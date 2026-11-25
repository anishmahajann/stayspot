import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { format, differenceInCalendarDays } from 'date-fns';
import {
  fetchProperty,
  fetchAvailability,
  fetchReviews,
  setSelectedUnit,
} from '../store/slices/propertySlice';
import { getQuote, createHold } from '../store/slices/bookingSlice';
import PhotoGallery from '../components/property/PhotoGallery';
import AmenityList from '../components/property/AmenityList';
import MapView from '../components/property/MapView';
import DateRangePicker from '../components/booking/DateRangePicker';
import PriceBreakdown from '../components/booking/PriceBreakdown';
import CancellationPolicy from '../components/booking/CancellationPolicy';
import StarRating from '../components/common/StarRating';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  FiMapPin,
  FiUsers,
  FiPlus,
  FiMinus,
  FiCheck,
  FiClock,
  FiShield,
  FiAlertCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentProperty, units, selectedUnit, availability, reviews, loading, error } =
    useSelector((state) => state.property);
  const { priceQuote, loading: bookingLoading } = useSelector((state) => state.booking);
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Booking sidebar local state
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [guests, setGuests] = useState(1);
  const [bookingError, setBookingError] = useState('');

  // Fetch property details, initial availability, and reviews on mount
  useEffect(() => {
    if (id) {
      dispatch(fetchProperty(id));
      dispatch(fetchReviews(id));
    }
  }, [id, dispatch]);

  // When selected unit changes, fetch unit availability
  useEffect(() => {
    if (id && selectedUnit?._id) {
      dispatch(
        fetchAvailability({
          propertyId: id,
          unitId: selectedUnit._id,
        })
      );
    }
  }, [id, selectedUnit?._id, dispatch]);

  // When dates and selected unit are ready, request quote
  useEffect(() => {
    if (selectedUnit?._id && dateRange.from && dateRange.to) {
      const checkInStr = format(dateRange.from, 'yyyy-MM-dd');
      const checkOutStr = format(dateRange.to, 'yyyy-MM-dd');
      dispatch(
        getQuote({
          unitId: selectedUnit._id,
          propertyId: id,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          guests,
        })
      );
    }
  }, [selectedUnit?._id, dateRange.from, dateRange.to, guests, id, dispatch]);

  const handleUnitSelect = (unit) => {
    dispatch(setSelectedUnit(unit));
  };

  const handleBookNow = async () => {
    setBookingError('');

    if (!selectedUnit) {
      setBookingError('Please choose a room unit type first.');
      toast.error('Please choose a room type.');
      return;
    }

    if (!dateRange.from || !dateRange.to) {
      setBookingError('Please choose both check-in and check-out dates.');
      toast.error('Please select check-in and check-out dates.');
      return;
    }

    if (!isAuthenticated) {
      toast('Please log in to proceed with booking.', { icon: '🔒' });
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const nights = differenceInCalendarDays(dateRange.to, dateRange.from);
    if (nights <= 0) {
      setBookingError('Check-out date must be after check-in date.');
      return;
    }

    const payload = {
      propertyId: id,
      unitId: selectedUnit._id,
      checkIn: format(dateRange.from, 'yyyy-MM-dd'),
      checkOut: format(dateRange.to, 'yyyy-MM-dd'),
      guests,
    };

    try {
      const resultAction = await dispatch(createHold(payload));
      if (createHold.fulfilled.match(resultAction)) {
        const booking = resultAction.payload.booking || resultAction.payload;
        toast.success('Room held for 15 minutes! Proceeding to checkout.');
        navigate(`/checkout/${booking._id}`);
      } else {
        const msg = resultAction.payload || 'Failed to place booking hold.';
        setBookingError(msg);
        toast.error(msg);
      }
    } catch (err) {
      setBookingError(err.message || 'Error initiating reservation');
      toast.error(err.message || 'Error initiating reservation');
    }
  };

  if (loading && !currentProperty) {
    return <LoadingSpinner fullScreen text="Loading luxury stay details..." />;
  }

  if (error || !currentProperty) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
        <p className="text-gray-600 mb-6">{error || 'This property listing does not exist.'}</p>
        <button
          onClick={() => navigate('/search')}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
        >
          Back to Search
        </button>
      </div>
    );
  }

  const {
    title,
    description,
    type,
    location,
    rating = 0,
    reviewCount = 0,
    amenities = [],
    images = [],
    policies = {},
  } = currentProperty;

  const typeLabels = {
    hotel: 'Boutique Hotel',
    resort: 'Luxury Resort',
    villa: 'Private Villa',
    apartment: 'Serviced Apartment',
    'event-venue': 'Event Convention Venue',
  };

  const activeUnit = selectedUnit || (units && units[0]);
  const activeBasePrice = activeUnit?.basePrice || currentProperty.basePrice || 2499;

  // Disabled dates from availability calendar for the active unit
  const unitCalendarDays = availability?.calendar?.[activeUnit?._id]?.days;
  const blockedDatesList = unitCalendarDays
    ? Object.values(unitCalendarDays)
        .filter((d) => !d.isAvailable || d.isBlocked)
        .map((d) => d.date)
    : availability?.blockedDates || availability?.bookedDates || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* 1. Header Information */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-100">
            {typeLabels[type] || type || 'Stay'}
          </span>
          <div className="flex items-center space-x-1.5 text-xs text-gray-600">
            <FiMapPin className="w-4 h-4 text-emerald-600" />
            <span>
              {location?.address ? `${location.address}, ` : ''}
              {location?.city}, {location?.state || location?.country}
            </span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          {title}
        </h1>

        <div className="flex items-center space-x-4 mt-3">
          <div className="flex items-center space-x-2">
            <StarRating rating={rating} size="md" />
            <span className="font-bold text-gray-900 text-sm">{Number(rating).toFixed(1)}</span>
            <span className="text-gray-500 text-xs">({reviewCount} verified reviews)</span>
          </div>
          <span className="text-gray-300">•</span>
          <span className="text-xs text-emerald-700 font-medium flex items-center space-x-1">
            <FiShield className="w-3.5 h-3.5" />
            <span>Verified Partner</span>
          </span>
        </div>
      </div>

      {/* 2. Photo Gallery */}
      <PhotoGallery images={images} title={title} />

      {/* 3. Main Content Split (Details vs Sticky Booking Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left column (Info, Units, Amenities, Location, Reviews) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-10">
          {/* About / Description */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-gray-900">About this property</h2>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
              {description}
            </p>

            {/* Check-in / Check-out hours */}
            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="flex items-center space-x-2 text-gray-600">
                <FiClock className="w-4 h-4 text-emerald-600" />
                <span>Check-in: <strong>{policies?.checkInTime || '14:00'}</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <FiClock className="w-4 h-4 text-emerald-600" />
                <span>Check-out: <strong>{policies?.checkOutTime || '11:00'}</strong></span>
              </div>
            </div>
          </section>

          {/* Room Units Selection */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Available Room & Space Units</h2>
                <p className="text-xs text-gray-500 mt-0.5">Select a unit to customize your reservation</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                {units?.length || 0} Options
              </span>
            </div>

            {units && units.length > 0 ? (
              <div className="space-y-4">
                {units.map((unit) => {
                  const isSelected = activeUnit?._id === unit._id;
                  return (
                    <div
                      key={unit._id}
                      onClick={() => handleUnitSelect(unit)}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/40 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-gray-900 text-base">{unit.name}</h3>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                              Selected
                            </span>
                          )}
                        </div>
                        {unit.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">{unit.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500 pt-1">
                          <span className="flex items-center space-x-1">
                            <FiUsers className="w-3.5 h-3.5 text-gray-400" />
                            <span>Up to {unit.capacity} Guests</span>
                          </span>
                          <span>•</span>
                          <span>{unit.count} Units Available</span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-baseline sm:items-end justify-between w-full sm:w-auto gap-1">
                        <div className="text-right">
                          <span className="text-xl font-extrabold text-emerald-600">
                            ₹{Number(unit.basePrice).toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-gray-500"> / night</span>
                        </div>
                        <button
                          type="button"
                          className={`mt-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Choose Unit'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Single property reservation. Standard room pricing applies.
              </p>
            )}
          </section>

          {/* Amenities */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Amenities & Conveniences</h2>
            <AmenityList amenities={amenities} limit={8} />
          </section>

          {/* Location & Map */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Where you'll be</h2>
            <p className="text-sm text-gray-600">
              {location?.address ? `${location.address}, ` : ''}
              {location?.city}, {location?.state || location?.country}
            </p>
            <MapView
              coordinates={location?.coordinates}
              title={title}
              address={`${location?.city}, ${location?.country}`}
            />
          </section>

          {/* Cancellation Policy Detail */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">Cancellation Policy</h2>
            <CancellationPolicy
              policyType={policies?.cancellation || 'moderate'}
              checkIn={dateRange.from || new Date()}
              totalAmount={priceQuote?.totalAmount || activeBasePrice}
            />
          </section>

          {/* Reviews Section */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-gray-900">Guest Reviews</h2>
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold">
                  <span>★</span>
                  <span>{Number(rating).toFixed(1)}</span>
                </div>
              </div>
              <span className="text-xs text-gray-500">{reviews?.length || 0} reviews</span>
            </div>

            {reviews && reviews.length > 0 ? (
              <div className="space-y-6 divide-y divide-gray-100">
                {reviews.map((rev) => (
                  <div key={rev._id} className="pt-5 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                          {(rev.userId?.name || rev.user?.name)
                            ? (rev.userId?.name || rev.user?.name)[0].toUpperCase()
                            : 'G'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {rev.userId?.name || rev.user?.name || 'Verified Guest'}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {rev.createdAt ? format(new Date(rev.createdAt), 'MMMM yyyy') : 'Recently'}
                          </p>
                        </div>
                      </div>
                      <StarRating rating={rev.rating || 5} size="sm" />
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No reviews yet. Be the first guest to share your experience!
              </p>
            )}
          </section>
        </div>

        {/* Right column: Sticky Booking Sidebar */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-28 bg-white p-6 rounded-3xl border border-gray-200 shadow-xl space-y-6">
            {/* Price Preview */}
            <div className="flex items-baseline justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="text-xs text-gray-500 font-medium block">Selected Rate</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-extrabold text-gray-900">
                    ₹{Number(activeBasePrice).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">/ night</span>
                </div>
              </div>

              {activeUnit && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold truncate max-w-[140px]">
                  {activeUnit.name}
                </span>
              )}
            </div>

            {/* Date Range Picker */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Stay Dates
              </label>
              <DateRangePicker
                disabledDates={blockedDatesList}
                selectedRange={dateRange}
                onDateChange={(range) => setDateRange(range)}
                numberOfMonths={1}
              />
            </div>

            {/* Guest Counter */}
            <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-gray-800">Guests</label>
                <span className="text-xs text-gray-500">
                  Capacity: {activeUnit?.capacity || 2} max
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  disabled={guests <= 1}
                  className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-600 hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <FiMinus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-sm w-4 text-center">{guests}</span>
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.min(activeUnit?.capacity || 10, g + 1))}
                  disabled={guests >= (activeUnit?.capacity || 10)}
                  className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-600 hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Price Quote Summary if calculated */}
            {priceQuote && dateRange.from && dateRange.to && (
              <PriceBreakdown
                breakdown={priceQuote.priceBreakdown || priceQuote.breakdown || []}
                totalAmount={priceQuote.totalAmount || 0}
                discount={priceQuote.discount || 0}
                taxes={priceQuote.taxes || 0}
              />
            )}

            {/* Booking error */}
            {bookingError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center space-x-2">
                <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Book Now Button */}
            <button
              type="button"
              onClick={handleBookNow}
              disabled={bookingLoading}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition-all hover:shadow-xl hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {bookingLoading ? (
                <LoadingSpinner size="sm" text="" />
              ) : (
                <span>Reserve Room (15-min Hold)</span>
              )}
            </button>

            <p className="text-center text-xs text-gray-400">
              You won't be charged yet. Unit will be temporarily held during checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
