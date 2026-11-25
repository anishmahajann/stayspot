import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  searchProperties,
  setFilters,
  clearFilters,
  setPage,
} from '../store/slices/searchSlice';
import FilterSidebar from '../components/search/FilterSidebar';
import PropertyCard from '../components/search/PropertyCard';
import SearchBar from '../components/search/SearchBar';
import {
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiInbox,
  FiArrowDown,
  FiArrowUp,
} from 'react-icons/fi';

export default function SearchPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const { filters, results, pagination, loading, error } = useSelector(
    (state) => state.search
  );

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');

  // Initialize filters from URL query parameters on mount and URL changes
  useEffect(() => {
    const urlCity = searchParams.get('city') || '';
    const urlCheckIn = searchParams.get('checkIn') || null;
    const urlCheckOut = searchParams.get('checkOut') || null;
    const urlGuests = searchParams.get('guests') ? Number(searchParams.get('guests')) : 1;
    const urlType = searchParams.get('type') || '';
    const urlMinPrice = searchParams.get('minPrice') || '';
    const urlMaxPrice = searchParams.get('maxPrice') || '';
    const urlAmenities = searchParams.get('amenities')
      ? searchParams.get('amenities').split(',').filter(Boolean)
      : [];

    const initialFilters = {
      city: urlCity,
      checkIn: urlCheckIn,
      checkOut: urlCheckOut,
      guests: urlGuests,
      type: urlType,
      minPrice: urlMinPrice,
      maxPrice: urlMaxPrice,
      amenities: urlAmenities,
    };

    dispatch(setFilters(initialFilters));
    dispatch(searchProperties(initialFilters));
  }, [searchParams.toString()]);

  // Synchronize Redux filters back to URL search params
  const syncUrlParams = (updatedFilters) => {
    const params = new URLSearchParams();
    if (updatedFilters.city) params.set('city', updatedFilters.city);
    if (updatedFilters.checkIn) params.set('checkIn', updatedFilters.checkIn);
    if (updatedFilters.checkOut) params.set('checkOut', updatedFilters.checkOut);
    if (updatedFilters.guests && updatedFilters.guests > 1)
      params.set('guests', updatedFilters.guests);
    if (updatedFilters.type) params.set('type', updatedFilters.type);
    if (updatedFilters.minPrice) params.set('minPrice', updatedFilters.minPrice);
    if (updatedFilters.maxPrice) params.set('maxPrice', updatedFilters.maxPrice);
    if (updatedFilters.amenities?.length > 0)
      params.set('amenities', updatedFilters.amenities.join(','));

    setSearchParams(params);
  };

  const handleApplyFilters = (newFilters) => {
    const merged = { ...filters, ...newFilters };
    dispatch(setFilters(merged));
    syncUrlParams(merged);
    dispatch(searchProperties());
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setSearchParams(new URLSearchParams());
    dispatch(searchProperties());
  };

  const handlePageChange = (newPage) => {
    dispatch(setPage(newPage));
    dispatch(searchProperties());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Client-side sorting for snappy responsiveness
  const sortedResults = useMemo(() => {
    if (!results || !Array.isArray(results)) return [];
    const cloned = [...results];

    switch (sortBy) {
      case 'price_asc':
        return cloned.sort((a, b) => {
          const priceA = a.minPrice || a.pricePerNight || a.basePrice || a.units?.[0]?.basePrice || 0;
          const priceB = b.minPrice || b.pricePerNight || b.basePrice || b.units?.[0]?.basePrice || 0;
          return priceA - priceB;
        });
      case 'price_desc':
        return cloned.sort((a, b) => {
          const priceA = a.minPrice || a.pricePerNight || a.basePrice || a.units?.[0]?.basePrice || 0;
          const priceB = b.minPrice || b.pricePerNight || b.basePrice || b.units?.[0]?.basePrice || 0;
          return priceB - priceA;
        });
      case 'rating':
        return cloned.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'reviews':
        return cloned.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
      default:
        return cloned;
    }
  }, [results, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-4">Explore Properties & Stays</h1>
        <SearchBar
          compact
          initialValues={filters}
          onSearch={(params) => {
            handleApplyFilters(params);
          }}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Filter Sidebar */}
        <FilterSidebar
          filters={filters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          isOpenOnMobile={mobileFilterOpen}
          onCloseMobile={() => setMobileFilterOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 w-full">
          {/* Top Bar (Count, Mobile filter trigger, Sort Dropdown) */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
              {/* Result Count */}
              <div>
                <span className="text-sm font-semibold text-gray-900">
                  {pagination.total || sortedResults.length} properties found
                </span>
                {filters.city && (
                  <span className="text-xs text-gray-500 block">in "{filters.city}"</span>
                )}
              </div>

              {/* Mobile Filter Button */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <FiFilter className="w-3.5 h-3.5 text-emerald-600" />
                <span>Filters</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-gray-500 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="recommended">Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="reviews">Most Reviewed</option>
              </select>
            </div>
          </div>

          {/* Skeletons Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm animate-pulse"
                >
                  <div className="aspect-[16/10] bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                      <div className="h-6 bg-gray-200 rounded w-20" />
                      <div className="h-8 bg-gray-200 rounded w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedResults.length > 0 ? (
            /* Results Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedResults.map((property) => (
                <PropertyCard key={property._id} property={property} />
              ))}
            </div>
          ) : (
            /* No Results State */
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <FiInbox className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No properties matched your search</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                Try widening your price range, choosing different dates, or clearing selected amenities.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 shadow-md shadow-emerald-600/30 transition-all"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center space-x-2">
              <button
                type="button"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-40 disabled:pointer-events-none transition-all"
                aria-label="Previous Page"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>

              {Array.from({ length: pagination.totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                    pagination.page === pageNum
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-40 disabled:pointer-events-none transition-all"
                aria-label="Next Page"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
