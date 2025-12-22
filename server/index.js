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
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

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
    const { category } = req.body;
    const db = getDB();
    const uploadedPhotos = [];

    for (const file of req.files) {
      // Optimization with Sharp
      const optimizedFilename = `opt-${file.filename}`;
      const optimizedPath = path.join(UPLOADS_DIR, optimizedFilename);
      
      const metadata = await sharp(file.path).metadata();
      
      await sharp(file.path)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(optimizedPath);

      // Clean up original if wanted, or keep it. We'll keep optimized one for display
      // Ideally we would delete the original heavy file to save space
      // fs.unlinkSync(file.path); 

      const photo = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        url: `${req.protocol}://${req.get('host')}/uploads/${optimizedFilename}`,
        originalUrl: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
        category: category || 'all',
        title: file.originalname.split('.')[0],
        width: metadata.width, // approximate from original
        height: metadata.height, // approximate from original
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
