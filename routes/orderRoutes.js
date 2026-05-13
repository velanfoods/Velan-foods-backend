const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/orders – புதிய ஆர்டர்
router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'ஆர்டரில் பொருட்கள் இல்லை' });
    }

    // Stock சோதனை & விலை கணக்கீடு
    let itemsTotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `பொருள் கண்டுபிடிக்கவில்லை: ${item.product}` });
      }
      if (product.stock < item.qty) {
        return res.status(400).json({ success: false, message: `${product.name} – போதுமான stock இல்லை` });
      }
      itemsTotal += product.price * item.qty;
      orderItems.push({ product: product._id, name: product.name, emoji: product.emoji, qty: item.qty, price: product.price, unit: product.unit });
    }

    // Shipping கணக்கீடு
    const shippingCost = itemsTotal >= 500 ? 0 : 50;
    const discount = couponCode === 'VELAN10' ? Math.round(itemsTotal * 0.1) : 0;
    const totalAmount = itemsTotal + shippingCost - discount;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      couponCode,
      itemsTotal,
      shippingCost,
      discount,
      totalAmount
    });

    // Stock குறைக்கவும்
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
    }

    res.status(201).json({
      success: true,
      message: 'ஆர்டர் வெற்றிகரமாக பதிவாகியது!',
      order
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/orders/my – என் ஆர்டர்கள்
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'name emoji')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id – ஒரு ஆர்டர் விவரம்
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) return res.status(404).json({ success: false, message: 'ஆர்டர் கண்டுபிடிக்கவில்லை' });

    // பயனர் தன் ஆர்டரை மட்டும் காண்பார்
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'அனுமதி இல்லை' });
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/orders/:id/cancel – ஆர்டர் ரத்து
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'ஆர்டர் கண்டுபிடிக்கவில்லை' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'அனுமதி இல்லை' });
    }
    if (['shipped', 'delivered'].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: 'இந்த நிலையில் ரத்து செய்ய முடியாது' });
    }

    order.orderStatus = 'cancelled';
    await order.save();

    // Stock திரும்ப சேர்க்கவும்
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } });
    }

    res.json({ success: true, message: 'ஆர்டர் ரத்து செய்யப்பட்டது', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Admin Routes ──

// GET /api/orders – அனைத்து ஆர்டர்களும் (Admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { orderStatus: status } : {};

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/orders/:id/status – நிலை மாற்றம் (Admin)
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { orderStatus, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'ஆர்டர் கண்டுபிடிக்கவில்லை' });

    order.orderStatus = orderStatus;
    if (orderStatus === 'delivered') {
      order.deliveredAt = new Date();
      order.paymentStatus = 'paid';
    }
    if (note) order.statusHistory.push({ status: orderStatus, note });

    await order.save();
    res.json({ success: true, message: 'நிலை புதுப்பிக்கப்பட்டது', order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
