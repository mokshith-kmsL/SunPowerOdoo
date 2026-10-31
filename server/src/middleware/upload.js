import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Where to save uploaded installation photos
const PHOTOS_DIR = 'uploads/installation-photos';

// Create the folder if it doesn't exist yet
if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}

// Configure how multer saves files to disk
const storage = multer.diskStorage({
  // Save all installation photos in the same folder
  destination: (req, file, cb) => {
    cb(null, PHOTOS_DIR);
  },

  // Give each file a unique name based on the current timestamp
  // e.g. "photo-1698765432100-123456789.jpg"
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random    = Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `photo-${timestamp}-${random}${extension}`);
  },
});

// Only allow image files (jpg, png, webp)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Only JPG, PNG, and WebP images are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

export default upload;
