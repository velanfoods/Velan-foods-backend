const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:    { type: String, required: true },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name:        { type: String, required: [true, 'பொருளின் பெயர் அவசியம்'], trim: true },
  nameTamil:   { type: String, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['தானியங்கள்', 'மசாலா', 'ஊறுகாய்', 'தேன் & எண்ணெய்', 'பருப்பு வகைகள்', 'மூலிகைகள்']
  },
  price:    { type: Number, required: true, min: 0 },
  mrp:      { type: Number, required: true, min: 0 },
  stock:    { type: Number, required: true, default: 0, min: 0 },
  unit:     { type: String, default: '250g' }, // 250g, 500g, 1kg, etc.
  images:   [{ type: String }],
  emoji:    { type: String, default: '🌾' },
  tags:     [{ type: String }],
  isOrganic:   { type: Boolean, default: true },
  isFeatured:  { type: Boolean, default: false },
  isActive:    { type: Boolean, default: true },
  badge:       { type: String, enum: ['Bestseller', 'New', 'Organic', 'Offer', 'Premium', ''], default: '' },
  reviews:     [reviewSchema],
  rating:      { type: Number, default: 0 },
  numReviews:  { type: Number, default: 0 }
}, { timestamps: true });

// Calculate average rating before save
productSchema.methods.calcAverageRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
  } else {
    this.rating = this.reviews.reduce((acc, r) => acc + r.rating, 0) / this.reviews.length;
    this.numReviews = this.reviews.length;
  }
};

// Discount percentage virtual
productSchema.virtual('discount').get(function () {
  return Math.round(((this.mrp - this.price) / this.mrp) * 100);
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
