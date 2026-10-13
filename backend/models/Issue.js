const mongoose = require('mongoose');

const partReplacedSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cost: { type: Number, required: true, min: [0, 'Part cost cannot be negative'], default: 0 },
  quantity: { type: Number, default: 1, min: 1 },
});

const issueSchema = new mongoose.Schema(
  {
    issueNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Issue must be associated with an asset'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Issue title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Issue category is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      index: true,
    },
    status: {
      type: String,
      enum: [
        'Reported',
        'Assigned',
        'Inspection Started',
        'Maintenance In Progress',
        'Waiting for Parts',
        'Resolved',
        'Closed',
        'Reopened',
      ],
      default: 'Reported',
      index: true,
    },
    reporter: {
      name: { type: String, default: 'Anonymous Reporter' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      isPublic: { type: Boolean, default: true },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    // AI Issue Triage Structured Output
    aiTriage: {
      suggestedTitle: { type: String, default: '' },
      suggestedCategory: { type: String, default: '' },
      suggestedPriority: { type: String, default: '' },
      possibleCauses: [{ type: String }],
      initialChecks: [{ type: String }],
      recurringWarning: { type: String, default: '' },
      wasAiUsed: { type: Boolean, default: false },
      wasUserEdited: { type: Boolean, default: false },
    },
    // Maintenance Work Log
    maintenance: {
      notes: { type: String, default: '' },
      workPerformed: { type: String, default: '' },
      partsReplaced: [partReplacedSchema],
      totalCost: { type: Number, default: 0, min: [0, 'Cost cannot be negative'] },
      timeSpentHours: { type: Number, default: 0, min: [0, 'Time spent cannot be negative'] },
      completionDate: { type: Date, default: null },
      nextRecommendedServiceDate: { type: Date, default: null },
      finalCondition: {
        type: String,
        enum: ['Operational', 'Partially Operational', 'Needs Further Work', 'Decommissioned'],
        default: 'Operational',
      },
    },
    evidence: [
      {
        url: { type: String, required: true },
        caption: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Issue', issueSchema);
