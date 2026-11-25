import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

/**
 * StarRating component supporting fractional ratings and interactive selection
 */
export default function StarRating({
  rating = 0,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onChange,
}) {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  const iconClass = sizeClasses[size] || sizeClasses.md;

  const stars = [];
  for (let i = 1; i <= maxStars; i++) {
    if (interactive) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => onChange && onChange(i)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          {i <= rating ? (
            <FaStar className={`${iconClass} text-amber-400`} />
          ) : (
            <FaRegStar className={`${iconClass} text-gray-300 hover:text-amber-300`} />
          )}
        </button>
      );
    } else {
      if (rating >= i) {
        stars.push(<FaStar key={i} className={`${iconClass} text-amber-400`} />);
      } else if (rating >= i - 0.5) {
        stars.push(<FaStarHalfAlt key={i} className={`${iconClass} text-amber-400`} />);
      } else {
        stars.push(<FaRegStar key={i} className={`${iconClass} text-gray-300`} />);
      }
    }
  }

  return <div className="flex items-center space-x-0.5">{stars}</div>;
}
