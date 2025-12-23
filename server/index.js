const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const path = require('path');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const admin = require('firebase-admin');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = process.env.SECRET_KEY || 'gizli-anahtar-degistir-bunu';

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Check Cloudinary config
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn("UYARI: Cloudinary ortam değişkenleri eksik! Fotoğraf yükleme çalışmayacaktır.");
}

// Firebase Admin SDK initialization
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
  console.error("HATA: Firebase ortam değişkenleri eksik!");
} else {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
  console.log("Firebase Admin SDK initialized successfully.");
}

const db = admin.firestore();

// Default categories to initialize if collection is empty
const defaultCategories = [
  { id: 'portrait', name: 'Portre' },
  { id: 'landscape', name: 'Manzara' },
  { id: 'urban', name: 'Şehir' },
  { id: 'minimal', name: 'Minimal' }
];

// Initialize default categories if needed
async function initializeCategories() {
  try {
    const snapshot = await db.collection('categories').get();
    if (snapshot.empty) {
      console.log("Initializing default categories...");
      const batch = db.batch();
      for (const cat of defaultCategories) {
        const ref = db.collection('categories').doc(cat.id);
        batch.set(ref, cat);
      }
      await batch.commit();
      console.log("Default categories created.");
    }
  } catch (error) {
    console.error("Error initializing categories:", error);
  }
}
initializeCategories();

// Middleware
app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Multer Storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir.'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Routes

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Demo user - In production use a database
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
  }
});

// Get Categories
app.get('/api/categories', async (req, res) => {
  try {
    // Prevent mobile browser caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const snapshot = await db.collection('categories').get();
    const categories = snapshot.docs.map(doc => doc.data());
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: 'Kategoriler alınamadı' });
  }
});

// Create Category
app.post('/api/categories', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const id = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');

    const docRef = db.collection('categories').doc(id);
    const doc = await docRef.get();

    if (doc.exists) {
      return res.status(400).json({ message: 'Kategori zaten var' });
    }

    const newCategory = { id, name };
    await docRef.set(newCategory);
    res.json(newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: 'Kategori oluşturulamadı' });
  }
});

// Get Photos
app.get('/api/photos', async (req, res) => {
  try {
    // Prevent mobile browser caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const snapshot = await db.collection('photos').orderBy('date', 'desc').get();
    const photos = snapshot.docs.map(doc => doc.data());
    res.json(photos);
  } catch (error) {
    console.error("Error fetching photos:", error);
    res.status(500).json({ message: 'Fotoğraflar alınamadı' });
  }
});

// Upload Photo
app.post('/api/upload', authenticateToken, upload.array('photos', 10), async (req, res) => {
  try {
    // Check for Cloudinary config
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("Cloudinary configuration missing");
      return res.status(500).json({ message: 'Sunucu yapılandırma hatası: Cloudinary ayarları eksik.' });
    }

    const { category } = req.body;
    const uploadedPhotos = [];

    for (const file of req.files) {
      // Upload to Cloudinary using stream
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'portfolio',
            transformation: [
              { width: 1200, crop: "limit" },
              { quality: "auto" }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        Readable.from(file.buffer).pipe(uploadStream);
      });

      const photo = {
        id: result.public_id, // Use Cloudinary public_id as ID
        url: result.secure_url,
        originalUrl: result.secure_url,
        category: category || 'all',
        title: file.originalname.split('.')[0],
        width: result.width,
        height: result.height,
        date: new Date().toISOString()
      };

      // Save to Firestore
      await db.collection('photos').doc(result.public_id.replace(/\//g, '_')).set(photo);
      uploadedPhotos.push(photo);
    }

    res.json(uploadedPhotos);
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ message: 'Yükleme hatası: ' + (error.message || JSON.stringify(error)) });
  }
});

// Delete Photo (Cloudinary + Firestore)
app.delete('/api/photos', authenticateToken, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ message: 'ID gerekli' });

  try {
    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(id);
    } catch (e) {
      console.error("Cloudinary delete error", e);
    }

    // Delete from Firestore
    const docId = id.replace(/\//g, '_');
    await db.collection('photos').doc(docId).delete();

    res.json({ message: 'Silindi' });
  } catch (error) {
    console.error("Error deleting photo:", error);
    res.status(500).json({ message: 'Silme hatası' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Deployed at:', new Date().toISOString());
});
