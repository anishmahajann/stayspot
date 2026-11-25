import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/**
 * Thunk to fetch all properties owned by logged-in host/owner
 */
export const fetchOwnerProperties = createAsyncThunk(
  'owner/fetchOwnerProperties',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/owner/properties');
      return response.data.properties || response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch owner properties';
      return rejectWithValue(message);
    }
  }
);

/**
 * Thunk to create a new property
 */
export const createProperty = createAsyncThunk(
  'owner/createProperty',
  async (propertyData, { rejectWithValue }) => {
    try {
      const response = await api.post('/owner/properties', propertyData);
      return response.data.property || response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to create property';
      return rejectWithValue(message);
    }
  }
);

/**
 * Thunk to update an existing property
 */
export const updateProperty = createAsyncThunk(
  'owner/updateProperty',
  async ({ id, propertyData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/owner/properties/${id}`, propertyData);
      return response.data.property || response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to update property';
      return rejectWithValue(message);
    }
  }
);

/**
 * Thunk to create a new unit under a property
 */
export const createUnit = createAsyncThunk(
  'owner/createUnit',
  async ({ propertyId, unitData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/owner/properties/${propertyId}/units`, unitData);
      return response.data.unit || response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to add unit';
      return rejectWithValue(message);
    }
  }
);

/**
 * Thunk to update a unit
 */
export const updateUnit = createAsyncThunk(
  'owner/updateUnit',
  async ({ unitId, unitData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/owner/units/${unitId}`, unitData);
      return response.data.unit || response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to update unit';
      return rejectWithValue(message);
    }
  }
);

/**
 * Thunk to delete a unit
 */
export const deleteUnit = createAsyncThunk(
  'owner/deleteUnit',
  async (unitId, { rejectWithValue }) => {
    try {
      await api.delete(`/owner/units/${unitId}`);
      return unitId;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to delete unit';
      return rejectWithValue(message);
    }
  }
);

/**
 * Thunk to manually block dates
 */
export const blockDates = createAsyncThunk(
  'owner/blockDates',
  async ({ unitId, startDate, endDate, reason }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/owner/units/${unitId}/block-dates`, {
        startDate,
        endDate,
        reason,
      });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to block dates';
      return rejectWithValue(message);
    }
  }
);

/**
 * Thunk to add dynamic pricing rules
 */
export const addPricingRule = createAsyncThunk(
  'owner/addPricingRule',
  async ({ unitId, ruleData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/owner/units/${unitId}/pricing-rules`, ruleData);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to add pricing rule';
      return rejectWithValue(message);
    }
  }
);

/**
 * Thunk to fetch all bookings made on owner's properties
 */
export const fetchOwnerBookings = createAsyncThunk(
  'owner/fetchOwnerBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/owner/bookings');
      return response.data.bookings || response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch owner bookings';
      return rejectWithValue(message);
    }
  }
);

/**
 * Thunk to fetch owner analytics and reports
 */
export const fetchReports = createAsyncThunk(
  'owner/fetchReports',
  async (timeframe = '30d', { rejectWithValue }) => {
    try {
      const response = await api.get('/owner/reports', { params: { timeframe } });
      return response.data.reports || response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch owner reports';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  properties: [],
  units: [],
  bookings: [],
  reports: null,
  loading: false,
  error: null,
};

const ownerSlice = createSlice({
  name: 'owner',
  initialState,
  reducers: {
    clearOwnerError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchOwnerProperties
      .addCase(fetchOwnerProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwnerProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.properties = Array.isArray(action.payload)
          ? action.payload
          : action.payload.properties || [];
      })
      .addCase(fetchOwnerProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // createProperty
      .addCase(createProperty.pending, (state) => {
        state.loading = true;
      })
      .addCase(createProperty.fulfilled, (state, action) => {
        state.loading = false;
        state.properties.unshift(action.payload);
      })
      .addCase(createProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // updateProperty
      .addCase(updateProperty.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProperty.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.properties.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.properties[index] = action.payload;
        }
      })
      .addCase(updateProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // createUnit
      .addCase(createUnit.fulfilled, (state, action) => {
        state.units.push(action.payload);
      })

      // deleteUnit
      .addCase(deleteUnit.fulfilled, (state, action) => {
        state.units = state.units.filter((u) => u._id !== action.payload);
      })

      // fetchOwnerBookings
      .addCase(fetchOwnerBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOwnerBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = Array.isArray(action.payload)
          ? action.payload
          : action.payload.bookings || [];
      })
      .addCase(fetchOwnerBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchReports
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearOwnerError } = ownerSlice.actions;
export default ownerSlice.reducer;
