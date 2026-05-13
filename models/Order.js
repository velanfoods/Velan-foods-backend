const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:     { type: String, required: true },
  emoji:    { type: String },
  qty:      { type: Number, required: true, min: 1 },
  price:    { type: Number, required: true },
  unit:     { type: String }
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  items: [orderItemSchema],

  shippingAddress: {
    name:    { type: String, required: true },
    phone:   { type: String, required: true },
    street:  { type: String, required: true },
    city:    { type: String, required: true },
    state:   { type: String, required: true },
    pincode: { type: String, required: true }
  },

  paymentMethod: {
    type: String,
    required: true,
    enum: ['COD', 'Razorpay', 'UPI', 'Card']
  },

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },

  razorpayOrderId:   { type: String },
  razorpayPaymentId: { type: String },

  itemsTotal:    { type: Number, required: true },
  shippingCost:  { type: Number, default: 0 },
  discount:      { type: Number, default: 0 },
  totalAmount:   { type: Number, required: true },

  orderStatus: {
    type: String,
    enum: ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'placed'
  },

  statusHistory: [{
    status:    { type: String },
    note:      { type: String },
    updatedAt: { type: Date, default: Date.now }
  }],

  deliveredAt: { type: Date },
  couponCode:  { type: String }

}, { timestamps: true });

// Auto-add status history on status change
orderSchema.pre('save', function (next) {
  if (this.isModified('orderStatus')) {
    this.statusHistory.push({ status: this.orderStatus });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
