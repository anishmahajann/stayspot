import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/**
 * Async thunk to fetch details of a single property by ID
 */
export const fetchProperty = createAsyncThunk(
  'property/fetchProperty',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/properties/${propertyId}`);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to load property';
      return rejectWithValue(message);
    }
  }
);

/**
 * Async thunk to check availability of a property or unit for date range
 */
export const fetchAvailability = createAsyncThunk(
  'property/fetchAvailability',
  async ({ propertyId, unitId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/properties/${propertyId}/availability`, {
        params: { unitId, startDate, endDate },
      });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to check availability';
      return rejectWithValue(message);
    }
  }
);

/**
 * Async thunk to fetch reviews for a property
 */
export const fetchReviews = createAsyncThunk(
  'property/fetchReviews',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/properties/${propertyId}/reviews`);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch reviews';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  currentProperty: null,
  units: [],
  selectedUnit: null,
  availability: {},
  reviews: [],
  loading: false,
  error: null,
};

const propertySlice = createSlice({
  name: 'property',
  initialState,
  reducers: {
    clearCurrentProperty: (state) => {
      state.currentProperty = null;
      state.units = [];
      state.selectedUnit = null;
      state.availability = {};
      state.reviews = [];
      state.error = null;
    },
    setSelectedUnit: (state, action) => {
      state.selectedUnit = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProperty
      .addCase(fetchProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProperty.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.property || action.payload;
        state.currentProperty = data;
        state.units = data.units || action.payload.units || [];
        if (state.units.length > 0 && !state.selectedUnit) {
          state.selectedUnit = state.units[0];
        }
        state.error = null;
      })
      .addCase(fetchProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchAvailability
      .addCase(fetchAvailability.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAvailability.fulfilled, (state, action) => {
        state.loading = false;
        state.availability = action.payload.availability || action.payload;
      })
      .addCase(fetchAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchReviews
      .addCase(fetchReviews.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload.reviews || action.payload || [];
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentProperty, setSelectedUnit } = propertySlice.actions;
export default propertySlice.reducer;
