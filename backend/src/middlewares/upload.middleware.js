const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define allowed MIME types and a max file size
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'image/jpeg',
  'image/png',
  'image/gif',
];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/documents'); // Relative to this file, goes up to backend/ then uploads/documents
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Multer file filter
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    // Create a proper error for file type rejection
    const error = new Error(`File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}. Received: ${file.mimetype}`);
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false); // Reject file
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES // 10 MB limit
  }
});

module.exports = upload;