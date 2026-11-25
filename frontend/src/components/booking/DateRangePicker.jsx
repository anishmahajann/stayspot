import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, isBefore, startOfToday, parseISO, isValid } from 'date-fns';
import { FiCalendar, FiX } from 'react-icons/fi';
import 'react-day-picker/dist/style.css';

/**
 * Responsive DateRangePicker component wrapping react-day-picker.
 *
 * @param {Object} props
 * @param {Array<string|Date|Object>} [props.disabledDates] - Blocked or booked dates
 * @param {Function} props.onDateChange - Callback with { from: Date, to: Date }
 * @param {Object} [props.selectedRange] - Current range { from, to }
 * @param {number} [props.minNights=1] - Minimum nights requirement
 * @param {number} [props.numberOfMonths] - Number of months to display
 */
export default function DateRangePicker({
  disabledDates = [],
  onDateChange,
  selectedRange = { from: undefined, to: undefined },
  minNights = 1,
  numberOfMonths,
}) {
  const today = startOfToday();
  const [range, setRange] = useState(selectedRange);
  const [monthsToShow, setMonthsToShow] = useState(numberOfMonths || 2);

  // Sync external selectedRange prop changes
  useEffect(() => {
    setRange(selectedRange);
  }, [selectedRange?.from, selectedRange?.to]);

  // Adjust months for mobile responsiveness if not overridden
  useEffect(() => {
    if (numberOfMonths) return;
    const handleResize = () => {
      setMonthsToShow(window.innerWidth < 768 ? 1 : 2);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [numberOfMonths]);

  // Normalize server disabled dates into an array of matchers for DayPicker
  const disabledMatchers = [
    { before: today }, // Disable all past dates
    ...disabledDates.map((item) => {
      if (!item) return null;
      if (typeof item === 'string') {
        const parsed = parseISO(item);
        return isValid(parsed) ? parsed : null;
      }
      if (item instanceof Date) return item;
      if (item.date) {
        const parsed = typeof item.date === 'string' ? parseISO(item.date) : item.date;
        return isValid(parsed) ? parsed : null;
      }
      if (item.from && item.to) {
        const fromDate = typeof item.from === 'string' ? parseISO(item.from) : item.from;
        const toDate = typeof item.to === 'string' ? parseISO(item.to) : item.to;
        return { from: fromDate, to: toDate };
      }
      return null;
    }).filter(Boolean),
  ];

  const handleSelect = (selected) => {
    setRange(selected || { from: undefined, to: undefined });
    if (onDateChange) {
      onDateChange(selected || { from: null, to: null });
    }
  };

  const handleClear = () => {
    const emptyRange = { from: undefined, to: undefined };
    setRange(emptyRange);
    if (onDateChange) {
      onDateChange({ from: null, to: null });
    }
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
        <div className="flex items-center space-x-2 text-sm text-gray-700">
          <FiCalendar className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">
            {range?.from ? (
              range?.to ? (
                <span>
                  {format(range.from, 'MMM dd, yyyy')} — {format(range.to, 'MMM dd, yyyy')}
                </span>
              ) : (
                <span>Select check-out date (from {format(range.from, 'MMM dd')})</span>
              )
            ) : (
              <span className="text-gray-500">Select check-in & check-out dates</span>
            )}
          </span>
        </div>

        {range?.from && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-emerald-700 hover:underline"
          >
            <FiX className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Calendar */}
      <div className="flex justify-center overflow-x-auto">
        <DayPicker
          mode="range"
          selected={range}
          onSelect={handleSelect}
          disabled={disabledMatchers}
          numberOfMonths={monthsToShow}
          min={minNights + 1}
          modifiersStyles={{
            selected: { backgroundColor: '#059669', color: '#ffffff' },
          }}
          className="date-range-picker"
        />
      </div>

      {minNights > 1 && (
        <p className="mt-2 text-center text-xs text-gray-500">
          * Minimum stay requirement: {minNights} nights
        </p>
      )}
    </div>
  );
}
