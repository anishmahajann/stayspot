import React from 'react';
import { differenceInHours, differenceInCalendarDays, parseISO, isValid } from 'date-fns';
import { FiShield, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

/**
 * CancellationPolicy display and refund calculation component
 *
 * @param {Object} props
 * @param {string} [props.policyType='moderate'] - 'flexible' | 'moderate' | 'strict'
 * @param {string|Date} props.checkIn - Check-in date
 * @param {number} [props.totalAmount=0] - Total booking amount to compute refund
 * @param {string} [props.currency='₹'] - Currency symbol
 */
export default function CancellationPolicy({
  policyType = 'moderate',
  checkIn,
  totalAmount = 0,
  currency = '₹',
}) {
  const checkInDate = typeof checkIn === 'string' ? parseISO(checkIn) : checkIn;
  const now = new Date();

  let hoursRemaining = 0;
  let daysRemaining = 0;
  if (checkInDate && isValid(checkInDate)) {
    hoursRemaining = differenceInHours(checkInDate, now);
    daysRemaining = differenceInCalendarDays(checkInDate, now);
  }

  // Calculate refund percentage and status color based on policy and timing
  let refundPercent = 0;
  let refundExplanation = '';
  let colorTheme = 'red'; // 'green', 'yellow', 'red'

  const normalizedPolicy = (policyType || 'moderate').toLowerCase();

  if (normalizedPolicy === 'flexible') {
    // Flexible: Full refund up to 24 hours prior to check-in
    if (hoursRemaining >= 24) {
      refundPercent = 100;
      colorTheme = 'green';
      refundExplanation = 'Eligible for 100% full refund if cancelled at least 24 hours before check-in.';
    } else if (hoursRemaining > 0) {
      refundPercent = 0;
      colorTheme = 'red';
      refundExplanation = 'Non-refundable: Cancellation is within 24 hours of check-in.';
    } else {
      refundPercent = 0;
      colorTheme = 'red';
      refundExplanation = 'Check-in date has passed. No refund available.';
    }
  } else if (normalizedPolicy === 'strict') {
    // Strict: 50% refund up to 7 days before check-in, no refund after
    if (daysRemaining >= 7) {
      refundPercent = 50;
      colorTheme = 'yellow';
      refundExplanation = 'Eligible for 50% partial refund if cancelled 7+ days before check-in.';
    } else {
      refundPercent = 0;
      colorTheme = 'red';
      refundExplanation = 'Non-refundable under strict policy within 7 days of check-in.';
    }
  } else {
    // Moderate (default): 100% refund up to 5 days before, 50% refund between 2 and 5 days, 0% under 48 hours
    if (daysRemaining >= 5) {
      refundPercent = 100;
      colorTheme = 'green';
      refundExplanation = 'Eligible for 100% full refund if cancelled at least 5 days prior to check-in.';
    } else if (hoursRemaining >= 48) {
      refundPercent = 50;
      colorTheme = 'yellow';
      refundExplanation = 'Eligible for 50% partial refund if cancelled 2-5 days before check-in.';
    } else {
      refundPercent = 0;
      colorTheme = 'red';
      refundExplanation = 'Non-refundable: Cancellation is within 48 hours of check-in.';
    }
  }

  const estimatedRefundAmount = Math.round((totalAmount * refundPercent) / 100);

  const themeStyles = {
    green: {
      border: 'border-emerald-200',
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-800',
      badge: 'bg-emerald-100 text-emerald-800',
      icon: <FiCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
    },
    yellow: {
      border: 'border-amber-200',
      bg: 'bg-amber-50/70',
      text: 'text-amber-800',
      badge: 'bg-amber-100 text-amber-800',
      icon: <FiAlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
    },
    red: {
      border: 'border-red-200',
      bg: 'bg-red-50/70',
      text: 'text-red-800',
      badge: 'bg-red-100 text-red-800',
      icon: <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />,
    },
  }[colorTheme];

  return (
    <div className={`p-4 rounded-2xl border ${themeStyles.border} ${themeStyles.bg} transition-all`}>
      <div className="flex items-start space-x-3">
        {themeStyles.icon}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-semibold capitalize text-gray-900">
              {normalizedPolicy} Cancellation Policy
            </h4>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${themeStyles.badge}`}>
              {refundPercent}% Refund
            </span>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">{refundExplanation}</p>

          {totalAmount > 0 && (
            <div className="mt-2.5 pt-2 border-t border-gray-200/50 flex items-center justify-between text-xs">
              <span className="text-gray-500">Estimated Refund Amount:</span>
              <span className="font-bold text-gray-900 text-sm">
                {currency}
                {estimatedRefundAmount.toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
