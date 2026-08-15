const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Images now upload straight to Cloudinary instead of local disk — this
// survives server restarts/redeploys (local disk on Render does not).
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'nestara/properties',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1600, height: 1200, crop: 'limit', quality: 'auto' }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 }, // 5MB per image, max 10 images
});

module.exports = upload;