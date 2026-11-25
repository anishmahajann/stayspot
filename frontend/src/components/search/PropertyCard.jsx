import React from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../common/StarRating';
import { FiMapPin, FiWifi, FiWind, FiArrowRight } from 'react-icons/fi';
import { MdPool, MdLocalParking, MdRestaurant, MdFitnessCenter } from 'react-icons/md';

const getSmallAmenityIcon = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('wifi')) return <FiWifi className="w-3.5 h-3.5" title="WiFi" />;
  if (lower.includes('pool')) return <MdPool className="w-3.5 h-3.5" title="Pool" />;
  if (lower.includes('ac') || lower.includes('air')) return <FiWind className="w-3.5 h-3.5" title="AC" />;
  if (lower.includes('park')) return <MdLocalParking className="w-3.5 h-3.5" title="Parking" />;
  if (lower.includes('restaurant') || lower.includes('dining'))
    return <MdRestaurant className="w-3.5 h-3.5" title="Restaurant" />;
  if (lower.includes('gym')) return <MdFitnessCenter className="w-3.5 h-3.5" title="Gym" />;
  return null;
};

/**
 * PropertyCard component for search results and featured listings
 *
 * @param {Object} props
 * @param {Object} props.property
 */
export default function PropertyCard({ property }) {
  if (!property) return null;

  const {
    _id,
    title,
    type,
    location,
    rating = 0,
    reviewCount = 0,
    amenities = [],
    images = [],
    units = [],
    minPrice,
  } = property;

  // Compute lowest starting price from units if not explicitly provided
  let displayPrice = minPrice || property.pricePerNight;
  if (!displayPrice && units && units.length > 0) {
    const prices = units.map((u) => u.basePrice).filter((p) => p !== undefined && p !== null);
    if (prices.length > 0) {
      displayPrice = Math.min(...prices);
    }
  }
  if (!displayPrice) {
    displayPrice = property.basePrice || 2499;
  }

  // Pick first image or fallback
  const firstImage =
    images && images.length > 0
      ? typeof images[0] === 'string'
        ? images[0]
        : images[0]?.url
      : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

  const typeLabels = {
    hotel: 'Boutique Hotel',
    resort: 'Luxury Resort',
    villa: 'Private Villa',
    apartment: 'Serviced Apartment',
    'event-venue': 'Event Venue',
  };

  const previewAmenities = (amenities || []).slice(0, 4);

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* Property Image & Badges */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        <Link to={`/property/${_id}`}>
          <img
            src={firstImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </Link>

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-gray-800 shadow-sm backdrop-blur-sm capitalize">
            {typeLabels[type] || type || 'Stay'}
          </span>
        </div>

        {/* Rating Floating Tag */}
        {rating > 0 && (
          <div className="absolute top-3 right-3 flex items-center space-x-1 px-2.5 py-1 rounded-full bg-black/70 text-white text-xs font-semibold backdrop-blur-sm">
            <span className="text-amber-400">★</span>
            <span>{Number(rating).toFixed(1)}</span>
            {reviewCount > 0 && (
              <span className="text-gray-300 text-[11px]">({reviewCount})</span>
            )}
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Location */}
          <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1.5">
            <FiMapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="truncate">
              {location?.city ? `${location.city}, ` : ''}
              {location?.state || location?.country || 'India'}
            </span>
          </div>

          {/* Title */}
          <Link to={`/property/${_id}`}>
            <h3 className="font-bold text-gray-900 text-lg hover:text-emerald-600 transition-colors line-clamp-1">
              {title}
            </h3>
          </Link>

          {/* Star rating summary */}
          <div className="flex items-center space-x-2 mt-2">
            <StarRating rating={rating} size="sm" />
            <span className="text-xs text-gray-500">
              {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            </span>
          </div>

          {/* Amenities Preview */}
          {previewAmenities.length > 0 && (
            <div className="flex items-center flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              {previewAmenities.map((amenity, idx) => {
                const icon = getSmallAmenityIcon(amenity);
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-gray-50 text-[11px] font-medium text-gray-600 border border-gray-100"
                  >
                    {icon}
                    <span className="capitalize">{amenity}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Pricing & CTA */}
        <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 block">Starting from</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-extrabold text-emerald-600">
                ₹{Number(displayPrice).toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-gray-500 font-medium">/ night</span>
            </div>
          </div>

          <Link
            to={`/property/${_id}`}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-semibold text-xs sm:text-sm transition-all duration-200 shadow-xs group-hover:bg-emerald-600 group-hover:text-white"
          >
            <span>View Details</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
