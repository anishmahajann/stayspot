import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import {
  fetchOwnerProperties,
  fetchOwnerBookings,
  fetchReports,
  createProperty,
} from '../../store/slices/ownerSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  FiHome,
  FiCalendar,
  FiDollarSign,
  FiTrendingUp,
  FiPlus,
  FiBarChart2,
  FiSettings,
  FiEye,
  FiEdit,
  FiMapPin,
  FiUsers,
  FiLock,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function OwnerDashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { properties, bookings, reports, loading } = useSelector((state) => state.owner);
  const [addPropertyModalOpen, setAddPropertyModalOpen] = useState(false);
  const [newPropertyData, setNewPropertyData] = useState({
    title: '',
    description: '',
    type: 'hotel',
    address: '',
    city: '',
    state: '',
    basePrice: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchOwnerProperties());
    dispatch(fetchOwnerBookings());
    dispatch(fetchReports('30d'));
  }, [dispatch]);

  // Derived metrics
  const totalProperties = properties?.length || 0;
  const totalBookings = reports?.totalBookings ?? bookings?.length ?? 0;

  const currentMonthRevenue =
    reports?.totalRevenue ??
    (bookings || [])
      .filter((b) => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  const occupancyRate = reports?.occupancyRate !== undefined ? reports.occupancyRate : 0;

  const recentBookings = (bookings || []).slice(0, 5);

  const handleAddPropertySubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        title: newPropertyData.title,
        description: newPropertyData.description,
        type: newPropertyData.type,
        location: {
          address: newPropertyData.address,
          city: newPropertyData.city,
          state: newPropertyData.state,
          country: 'India',
        },
        basePrice: Number(newPropertyData.basePrice) || 2999,
      };

      const result = await dispatch(createProperty(payload));
      if (createProperty.fulfilled.match(result)) {
        toast.success('Property created successfully!');
        setAddPropertyModalOpen(false);
        setNewPropertyData({
          title: '',
          description: '',
          type: 'hotel',
          address: '',
          city: '',
          state: '',
          basePrice: '',
        });
        dispatch(fetchOwnerProperties());
      } else {
        toast.error(result.payload || 'Failed to create property');
      }
    } catch (err) {
      toast.error(err.message || 'Error creating property');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && (!properties || properties.length === 0)) {
    return <LoadingSpinner fullScreen text="Loading host portal..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block">
            Owner Management Portal
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Host Dashboard</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setAddPropertyModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/30 transition-all hover:scale-105"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Property</span>
          </button>
          <Link
            to="/owner/reports"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors shadow-xs"
          >
            <FiBarChart2 className="w-4 h-4 text-emerald-600" />
            <span>Reports</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem('hostPortalToken');
              toast.success('Host Portal locked');
              window.location.href = '/';
            }}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-sm transition-colors"
          >
            <FiLock className="w-4 h-4" />
            <span>Lock Portal</span>
          </button>
        </div>
      </div>

      {/* 1. Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Properties */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 flex-shrink-0">
            <FiHome className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Properties</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">{totalProperties}</h3>
            <span className="text-[11px] text-emerald-600 font-medium">Active Listings</span>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-teal-50 text-teal-600 flex-shrink-0">
            <FiCalendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Bookings</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">{totalBookings}</h3>
            <span className="text-[11px] text-teal-600 font-medium">All Time</span>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 flex-shrink-0">
            <FiDollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Month Revenue</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">
              ₹{Number(currentMonthRevenue).toLocaleString('en-IN')}
            </h3>
            <span className="text-[11px] text-amber-600 font-medium">Last 30 days</span>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-purple-50 text-purple-600 flex-shrink-0">
            <FiTrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Occupancy</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">{occupancyRate}%</h3>
            <span className="text-[11px] text-purple-600 font-medium">Average 30 days</span>
          </div>
        </div>
      </div>

      {/* 2. My Properties Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Your Properties</h2>
          <span className="text-xs text-gray-500">{properties?.length || 0} Listed</span>
        </div>

        {properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop) => {
              const firstImg =
                prop.images?.[0]?.url ||
                (typeof prop.images?.[0] === 'string' ? prop.images[0] : null) ||
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80';

              const firstUnitId = prop.units?.[0]?._id || prop._id;

              return (
                <div
                  key={prop._id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative aspect-[16/10] bg-gray-100">
                    <img src={firstImg} alt={prop.title} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/95 text-gray-800 shadow-xs capitalize">
                      {prop.type || 'Hotel'}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{prop.title}</h3>
                      <p className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
                        <FiMapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>
                          {prop.location?.city ? `${prop.location.city}, ` : ''}
                          {prop.location?.country || 'India'}
                        </span>
                      </p>
                      <div className="flex items-center space-x-3 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                        <span>{prop.units?.length || 0} Unit Types</span>
                        <span>•</span>
                        <span>Rating: ★ {Number(prop.rating || 0).toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Link
                        to={`/owner/properties/${prop._id}`}
                        className="flex-1 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-center text-xs font-semibold transition-all flex items-center justify-center space-x-1"
                      >
                        <FiEdit className="w-3.5 h-3.5" />
                        <span>Edit Units</span>
                      </Link>

                      <Link
                        to={`/owner/calendar/${firstUnitId}`}
                        className="py-2 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors flex items-center space-x-1"
                        title="Open Calendar"
                      >
                        <FiCalendar className="w-3.5 h-3.5" />
                        <span>Calendar</span>
                      </Link>

                      <Link
                        to={`/property/${prop._id}`}
                        target="_blank"
                        className="py-2 px-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                        title="View Public Page"
                      >
                        <FiEye className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <FiHome className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No properties listed yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Begin hosting today by adding your first hotel, resort, villa, or banquet event venue.
            </p>
            <button
              type="button"
              onClick={() => setAddPropertyModalOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 shadow-md shadow-emerald-600/30 transition-all"
            >
              List Your First Property
            </button>
          </div>
        )}
      </div>

      {/* 3. Recent Bookings Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
          <span className="text-xs text-gray-500">Latest 5 reservations</span>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {recentBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Booking Ref</th>
                    <th className="px-6 py-3.5">Guest</th>
                    <th className="px-6 py-3.5">Property / Unit</th>
                    <th className="px-6 py-3.5">Dates</th>
                    <th className="px-6 py-3.5">Total Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentBookings.map((b) => (
                    <tr key={b._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-gray-700">
                        #{b._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{b.userId?.name || 'Guest'}</p>
                        <p className="text-xs text-gray-400">{b.userId?.email || ''}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{b.propertyId?.title || 'Listing'}</p>
                        <p className="text-xs text-gray-500">{b.unitId?.name || ''}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        {b.checkIn ? format(new Date(b.checkIn), 'MMM dd') : ''} -{' '}
                        {b.checkOut ? format(new Date(b.checkOut), 'MMM dd, yyyy') : ''}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            b.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : b.status === 'held'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-500">
              No recent bookings found. Reservations will appear here as soon as guests book.
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Property Modal */}
      <Modal
        isOpen={addPropertyModalOpen}
        onClose={() => setAddPropertyModalOpen(false)}
        title="Create New Property"
      >
        <form onSubmit={handleAddPropertySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Property Title
            </label>
            <input
              type="text"
              required
              value={newPropertyData.title}
              onChange={(e) => setNewPropertyData({ ...newPropertyData, title: e.target.value })}
              placeholder="e.g. Royal Orchid Grand Palace"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Description
            </label>
            <textarea
              rows={3}
              required
              value={newPropertyData.description}
              onChange={(e) =>
                setNewPropertyData({ ...newPropertyData, description: e.target.value })
              }
              placeholder="Describe the atmosphere, ambiance, and location..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Type</label>
              <select
                value={newPropertyData.type}
                onChange={(e) => setNewPropertyData({ ...newPropertyData, type: e.target.value })}
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
                Base Nightly Price (₹)
              </label>
              <input
                type="number"
                required
                min="0"
                value={newPropertyData.basePrice}
                onChange={(e) =>
                  setNewPropertyData({ ...newPropertyData, basePrice: e.target.value })
                }
                placeholder="2999"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">City</label>
              <input
                type="text"
                required
                value={newPropertyData.city}
                onChange={(e) => setNewPropertyData({ ...newPropertyData, city: e.target.value })}
                placeholder="Mumbai"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">State</label>
              <input
                type="text"
                value={newPropertyData.state}
                onChange={(e) => setNewPropertyData({ ...newPropertyData, state: e.target.value })}
                placeholder="Maharashtra"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setAddPropertyModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Property'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
