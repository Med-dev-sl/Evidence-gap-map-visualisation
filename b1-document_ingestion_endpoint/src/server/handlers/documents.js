import prisma from '../prisma.js'
import { extractMetadata } from '../../services/pdfParser.js'

export async function handleDocumentUpload(fileBuffer) {
  const metadata = await extractMetadata(fileBuffer)

  if (!metadata.doi) {
    const error = new Error('Could not extract DOI from the PDF')
    error.statusCode = 400
    throw error
  }

  const existing = await prisma.document.findUnique({
    where: { doi: metadata.doi },
  })

  if (existing) {
    return { document: existing, duplicate: true, statusCode: 200 }
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

  return { document, duplicate: false, statusCode: 201 }
}
