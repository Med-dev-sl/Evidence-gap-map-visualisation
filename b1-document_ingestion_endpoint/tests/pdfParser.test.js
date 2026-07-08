import { describe, it, expect, vi } from 'vitest'

vi.mock('pdf-parse', () => ({
  default: vi.fn(),
}))

import pdfParse from 'pdf-parse'
import { extractMetadata } from '../src/services/pdfParser.js'

const SAMPLE_TEXT = [
  'A Novel Approach to Quantum Computing',
  'John Smith, Jane Doe, and Bob Chen',
  'Department of Physics, University of Science',
  '',
  'Abstract',
  'This paper presents a novel approach to quantum computing using topological qubits.',
  'We demonstrate significant improvements in coherence time and error rates.',
  '',
  'Keywords: quantum computing, topological qubits, coherence',
  'DOI: 10.1234/example.2024.00123',
  'Introduction',
  'Quantum computing has emerged as a promising paradigm...',
].join('\n')

describe('extractMetadata', () => {
  it('extracts DOI, title, abstract, authors, and year from PDF text', async () => {
    pdfParse.mockResolvedValue({ text: SAMPLE_TEXT, numpages: 1 })

    const result = await extractMetadata(Buffer.from('fake'))

    expect(result.doi).toBe('10.1234/example.2024.00123')
    expect(result.title).toBe('A Novel Approach to Quantum Computing')
    expect(result.abstract).toBe(
      'This paper presents a novel approach to quantum computing using topological qubits.\nWe demonstrate significant improvements in coherence time and error rates.',
    )
    expect(result.authors).toContain('John Smith')
    expect(result.authors).toContain('Jane Doe')
    expect(result.authors).toContain('Bob Chen')
    expect(result.year).toBe(2024)
  })

  it('returns nulls when metadata is not found', async () => {
    pdfParse.mockResolvedValue({ text: 'Some random text without metadata', numpages: 1 })

    const result = await extractMetadata(Buffer.from('fake'))

    expect(result.doi).toBeNull()
    expect(result.title).toBe('Some random text without metadata')
    expect(result.abstract).toBeNull()
    expect(result.authors).toBeNull()
    expect(result.year).toBeNull()
  })

  it('extracts the year from text containing multiple years', async () => {
    const text = [
      'Title',
      'Author',
      'Abstract: A study conducted in 2023.',
      'DOI: 10.1234/test.2023.56789',
      'References',
      'Smith (2020) showed that...',
      'Jones (2021) disagreed...',
    ].join('\n')

    pdfParse.mockResolvedValue({ text, numpages: 1 })

    const result = await extractMetadata(Buffer.from('fake'))
    expect(result.year).toBe(2023)
    expect(result.doi).toBe('10.1234/test.2023.56789')
  })
})
