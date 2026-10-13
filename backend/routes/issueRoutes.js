const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const Asset = require('../models/Asset');
const AssetHistory = require('../models/AssetHistory');
const { protect, authorize } = require('../middleware/auth');
const { triageIssue } = require('../services/aiService');

// @route   POST /api/issues/triage
// @desc    GenAI Issue Triage - converts natural language into structured diagnostic suggestions
router.post('/triage', async (req, res) => {
  try {
    const { assetId, assetCode, complaint } = req.body;

    if (!complaint || complaint.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Complaint text is required for AI triage analysis',
      });
    }

    let assetContext = {};
    if (assetId) {
      const asset = await Asset.findById(assetId);
      if (asset) {
        const pastIssues = await Issue.find({ asset: asset._id }).sort({ createdAt: -1 }).limit(3);
        assetContext = {
          name: asset.name,
          assetCode: asset.assetCode,
          category: asset.category,
          condition: asset.condition,
          location: asset.location,
          recentIssues: pastIssues,
        };
      }
    } else if (assetCode) {
      const asset = await Asset.findOne({ assetCode: assetCode.toUpperCase() });
      if (asset) {
        const pastIssues = await Issue.find({ asset: asset._id }).sort({ createdAt: -1 }).limit(3);
        assetContext = {
          name: asset.name,
          assetCode: asset.assetCode,
          category: asset.category,
          condition: asset.condition,
          location: asset.location,
          recentIssues: pastIssues,
        };
      }
    }

    const suggestions = await triageIssue(assetContext, complaint);

    res.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to perform AI issue triage',
      error: error.message,
    });
  }
});

// @route   POST /api/issues
// @desc    Report a new maintenance issue (Public QR reporting or Internal)
router.post('/', async (req, res) => {
  try {
    const {
      assetId,
      assetCode,
      title,
      description,
      category,
      priority,
      reporterName,
      reporterEmail,
      reporterPhone,
      aiTriage,
      isUserEdited,
    } = req.body;

    if (!description) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }

    // Resolve Asset
    let asset = null;
    if (assetId) {
      asset = await Asset.findById(assetId);
    } else if (assetCode) {
      asset = await Asset.findOne({ assetCode: assetCode.toUpperCase() });
    }

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found for reporting issue' });
    }

    // Generate unique Issue Number (e.g., ISS-1001)
    const count = await Issue.countDocuments();
    const issueNumber = `ISS-${1000 + count + 1}`;

    const issue = await Issue.create({
      issueNumber,
      asset: asset._id,
      title: title || `${asset.name} Malfunction`,
      description,
      category: category || asset.category,
      priority: priority || 'Medium',
      status: 'Reported',
      reporter: {
        name: reporterName || 'Public Reporter',
        email: reporterEmail || '',
        phone: reporterPhone || '',
        isPublic: true,
      },
      aiTriage: {
        suggestedTitle: aiTriage?.suggestedTitle || '',
        suggestedCategory: aiTriage?.suggestedCategory || '',
        suggestedPriority: aiTriage?.suggestedPriority || '',
        possibleCauses: aiTriage?.possibleCauses || [],
        initialChecks: aiTriage?.initialChecks || [],
        recurringWarning: aiTriage?.recurringWarning || '',
        wasAiUsed: Boolean(aiTriage),
        wasUserEdited: Boolean(isUserEdited),
      },
    });

    // Update Asset Status to 'Issue Reported'
    const prevStatus = asset.status;
    asset.status = 'Issue Reported';
    await asset.save();

    // Log permanent history entry
    await AssetHistory.create({
      asset: asset._id,
      issue: issue._id,
      action: 'Issue Reported',
      actor: {
        name: reporterName || 'Public Reporter',
        role: 'Reporter',
      },
      details: `Reported issue [${issue.issueNumber}]: "${issue.title}". Priority: ${issue.priority}`,
      previousStatus: prevStatus,
      newStatus: 'Issue Reported',
    });

    res.status(201).json({
      success: true,
      message: 'Issue reported successfully',
      issue,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to report issue', error: error.message });
  }
});

// @route   GET /api/issues
// @desc    Get all issues with filters (admin sees all, technician sees all or assigned)
router.get('/', protect, async (req, res) => {
  try {
    const { status, priority, category, assignedTechnician, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignedTechnician) query.assignedTechnician = assignedTechnician;

    if (search) {
      query.$or = [
        { issueNumber: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const issues = await Issue.find(query)
      .populate('asset', 'name assetCode category location condition status')
      .populate('assignedTechnician', 'name email specialization phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: issues.length,
      issues,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch issues', error: error.message });
  }
});

// @route   GET /api/issues/:id
// @desc    Get detailed issue by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('asset')
      .populate('assignedTechnician', 'name email specialization phone');

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    res.json({
      success: true,
      issue,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving issue', error: error.message });
  }
});

// @route   PATCH /api/issues/:id/assign
// @desc    Assign technician to issue (Admin)
router.patch('/:id/assign', protect, authorize('admin'), async (req, res) => {
  try {
    const { technicianId } = req.body;
    const issue = await Issue.findById(req.params.id).populate('asset');
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

    issue.assignedTechnician = technicianId;
    if (issue.status === 'Reported') {
      issue.status = 'Assigned';
    }
    await issue.save();

    // Log history
    await AssetHistory.create({
      asset: issue.asset._id,
      issue: issue._id,
      action: 'Technician Assigned',
      actor: { name: req.user.name, role: req.user.role, userId: req.user._id },
      details: `Assigned issue ${issue.issueNumber} to technician.`,
      newStatus: issue.asset.status,
    });

    res.json({ success: true, message: 'Technician assigned successfully', issue });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to assign technician', error: error.message });
  }
});

// @route   PATCH /api/issues/:id/inspect
// @desc    Technician begins inspection
router.patch('/:id/inspect', protect, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id).populate('asset');
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

    issue.status = 'Inspection Started';
    await issue.save();

    // Update asset status to 'Under Inspection'
    const asset = await Asset.findById(issue.asset._id);
    const prevStatus = asset.status;
    asset.status = 'Under Inspection';
    await asset.save();

    // Log history
    await AssetHistory.create({
      asset: asset._id,
      issue: issue._id,
      action: 'Inspection Started',
      actor: { name: req.user.name, role: req.user.role, userId: req.user._id },
      details: `Technician began active inspection for issue ${issue.issueNumber}.`,
      previousStatus: prevStatus,
      newStatus: 'Under Inspection',
    });

    res.json({ success: true, message: 'Inspection started', issue, assetStatus: asset.status });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to start inspection', error: error.message });
  }
});

// @route   PATCH /api/issues/:id/maintenance
// @desc    Record maintenance progress, parts replaced, costs, notes
router.patch('/:id/maintenance', protect, async (req, res) => {
  try {
    const { notes, workPerformed, partsReplaced, totalCost, timeSpentHours, status } = req.body;
    const issue = await Issue.findById(req.params.id).populate('asset');
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

    // Validate non-negative cost
    if (totalCost !== undefined && totalCost < 0) {
      return res.status(400).json({ success: false, message: 'Maintenance cost cannot be negative' });
    }

    if (notes !== undefined) issue.maintenance.notes = notes;
    if (workPerformed !== undefined) issue.maintenance.workPerformed = workPerformed;
    if (partsReplaced !== undefined) issue.maintenance.partsReplaced = partsReplaced;
    if (totalCost !== undefined) issue.maintenance.totalCost = totalCost;
    if (timeSpentHours !== undefined) issue.maintenance.timeSpentHours = timeSpentHours;
    if (status) issue.status = status;

    await issue.save();

    // If repair work in progress, update asset status to Under Maintenance
    const asset = await Asset.findById(issue.asset._id);
    if (issue.status === 'Maintenance In Progress' && asset.status !== 'Under Maintenance') {
      const prev = asset.status;
      asset.status = 'Under Maintenance';
      await asset.save();

      await AssetHistory.create({
        asset: asset._id,
        issue: issue._id,
        action: 'Maintenance In Progress',
        actor: { name: req.user.name, role: req.user.role, userId: req.user._id },
        details: `Active repair work in progress. Parts: ${issue.maintenance.partsReplaced.length}.`,
        previousStatus: prev,
        newStatus: 'Under Maintenance',
      });
    }

    res.json({ success: true, message: 'Maintenance log updated', issue });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update maintenance', error: error.message });
  }
});

// @route   PATCH /api/issues/:id/resolve
// @desc    Mark issue as resolved (requires maintenance note, restores asset to Operational)
router.patch('/:id/resolve', protect, async (req, res) => {
  try {
    const { notes, workPerformed, partsReplaced, totalCost, nextServiceDate } = req.body;
    const issue = await Issue.findById(req.params.id).populate('asset');
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

    // Business rule: Issue cannot be resolved without maintenance notes
    const finalNote = notes || issue.maintenance?.notes;
    if (!finalNote || finalNote.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Business Rule Violation: An issue cannot be resolved without a maintenance note.',
      });
    }

    if (totalCost !== undefined && totalCost < 0) {
      return res.status(400).json({ success: false, message: 'Maintenance cost cannot be negative.' });
    }

    const completionDate = new Date();

    // Validate next service date if provided
    if (nextServiceDate && new Date(nextServiceDate) < completionDate) {
      return res.status(400).json({
        success: false,
        message: 'Next service date cannot be earlier than the maintenance completion date.',
      });
    }

    issue.status = 'Resolved';
    issue.maintenance.notes = finalNote;
    if (workPerformed) issue.maintenance.workPerformed = workPerformed;
    if (partsReplaced) issue.maintenance.partsReplaced = partsReplaced;
    if (totalCost !== undefined) issue.maintenance.totalCost = totalCost;
    issue.maintenance.completionDate = completionDate;
    if (nextServiceDate) issue.maintenance.nextRecommendedServiceDate = new Date(nextServiceDate);
    issue.maintenance.finalCondition = 'Operational';

    await issue.save();

    // Restore asset back to Operational & update service dates
    const asset = await Asset.findById(issue.asset._id);
    const prevStatus = asset.status;
    asset.status = 'Operational';
    asset.condition = 'Good';
    asset.lastServiceDate = completionDate;
    if (nextServiceDate) {
      asset.nextServiceDate = new Date(nextServiceDate);
    } else {
      // Default next service 90 days out
      const autoNext = new Date(completionDate);
      autoNext.setDate(autoNext.getDate() + 90);
      asset.nextServiceDate = autoNext;
    }
    await asset.save();

    // Permanent history log
    await AssetHistory.create({
      asset: asset._id,
      issue: issue._id,
      action: 'Maintenance Successfully Completed',
      actor: { name: req.user.name, role: req.user.role, userId: req.user._id },
      details: `Issue ${issue.issueNumber} marked resolved. Work: "${issue.maintenance.workPerformed || finalNote}". Total cost: $${issue.maintenance.totalCost || 0}.`,
      previousStatus: prevStatus,
      newStatus: 'Operational',
    });

    res.json({
      success: true,
      message: 'Issue marked resolved and asset returned to Operational status.',
      issue,
      asset,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to resolve issue', error: error.message });
  }
});

// @route   PATCH /api/issues/:id/reopen
// @desc    Reopen a resolved or closed issue
router.patch('/:id/reopen', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const issue = await Issue.findById(req.params.id).populate('asset');
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

    issue.status = 'Reopened';
    await issue.save();

    const asset = await Asset.findById(issue.asset._id);
    const prevStatus = asset.status;
    asset.status = 'Issue Reported';
    await asset.save();

    await AssetHistory.create({
      asset: asset._id,
      issue: issue._id,
      action: 'Issue Reopened',
      actor: { name: req.user.name, role: req.user.role, userId: req.user._id },
      details: `Reopened issue ${issue.issueNumber}. Reason: ${reason || 'Unresolved symptoms'}`,
      previousStatus: prevStatus,
      newStatus: 'Issue Reported',
    });

    res.json({ success: true, message: 'Issue reopened successfully', issue });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reopen issue', error: error.message });
  }
});

module.exports = router;
