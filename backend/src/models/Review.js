import mongoose from 'mongoose';

/**
 * Review Schema representing verified guest feedback on properties.
 */
const reviewSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      unique: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
      default: '',
    },
    comment: {
      type: String,
      required: [true, 'Please provide review comments'],
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for listing reviews for a property in reverse chronological order
reviewSchema.index({ propertyId: 1, createdAt: -1 });

/**
 * Static method to recalculate property average rating and review count.
 * 
 * @param {mongoose.Types.ObjectId} propertyId
 */
reviewSchema.statics.calculateAverageRating = async function (propertyId) {
  const stats = await this.aggregate([
    { $match: { propertyId: new mongoose.Types.ObjectId(propertyId) } },
    {
      $group: {
        _id: '$propertyId',
        reviewCount: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  const Property = mongoose.model('Property');
  if (stats.length > 0) {
    await Property.findByIdAndUpdate(propertyId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].reviewCount,
    });
  } else {
    await Property.findByIdAndUpdate(propertyId, {
      rating: 0,
      reviewCount: 0,
    });
  }
};

// Post-save hook to recompute property rating
reviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.propertyId);
});

export const Review = mongoose.model('Review', reviewSchema);
export default Review;
