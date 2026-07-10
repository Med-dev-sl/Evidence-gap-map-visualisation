import multer from 'multer'
import { handleDocumentUpload } from '../src/server/handlers/documents.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('file')

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message })
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file uploaded' })
      }

      const result = await handleDocumentUpload(req.file.buffer)
      return res.status(result.statusCode).json({
        document: result.document,
        duplicate: result.duplicate,
      })
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message })
      }
      console.error('Upload error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })
}
