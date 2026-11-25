import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateProperty,
  createUnit,
  updateUnit,
  deleteUnit,
  fetchOwnerProperties,
} from '../../store/slices/ownerSlice';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  FiArrowLeft,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiImage,
  FiCheck,
  FiX,
  FiUsers,
  FiDollarSign,
  FiLayers,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const AMENITY_OPTIONS = [
  'WiFi',
  'Pool',
  'Parking',
  'AC',
  'Restaurant',
  'Gym',
  'Spa',
  'Breakfast',
  'Bar',
  'Pet Friendly',
  'Conference Hall',
];

export default function OwnerPropertyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'hotel',
    address: '',
    city: '',
    state: '',
    country: 'India',
    checkInTime: '14:00',
    checkOutTime: '11:00',
    cancellation: 'moderate',
    amenities: [],
  });

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [images, setImages] = useState([]);

  // Unit Modal
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [unitFormData, setUnitFormData] = useState({
    name: '',
    description: '',
    capacity: 2,
    count: 5,
    basePrice: 2999,
  });

  useEffect(() => {
    const loadPropertyData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/properties/${id}`);
        const prop = data.property || data;
        setProperty(prop);
        setUnits(data.units || prop.units || []);

        setFormData({
          title: prop.title || '',
          description: prop.description || '',
          type: prop.type || 'hotel',
          address: prop.location?.address || '',
          city: prop.location?.city || '',
          state: prop.location?.state || '',
          country: prop.location?.country || 'India',
          checkInTime: prop.policies?.checkInTime || '14:00',
          checkOutTime: prop.policies?.checkOutTime || '11:00',
          cancellation: prop.policies?.cancellation || 'moderate',
          amenities: prop.amenities || [],
        });

        const imgs = (prop.images || []).map((img) =>
          typeof img === 'string' ? img : img.url
        );
        setImages(imgs);
      } catch (err) {
        toast.error('Failed to load property details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPropertyData();
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmenityToggle = (amenity) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleAddImage = () => {
    if (!imageUrlInput.trim()) return;
    setImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveProperty = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
        },
        policies: {
          checkInTime: formData.checkInTime,
          checkOutTime: formData.checkOutTime,
          cancellation: formData.cancellation,
        },
        amenities: formData.amenities,
        images: images.map((url) => ({ url })),
      };

      const result = await dispatch(updateProperty({ id, propertyData: payload }));
      if (updateProperty.fulfilled.match(result)) {
        toast.success('Property updated successfully!');
      } else {
        toast.error(result.payload || 'Failed to update property');
      }
    } catch (err) {
      toast.error(err.message || 'Error updating property');
    } finally {
      setIsSaving(false);
    }
  };

  // Unit handlers
  const handleOpenAddUnit = () => {
    setEditingUnit(null);
    setUnitFormData({
      name: '',
      description: '',
      capacity: 2,
      count: 5,
      basePrice: 2999,
    });
    setUnitModalOpen(true);
  };

  const handleOpenEditUnit = (unit) => {
    setEditingUnit(unit);
    setUnitFormData({
      name: unit.name || '',
      description: unit.description || '',
      capacity: unit.capacity || 2,
      count: unit.count || 1,
      basePrice: unit.basePrice || 2999,
    });
    setUnitModalOpen(true);
  };

  const handleSaveUnit = async (e) => {
    e.preventDefault();
    try {
      if (editingUnit) {
        // Update unit
        const res = await dispatch(
          updateUnit({
            unitId: editingUnit._id,
            unitData: unitFormData,
          })
        );
        if (updateUnit.fulfilled.match(res)) {
          toast.success('Room unit updated!');
          setUnits((prev) =>
            prev.map((u) => (u._id === editingUnit._id ? { ...u, ...unitFormData } : u))
          );
          setUnitModalOpen(false);
        } else {
          toast.error(res.payload || 'Failed to update unit');
        }
      } else {
        // Create unit
        const res = await dispatch(
          createUnit({
            propertyId: id,
            unitData: unitFormData,
          })
        );
        if (createUnit.fulfilled.match(res)) {
          toast.success('Room unit added!');
          const newUnit = res.payload.unit || res.payload;
          setUnits((prev) => [...prev, newUnit]);
          setUnitModalOpen(false);
        } else {
          toast.error(res.payload || 'Failed to add unit');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Error saving unit');
    }
  };

  const handleDeleteUnit = async (unitId) => {
    if (!window.confirm('Are you sure you want to delete this room unit?')) return;
    try {
      const res = await dispatch(deleteUnit(unitId));
      if (deleteUnit.fulfilled.match(res)) {
        toast.success('Unit deleted');
        setUnits((prev) => prev.filter((u) => u._id !== unitId));
      } else {
        toast.error(res.payload || 'Failed to delete unit');
      }
    } catch (err) {
      toast.error(err.message || 'Error deleting unit');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading property management..." />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <Link
          to="/owner/dashboard"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-gray-600 hover:text-emerald-600 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold capitalize">
          {formData.type || 'Hotel'}
        </span>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Manage Property & Units
        </h1>
        <p className="text-sm text-gray-500">
          Configure property policies, photos, amenities, and room inventories
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Property Edit Form */}
        <div className="lg:col-span-7 space-y-8">
          <form onSubmit={handleSaveProperty} className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3">
              Property Information
            </h2>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Property Title
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="hotel">Boutique Hotel</option>
                  <option value="resort">Luxury Resort</option>
                  <option value="villa">Private Villa</option>
                  <option value="apartment">Apartment</option>
                  <option value="event-venue">Event Venue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Cancellation Policy
                </label>
                <select
                  name="cancellation"
                  value={formData.cancellation}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="flexible">Flexible (100% refund up to 24h)</option>
                  <option value="moderate">Moderate (100% refund up to 5 days)</option>
                  <option value="strict">Strict (50% refund up to 7 days)</option>
                </select>
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Location</h3>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Street Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="e.g. 12 Heritage Way, Marine Drive"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">State / Province</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Amenities Checkboxes */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Select Amenities
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AMENITY_OPTIONS.map((amenity) => {
                  const checked = formData.amenities.includes(amenity);
                  return (
                    <label
                      key={amenity}
                      className={`flex items-center space-x-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition-colors ${
                        checked
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleAmenityToggle(amenity)}
                        className="hidden"
                      />
                      <div
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300'
                        }`}
                      >
                        {checked && <FiCheck className="w-2.5 h-2.5" />}
                      </div>
                      <span>{amenity}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Image Gallery Upload */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Property Images
              </h3>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Paste image URL (https://...)"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-white text-xs font-semibold hover:bg-gray-900"
                >
                  Add Image
                </button>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                  {images.map((imgUrl, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={imgUrl} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white hover:bg-red-700 opacity-90 transition-opacity"
                        title="Remove image"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving Changes...' : 'Save Property Changes'}
            </button>
          </form>
        </div>

        {/* Right Column: Room Units Management */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Room Units</h2>
                <p className="text-xs text-gray-500">Configure capacities and pricing</p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddUnit}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-xs"
              >
                <FiPlus className="w-3.5 h-3.5" />
                <span>Add Unit</span>
              </button>
            </div>

            {units && units.length > 0 ? (
              <div className="space-y-3">
                {units.map((unit) => (
                  <div
                    key={unit._id}
                    className="p-4 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all space-y-2 bg-gray-50/50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{unit.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{unit.description}</p>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditUnit(unit)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-gray-100"
                          title="Edit Unit"
                        >
                          <FiEdit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUnit(unit._id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-gray-100"
                          title="Delete Unit"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200/60 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[10px]">Capacity</span>
                        <span className="font-semibold text-gray-800">{unit.capacity} Guests</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Count</span>
                        <span className="font-semibold text-gray-800">{unit.count} Units</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Price/Night</span>
                        <span className="font-bold text-emerald-600">
                          ₹{Number(unit.basePrice).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Link
                        to={`/owner/calendar/${unit._id}`}
                        className="inline-flex items-center space-x-1 text-xs text-emerald-600 font-semibold hover:underline"
                      >
                        <span>Manage Calendar & Pricing Rules →</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-gray-500 border border-dashed rounded-2xl border-gray-200">
                No room units added yet. Click "+ Add Unit" to create room categories.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Unit Modal */}
      <Modal
        isOpen={unitModalOpen}
        onClose={() => setUnitModalOpen(false)}
        title={editingUnit ? 'Edit Room Unit' : 'Add New Room Unit'}
      >
        <form onSubmit={handleSaveUnit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Unit / Room Name
            </label>
            <input
              type="text"
              required
              value={unitFormData.name}
              onChange={(e) => setUnitFormData({ ...unitFormData, name: e.target.value })}
              placeholder="e.g. Deluxe Sea View Suite, Grand Banquet Hall"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={unitFormData.description}
              onChange={(e) => setUnitFormData({ ...unitFormData, description: e.target.value })}
              placeholder="King bed, balcony, sea views..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Capacity
              </label>
              <input
                type="number"
                required
                min="1"
                value={unitFormData.capacity}
                onChange={(e) =>
                  setUnitFormData({ ...unitFormData, capacity: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Count / Slots
              </label>
              <input
                type="number"
                required
                min="1"
                value={unitFormData.count}
                onChange={(e) =>
                  setUnitFormData({ ...unitFormData, count: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Price (₹)
              </label>
              <input
                type="number"
                required
                min="0"
                value={unitFormData.basePrice}
                onChange={(e) =>
                  setUnitFormData({ ...unitFormData, basePrice: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold text-emerald-700"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setUnitModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm"
            >
              {editingUnit ? 'Update Unit' : 'Create Unit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
