import mongoose from 'mongoose';

/**
 * RoomUnit Schema representing room types or event spaces available within a property.
 */
const roomUnitSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Unit must belong to a property'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide room/unit name (e.g., Deluxe Room, Grand Ballroom)'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    capacity: {
      type: Number,
      required: [true, 'Please provide max guest capacity'],
      min: [1, 'Capacity must be at least 1 guest'],
    },
    count: {
      type: Number,
      required: [true, 'Please specify total quantity of this unit type'],
      min: [1, 'Unit count must be at least 1'],
      comment: 'Total rooms or slots available of this type in the property',
    },
    basePrice: {
      type: Number,
      required: [true, 'Please specify base nightly or per-day price'],
      min: [0, 'Base price cannot be negative'],
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
    amenities: {
      type: [String],
      default: [],
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

// Helpful index for fast property unit lookups
roomUnitSchema.index({ propertyId: 1, isActive: 1 });

export const RoomUnit = mongoose.model('RoomUnit', roomUnitSchema);
export default RoomUnit;
