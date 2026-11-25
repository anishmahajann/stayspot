import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/**
 * Async thunk to calculate accurate pricing quote for selected dates & unit
 */
export const getQuote = createAsyncThunk(
  'booking/getQuote',
  async (quoteData, { rejectWithValue }) => {
    try {
      const response = await api.post('/bookings/quote', quoteData);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch pricing quote';
      return rejectWithValue(message);
    }
  }
);

/**
 * Async thunk to create a temporary hold/lock on a unit before payment
 */
export const createHold = createAsyncThunk(
  'booking/createHold',
  async (holdData, { rejectWithValue }) => {
    try {
      const response = await api.post('/bookings/hold', holdData);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to reserve booking hold';
      return rejectWithValue(message);
    }
  }
);

/**
 * Async thunk to confirm booking after payment verification
 */
export const confirmBooking = createAsyncThunk(
  'booking/confirmBooking',
  async ({ bookingId, paymentDetails }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/confirm`, paymentDetails);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Booking confirmation failed';
      return rejectWithValue(message);
    }
  }
);

/**
 * Async thunk to cancel an existing booking
 */
export const cancelBooking = createAsyncThunk(
  'booking/cancelBooking',
  async ({ bookingId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/bookings/${bookingId}/cancel`, { reason });
      return { bookingId, data: response.data };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Booking cancellation failed';
      return rejectWithValue(message);
    }
  }
);

/**
 * Async thunk to load all bookings of current user
 */
export const fetchMyBookings = createAsyncThunk(
  'booking/fetchMyBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/bookings/my');
      return response.data.bookings || response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch user bookings';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  currentBooking: null,
  priceQuote: null,
  holdExpiry: null,
  myBookings: [],
  loading: false,
  error: null,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    clearQuote: (state) => {
      state.priceQuote = null;
    },
    clearBooking: (state) => {
      state.currentBooking = null;
      state.priceQuote = null;
      state.holdExpiry = null;
      state.error = null;
    },
    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload;
      if (action.payload?.holdExpiresAt) {
        state.holdExpiry = action.payload.holdExpiresAt;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // getQuote
      .addCase(getQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQuote.fulfilled, (state, action) => {
        state.loading = false;
        state.priceQuote = action.payload.quote || action.payload;
      })
      .addCase(getQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // createHold
      .addCase(createHold.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createHold.fulfilled, (state, action) => {
        state.loading = false;
        const booking = action.payload.booking || action.payload;
        state.currentBooking = booking;
        state.holdExpiry = booking.holdExpiresAt || action.payload.holdExpiresAt || null;
      })
      .addCase(createHold.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // confirmBooking
      .addCase(confirmBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmBooking.fulfilled, (state, action) => {
        state.loading = false;
        const booking = action.payload.booking || action.payload;
        state.currentBooking = booking;
      })
      .addCase(confirmBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // cancelBooking
      .addCase(cancelBooking.pending, (state) => {
        state.loading = true;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.loading = false;
        const { bookingId } = action.payload;
        state.myBookings = state.myBookings.map((b) =>
          b._id === bookingId ? { ...b, status: 'cancelled' } : b
        );
        if (state.currentBooking?._id === bookingId) {
          state.currentBooking.status = 'cancelled';
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchMyBookings
      .addCase(fetchMyBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.myBookings = Array.isArray(action.payload)
          ? action.payload
          : action.payload.bookings || [];
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearQuote, clearBooking, setCurrentBooking } = bookingSlice.actions;
export default bookingSlice.reducer;
