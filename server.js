const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ── Middleware ──
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ──
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders',   require('./routes/orderRoutes'));
app.use('/api/users',    require('./routes/userRoutes'));
app.use('/api/payment',  require('./routes/paymentRoutes'));

// ── Health Check ──
app.get('/', (req, res) => {
  res.json({
    message: '🌾 Velan Foods API இயங்குகிறது!',
    version: '1.0.0',
    status: 'active'
  });
});

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route கண்டுபிடிக்கவில்லை' });
});

// ── Error Handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server பிழை ஏற்பட்டது'
  });
});

// ── MongoDB Connection & Start ──
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB இணைக்கப்பட்டது');
    app.listen(PORT, () => {
      console.log(`🚀 Server port ${PORT}-ல் இயங்குகிறது`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB பிழை:', err.message);
    process.exit(1);
  });
