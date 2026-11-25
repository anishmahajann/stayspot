import React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { FiCheck, FiInfo } from 'react-icons/fi';

/**
 * Detailed Price Breakdown Table component
 *
 * @param {Object} props
 * @param {Array<{date: string|Date, price: number, ruleName?: string}>} [props.breakdown] - Nightly rates
 * @param {number} props.totalAmount - Final total price
 * @param {number} [props.subtotal] - Optional calculated subtotal
 * @param {number} [props.discount] - Optional applied discount
 * @param {number} [props.taxes] - Optional taxes/fees
 * @param {string} [props.currency='₹'] - Currency symbol
 */
export default function PriceBreakdown({
  breakdown = [],
  totalAmount = 0,
  subtotal,
  discount = 0,
  taxes = 0,
  currency = '₹',
}) {
  const calculatedSubtotal =
    subtotal !== undefined
      ? subtotal
      : breakdown.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const formatDate = (dateVal) => {
    try {
      const d = typeof dateVal === 'string' ? parseISO(dateVal) : dateVal;
      return isValid(d) ? format(d, 'EEE, MMM dd, yyyy') : 'Night';
    } catch {
      return 'Night';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">Price Details</h3>
        <span className="text-xs text-gray-500 font-medium">
          {breakdown.length} {breakdown.length === 1 ? 'Night' : 'Nights'}
        </span>
      </div>

      {/* Nightly price rows */}
      <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
        {breakdown.length > 0 ? (
          breakdown.map((row, idx) => (
            <div key={idx} className="px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm hover:bg-gray-50/50">
              <div className="flex flex-col">
                <span className="font-medium text-gray-800">{formatDate(row.date)}</span>
                {row.ruleName && (
                  <span className="text-[11px] text-emerald-600 flex items-center space-x-1">
                    <FiCheck className="w-3 h-3" />
                    <span>{row.ruleName}</span>
                  </span>
                )}
              </div>
              <span className="font-semibold text-gray-900">
                {currency}
                {Number(row.price).toLocaleString('en-IN')}
              </span>
            </div>
          ))
        ) : (
          <div className="px-4 py-3 text-xs text-gray-500 text-center">
            Standard pricing rate applies
          </div>
        )}
      </div>

      {/* Totals Summary */}
      <div className="p-4 bg-gray-50/50 border-t border-gray-100 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span className="font-medium text-gray-800">
            {currency}
            {Number(calculatedSubtotal).toLocaleString('en-IN')}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span className="flex items-center space-x-1">
              <span>Promotional Discount</span>
            </span>
            <span className="font-medium">
              -{currency}
              {Number(discount).toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {taxes > 0 && (
          <div className="flex justify-between text-gray-600">
            <span className="flex items-center space-x-1">
              <span>Taxes & GST (18%)</span>
              <FiInfo className="w-3.5 h-3.5 text-gray-400" />
            </span>
            <span className="font-medium text-gray-800">
              {currency}
              {Number(taxes).toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Final Total */}
        <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
          <div>
            <span className="text-base font-bold text-gray-900">Total Amount</span>
            <span className="block text-[11px] text-gray-500 font-normal">Includes all taxes and fees</span>
          </div>
          <span className="text-2xl font-extrabold text-emerald-600">
            {currency}
            {Number(totalAmount).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
}
