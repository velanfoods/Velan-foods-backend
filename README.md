# 🌾 Velan Foods – Backend API

Node.js + Express + MongoDB மூலம் உருவாக்கப்பட்ட முழுமையான E-Commerce Backend.

---

## 📁 கோப்பு கட்டமைப்பு

```
velan-foods-backend/
├── server.js              # Main entry point
├── seed.js                # Sample data loader
├── .env.example           # Environment variables template
├── package.json
├── models/
│   ├── User.js            # பயனர் model
│   ├── Product.js         # பொருள் model
│   └── Order.js           # ஆர்டர் model
├── middleware/
│   └── auth.js            # JWT authentication
└── routes/
    ├── authRoutes.js      # Login, Register, Profile
    ├── productRoutes.js   # Products CRUD
    ├── orderRoutes.js     # Orders management
    ├── userRoutes.js      # User management
    └── paymentRoutes.js   # Razorpay integration
```

---

## 🚀 Setup செய்வது எப்படி?

### 1. MongoDB நிறுவு
```bash
# Mac
brew install mongodb-community
brew services start mongodb-community

# Windows – https://www.mongodb.com/try/download/community
```

### 2. Dependencies நிறுவு
```bash
cd velan-foods-backend
npm install
```

### 3. Environment கோப்பு உருவாக்கு
```bash
cp .env.example .env
# .env கோப்பை திறந்து MONGO_URI, JWT_SECRET மாற்றவும்
```

### 4. Sample data ஏற்று
```bash
npm run seed
```

### 5. Server தொடங்கு
```bash
npm run dev    # Development (auto-restart)
npm start      # Production
```

Server **http://localhost:5000** இல் இயங்கும்.

---

## 🔗 API Endpoints

### Authentication
| Method | URL | விவரம் |
|--------|-----|---------|
| POST | /api/auth/register | புதிய பதிவு |
| POST | /api/auth/login | உள்நுழைவு |
| GET | /api/auth/me | என் விவரம் |
| PUT | /api/auth/profile | profile மாற்று |
| POST | /api/auth/address | முகவரி சேர்க்க |

### Products
| Method | URL | விவரம் |
|--------|-----|---------|
| GET | /api/products | அனைத்து பொருட்கள் |
| GET | /api/products/:id | ஒரு பொருள் |
| POST | /api/products | புதிய பொருள் (Admin) |
| PUT | /api/products/:id | திருத்தம் (Admin) |
| DELETE | /api/products/:id | நீக்கம் (Admin) |
| POST | /api/products/:id/review | விமர்சனம் |

### Orders
| Method | URL | விவரம் |
|--------|-----|---------|
| POST | /api/orders | புதிய ஆர்டர் |
| GET | /api/orders/my | என் ஆர்டர்கள் |
| GET | /api/orders/:id | ஆர்டர் விவரம் |
| PUT | /api/orders/:id/cancel | ஆர்டர் ரத்து |
| GET | /api/orders | அனைத்தும் (Admin) |
| PUT | /api/orders/:id/status | நிலை மாற்று (Admin) |

### Payment
| Method | URL | விவரம் |
|--------|-----|---------|
| POST | /api/payment/create-order | Razorpay order |
| POST | /api/payment/verify | Payment confirm |

---

## 🔐 Authentication

JWT Token-ஐ header-ல் அனுப்பவும்:
```
Authorization: Bearer <your_token>
```

---

## 💳 Razorpay Setup

1. https://razorpay.com இல் account உருவாக்கு
2. API Keys பெறு (Test mode)
3. `.env` கோப்பில் `RAZORPAY_KEY_ID` மற்றும் `RAZORPAY_KEY_SECRET` சேர்க்கவும்

---

## 👤 Admin Login (Seed data)

```
Email: admin@velanfoods.com
Password: admin123
```

---

## 🌐 Frontend இணைப்பு

Frontend-ல் API calls இப்படி செய்யவும்:

```javascript
// Login
const res = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const data = await res.json();
localStorage.setItem('token', data.token);

// Products பெற
const products = await fetch('http://localhost:5000/api/products').then(r => r.json());
```
