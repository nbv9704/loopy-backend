import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import fs from 'fs'

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: timestamp-uuid.ext
    const timestamp = Date.now()
    const uniqueId = crypto.randomUUID()
    const ext = path.extname(file.originalname)
    const uniqueFilename = `${timestamp}-${uniqueId}${ext}`
    cb(null, uniqueFilename)
  },
})

// File filter for image types
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only PNG, JPG, and WebP are allowed.'))
  }
}

// Configure multer with storage, limits, and file filter
export const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB in bytes
  },
  fileFilter,
})
