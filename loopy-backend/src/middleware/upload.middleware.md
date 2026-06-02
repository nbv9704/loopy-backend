# Upload Middleware Documentation

## Overview

The upload middleware provides multer configuration for handling file uploads in the backend. It's specifically designed for image uploads with validation and secure storage.

## Configuration

- **Storage**: Disk storage in `public/uploads` directory
- **File Size Limit**: 2MB maximum
- **Allowed File Types**: PNG, JPG, JPEG, SVG, WebP
- **Filename Format**: `{timestamp}-{uuid}.{extension}`

## Usage

### Single File Upload

```typescript
import { upload } from '../middleware/upload.middleware'

// In your route
router.post('/upload', upload.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }

  const fileUrl = `/uploads/${req.file.filename}`
  res.json({ success: true, url: fileUrl })
})
```

### Multiple Files Upload

```typescript
router.post('/upload-multiple', upload.array('images', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' })
  }

  const fileUrls = (req.files as Express.Multer.File[]).map(file => `/uploads/${file.filename}`)
  res.json({ success: true, urls: fileUrls })
})
```

## Error Handling

The middleware will automatically reject:

- Files larger than 2MB
- Files with invalid MIME types (not PNG, JPG, SVG, or WebP)

Handle errors in your route:

```typescript
router.post('/upload', (req, res, next) => {
  upload.single('logo')(req, res, err => {
    if (err) {
      if (err.message.includes('File too large')) {
        return res.status(400).json({
          error: 'File size exceeds 2MB limit',
        })
      }
      if (err.message.includes('Invalid file type')) {
        return res.status(400).json({
          error: 'Invalid file type. Only PNG, JPG, SVG, and WebP are allowed.',
        })
      }
      return res.status(500).json({ error: 'Upload failed' })
    }
    next()
  })
})
```

## File Access

Uploaded files are stored in `backend/public/uploads/` and can be accessed via:

- URL: `http://localhost:3000/uploads/{filename}`
- File system: `public/uploads/{filename}`

## Security Features

1. **Unique Filenames**: Prevents file collisions using timestamp + UUID
2. **MIME Type Validation**: Only allows specific image formats
3. **File Size Limits**: Prevents large file uploads
4. **Secure Storage**: Files stored outside source code directory

## Testing

Run tests with:

```bash
npm test -- upload.middleware.test.ts
```

Tests cover:

- File type validation (accept/reject)
- Filename generation uniqueness
- Storage destination configuration
- Extension preservation
