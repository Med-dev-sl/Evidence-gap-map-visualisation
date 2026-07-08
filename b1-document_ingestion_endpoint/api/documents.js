import multer from 'multer'
import prisma from '../src/server/prisma.js'
import { extractMetadata } from '../src/services/pdfParser.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('file')

export default async function handler(req, res) {
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
    } catch (error) {
      console.error('Upload error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })
}
