const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Product = require('./models/Product');
const User = require('./models/User');

const sampleProducts = [
  { name: 'நாட்டு மிளகாய் தூள்', nameTamil: 'நாட்டு மிளகாய் தூள்', description: 'சுத்தமான நாட்டு மிளகாய்களில் இருந்து தயாரித்த காரமான தூள்', category: 'மசாலா', price: 149, mrp: 199, stock: 100, unit: '250g', emoji: '🌶️', badge: 'Bestseller', isFeatured: true },
  { name: 'Cardamom Honey', nameTamil: 'கார்டமம் ஹனி', description: 'மலை மலர்களிலிருந்து சேகரிக்கப்பட்ட தூய ஏலக்காய் தேன்', category: 'தேன் & எண்ணெய்', price: 349, mrp: 449, stock: 60, unit: '500g', emoji: '🍯', badge: 'Organic', isFeatured: true },
  { name: 'மாவடு ஊறுகாய்', nameTamil: 'மாவடு ஊறுகாய்', description: 'பாரம்பரிய செய்முறையில் தயாரித்த நாஞ்சில்நாடு மாவடு', category: 'ஊறுகாய்', price: 199, mrp: 249, stock: 80, unit: '300g', emoji: '🫙', badge: '', isFeatured: true },
  { name: 'Sivappu Kavuni Arisi', nameTamil: 'சிவப்பு கவுனி அரிசி', description: 'தமிழ்நாட்டின் பாரம்பரிய சிவப்பு அரிசி – நார்ச்சத்து நிரம்பியது', category: 'தானியங்கள்', price: 280, mrp: 350, stock: 150, unit: '1kg', emoji: '🌾', badge: 'New', isFeatured: true },
  { name: 'கடலை பருப்பு', nameTamil: 'கடலை பருப்பு', description: 'நேரடி விவசாயியிடமிருந்து வந்த சுத்தமான கடலை பருப்பு', category: 'பருப்பு வகைகள்', price: 120, mrp: 160, stock: 200, unit: '500g', emoji: '🥜', badge: '' },
  { name: 'Tulasi & Adathodai Tea', nameTamil: 'துளசி & ஆடாதொடை டீ', description: 'நோய் எதிர்ப்பு சக்தி அளிக்கும் மூலிகை தேயிலை கலவை', category: 'மூலிகைகள்', price: 229, mrp: 299, stock: 75, unit: '100g', emoji: '🌿', badge: 'Offer', isFeatured: true },
  { name: 'Garam Masala Mix', nameTamil: 'கரம் மசாலா', description: '25 மசாலாக்களை கலந்து தயாரித்த சிறப்பான கரம் மசாலா', category: 'மசாலா', price: 175, mrp: 220, stock: 90, unit: '200g', emoji: '🧄', badge: '' },
  { name: 'Gold Press Nallennai', nameTamil: 'கோல்டு பிரஸ் நல்லெண்ணெய்', description: 'Cold pressed method-ல் தயாரித்த தூய நல்லெண்ணெய்', category: 'தேன் & எண்ணெய்', price: 395, mrp: 480, stock: 50, unit: '1L', emoji: '🌻', badge: 'Premium', isFeatured: true },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB இணைக்கப்பட்டது');

    await Product.deleteMany({});
    await User.deleteMany({});

    await Product.insertMany(sampleProducts);
    console.log(`✅ ${sampleProducts.length} பொருட்கள் சேர்க்கப்பட்டன`);

    await User.create({
      name: 'Admin வேலன்',
      email: 'admin@velanfoods.com',
      phone: '9876543210',
      password: 'admin123',
      role: 'admin'
    });
    console.log('✅ Admin பயனர் உருவாக்கப்பட்டது (admin@velanfoods.com / admin123)');

    console.log('\n🌾 Seeding முடிந்தது!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed பிழை:', err.message);
    process.exit(1);
  }
}

seed();
