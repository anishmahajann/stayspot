import React, { useState, useEffect, useRef } from 'react';
import { FiClock, FiAlertTriangle } from 'react-icons/fi';

/**
 * Countdown timer component for booking holds
 *
 * @param {Object} props
 * @param {string|Date|number} props.expiresAt - Expiry timestamp
 * @param {Function} [props.onExpire] - Callback when countdown finishes
 */
export default function BookingTimer({ expiresAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    hasExpiredRef.current = false;

    if (!expiresAt) {
      setTimeLeft(0);
      return;
    }

    const calculateRemaining = () => {
      const expiry = new Date(expiresAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      return diff;
    };

    const initialDiff = calculateRemaining();
    setTimeLeft(initialDiff);

    if (initialDiff <= 0) {
      if (!hasExpiredRef.current && onExpireRef.current) {
        hasExpiredRef.current = true;
        onExpireRef.current();
      }
      return;
    }

    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        if (!hasExpiredRef.current && onExpireRef.current) {
          hasExpiredRef.current = true;
          onExpireRef.current();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Color styles based on time remaining:
  // > 5 min (300s): Green
  // 2 - 5 min (120s - 300s): Yellow
  // < 2 min (< 120s): Red with pulse
  let colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let badgeText = 'Hold Active';
  let isPulsing = false;

  if (timeLeft <= 0) {
    colorClasses = 'bg-red-100 text-red-800 border-red-300';
    badgeText = 'Hold Expired';
  } else if (timeLeft < 120) {
    colorClasses = 'bg-red-50 text-red-700 border-red-200';
    badgeText = 'Expiring Soon!';
    isPulsing = true;
  } else if (timeLeft <= 300) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    badgeText = 'Limited Time';
  }

  return (
    <div
      className={`inline-flex items-center space-x-2.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${colorClasses} ${
        isPulsing ? 'animate-pulse ring-2 ring-red-400/40' : ''
      }`}
    >
      {timeLeft < 120 ? (
        <FiAlertTriangle className={`w-4 h-4 ${timeLeft <= 0 ? 'text-red-700' : 'text-red-500'}`} />
      ) : (
        <FiClock className="w-4 h-4" />
      )}
      <div className="flex items-center space-x-1.5">
        <span className="text-xs uppercase tracking-wider font-bold opacity-80">{badgeText}:</span>
        <span className="font-mono text-base tracking-widest">{formattedTime}</span>
      </div>
    </div>
  );
}
