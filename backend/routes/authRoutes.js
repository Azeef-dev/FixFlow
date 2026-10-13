const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'fixflow_secure_jwt_token_secret_key_2026',
    { expiresIn: '30d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user (admin or technician)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, specialization } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'technician',
      phone: phone || '',
      specialization: specialization || 'General Maintenance',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        specialization: user.specialization,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get JWT token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        specialization: user.specialization,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get currently authenticated user profile
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// @route   GET /api/auth/technicians
// @desc    Get all active technicians for ticket assignment
router.get('/technicians', protect, async (req, res) => {
  try {
    const technicians = await User.find({
      role: 'technician',
      isActive: true,
    }).select('name email phone specialization role');

    res.json({
      success: true,
      technicians,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch technicians',
      error: error.message,
    });
  }
});

// @route   POST /api/auth/seed
// @desc    Seed default demo accounts (Admin & Technician) for hackathon evaluation
router.post('/seed', async (req, res) => {
  try {
    const adminEmail = 'admin@fixflow.io';
    const techEmail = 'tech@fixflow.io';

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: 'FixFlow Admin',
        email: adminEmail,
        password: 'Password123!',
        role: 'admin',
        specialization: 'System & Facility Management',
      });
    }

    let tech = await User.findOne({ email: techEmail });
    if (!tech) {
      tech = await User.create({
        name: 'Alex Technician',
        email: techEmail,
        password: 'Password123!',
        role: 'technician',
        specialization: 'HVAC & Electronics Specialist',
      });
    }

    res.json({
      success: true,
      message: 'Demo credentials ready',
      credentials: [
        { role: 'Admin', email: adminEmail, password: 'Password123!' },
        { role: 'Technician', email: techEmail, password: 'Password123!' },
      ],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
