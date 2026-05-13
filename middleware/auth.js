const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Token உருவாக்கு
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Login தேவை routes-க்கு
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'உள்நுழைவு தேவை' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'பயனர் கண்டுபிடிக்கவில்லை' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token செல்லுபடியற்றது' });
  }
};

// Admin மட்டும் routes-க்கு
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admin அனுமதி மட்டுமே' });
};

module.exports = { generateToken, protect, adminOnly };
