import mongoose from 'mongoose';

/**
 * Booking Schema representing room/unit reservations, temporary holds, and completed stays.
 */
const bookingSchema = new mongoose.Schema(
  {
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomUnit',
      required: [true, 'Unit ID is required for a booking'],
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property ID is required for a booking'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for a booking'],
    },
    checkIn: {
      type: Date,
      required: [true, 'Check-in date is required'],
    },
    checkOut: {
      type: Date,
      required: [true, 'Check-out date is required'],
    },
    guests: {
      type: Number,
      required: [true, 'Number of guests is required'],
      min: [1, 'Number of guests must be at least 1'],
    },
    nights: {
      type: Number,
      required: [true, 'Number of nights is required'],
      min: [1, 'Minimum booking duration is 1 night'],
    },
    priceBreakdown: [
      {
        date: {
          type: Date,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['held', 'confirmed', 'cancelled', 'completed'],
        message: '{VALUE} is not a valid booking status',
      },
      default: 'held',
    },
    holdExpiresAt: {
      type: Date,
      default: null,
      comment: 'TTL field - MongoDB auto-deletes when expired. Set to undefined/null upon confirmation.',
    },
    razorpayOrderId: {
      type: String,
      trim: true,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundId: {
      type: String,
      trim: true,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for availability lookup
bookingSchema.index({ unitId: 1, checkIn: 1, checkOut: 1, status: 1 });

// TTL index to automatically expire unconfirmed holds
bookingSchema.index({ holdExpiresAt: 1 }, { expireAfterSeconds: 0 });

// User bookings and property bookings lookup indexes
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ propertyId: 1, status: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
