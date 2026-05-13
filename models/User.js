const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  phone:   { type: String, required: true },
  street:  { type: String, required: true },
  city:    { type: String, required: true },
  state:   { type: String, required: true },
  pincode: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  name:     { type: String, required: [true, 'பெயர் அவசியம்'], trim: true },
  email:    { type: String, required: [true, 'மின்னஞ்சல் அவசியம்'], unique: true, lowercase: true },
  phone:    { type: String, required: [true, 'தொலைபேசி எண் அவசியம்'] },
  password: { type: String, required: [true, 'கடவுச்சொல் அவசியம்'], minlength: 6, select: false },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  addresses: [addressSchema],
  wishlist:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  isActive:  { type: Boolean, default: true }
}, { timestamps: true });

// Password hash before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password compare method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
