import mongoose from 'mongoose';

/**
 * Property Schema representing hotels, resorts, villas, apartments, and event venues.
 */
const propertySchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Property must be associated with an owner'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide property title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide property description'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Please specify property type'],
      enum: {
        values: ['hotel', 'resort', 'villa', 'apartment', 'event-venue'],
        message: '{VALUE} is not a valid property type',
      },
    },
    location: {
      address: {
        type: String,
        trim: true,
        default: '',
      },
      city: {
        type: String,
        required: [true, 'Please provide city'],
        trim: true,
        index: true,
      },
      state: {
        type: String,
        trim: true,
        default: '',
      },
      country: {
        type: String,
        default: 'India',
        trim: true,
      },
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: [0, 0],
        },
      },
    },
    amenities: {
      type: [String],
      default: [],
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          default: '',
        },
      },
    ],
    policies: {
      checkInTime: {
        type: String,
        default: '14:00',
      },
      checkOutTime: {
        type: String,
        default: '11:00',
      },
      cancellation: {
        type: String,
        enum: ['flexible', 'moderate', 'strict'],
        default: 'moderate',
      },
      petsAllowed: {
        type: Boolean,
        default: false,
      },
      smokingAllowed: {
        type: Boolean,
        default: false,
      },
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: [0, 'Review count cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Geospatial index for distance and radius queries
propertySchema.index({ 'location.coordinates': '2dsphere' });

// Full-text search index
propertySchema.index({
  title: 'text',
  description: 'text',
  'location.city': 'text',
});

// Virtual populate for room units
propertySchema.virtual('units', {
  ref: 'RoomUnit',
  localField: '_id',
  foreignField: 'propertyId',
});

export const Property = mongoose.model('Property', propertySchema);
export default Property;
