import mongoose from 'mongoose';

/**
 * BlockedDate Schema representing dates blocked by owner for maintenance or private reservations.
 */
const blockedDateSchema = new mongoose.Schema(
  {
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomUnit',
      required: [true, 'Unit ID is required to block dates'],
      index: true,
    },
    from: {
      type: Date,
      required: [true, 'From date is required'],
    },
    to: {
      type: Date,
      required: [true, 'To date is required'],
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator user ID is required'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Fast overlap querying index
blockedDateSchema.index({ unitId: 1, from: 1, to: 1 });

export const BlockedDate = mongoose.model('BlockedDate', blockedDateSchema);
export default BlockedDate;
