export function createPdfBuffer(textContent) {
  const escapedText = textContent
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')

  const contentStream = `BT /F1 12 Tf 50 750 Td (${escapedText}) Tj ET`

  const objects = [
    { obj: '1 0', content: '<< /Type /Catalog /Pages 2 0 R >>' },
    { obj: '2 0', content: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
    { obj: '3 0', content: '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>' },
    { obj: '4 0', content: `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream` },
    { obj: '5 0', content: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>' },
  ]

  const body = objects
    .map((o) => `${o.obj}\nobj\n${o.content}\nendobj`)
    .join('\n')

  const entries = ['0000000000 65535 f ']
  let offset = 9
  for (let i = 0; i < objects.length; i++) {
    entries.push(`${String(offset).padStart(10, '0')} 00000 n `)
    offset += objects[i].content.length + `\nendobj\n`.length + `${i + 1} 0 obj\n`.length + `obj\n`.length
  }

  const xref = `xref\n0 ${objects.length + 1}\n${entries.join('\n')}`
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>`
  const startxref = body.length + `\n`.length + xref.length + `\n`.length

  const pdf = `%PDF-1.4\n${body}\n${xref}\n${trailer}\nstartxref\n${startxref}\n%%EOF`

  return Buffer.from(pdf, 'utf-8')
}
