import mongoose from 'mongoose';
import Property from '../models/Property.js';
import RoomUnit from '../models/RoomUnit.js';
import Booking from '../models/Booking.js';
import BlockedDate from '../models/BlockedDate.js';
import PricingRule from '../models/PricingRule.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import { getOwnerBookings as getOwnerBookingsService } from '../services/bookingService.js';

/**
 * @controller ownerController
 * Host/owner portal endpoints: property management, room unit inventory,
 * date blocking, dynamic pricing rules, reservations list, and business analytics.
 */

/**
 * Helper: Verify that a property belongs to the requesting owner.
 */
const verifyPropertyOwnership = async (propertyId, ownerId) => {
  const property = await Property.findById(propertyId);
  if (!property) {
    throw new AppError('Property not found', 404);
  }
  if (property.ownerId.toString() !== ownerId.toString()) {
    throw new AppError('Unauthorized: You do not own this property', 403);
  }
  return property;
};

/**
 * Helper: Verify that a room unit belongs to a property owned by the requesting owner.
 */
const verifyUnitOwnership = async (unitId, ownerId) => {
  const unit = await RoomUnit.findById(unitId).populate('propertyId');
  if (!unit) {
    throw new AppError('Room unit not found', 404);
  }
  if (unit.propertyId.ownerId.toString() !== ownerId.toString()) {
    throw new AppError('Unauthorized: You do not own this property or unit', 403);
  }
  return unit;
};

/**
 * Create a new property listing.
 * POST /api/owner/properties
 */
export const createProperty = catchAsync(async (req, res, next) => {
  const ownerId = req.user.id || req.user._id;
  const { basePrice, capacity, count, ...restBody } = req.body;

  const propertyData = {
    ...restBody,
    ownerId,
  };

  const property = await Property.create(propertyData);

  // Create a default room/space unit so the property is immediately bookable & searchable
  const defaultUnitName =
    property.type === 'event-venue'
      ? 'Main Event Hall'
      : property.type === 'villa'
      ? 'Entire Villa'
      : property.type === 'apartment'
      ? '1 BHK Apartment'
      : 'Standard Room';

  const defaultUnit = await RoomUnit.create({
    propertyId: property._id,
    name: defaultUnitName,
    description: `Primary ${defaultUnitName.toLowerCase()} at ${property.title}`,
    capacity: Number(capacity) || (property.type === 'event-venue' ? 100 : 2),
    count: Number(count) || (property.type === 'villa' ? 1 : 5),
    basePrice: Number(basePrice) || 2999,
    isActive: true,
  });

  const enrichedProperty = {
    ...property.toObject(),
    units: [defaultUnit],
  };

  res.status(201).json({
    status: 'success',
    message: 'Property created successfully',
    property: enrichedProperty,
    data: enrichedProperty,
  });
});

/**
 * Update an existing property.
 * PUT /api/owner/properties/:id
 */
export const updateProperty = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const ownerId = req.user.id || req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid property ID format', 400));
  }

  await verifyPropertyOwnership(id, ownerId);

  const updatedProperty = await Property.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    message: 'Property updated successfully',
    property: updatedProperty,
    data: updatedProperty,
  });
});

/**
 * Delete a property and its associated units.
 * DELETE /api/owner/properties/:id
 */
export const deleteProperty = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const ownerId = req.user.id || req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid property ID format', 400));
  }

  await verifyPropertyOwnership(id, ownerId);
  await RoomUnit.deleteMany({ propertyId: id });
  await Property.findByIdAndDelete(id);

  res.status(200).json({
    status: 'success',
    message: 'Property deleted successfully',
  });
});

/**
 * List all properties owned by logged-in host with unit inventory counts.
 * GET /api/owner/properties
 */
export const getOwnerProperties = catchAsync(async (req, res, next) => {
  const ownerId = req.user.id || req.user._id;

  const properties = await Property.find({ ownerId }).sort({ createdAt: -1 }).lean();
  const propertyIds = properties.map((p) => p._id);

  // Group room units by property
  const units = await RoomUnit.find({ propertyId: { $in: propertyIds } }).lean();
  const unitCountsByProp = {};
  const unitsByProp = {};
  units.forEach((u) => {
    const pId = u.propertyId.toString();
    if (!unitCountsByProp[pId]) {
      unitCountsByProp[pId] = { count: 0, totalInventory: 0 };
      unitsByProp[pId] = [];
    }
    unitCountsByProp[pId].count += 1;
    unitCountsByProp[pId].totalInventory += u.count || 1;
    unitsByProp[pId].push(u);
  });

  const propertiesWithStats = properties.map((prop) => ({
    ...prop,
    units: unitsByProp[prop._id.toString()] || [],
    unitTypesCount: unitCountsByProp[prop._id.toString()]?.count || 0,
    totalInventoryCount: unitCountsByProp[prop._id.toString()]?.totalInventory || 0,
  }));

  res.status(200).json({
    status: 'success',
    results: propertiesWithStats.length,
    properties: propertiesWithStats,
    data: propertiesWithStats,
  });
});

/**
 * Add a new room unit / event hall to an owner's property.
 * POST /api/owner/units
 */
export const createUnit = catchAsync(async (req, res, next) => {
  const ownerId = req.user.id || req.user._id;
  const { propertyId } = req.body;

  if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
    return next(new AppError('A valid propertyId is required', 400));
  }

  await verifyPropertyOwnership(propertyId, ownerId);

  const unit = await RoomUnit.create(req.body);

  res.status(201).json({
    status: 'success',
    message: 'Room unit created successfully',
    unit,
    data: unit,
  });
});

/**
 * Update a room unit.
 * PUT /api/owner/units/:id
 */
export const updateUnit = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const ownerId = req.user.id || req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid unit ID format', 400));
  }

  await verifyUnitOwnership(id, ownerId);

  const updatedUnit = await RoomUnit.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    message: 'Room unit updated successfully',
    unit: updatedUnit,
    data: updatedUnit,
  });
});

/**
 * Block dates on a room unit for maintenance or private reservations.
 * POST /api/owner/units/:id/block
 */
export const blockDates = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { from, to, reason } = req.body;
  const ownerId = req.user.id || req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid unit ID format', 400));
  }

  if (!from || !to) {
    return next(new AppError('From and To dates are required', 400));
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (toDate <= fromDate) {
    return next(new AppError('To date must be strictly after From date', 400));
  }

  await verifyUnitOwnership(id, ownerId);

  const blockedDate = await BlockedDate.create({
    unitId: id,
    from: fromDate,
    to: toDate,
    reason: reason || '',
    createdBy: ownerId,
  });

  res.status(201).json({
    status: 'success',
    message: 'Dates blocked successfully',
    blockedDate,
    data: blockedDate,
  });
});

/**
 * Remove a blocked date range.
 * DELETE /api/owner/units/:id/block/:blockId
 */
export const unblockDates = catchAsync(async (req, res, next) => {
  const { id, blockId } = req.params;
  const ownerId = req.user.id || req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(blockId)) {
    return next(new AppError('Invalid unit or block ID format', 400));
  }

  await verifyUnitOwnership(id, ownerId);

  const deleted = await BlockedDate.findOneAndDelete({
    _id: blockId,
    unitId: id,
  });

  if (!deleted) {
    return next(new AppError('Blocked date range not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Dates unblocked successfully',
  });
});

/**
 * Add a dynamic pricing rule to a room unit.
 * POST /api/owner/units/:id/pricing
 */
export const addPricingRule = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const ownerId = req.user.id || req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid unit ID format', 400));
  }

  await verifyUnitOwnership(id, ownerId);

  const rule = await PricingRule.create({
    ...req.body,
    unitId: id,
  });

  res.status(201).json({
    status: 'success',
    message: 'Pricing rule created successfully',
    pricingRule: rule,
    data: rule,
  });
});

/**
 * Update an existing pricing rule.
 * PUT /api/owner/pricing/:id
 */
export const updatePricingRule = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const ownerId = req.user.id || req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid pricing rule ID format', 400));
  }

  const rule = await PricingRule.findById(id);
  if (!rule) {
    return next(new AppError('Pricing rule not found', 404));
  }

  await verifyUnitOwnership(rule.unitId, ownerId);

  const updatedRule = await PricingRule.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    message: 'Pricing rule updated successfully',
    pricingRule: updatedRule,
    data: updatedRule,
  });
});

/**
 * Delete a pricing rule.
 * DELETE /api/owner/pricing/:id
 */
export const deletePricingRule = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const ownerId = req.user.id || req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid pricing rule ID format', 400));
  }

  const rule = await PricingRule.findById(id);
  if (!rule) {
    return next(new AppError('Pricing rule not found', 404));
  }

  await verifyUnitOwnership(rule.unitId, ownerId);

  await PricingRule.findByIdAndDelete(id);

  res.status(200).json({
    status: 'success',
    message: 'Pricing rule deleted successfully',
  });
});

/**
 * List bookings across all properties owned by this host.
 * GET /api/owner/bookings
 */
export const getOwnerBookings = catchAsync(async (req, res, next) => {
  const ownerId = req.user.id || req.user._id;
  const { propertyId, status, page, limit } = req.query;

  const result = await getOwnerBookingsService(ownerId, {
    propertyId,
    status,
    page,
    limit,
  });

  res.status(200).json({
    status: 'success',
    results: result.bookings.length,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    bookings: result.bookings,
    data: result.bookings,
  });
});

/**
 * Calculate occupancy statistics across owner's properties.
 * GET /api/owner/reports/occupancy?from=&to=&propertyId=
 */
export const getOccupancyReport = catchAsync(async (req, res, next) => {
  const ownerId = req.user.id || req.user._id;
  const { propertyId, from, to } = req.query;

  const endDate = to ? new Date(to) : new Date();
  const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const propFilter = { ownerId };
  if (propertyId && mongoose.Types.ObjectId.isValid(propertyId)) {
    propFilter._id = propertyId;
  }

  const properties = await Property.find(propFilter).select('_id title').lean();
  const propIds = properties.map((p) => p._id);

  // Total room capacity
  const units = await RoomUnit.find({ propertyId: { $in: propIds }, isActive: true }).lean();
  const totalRoomSlots = units.reduce((acc, u) => acc + (u.count || 1), 0);

  const daysInRange = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const totalPotentialRoomNights = totalRoomSlots * daysInRange;

  // Confirmed and completed bookings in range
  const bookings = await Booking.find({
    propertyId: { $in: propIds },
    status: { $in: ['confirmed', 'completed'] },
    checkIn: { $lt: endDate },
    checkOut: { $gt: startDate },
  }).lean();

  const bookedRoomNights = bookings.reduce((acc, b) => acc + (b.nights || 1), 0);
  const occupancyRate = totalPotentialRoomNights > 0
    ? Math.round((bookedRoomNights / totalPotentialRoomNights) * 100 * 10) / 10
    : 0;

  res.status(200).json({
    status: 'success',
    report: {
      startDate,
      endDate,
      daysInRange,
      totalProperties: properties.length,
      totalRoomTypes: units.length,
      totalInventorySlots: totalRoomSlots,
      totalPotentialRoomNights,
      bookedRoomNights,
      totalBookings: bookings.length,
      occupancyRate: Math.min(100, occupancyRate),
    },
    data: {
      occupancyRate: Math.min(100, occupancyRate),
      bookedRoomNights,
      totalBookings: bookings.length,
    },
  });
});

/**
 * Calculate revenue statistics and breakdown with date grouping.
 * GET /api/owner/reports/revenue?from=&to=&propertyId=
 */
export const getRevenueReport = catchAsync(async (req, res, next) => {
  const ownerId = req.user.id || req.user._id;
  const { propertyId, from, to } = req.query;

  const endDate = to ? new Date(to) : new Date();
  const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const propFilter = { ownerId };
  if (propertyId && mongoose.Types.ObjectId.isValid(propertyId)) {
    propFilter._id = propertyId;
  }

  const properties = await Property.find(propFilter).select('_id title').lean();
  const propIds = properties.map((p) => p._id);

  // All bookings created or active in range
  const bookings = await Booking.find({
    propertyId: { $in: propIds },
    createdAt: { $gte: startDate, $lte: endDate },
  }).sort({ createdAt: 1 }).lean();

  let grossRevenue = 0;
  let totalRefunds = 0;
  let confirmedBookingsCount = 0;
  let cancelledBookingsCount = 0;
  const dailyBreakdown = {};

  bookings.forEach((b) => {
    const dayKey = new Date(b.createdAt).toISOString().split('T')[0];
    if (!dailyBreakdown[dayKey]) {
      dailyBreakdown[dayKey] = { date: dayKey, gross: 0, refunds: 0, net: 0, count: 0 };
    }

    if (b.status === 'confirmed' || b.status === 'completed') {
      grossRevenue += b.totalAmount || 0;
      confirmedBookingsCount += 1;
      dailyBreakdown[dayKey].gross += b.totalAmount || 0;
      dailyBreakdown[dayKey].net += b.totalAmount || 0;
      dailyBreakdown[dayKey].count += 1;
    } else if (b.status === 'cancelled') {
      cancelledBookingsCount += 1;
      const refund = b.refundAmount || 0;
      totalRefunds += refund;
      dailyBreakdown[dayKey].refunds += refund;
      dailyBreakdown[dayKey].net -= refund;
    }
  });

  const netRevenue = Math.max(0, grossRevenue - totalRefunds);
  const averageBookingValue = confirmedBookingsCount > 0
    ? Math.round(grossRevenue / confirmedBookingsCount)
    : 0;

  res.status(200).json({
    status: 'success',
    report: {
      startDate,
      endDate,
      grossRevenue,
      totalRefunds,
      netRevenue,
      confirmedBookingsCount,
      cancelledBookingsCount,
      totalBookingsCount: bookings.length,
      averageBookingValue,
      dailyBreakdown: Object.values(dailyBreakdown),
    },
    data: {
      grossRevenue,
      netRevenue,
      totalRefunds,
      averageBookingValue,
      dailyBreakdown: Object.values(dailyBreakdown),
    },
  });
});

/**
 * Delete (deactivate) a room unit.
 * DELETE /api/owner/units/:id
 */
export const deleteUnit = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const ownerId = req.user.id || req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid unit ID format', 400));
  }

  await verifyUnitOwnership(id, ownerId);
  await RoomUnit.findByIdAndDelete(id);

  res.status(200).json({
    status: 'success',
    message: 'Room unit deleted successfully',
  });
});

/**
 * Combined owner analytics report (occupancy + revenue + bookings).
 * GET /api/owner/reports?timeframe=30d
 */
export const getCombinedReports = catchAsync(async (req, res, next) => {
  const ownerId = req.user.id || req.user._id;
  const { timeframe = '30d', propertyId } = req.query;

  const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const days = daysMap[timeframe] || 30;
  const endDate = new Date();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const propFilter = { ownerId };
  if (propertyId && mongoose.Types.ObjectId.isValid(propertyId)) {
    propFilter._id = propertyId;
  }

  const properties = await Property.find(propFilter).select('_id title').lean();
  const propIds = properties.map((p) => p._id);

  const units = await RoomUnit.find({ propertyId: { $in: propIds }, isActive: true }).lean();
  const totalRoomSlots = units.reduce((acc, u) => acc + (u.count || 1), 0);
  const totalPotentialRoomNights = totalRoomSlots * days;

  const bookings = await Booking.find({
    propertyId: { $in: propIds },
    createdAt: { $gte: startDate, $lte: endDate },
  })
    .populate('propertyId', 'title')
    .populate('unitId', 'name')
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  let grossRevenue = 0;
  let totalRefunds = 0;
  let confirmedBookingsCount = 0;
  let bookedRoomNights = 0;
  const dailyMap = {};

  bookings.forEach((b) => {
    const dayKey = new Date(b.createdAt).toISOString().split('T')[0];
    if (!dailyMap[dayKey]) {
      dailyMap[dayKey] = { date: dayKey, revenue: 0, bookings: 0 };
    }
    if (b.status === 'confirmed' || b.status === 'completed') {
      grossRevenue += b.totalAmount || 0;
      confirmedBookingsCount += 1;
      bookedRoomNights += b.nights || 1;
      dailyMap[dayKey].revenue += b.totalAmount || 0;
      dailyMap[dayKey].bookings += 1;
    } else if (b.status === 'cancelled') {
      totalRefunds += b.refundAmount || 0;
    }
  });

  const netRevenue = Math.max(0, grossRevenue - totalRefunds);
  const averageBookingValue =
    confirmedBookingsCount > 0 ? Math.round(grossRevenue / confirmedBookingsCount) : 0;
  const occupancyRate =
    totalPotentialRoomNights > 0
      ? Math.min(100, Math.round((bookedRoomNights / totalPotentialRoomNights) * 100 * 10) / 10)
      : 0;

  const reports = {
    timeframe,
    totalRevenue: grossRevenue,
    netRevenue,
    totalRefunds,
    totalBookings: bookings.length,
    confirmedBookings: confirmedBookingsCount,
    averageBookingValue,
    occupancyRate,
    dailyBreakdown: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)),
    bookings,
  };

  res.status(200).json({
    status: 'success',
    reports,
    data: reports,
  });
});

/**
 * Get unit calendar data (booked dates, held dates, blocked dates, pricing rules).
 * GET /api/owner/units/:id/calendar?start=&end=
 */
export const getUnitCalendar = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const ownerId = req.user.id || req.user._id;
  const { start, end } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid unit ID format', 400));
  }

  const unit = await verifyUnitOwnership(id, ownerId);

  const now = new Date();
  const rangeStart = start
    ? new Date(start)
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const rangeEnd = end
    ? new Date(new Date(end).getTime() + 24 * 60 * 60 * 1000)
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const [bookings, blocks, pricingRules] = await Promise.all([
    Booking.find({
      unitId: id,
      status: { $in: ['confirmed', 'completed', 'held'] },
      checkIn: { $lt: rangeEnd },
      checkOut: { $gt: rangeStart },
      $or: [
        { status: { $in: ['confirmed', 'completed'] } },
        { status: 'held', holdExpiresAt: { $gt: now } },
      ],
    })
      .populate('userId', 'name email')
      .lean(),
    BlockedDate.find({
      unitId: id,
      from: { $lt: rangeEnd },
      to: { $gt: rangeStart },
    }).lean(),
    PricingRule.find({ unitId: id, isActive: true }).sort({ priority: -1 }).lean(),
  ]);

  const expandDays = (fromDate, toDate) => {
    const dates = [];
    const cur = new Date(Date.UTC(
      new Date(fromDate).getUTCFullYear(),
      new Date(fromDate).getUTCMonth(),
      new Date(fromDate).getUTCDate()
    ));
    const endDt = new Date(Date.UTC(
      new Date(toDate).getUTCFullYear(),
      new Date(toDate).getUTCMonth(),
      new Date(toDate).getUTCDate()
    ));
    while (cur < endDt) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return dates;
  };

  const bookedDates = [];
  const heldDates = [];
  bookings.forEach((b) => {
    const days = expandDays(b.checkIn, b.checkOut);
    days.forEach((date) => {
      const entry = {
        date,
        bookingId: b._id,
        guestName: b.userId?.name || 'Guest',
        amount: b.totalAmount,
        status: b.status,
      };
      if (b.status === 'held') {
        heldDates.push(entry);
      } else {
        bookedDates.push(entry);
      }
    });
  });

  const blockedDates = [];
  blocks.forEach((bl) => {
    const days = expandDays(bl.from, bl.to);
    days.forEach((date) => {
      blockedDates.push({
        date,
        blockId: bl._id,
        reason: bl.reason || 'Blocked',
      });
    });
  });

  res.status(200).json({
    status: 'success',
    unit: {
      _id: unit._id,
      name: unit.name,
      basePrice: unit.basePrice,
      capacity: unit.capacity,
      count: unit.count,
      propertyId: unit.propertyId?._id,
      propertyTitle: unit.propertyId?.title,
    },
    bookedDates,
    heldDates,
    blockedDates,
    pricingRules,
  });
});

export default {
  createProperty,
  updateProperty,
  getOwnerProperties,
  createUnit,
  updateUnit,
  deleteUnit,
  blockDates,
  unblockDates,
  addPricingRule,
  updatePricingRule,
  deletePricingRule,
  getOwnerBookings,
  getOccupancyReport,
  getRevenueReport,
  getCombinedReports,
  getUnitCalendar,
};
