import { Router } from 'express'
import multer from 'multer'
import prisma from '../prisma.js'
import { extractMetadata } from '../../services/pdfParser.js'

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

    const metadata = await extractMetadata(req.file.buffer)

    if (!metadata.doi) {
      return res.status(400).json({ error: 'Could not extract DOI from the PDF' })
    }

    const existing = await prisma.document.findUnique({
      where: { doi: metadata.doi },
    })

    if (existing) {
      return res.status(200).json({ document: existing, duplicate: true })
    }

    const document = await prisma.document.create({
      data: {
        doi: metadata.doi,
        title: metadata.title ?? '',
        abstract: metadata.abstract,
        authors: metadata.authors,
        year: metadata.year,
      },
    })

    return res.status(201).json({ document, duplicate: false })
  } catch (err) {
    if (err.message === 'Only PDF files are allowed') {
      return res.status(400).json({ error: err.message })
    }
    console.error('Upload error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
