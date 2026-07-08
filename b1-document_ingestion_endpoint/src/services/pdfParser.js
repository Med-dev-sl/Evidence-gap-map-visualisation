import pdfParse from 'pdf-parse'

const DOI_REGEX = /10\.\d{4,}\/[-._;()/:A-Za-z0-9]+/
const YEAR_REGEX = /\b(19|20)\d{2}\b/
const AUTHOR_SEPARATORS = /[,;]|\band\b/

export async function extractMetadata(pdfBuffer) {
  const data = await pdfParse(pdfBuffer)
  const text = data.text

  return {
    doi: extractDoi(text),
    title: extractTitle(text),
    abstract: extractAbstract(text),
    authors: extractAuthors(text),
    year: extractYear(text),
  }
}

function extractDoi(text) {
  const match = text.match(DOI_REGEX)
  return match ? match[0] : null
}

function extractTitle(text) {
  const lines = text.split('\n').map((l) => l.trim())
  if (lines.length === 0) return null

  const sectionStart = lines.findIndex(
    (l) =>
      !!l &&
      /^(abstract|introduction|keywords|doi|corresponding|references|bibliography|acknowledgments)\b/i.test(l),
  )

  const candidateLines = sectionStart === -1 ? lines : lines.slice(0, sectionStart)

  const titleLines = []
  for (const line of candidateLines) {
    if (!line) break
    if ((line.match(/,/g) || []).length >= 2) break
    if (/\band\b/i.test(line) && line.length > 50) break
    if (/^\d{4}$/.test(line)) break
    titleLines.push(line)
  }

  return titleLines.length > 0
    ? titleLines.join(' ').replace(/\s+/g, ' ').trim()
    : null
}

function extractAbstract(text) {
  const abstractMatch = text.match(
    /abstract\s*[:\-–—]?\s*([\s\S]+?)(?=\n\s*(keywords|introduction|doi|references|bibliography|acknowledgments)\b)/i,
  )
  return abstractMatch ? abstractMatch[1].trim() : null
}

function extractAuthors(text) {
  const labeledMatch = text.match(
    /(?:(?:authors?|by)\s*[:\-–—]?\s*)(.+?)(?=\n\s*(abstract|introduction|affiliation|email|doi)\b)/i,
  )

  if (labeledMatch) {
    return formatAuthors(labeledMatch[1])
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  const abstractIdx = lines.findIndex(
    (l) => /^abstract\b/i.test(l),
  )

  const candidateLines = abstractIdx === -1 ? lines : lines.slice(0, abstractIdx)

  const titleEndIdx = candidateLines.findIndex(
    (l) => (l.match(/,/g) || []).length >= 1 || /\band\b/i.test(l),
  )

  if (titleEndIdx === -1) return null

  const afterTitle = candidateLines.slice(titleEndIdx)
  const authorBlock = []

  for (const line of afterTitle) {
    if (!line || /^(abstract|introduction|doi|keywords|corresponding|department|institute|university)/i.test(line)) break
    if (/\d{4}/.test(line) && line.length < 10) break
    authorBlock.push(line)
  }

  if (authorBlock.length === 0) return null

  return formatAuthors(authorBlock.join(' '))
}

function formatAuthors(raw) {
  return raw
    .split(AUTHOR_SEPARATORS)
    .map((a) => a.replace(/[^\w\s.'-]/g, '').trim())
    .filter(Boolean)
    .slice(0, 10)
    .join(', ')
}

function extractYear(text) {
  const years = text.match(YEAR_REGEX)
  return years ? parseInt(years[0], 10) : null
}
