import PricingRule from '../models/PricingRule.js';
import RoomUnit from '../models/RoomUnit.js';

/**
 * @module pricingService
 * Dynamic pricing engine that calculates per-night prices based on
 * seasonal rates, weekend surcharges, length-of-stay discounts, and custom rules.
 */

/**
 * Get all active pricing rules for a unit, sorted by priority (highest first)
 * @param {string} unitId - Room unit ID
 * @returns {Promise<Array>} Sorted pricing rules
 */
export const getActivePricingRules = async (unitId) => {
  return PricingRule.find({
    unitId,
    isActive: true,
  }).sort({ priority: -1 });
};

/**
 * Calculate the price for a specific date based on applicable pricing rules
 * @param {Date} date - The date to price
 * @param {number} basePrice - Unit's base price per night
 * @param {Array} rules - Active pricing rules for the unit
 * @param {number} totalNights - Total stay length in nights (for length-of-stay evaluation)
 * @returns {{ price: number, appliedRule: string|null }}
 */
export const calculateDatePrice = (date, basePrice, rules = [], totalNights = 1) => {
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getUTCDay(); // 0 = Sunday, 6 = Saturday

  let finalPrice = basePrice;
  let appliedRule = null;

  for (const rule of rules) {
    let applies = false;

    switch (rule.type) {
      case 'seasonal':
        if (rule.startDate && rule.endDate) {
          const start = new Date(rule.startDate);
          const end = new Date(rule.endDate);
          applies = dateObj >= start && dateObj <= end;
        }
        break;

      case 'weekend':
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          applies = rule.daysOfWeek.includes(dayOfWeek);
        } else {
          // Default: Friday (5) and Saturday (6) are weekend
          applies = dayOfWeek === 5 || dayOfWeek === 6;
        }
        break;

      case 'length-of-stay':
        if (rule.minNights && totalNights >= rule.minNights) {
          applies = true;
        }
        break;

      case 'custom':
        if (rule.startDate && rule.endDate) {
          const start = new Date(rule.startDate);
          const end = new Date(rule.endDate);
          applies = dateObj >= start && dateObj <= end;
        }
        break;

      default:
        break;
    }

    if (applies) {
      if (rule.priceOverride !== null && rule.priceOverride !== undefined) {
        finalPrice = rule.priceOverride;
      } else if (rule.percentageAdjustment !== null && rule.percentageAdjustment !== undefined) {
        finalPrice = Math.round(basePrice * (1 + rule.percentageAdjustment / 100));
      }
      appliedRule = rule.name;
      // High priority rule wins for this date
      break;
    }
  }

  return { price: Math.max(0, finalPrice), appliedRule };
};

/**
 * Calculate total price and itemized breakdown for a stay
 * @param {Object|string} unitOrId - RoomUnit document or ID
 * @param {Date|string} checkIn - Check-in date
 * @param {Date|string} checkOut - Check-out date
 * @param {number} [guests=1] - Number of guests
 * @returns {Promise<{ priceBreakdown: Array, totalAmount: number, nights: number }>}
 */
export const calculateBookingPrice = async (unitOrId, checkIn, checkOut, guests = 1) => {
  let unit = unitOrId;
  if (typeof unitOrId === 'string' || unitOrId instanceof String) {
    unit = await RoomUnit.findById(unitOrId);
    if (!unit) {
      throw new Error('Room unit not found');
    }
  }

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  const diffTime = end.getTime() - start.getTime();
  const nights = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (nights <= 0) {
    throw new Error('Check-out date must be after check-in date');
  }

  const rules = await getActivePricingRules(unit._id);
  const priceBreakdown = [];
  let totalAmount = 0;

  for (let i = 0; i < nights; i++) {
    const currentNight = new Date(start);
    currentNight.setUTCDate(start.getUTCDate() + i);

    const { price, appliedRule } = calculateDatePrice(currentNight, unit.basePrice, rules, nights);
    priceBreakdown.push({
      date: currentNight,
      price,
      appliedRule,
    });
    totalAmount += price;
  }

  return {
    priceBreakdown,
    totalAmount,
    nights,
  };
};

export default {
  getActivePricingRules,
  calculateDatePrice,
  calculateBookingPrice,
};
