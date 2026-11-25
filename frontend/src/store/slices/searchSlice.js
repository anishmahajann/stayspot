import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const defaultFilters = {
  city: '',
  checkIn: null,
  checkOut: null,
  guests: 1,
  minPrice: '',
  maxPrice: '',
  type: '', // 'hotel', 'resort', 'event-venue', 'villa', 'apartment' or ''
  amenities: [],
  sortBy: 'recommended', // 'price_asc', 'price_desc', 'rating', 'reviews', 'recommended'
};

/**
 * Async thunk for searching properties based on filters and pagination
 */
export const searchProperties = createAsyncThunk(
  'search/searchProperties',
  async (customFilters, { getState, rejectWithValue }) => {
    try {
      const { search } = getState();
      const filters = customFilters || search.filters;
      const { pagination } = search;

      const params = {
        city: filters.city || undefined,
        checkIn: filters.checkIn || undefined,
        checkOut: filters.checkOut || undefined,
        guests: filters.guests || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        type: filters.type || undefined,
        amenities: filters.amenities?.length > 0 ? filters.amenities.join(',') : undefined,
        sortBy: filters.sortBy || undefined,
        page: pagination.page,
        limit: pagination.limit,
      };

      const response = await api.get('/properties/search', { params });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Search failed';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  filters: defaultFilters,
  results: [],
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  },
  loading: false,
  error: null,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },
    clearFilters: (state) => {
      state.filters = { ...defaultFilters };
      state.pagination.page = 1;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchProperties.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        if (Array.isArray(payload)) {
          state.results = payload;
          state.pagination.total = payload.length;
          state.pagination.totalPages = Math.ceil(payload.length / state.pagination.limit) || 1;
        } else {
          state.results = payload.properties || payload.data || [];
          state.pagination.total = payload.total ?? (payload.properties?.length || 0);
          state.pagination.totalPages = payload.totalPages ?? 1;
        }
        state.error = null;
      })
      .addCase(searchProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearFilters, setPage } = searchSlice.actions;
export default searchSlice.reducer;
