const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
    },
    assetCode: {
      type: String,
      required: [true, 'Asset code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Asset category is required'],
      enum: [
        'Electronics',
        'HVAC',
        'Machinery',
        'Furniture',
        'Plumbing',
        'Computing',
        'Vehicles',
        'Audio/Visual',
        'Other',
      ],
      default: 'Electronics',
    },
    location: {
      building: { type: String, default: 'Main Campus', trim: true },
      floor: { type: String, default: '1st Floor', trim: true },
      room: { type: String, default: 'General Area', trim: true },
    },
    condition: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'],
      default: 'Good',
    },
    status: {
      type: String,
      enum: [
        'Operational',
        'Issue Reported',
        'Under Inspection',
        'Under Maintenance',
        'Out of Service',
        'Retired',
      ],
      default: 'Operational',
      index: true,
    },
    modelNumber: {
      type: String,
      trim: true,
      default: '',
    },
    serialNumber: {
      type: String,
      trim: true,
      default: '',
    },
    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    purchaseDate: {
      type: Date,
      default: null,
    },
    warrantyExpiry: {
      type: Date,
      default: null,
    },
    lastServiceDate: {
      type: Date,
      default: null,
    },
    nextServiceDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    qrCodeUrl: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for formatted location string
assetSchema.virtual('fullLocation').get(function () {
  const { building, floor, room } = this.location || {};
  return [building, floor, room].filter(Boolean).join(' - ') || 'N/A';
});

assetSchema.set('toJSON', { virtuals: true });
assetSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Asset', assetSchema);
