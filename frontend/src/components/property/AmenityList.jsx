import React, { useState } from 'react';
import {
  FiWifi,
  FiWind,
  FiTv,
  FiCoffee,
  FiChevronDown,
  FiChevronUp,
  FiCheck,
} from 'react-icons/fi';
import {
  MdPool,
  MdLocalParking,
  MdRestaurant,
  MdFitnessCenter,
  MdSpa,
  MdPets,
  MdElevator,
  MdKitchen,
  MdLocalBar,
  MdMeetingRoom,
  MdSecurity,
  MdRoomService,
} from 'react-icons/md';

/**
 * Maps amenity name string to an icon component
 */
const getAmenityIcon = (name = '') => {
  const lower = name.toLowerCase().trim();
  if (lower.includes('wifi') || lower.includes('internet')) return <FiWifi className="w-5 h-5 text-emerald-600" />;
  if (lower.includes('pool')) return <MdPool className="w-5 h-5 text-teal-600" />;
  if (lower.includes('park')) return <MdLocalParking className="w-5 h-5 text-blue-600" />;
  if (lower.includes('ac') || lower.includes('air') || lower.includes('climate'))
    return <FiWind className="w-5 h-5 text-sky-600" />;
  if (lower.includes('restaurant') || lower.includes('dining') || lower.includes('food'))
    return <MdRestaurant className="w-5 h-5 text-amber-600" />;
  if (lower.includes('gym') || lower.includes('fitness'))
    return <MdFitnessCenter className="w-5 h-5 text-purple-600" />;
  if (lower.includes('spa') || lower.includes('wellness') || lower.includes('sauna'))
    return <MdSpa className="w-5 h-5 text-pink-600" />;
  if (lower.includes('breakfast') || lower.includes('coffee'))
    return <FiCoffee className="w-5 h-5 text-amber-700" />;
  if (lower.includes('bar') || lower.includes('lounge'))
    return <MdLocalBar className="w-5 h-5 text-rose-600" />;
  if (lower.includes('pet')) return <MdPets className="w-5 h-5 text-emerald-700" />;
  if (lower.includes('elevator') || lower.includes('lift'))
    return <MdElevator className="w-5 h-5 text-gray-600" />;
  if (lower.includes('kitchen')) return <MdKitchen className="w-5 h-5 text-indigo-600" />;
  if (lower.includes('tv') || lower.includes('television'))
    return <FiTv className="w-5 h-5 text-indigo-500" />;
  if (lower.includes('conference') || lower.includes('meeting') || lower.includes('hall'))
    return <MdMeetingRoom className="w-5 h-5 text-emerald-700" />;
  if (lower.includes('service') || lower.includes('room service'))
    return <MdRoomService className="w-5 h-5 text-amber-600" />;
  if (lower.includes('security')) return <MdSecurity className="w-5 h-5 text-green-700" />;

  return <FiCheck className="w-5 h-5 text-emerald-600" />;
};

/**
 * AmenityList component with icons and expandable view
 *
 * @param {Object} props
 * @param {Array<string>} props.amenities - Array of amenity strings
 * @param {number} [props.limit=8] - Initial number of amenities to show
 */
export default function AmenityList({ amenities = [], limit = 8 }) {
  const [expanded, setExpanded] = useState(false);

  if (!amenities || amenities.length === 0) {
    return <p className="text-sm text-gray-500">No amenities listed for this property.</p>;
  }

  const visibleAmenities = expanded ? amenities : amenities.slice(0, limit);
  const hasMore = amenities.length > limit;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {visibleAmenities.map((amenity, index) => (
          <div
            key={index}
            className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-emerald-200 transition-colors"
          >
            <div className="p-2 rounded-lg bg-white shadow-xs">
              {getAmenityIcon(amenity)}
            </div>
            <span className="text-sm font-medium text-gray-800 capitalize truncate">
              {amenity}
            </span>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center space-x-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline pt-1"
        >
          {expanded ? (
            <>
              <span>Show fewer amenities</span>
              <FiChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Show all {amenities.length} amenities</span>
              <FiChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
