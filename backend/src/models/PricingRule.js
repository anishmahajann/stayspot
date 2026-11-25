import mongoose from 'mongoose';

/**
 * PricingRule Schema for seasonal pricing, weekend rates, and custom discounts.
 */
const pricingRuleSchema = new mongoose.Schema(
  {
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomUnit',
      required: [true, 'Pricing rule must be attached to a room unit'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide rule name (e.g., Summer Peak, Weekend Rate)'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Please provide pricing rule type'],
      enum: {
        values: ['seasonal', 'weekend', 'length-of-stay', 'custom'],
        message: '{VALUE} is not a valid pricing rule type',
      },
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    daysOfWeek: {
      type: [Number], // 0=Sunday, 1=Monday, ..., 6=Saturday
      default: [],
      comment: '0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat',
    },
    priceOverride: {
      type: Number,
      min: [0, 'Price override cannot be negative'],
      default: null,
    },
    percentageAdjustment: {
      type: Number,
      default: null,
      comment: 'Positive = surcharge (+15%), negative = discount (-10%)',
    },
    minNights: {
      type: Number,
      min: [1, 'Minimum nights must be at least 1'],
      default: null,
    },
    priority: {
      type: Number,
      default: 0,
      comment: 'Higher value rules are evaluated first',
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

// Compound index for querying active rules for a unit by priority
pricingRuleSchema.index({ unitId: 1, isActive: 1, priority: -1 });

export const PricingRule = mongoose.model('PricingRule', pricingRuleSchema);
export default PricingRule;
