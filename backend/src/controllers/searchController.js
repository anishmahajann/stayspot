import { catchAsync, AppError } from '../middleware/errorHandler.js';
import { searchAvailableProperties } from '../services/availabilityService.js';

/**
 * @controller searchController
 * Handles search requests with date-range availability, guest capacity, pricing filters, and pagination.
 */

/**
 * Search properties based on availability, destination, guests, price, and amenities.
 * GET /api/search
 */
export const searchProperties = catchAsync(async (req, res, next) => {
  const {
    city,
    from,
    to,
    checkIn,
    checkOut,
    guests,
    minPrice,
    maxPrice,
    type,
    amenities,
    sort,
    sortBy,
    page,
    limit,
  } = req.query;

  // Validate dates if both provided
  const startDate = from || checkIn;
  const endDate = to || checkOut;

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return next(new AppError('Invalid date format provided for check-in or check-out', 400));
    }

    if (end <= start) {
      return next(new AppError('Check-out date must be strictly after check-in date', 400));
    }
  }

  const searchResults = await searchAvailableProperties({
    city,
    from: startDate,
    to: endDate,
    checkIn: startDate,
    checkOut: endDate,
    guests: guests ? parseInt(guests, 10) : 1,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    type,
    amenities,
    sort: sort || sortBy,
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 12,
  });

  res.status(200).json({
    status: 'success',
    results: searchResults.properties.length,
    total: searchResults.total,
    page: searchResults.page,
    totalPages: searchResults.totalPages,
    properties: searchResults.properties,
    data: searchResults.properties,
  });
});

export default {
  searchProperties,
};
