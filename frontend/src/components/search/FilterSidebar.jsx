import React, { useState, useEffect } from 'react';
import { FiFilter, FiX, FiCheck, FiRefreshCw } from 'react-icons/fi';

const PROPERTY_TYPES = [
  { id: 'hotel', label: 'Boutique Hotel' },
  { id: 'resort', label: 'Luxury Resort' },
  { id: 'villa', label: 'Private Villa' },
  { id: 'apartment', label: 'Serviced Apartment' },
  { id: 'event-venue', label: 'Event Venue' },
];

const POPULAR_AMENITIES = [
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
];

/**
 * FilterSidebar component for SearchPage
 *
 * @param {Object} props
 * @param {Object} props.filters - Current filter values from Redux or parent
 * @param {Function} props.onApply - Callback when filters are applied
 * @param {Function} props.onClear - Callback when filters are reset
 * @param {boolean} [props.isOpenOnMobile=false] - Mobile drawer status
 * @param {Function} [props.onCloseMobile] - Mobile drawer close handler
 */
export default function FilterSidebar({
  filters = {},
  onApply,
  onClear,
  isOpenOnMobile = false,
  onCloseMobile,
}) {
  const [localFilters, setLocalFilters] = useState({
    minPrice: filters.minPrice || '',
    maxPrice: filters.maxPrice || '',
    type: filters.type || '',
    amenities: filters.amenities || [],
  });

  useEffect(() => {
    setLocalFilters({
      minPrice: filters.minPrice || '',
      maxPrice: filters.maxPrice || '',
      type: filters.type || '',
      amenities: filters.amenities || [],
    });
  }, [filters]);

  const handleTypeToggle = (typeId) => {
    setLocalFilters((prev) => ({
      ...prev,
      type: prev.type === typeId ? '' : typeId,
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setLocalFilters((prev) => {
      const exists = prev.amenities.includes(amenity);
      const newAmenities = exists
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity];
      return { ...prev, amenities: newAmenities };
    });
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    if (onApply) {
      onApply(localFilters);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleReset = () => {
    const resetValues = {
      minPrice: '',
      maxPrice: '',
      type: '',
      amenities: [],
    };
    setLocalFilters(resetValues);
    if (onClear) {
      onClear();
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <FiFilter className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-gray-900 text-base">Filters</h3>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
        >
          <FiRefreshCw className="w-3 h-3" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
          Price Range (per night)
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <span className="text-[11px] text-gray-500 block mb-1">Min Price (₹)</span>
            <input
              type="number"
              name="minPrice"
              value={localFilters.minPrice}
              onChange={handlePriceChange}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block mb-1">Max Price (₹)</span>
            <input
              type="number"
              name="maxPrice"
              value={localFilters.maxPrice}
              onChange={handlePriceChange}
              placeholder="50000"
              min="0"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Property Type */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
          Property Type
        </label>
        <div className="space-y-2">
          {PROPERTY_TYPES.map((t) => (
            <label
              key={t.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-sm transition-all ${
                localFilters.type === t.id
                  ? 'border-emerald-500 bg-emerald-50/70 text-emerald-800 font-semibold'
                  : 'border-gray-100 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span>{t.label}</span>
              <input
                type="checkbox"
                checked={localFilters.type === t.id}
                onChange={() => handleTypeToggle(t.id)}
                className="hidden"
              />
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  localFilters.type === t.id
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {localFilters.type === t.id && <FiCheck className="w-3 h-3" />}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
          Amenities
        </label>
        <div className="space-y-2">
          {POPULAR_AMENITIES.map((amenity) => {
            const isChecked = localFilters.amenities.includes(amenity);
            return (
              <label
                key={amenity}
                className="flex items-center space-x-2.5 text-sm text-gray-700 cursor-pointer hover:text-emerald-700 select-none"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    isChecked
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-gray-300 bg-white'
                  }`}
                  onClick={() => handleAmenityToggle(amenity)}
                >
                  {isChecked && <FiCheck className="w-3 h-3" />}
                </div>
                <span onClick={() => handleAmenityToggle(amenity)}>{amenity}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-gray-100 space-y-2">
        <button
          type="button"
          onClick={handleApply}
          className="w-full py-2.5 px-4 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all text-sm"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-28 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          {content}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isOpenOnMobile && (
        <div className="fixed inset-0 z-50 lg:hidden overflow-hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-sm bg-white shadow-2xl p-6 overflow-y-auto">
              <div className="flex justify-end pb-3">
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              {content}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
