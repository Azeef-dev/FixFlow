const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const AssetHistory = require('../models/AssetHistory');
const Issue = require('../models/Issue');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/assets/public/:assetCode
// @desc    Safe public view for QR scanning (No internal costs/confidential info)
router.get('/public/:assetCode', async (req, res) => {
  try {
    const { assetCode } = req.params;
    const asset = await Asset.findOne({ assetCode: assetCode.toUpperCase() });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: `Asset with code '${assetCode.toUpperCase()}' not found. Please verify the QR label.`,
      });
    }

    // Fetch safe recent activity history (exclude internal costs)
    const recentHistory = await AssetHistory.find({ asset: asset._id })
      .sort({ timestamp: -1 })
      .limit(5)
      .select('action timestamp newStatus');

    // Return strictly safe public information
    res.json({
      success: true,
      asset: {
        id: asset._id,
        name: asset.name,
        assetCode: asset.assetCode,
        category: asset.category,
        location: asset.location,
        condition: asset.condition,
        status: asset.status,
        lastServiceDate: asset.lastServiceDate,
        nextServiceDate: asset.nextServiceDate,
        modelNumber: asset.modelNumber,
        isRetired: asset.status === 'Retired',
      },
      recentActivity: recentHistory,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving asset', error: error.message });
  }
});

// @route   GET /api/assets
// @desc    Get all assets with search, category, status, and location filtering
router.get('/', protect, async (req, res) => {
  try {
    const { search, category, status, condition, building } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { assetCode: { $regex: search, $options: 'i' } },
        { modelNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) query.category = category;
    if (status) query.status = status;
    if (condition) query.condition = condition;
    if (building) query['location.building'] = building;

    const assets = await Asset.find(query)
      .populate('assignedTechnician', 'name email phone specialization')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: assets.length,
      assets,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve assets', error: error.message });
  }
});

// @route   POST /api/assets
// @desc    Create a new asset (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      assetCode,
      category,
      location,
      condition,
      modelNumber,
      serialNumber,
      assignedTechnician,
      purchaseDate,
      warrantyExpiry,
      lastServiceDate,
      nextServiceDate,
      notes,
    } = req.body;

    if (!name || !assetCode) {
      return res.status(400).json({
        success: false,
        message: 'Asset name and unique asset code are required',
      });
    }

    const codeUpper = assetCode.trim().toUpperCase();
    const existing = await Asset.findOne({ assetCode: codeUpper });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Asset code '${codeUpper}' is already registered. Duplicate asset codes are rejected.`,
      });
    }

    // Client public URL for QR mapping
    const clientBase = process.env.CLIENT_URL || 'http://localhost:5173';
    const qrCodeUrl = `${clientBase}/scan/${codeUpper}`;

    const asset = await Asset.create({
      name,
      assetCode: codeUpper,
      category: category || 'Electronics',
      location: location || { building: 'Main Campus', floor: '1st Floor', room: 'Room 101' },
      condition: condition || 'Good',
      status: 'Operational',
      modelNumber: modelNumber || '',
      serialNumber: serialNumber || '',
      assignedTechnician: assignedTechnician || null,
      purchaseDate: purchaseDate || null,
      warrantyExpiry: warrantyExpiry || null,
      lastServiceDate: lastServiceDate || new Date(),
      nextServiceDate: nextServiceDate || null,
      notes: notes || '',
      qrCodeUrl,
      createdBy: req.user._id,
    });

    // Create permanent audit history log
    await AssetHistory.create({
      asset: asset._id,
      action: 'Asset Registered',
      actor: { name: req.user.name, role: req.user.role, userId: req.user._id },
      details: `Asset '${asset.name}' registered with code '${asset.assetCode}'`,
      newStatus: 'Operational',
    });

    res.status(201).json({
      success: true,
      message: 'Asset registered successfully',
      asset,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Asset registration failed', error: error.message });
  }
});

// @route   GET /api/assets/:id
// @desc    Get detailed asset by ID (Internal dashboard view)
router.get('/:id', protect, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('assignedTechnician', 'name email phone specialization')
      .populate('createdBy', 'name email');

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Active & past issues
    const issues = await Issue.find({ asset: asset._id }).sort({ createdAt: -1 });

    // History timeline
    const history = await AssetHistory.find({ asset: asset._id })
      .populate('actor.userId', 'name role')
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      asset,
      issues,
      history,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving asset details', error: error.message });
  }
});

// @route   PUT /api/assets/:id
// @desc    Update asset details (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    const previousStatus = asset.status;
    const updates = req.body;

    // Do not allow breaking QR code mapping by editing assetCode directly
    delete updates.assetCode;

    Object.assign(asset, updates);
    await asset.save();

    // If status changed, log history
    if (updates.status && updates.status !== previousStatus) {
      await AssetHistory.create({
        asset: asset._id,
        action: 'Status Updated by Admin',
        actor: { name: req.user.name, role: req.user.role, userId: req.user._id },
        details: `Status transitioned from ${previousStatus} to ${asset.status}`,
        previousStatus,
        newStatus: asset.status,
      });
    }

    res.json({
      success: true,
      message: 'Asset updated successfully',
      asset,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update asset', error: error.message });
  }
});

// @route   GET /api/assets/:id/history
// @desc    Get permanent audit history timeline for an asset
router.get('/:id/history', protect, async (req, res) => {
  try {
    const history = await AssetHistory.find({ asset: req.params.id })
      .populate('issue', 'issueNumber title priority status')
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch asset history', error: error.message });
  }
});

module.exports = router;
