const router = require('express').Router();
const multer = require('multer');
const cloudinary = require('../lib/cloudinary');
const { requireAuth } = require('../middleware/auth');

// Use memory storage — stream directly to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// Helper: upload buffer to Cloudinary
function uploadToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

// POST /api/uploads/gallery
router.post('/gallery', requireAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' });
  try {
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'luxury-barbers/gallery',
      transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
    });
    res.json({
      url: result.secure_url,
      thumbnail_url: cloudinary.url(result.public_id, { width: 400, height: 400, crop: 'fill', quality: 'auto', fetch_format: 'auto' }),
      public_id: result.public_id,
    });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// POST /api/uploads/barber
router.post('/barber', requireAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' });
  try {
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'luxury-barbers/barbers',
      transformation: [{ width: 600, height: 600, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' }],
    });
    res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Error handler for multer
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large. Max 10MB.' });
  res.status(400).json({ error: err.message });
});

module.exports = router;
