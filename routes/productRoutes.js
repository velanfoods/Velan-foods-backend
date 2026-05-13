const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/products – அனைத்து பொருட்களும் (filter, search, pagination)
router.get('/', async (req, res) => {
  try {
    const { category, search, featured, minPrice, maxPrice, page = 1, limit = 12 } = req.query;
    const query = { isActive: true };

    if (category)  query.category = category;
    if (featured)  query.isFeatured = true;
    if (search)    query.name = { $regex: search, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      products
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id – ஒரு பொருளின் விவரம்
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('reviews.user', 'name');
    if (!product) return res.status(404).json({ success: false, message: 'பொருள் கண்டுபிடிக்கவில்லை' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products – புதிய பொருள் (Admin மட்டும்)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, message: 'பொருள் சேர்க்கப்பட்டது', product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/products/:id – பொருள் திருத்தம் (Admin மட்டும்)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'பொருள் கண்டுபிடிக்கவில்லை' });
    res.json({ success: true, message: 'பொருள் புதுப்பிக்கப்பட்டது', product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/products/:id – பொருள் நீக்கம் (Admin மட்டும்)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'பொருள் கண்டுபிடிக்கவில்லை' });
    res.json({ success: true, message: 'பொருள் நீக்கப்பட்டது' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products/:id/review – விமர்சனம் சேர்க்க
router.post('/:id/review', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'பொருள் கண்டுபிடிக்கவில்லை' });

    const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());
    if (alreadyReviewed) return res.status(400).json({ success: false, message: 'நீங்கள் ஏற்கனவே விமர்சனம் அளித்துள்ளீர்கள்' });

    product.reviews.push({ user: req.user._id, name: req.user.name, ...req.body });
    product.calcAverageRating();
    await product.save();

    res.status(201).json({ success: true, message: 'விமர்சனம் சேர்க்கப்பட்டது' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
