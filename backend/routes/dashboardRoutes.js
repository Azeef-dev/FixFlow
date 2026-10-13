const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const Issue = require('../models/Issue');
const AssetHistory = require('../models/AssetHistory');
const { protect } = require('../middleware/auth');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard metrics, operational summaries, and recent activity
router.get('/stats', protect, async (req, res) => {
  try {
    const totalAssets = await Asset.countDocuments();
    const operationalAssets = await Asset.countDocuments({ status: 'Operational' });
    const inMaintenanceAssets = await Asset.countDocuments({ status: { $in: ['Under Inspection', 'Under Maintenance'] } });
    const outOfServiceAssets = await Asset.countDocuments({ status: 'Out of Service' });

    const totalIssues = await Issue.countDocuments();
    const activeIssues = await Issue.countDocuments({
      status: { $in: ['Reported', 'Assigned', 'Inspection Started', 'Maintenance In Progress', 'Waiting for Parts', 'Reopened'] },
    });
    const resolvedIssues = await Issue.countDocuments({ status: 'Resolved' });
    const criticalIssues = await Issue.countDocuments({
      priority: 'Critical',
      status: { $ne: 'Resolved' },
    });

    // Breakdown by category
    const categoryStats = await Asset.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Priority breakdown for active issues
    const priorityStats = await Issue.aggregate([
      { $match: { status: { $ne: 'Resolved' } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Recent system activity feed
    const recentActivity = await AssetHistory.find()
      .populate('asset', 'name assetCode')
      .populate('issue', 'issueNumber priority')
      .sort({ timestamp: -1 })
      .limit(8);

    res.json({
      success: true,
      stats: {
        totalAssets,
        operationalAssets,
        inMaintenanceAssets,
        outOfServiceAssets,
        totalIssues,
        activeIssues,
        resolvedIssues,
        criticalIssues,
      },
      categoryStats,
      priorityStats,
      recentActivity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard metrics',
      error: error.message,
    });
  }
});

module.exports = router;
