const mongoose = require('mongoose');

const assetHistorySchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'History record must link to an asset'],
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    actor: {
      name: { type: String, default: 'System' },
      role: { type: String, default: 'System' },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      default: null,
    },
    details: {
      type: String,
      default: '',
    },
    previousStatus: {
      type: String,
      default: '',
    },
    newStatus: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AssetHistory', assetHistorySchema);
