const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');
const { Readable } = require('stream');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = process.env.SECRET_KEY || 'gizli-anahtar-degistir-bunu';
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Check config
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn("UYARI: Cloudinary ortam değişkenleri eksik! Fotoğraf yükleme çalışmayacaktır.");
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Data simulation
// UYARI: Vercel gibi serverless ortamlarda bu dosya kalıcı olmaz!
// Her deploy'da veya cold start'ta sıfırlanabilir.
// Gerçek bir veritabanı (MongoDB, PostgreSQL vb.) kullanılması önerilir.
const DB_FILE = path.join('/tmp', 'db.json'); // Vercel'de yazılabilir tek yer /tmp
// Ancak /tmp de geçicidir. Şimdilik çalışması için böyle yapıyoruz.

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({
    categories: [
      { id: 'portrait', name: 'Portre' },
      { id: 'landscape', name: 'Manzara' },
      { id: 'urban', name: 'Şehir' },
      { id: 'minimal', name: 'Minimal' }
    ],
    photos: []
  }, null, 2));
}

// Helper to read/write DB
const getDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    return { categories: [], photos: [] };
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
};
const saveDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

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
app.get('/api/categories', (req, res) => {
  const db = getDB();
  res.json(db.categories);
});

// Create Category
app.post('/api/categories', authenticateToken, (req, res) => {
  const { name } = req.body;
  const id = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');

  const db = getDB();
  if (db.categories.find(c => c.id === id)) {
    return res.status(400).json({ message: 'Kategori zaten var' });
  }

  const newCategory = { id, name };
  db.categories.push(newCategory);
  saveDB(db);
  res.json(newCategory);
});

// Get Photos
app.get('/api/photos', (req, res) => {
  const db = getDB();
  res.json(db.photos);
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
    const db = getDB();
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

      db.photos.push(photo);
      uploadedPhotos.push(photo);
    }

    saveDB(db);
    res.json(uploadedPhotos);
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ message: 'Yükleme hatası: ' + (error.message || JSON.stringify(error)) });
  }
});

// Delete Photo (Cloudinary)
// Note: id param might need to be encoded by client if it contains slashes (portfolio/abc)
// Better to use a query parameter for safety with public_ids containing slashes
app.delete('/api/photos', authenticateToken, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ message: 'ID gerekli' });

  const db = getDB();
  const photoIndex = db.photos.findIndex(p => p.id === id);

  if (photoIndex === -1) {
    return res.status(404).json({ message: 'Fotoğraf bulunamadı' });
  }

  const photo = db.photos[photoIndex];

  try {
    await cloudinary.uploader.destroy(photo.id);
  } catch (e) {
    console.error("Cloudinary delete error", e);
  }

  db.photos.splice(photoIndex, 1);
  saveDB(db);
  res.json({ message: 'Silindi' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Deployed at:', new Date().toISOString());
});
