const express = require('express');
const router = express.Router();
const https = require('https');
const User = require('../models/User');
const { generateToken, protect } = require('../middleware/auth');

// ── OTP Store ──
const otpStore = {};

// ── Brevo HTTP API மூலம் Email அனுப்பு ──
async function sendEmailOTP(email, otp) {
  const data = JSON.stringify({
    sender: { name: 'Velan Foods', email: 'velanfoodstn@gmail.com' },
    to: [{ email: email }],
    subject: 'Velan Foods – உங்கள் OTP குறியீடு',
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#FBF5EC;border-radius:16px">
        <div style="text-align:center;margin-bottom:24px">
          <h2 style="color:#4A2C0A">🌾 Velan Foods</h2>
          <p style="color:#7A5C44;font-size:13px">இயற்கை • தரம் • சுவை</p>
        </div>
        <div style="background:#fff;border-radius:12px;padding:28px;text-align:center">
          <p style="color:#4A2C0A;font-size:16px">உங்கள் OTP குறியீடு:</p>
          <div style="background:#FDF0DC;border:2px dashed #E8821A;border-radius:12px;padding:20px;margin:16px 0">
            <span style="font-size:40px;font-weight:900;letter-spacing:10px;color:#4A2C0A">${otp}</span>
          </div>
          <p style="color:#7A5C44;font-size:13px">இந்த OTP <strong>10 நிமிடங்களில்</strong> expire ஆகும்</p>
          <p style="color:#C0392B;font-size:12px">இந்த OTP-ஐ யாரிடமும் பகிர வேண்டாம்</p>
        </div>
      </div>
    `
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`Brevo error: ${res.statusCode} - ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'மின்னஞ்சல் தேவை' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'இந்த மின்னஞ்சல் ஏற்கனவே பதிவாகியுள்ளது' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };

    await sendEmailOTP(email, otp);
    res.json({ success: true, message: `OTP ${email}-க்கு அனுப்பப்பட்டது` });
  } catch (err) {
    console.error('OTP error:', err);
    res.status(500).json({ success: false, message: 'OTP அனுப்ப முடியவில்லை: ' + err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, otp } = req.body;

    const stored = otpStore[email];
    if (!stored) return res.status(400).json({ success: false, message: 'OTP அனுப்பவில்லை' });
    if (Date.now() > stored.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ success: false, message: 'OTP காலாவதியானது' });
    }
    if (stored.otp !== otp) return res.status(400).json({ success: false, message: 'தவறான OTP' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'இந்த மின்னஞ்சல் ஏற்கனவே பதிவாகியுள்ளது' });

    const user = await User.create({ name, email, phone, password });
    delete otpStore[email];

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

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'மின்னஞ்சல் மற்றும் கடவுச்சொல் தேவை' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்' });
    }
    if (!user.isActive) return res.status(403).json({ success: false, message: 'கணக்கு செயலற்று உள்ளது' });

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

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone }, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile புதுப்பிக்கப்பட்டது', user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/auth/address
router.post('/address', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (req.body.isDefault) user.addresses.forEach(a => (a.isDefault = false));
    user.addresses.push(req.body);
    await user.save();
    res.json({ success: true, message: 'முகவரி சேர்க்கப்பட்டது', addresses: user.addresses });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
