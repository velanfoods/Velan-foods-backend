const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, protect } = require('../middleware/auth');

// POST /api/auth/register – புதிய பயனர் பதிவு
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: 'இந்த மின்னஞ்சல் ஏற்கனவே பதிவாகியுள்ளது' });
    }

    const user = await User.create({ name, email, phone, password });

    res.status(201).json({
      success: true,
      message: 'பதிவு வெற்றிகரமாக முடிந்தது!',
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login – உள்நுழைவு
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'மின்னஞ்சல் மற்றும் கடவுச்சொல் தேவை' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'கணக்கு செயலற்று உள்ளது' });
    }

    res.json({
      success: true,
      message: 'வெற்றிகரமாக உள்நுழைந்தீர்கள்!',
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me – தற்போதைய பயனர் விவரம்
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/auth/profile – profile update
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: 'Profile புதுப்பிக்கப்பட்டது', user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/auth/address – புதிய முகவரி சேர்க்க
router.post('/address', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (req.body.isDefault) {
      user.addresses.forEach(a => (a.isDefault = false));
    }
    user.addresses.push(req.body);
    await user.save();
    res.json({ success: true, message: 'முகவரி சேர்க்கப்பட்டது', addresses: user.addresses });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
