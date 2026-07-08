import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

vi.mock('../src/server/prisma.js', () => ({
  default: {
    document: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('../src/services/pdfParser.js', () => ({
  extractMetadata: vi.fn(),
}))

const { default: prisma } = await import('../src/server/prisma.js')
const { extractMetadata } = await import('../src/services/pdfParser.js')
const { default: app } = await import('../src/server/index.js')

describe('POST /api/documents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a new document when a valid PDF is uploaded', async () => {
    const metadata = {
      doi: '10.1234/test.2024.001',
      title: 'Test Title',
      abstract: 'Test abstract',
      authors: 'Alice, Bob',
      year: 2024,
    }

    extractMetadata.mockResolvedValue(metadata)
    prisma.document.findUnique.mockResolvedValue(null)
    prisma.document.create.mockResolvedValue({ id: 1, ...metadata })

    const res = await request(app)
      .post('/api/documents')
      .attach('file', Buffer.from('fake pdf content'), 'test.pdf')

    expect(res.status).toBe(201)
    expect(res.body.document.doi).toBe('10.1234/test.2024.001')
    expect(res.body.duplicate).toBe(false)
    expect(prisma.document.create).toHaveBeenCalledWith({
      data: {
        doi: metadata.doi,
        title: metadata.title,
        abstract: metadata.abstract,
        authors: metadata.authors,
        year: metadata.year,
      },
    })
  })

  it('returns existing document when DOI already exists', async () => {
    const existingDoc = {
      id: 1,
      doi: '10.1234/test.2024.001',
      title: 'Existing Title',
      abstract: 'Existing abstract',
      authors: 'Existing Author',
      year: 2024,
    }

    extractMetadata.mockResolvedValue({
      doi: '10.1234/test.2024.001',
      title: 'Existing Title',
      abstract: 'Existing abstract',
      authors: 'Existing Author',
      year: 2024,
    })
    prisma.document.findUnique.mockResolvedValue(existingDoc)

    const res = await request(app)
      .post('/api/documents')
      .attach('file', Buffer.from('fake pdf content'), 'test.pdf')

    expect(res.status).toBe(200)
    expect(res.body.document.id).toBe(1)
    expect(res.body.duplicate).toBe(true)
    expect(prisma.document.create).not.toHaveBeenCalled()
  })

  it('returns 400 when no file is uploaded', async () => {
    const res = await request(app).post('/api/documents')

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('No PDF file uploaded')
  })

  it('returns 400 when DOI cannot be extracted', async () => {
    extractMetadata.mockResolvedValue({
      doi: null,
      title: 'No DOI',
      abstract: null,
      authors: null,
      year: null,
    })

    const res = await request(app)
      .post('/api/documents')
      .attach('file', Buffer.from('fake pdf content'), 'test.pdf')

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Could not extract DOI from the PDF')
  })
})
