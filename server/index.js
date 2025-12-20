const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = process.env.SECRET_KEY || 'gizli-anahtar-degistir-bunu';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Data simulation
const DB_FILE = path.join(__dirname, 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

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
const getDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
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
        url: `http://localhost:${PORT}/uploads/${optimizedFilename}`,
        originalUrl: `http://localhost:${PORT}/uploads/${file.filename}`,
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
    console.error(error);
    res.status(500).json({ message: 'Yükleme hatası' });
  }
});

// Delete Photo
app.delete('/api/photos/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const photoIndex = db.photos.findIndex(p => p.id === id);
  
  if (photoIndex === -1) {
    return res.status(404).json({ message: 'Fotoğraf bulunamadı' });
  }

  const photo = db.photos[photoIndex];
  // Try to delete file
  try {
      const filename = path.basename(photo.url);
      const filepath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  } catch (e) {
      console.error("Error deleting file", e);
  }

  db.photos.splice(photoIndex, 1);
  saveDB(db);
  res.json({ message: 'Silindi' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
