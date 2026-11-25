import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { FiSearch, FiMapPin, FiCalendar, FiUsers, FiPlus, FiMinus, FiX } from 'react-icons/fi';
import 'react-day-picker/dist/style.css';

const POPULAR_CITIES = [
  'Mumbai',
  'Goa',
  'Bengaluru',
  'Delhi',
  'Jaipur',
  'Udaipur',
  'Manali',
  'Kochi',
  'Hyderabad',
  'Chennai',
];

/**
 * Universal SearchBar component for Home and Search pages
 *
 * @param {Object} props
 * @param {Object} [props.initialValues] - Preloaded search values
 * @param {Function} [props.onSearch] - Optional callback triggered on search
 * @param {boolean} [props.compact=false] - Compact style layout
 */
export default function SearchBar({ initialValues = {}, onSearch, compact = false }) {
  const navigate = useNavigate();

  const [city, setCity] = useState(initialValues.city || '');
  const [citySuggestionsOpen, setCitySuggestionsOpen] = useState(false);

  // Date range
  const parseInitialDate = (d) => {
    if (!d) return undefined;
    if (d instanceof Date) return d;
    const parsed = parseISO(d);
    return isValid(parsed) ? parsed : undefined;
  };

  const [dateRange, setDateRange] = useState({
    from: parseInitialDate(initialValues.checkIn),
    to: parseInitialDate(initialValues.checkOut),
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Guests
  const [guests, setGuests] = useState(Number(initialValues.guests) || 1);
  const [guestsPickerOpen, setGuestsPickerOpen] = useState(false);

  const containerRef = useRef(null);

  // Close open dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setCitySuggestionsOpen(false);
        setDatePickerOpen(false);
        setGuestsPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredCities = POPULAR_CITIES.filter((c) =>
    c.toLowerCase().includes(city.toLowerCase().trim())
  );

  const handleCitySelect = (selectedCity) => {
    setCity(selectedCity);
    setCitySuggestionsOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();

    const searchParams = {
      city: city.trim(),
      checkIn: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
      checkOut: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '',
      guests,
    };

    if (onSearch) {
      onSearch(searchParams);
    } else {
      // Build query string and navigate to /search
      const query = new URLSearchParams();
      if (searchParams.city) query.set('city', searchParams.city);
      if (searchParams.checkIn) query.set('checkIn', searchParams.checkIn);
      if (searchParams.checkOut) query.set('checkOut', searchParams.checkOut);
      if (searchParams.guests) query.set('guests', searchParams.guests);

      navigate(`/search?${query.toString()}`);
    }

    setCitySuggestionsOpen(false);
    setDatePickerOpen(false);
    setGuestsPickerOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-white text-gray-900 rounded-2xl shadow-xl border border-gray-100 ${
        compact ? 'p-2' : 'p-3 sm:p-4'
      }`}
    >
      <form
        onSubmit={handleSearchSubmit}
        className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3 items-center"
      >
        {/* City Input */}
        <div className="relative md:col-span-4">
          <div
            className="flex items-center space-x-3 px-3.5 py-3 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all"
            onClick={() => setCitySuggestionsOpen(true)}
          >
            <FiMapPin className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Where to?
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setCitySuggestionsOpen(true);
                }}
                placeholder="City, location, or destination"
                className="w-full bg-transparent border-none p-0 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
              />
            </div>
            {city && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCity('');
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* City Autocomplete Dropdown */}
          {citySuggestionsOpen && (
            <div className="absolute top-full left-0 mt-2 w-full sm:w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in max-h-60 overflow-y-auto">
              <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Popular Destinations
              </div>
              {filteredCities.length > 0 ? (
                filteredCities.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleCitySelect(item)}
                    className="w-full text-left px-3.5 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center space-x-2.5 transition-colors"
                  >
                    <FiMapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="font-medium">{item}</span>
                  </button>
                ))
              ) : (
                <div className="px-3.5 py-2 text-xs text-gray-500">
                  Use "{city}" as location
                </div>
              )}
            </div>
          )}
        </div>

        {/* Date Range Picker Input */}
        <div className="relative md:col-span-5">
          <div
            className="flex items-center space-x-3 px-3.5 py-3 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent focus-within:border-emerald-500 transition-all"
            onClick={() => setDatePickerOpen(!datePickerOpen)}
          >
            <FiCalendar className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Dates
              </label>
              <div className="text-sm font-semibold text-gray-900 truncate">
                {dateRange?.from ? (
                  dateRange?.to ? (
                    <span>
                      {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                    </span>
                  ) : (
                    <span>Check-in: {format(dateRange.from, 'MMM d')}</span>
                  )
                ) : (
                  <span className="text-gray-400 font-normal">Add check-in & check-out</span>
                )}
              </div>
            </div>
          </div>

          {/* Date Picker Popover */}
          {datePickerOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 w-max max-w-[92vw]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-700">Select Dates</span>
                {dateRange.from && (
                  <button
                    type="button"
                    onClick={() => setDateRange({ from: undefined, to: undefined })}
                    className="text-xs text-emerald-600 hover:underline font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
              <DayPicker
                mode="range"
                selected={dateRange}
                defaultMonth={dateRange?.from || new Date()}
                onSelect={(range) => {
                  setDateRange(range || { from: undefined, to: undefined });
                  if (range?.from && range?.to) {
                    setDatePickerOpen(false);
                  }
                }}
                disabled={{ before: new Date() }}
                numberOfMonths={1}
                className="date-picker-sm text-gray-900"
              />
            </div>
          )}
        </div>

        {/* Guests Counter Input */}
        <div className="relative md:col-span-3 lg:col-span-2">
          <div
            className="flex items-center space-x-3 px-3.5 py-3 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent focus-within:border-emerald-500 transition-all"
            onClick={() => setGuestsPickerOpen(!guestsPickerOpen)}
          >
            <FiUsers className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Guests
              </label>
              <div className="text-sm font-semibold text-gray-900">
                {guests} {guests === 1 ? 'Guest' : 'Guests'}
              </div>
            </div>
          </div>

          {/* Guests Popover */}
          {guestsPickerOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 animate-scale-up">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Guests</p>
                  <p className="text-xs text-gray-500">Ages 13 or above</p>
                </div>
                <div className="flex items-center space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setGuests((g) => Math.max(1, g - 1))}
                    disabled={guests <= 1}
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <FiMinus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-semibold text-sm w-4 text-center">{guests}</span>
                  <button
                    type="button"
                    onClick={() => setGuests((g) => Math.min(20, g + 1))}
                    disabled={guests >= 20}
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <FiPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search CTA Button */}
        <div className="md:col-span-12 lg:col-span-1 flex justify-end">
          <button
            type="submit"
            className="w-full lg:w-12 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 transition-all hover:scale-105 focus:outline-none"
            aria-label="Search"
          >
            <FiSearch className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
