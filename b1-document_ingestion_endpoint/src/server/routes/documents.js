import { Router } from 'express'
import multer from 'multer'
import { handleDocumentUpload } from '../handlers/documents.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Only PDF files are allowed'))
      return
    }
    cb(null, true)
  },
})

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' })
    }

    const result = await handleDocumentUpload(req.file.buffer)
    return res.status(result.statusCode).json({
      document: result.document,
      duplicate: result.duplicate,
    })
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message })
    }
    if (err.message === 'Only PDF files are allowed') {
      return res.status(400).json({ error: err.message })
    }
    console.error('Upload error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
