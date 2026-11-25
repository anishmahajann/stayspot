import mongoose from 'mongoose';
import Property from '../models/Property.js';
import RoomUnit from '../models/RoomUnit.js';
import Booking from '../models/Booking.js';
import BlockedDate from '../models/BlockedDate.js';
import { calculateBookingPrice } from './pricingService.js';

/**
 * @module availabilityService
 * High-performance availability calculation engine supporting:
 * - Date-range overlap queries
 * - Capacity and inventory deduction (holds + confirmed bookings + blocked dates)
 * - Multi-criteria search with dynamic price computation
 * - Monthly availability calendars for calendar UI
 * - Atomic booking lock checking with MongoDB sessions
 */

/**
 * Check whether a specific unit has available capacity for the given date range.
 *
 * @param {string} unitId
 * @param {Date|string} checkIn
 * @param {Date|string} checkOut
 * @param {number} [quantity=1]
 * @param {string|null} [excludeBookingId=null]
 * @param {mongoose.ClientSession|null} [session=null]
 * @returns {Promise<{ available: boolean, remainingCount: number, totalCount: number }>}
 */
export const checkUnitAvailability = async (
  unitId,
  checkIn,
  checkOut,
  quantity = 1,
  excludeBookingId = null,
  session = null
) => {
  const unit = await RoomUnit.findById(unitId).session(session);
  if (!unit || !unit.isActive) {
    return { available: false, remainingCount: 0, totalCount: 0 };
  }

  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);

  // Check if dates are blocked by owner
  const blockedDatesQuery = {
    unitId: new mongoose.Types.ObjectId(unitId),
    from: { $lt: endDate },
    to: { $gt: startDate },
  };

  const isBlocked = await BlockedDate.exists(blockedDatesQuery).session(session);
  if (isBlocked) {
    return { available: false, remainingCount: 0, totalCount: unit.count };
  }

  // Count overlapping active bookings (held or confirmed)
  const bookingFilter = {
    unitId: new mongoose.Types.ObjectId(unitId),
    status: { $in: ['confirmed', 'held'] },
    checkIn: { $lt: endDate },
    checkOut: { $gt: startDate },
  };

  // If held, ensure hold hasn't expired according to server time
  bookingFilter.$or = [
    { status: 'confirmed' },
    { status: 'held', holdExpiresAt: { $gt: new Date() } },
  ];

  if (excludeBookingId) {
    bookingFilter._id = { $ne: new mongoose.Types.ObjectId(excludeBookingId) };
  }

  const bookedCount = await Booking.countDocuments(bookingFilter).session(session);
  const remainingCount = Math.max(0, unit.count - bookedCount);

  return {
    available: remainingCount >= quantity,
    remainingCount,
    totalCount: unit.count,
  };
};

/**
 * Atomic reservation lock to prevent race conditions and double bookings.
 *
 * @param {Object} bookingData
 * @param {mongoose.ClientSession} session
 * @returns {Promise<Booking>}
 */
export const createBookingWithLock = async (bookingData, session = null) => {
  const { unitId, checkIn, checkOut } = bookingData;

  const availability = await checkUnitAvailability(
    unitId,
    checkIn,
    checkOut,
    1,
    null,
    session
  );

  if (!availability.available) {
    const error = new Error('Selected room unit is no longer available for these dates.');
    error.statusCode = 409;
    throw error;
  }

  const bookings = await Booking.create([bookingData], { session });
  return bookings[0];
};

/**
 * Search available properties with full filtering, dynamic pricing, and pagination.
 *
 * @param {Object} params
 * @returns {Promise<{ properties: Array, total: number, page: number, totalPages: number }>}
 */
export const searchAvailableProperties = async (params = {}) => {
  const {
    city,
    from,
    to,
    checkIn,
    checkOut,
    guests = 1,
    minPrice,
    maxPrice,
    type,
    amenities,
    sort = 'recommended',
    sortBy,
    page = 1,
    limit = 12,
  } = params;

  const effectiveCheckIn = from || checkIn;
  const effectiveCheckOut = to || checkOut;
  const guestCount = parseInt(guests, 10) || 1;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const currentLimit = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));

  // Build property base query
  const propertyQuery = { isActive: true };

  if (city && city.trim() !== '') {
    propertyQuery['location.city'] = { $regex: new RegExp(city.trim(), 'i') };
  }

  if (type && type.trim() !== '') {
    propertyQuery.type = type.trim();
  }

  if (amenities) {
    const amenityArray = Array.isArray(amenities)
      ? amenities
      : amenities.split(',').map((a) => a.trim()).filter(Boolean);
    if (amenityArray.length > 0) {
      propertyQuery.amenities = { $all: amenityArray };
    }
  }

  // Fetch candidate properties
  const properties = await Property.find(propertyQuery).lean();
  if (properties.length === 0) {
    return { properties: [], total: 0, page: currentPage, totalPages: 0 };
  }

  const propertyIds = properties.map((p) => p._id);

  // Fetch active units for candidate properties with sufficient capacity
  const unitQuery = {
    propertyId: { $in: propertyIds },
    isActive: true,
    capacity: { $gte: guestCount },
  };

  const units = await RoomUnit.find(unitQuery).lean();
  const unitsByProperty = {};
  units.forEach((unit) => {
    const pId = unit.propertyId.toString();
    if (!unitsByProperty[pId]) unitsByProperty[pId] = [];
    unitsByProperty[pId].push(unit);
  });

  const availableProperties = [];

  // Determine availability and prices for each property
  for (const property of properties) {
    const pId = property._id.toString();
    const propUnits = unitsByProperty[pId] || [];

    if (propUnits.length === 0) continue;

    let lowestPrice = Infinity;
    let matchingUnitAvailable = false;
    const availableUnits = [];

    for (const unit of propUnits) {
      let isUnitAvailable = true;

      // If dates provided, calculate overlap
      if (effectiveCheckIn && effectiveCheckOut) {
        const { available } = await checkUnitAvailability(
          unit._id,
          effectiveCheckIn,
          effectiveCheckOut
        );
        isUnitAvailable = available;
      }

      if (isUnitAvailable) {
        matchingUnitAvailable = true;

        let stayPrice = unit.basePrice;
        if (effectiveCheckIn && effectiveCheckOut) {
          try {
            const quote = await calculateBookingPrice(unit, effectiveCheckIn, effectiveCheckOut, guestCount);
            stayPrice = Math.round(quote.totalAmount / (quote.nights || 1));
          } catch (e) {
            stayPrice = unit.basePrice;
          }
        }

        if (stayPrice < lowestPrice) {
          lowestPrice = stayPrice;
        }

        availableUnits.push({
          ...unit,
          effectiveNightlyPrice: stayPrice,
        });
      }
    }

    if (matchingUnitAvailable) {
      // Filter by price range
      const numericMin = minPrice ? parseFloat(minPrice) : null;
      const numericMax = maxPrice ? parseFloat(maxPrice) : null;

      if (numericMin !== null && lowestPrice < numericMin) continue;
      if (numericMax !== null && lowestPrice > numericMax) continue;

      availableProperties.push({
        ...property,
        pricePerNight: lowestPrice === Infinity ? propUnits[0].basePrice : lowestPrice,
        availableUnitsCount: availableUnits.length,
        availableUnits,
      });
    }
  }

  // Sort results
  const sortOption = sortBy || sort;
  availableProperties.sort((a, b) => {
    switch (sortOption) {
      case 'price_asc':
      case 'price-low-to-high':
        return a.pricePerNight - b.pricePerNight;
      case 'price_desc':
      case 'price-high-to-low':
        return b.pricePerNight - a.pricePerNight;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'reviews':
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      default:
        return (b.rating || 0) - (a.rating || 0);
    }
  });

  const total = availableProperties.length;
  const totalPages = Math.ceil(total / currentLimit);
  const startIndex = (currentPage - 1) * currentLimit;
  const paginatedProperties = availableProperties.slice(startIndex, startIndex + currentLimit);

  return {
    properties: paginatedProperties,
    total,
    page: currentPage,
    totalPages,
  };
};

/**
 * Get monthly availability calendar for all units under a property.
 *
 * @param {string} propertyId
 * @param {number|string} [month] - 1 to 12
 * @param {number|string} [year] - e.g. 2026
 * @returns {Promise<Object>} Calendar availability data grouped by unit and date
 */
export const getMonthlyAvailability = async (propertyId, month, year) => {
  const now = new Date();
  const targetYear = year ? parseInt(year, 10) : now.getUTCFullYear();
  const targetMonth = month ? parseInt(month, 10) - 1 : now.getUTCMonth(); // 0-indexed

  const startDate = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59));

  const units = await RoomUnit.find({ propertyId, isActive: true }).lean();
  if (units.length === 0) {
    return { propertyId, month: targetMonth + 1, year: targetYear, calendar: {} };
  }

  const unitIds = units.map((u) => u._id);

  // Active bookings overlapping this month
  const activeBookings = await Booking.find({
    unitId: { $in: unitIds },
    status: { $in: ['confirmed', 'held'] },
    checkIn: { $lt: endDate },
    checkOut: { $gt: startDate },
    $or: [
      { status: 'confirmed' },
      { status: 'held', holdExpiresAt: { $gt: now } },
    ],
  }).lean();

  // Blocked date ranges overlapping this month
  const blockedDates = await BlockedDate.find({
    unitId: { $in: unitIds },
    from: { $lt: endDate },
    to: { $gt: startDate },
  }).lean();

  const daysInMonth = endDate.getUTCDate();
  const calendar = {};

  for (const unit of units) {
    const uId = unit._id.toString();
    calendar[uId] = {
      unitId: uId,
      unitName: unit.name,
      totalCount: unit.count,
      days: {},
    };

    const unitBookings = activeBookings.filter((b) => b.unitId.toString() === uId);
    const unitBlocked = blockedDates.filter((b) => b.unitId.toString() === uId);

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(Date.UTC(targetYear, targetMonth, day, 12, 0, 0));
      const dateKey = dayDate.toISOString().split('T')[0];

      // Check if day is blocked
      const isBlocked = unitBlocked.some((b) => {
        const from = new Date(b.from);
        const to = new Date(b.to);
        return dayDate >= from && dayDate < to;
      });

      if (isBlocked) {
        calendar[uId].days[dateKey] = {
          date: dateKey,
          availableCount: 0,
          isAvailable: false,
          isBlocked: true,
        };
        continue;
      }

      // Overlapping bookings on this date
      const bookedCount = unitBookings.filter((b) => {
        const checkIn = new Date(b.checkIn);
        const checkOut = new Date(b.checkOut);
        return dayDate >= checkIn && dayDate < checkOut;
      }).length;

      const availableCount = Math.max(0, unit.count - bookedCount);

      calendar[uId].days[dateKey] = {
        date: dateKey,
        availableCount,
        isAvailable: availableCount > 0,
        isBlocked: false,
      };
    }
  }

  return {
    propertyId,
    month: targetMonth + 1,
    year: targetYear,
    unitsCount: units.length,
    calendar,
  };
};

export default {
  checkUnitAvailability,
  createBookingWithLock,
  searchAvailableProperties,
  getMonthlyAvailability,
};
