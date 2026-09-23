/**
 * Minimal valid PDF generator that outputs standard compliant PDF 1.4 documents.
 * This ensures any book text can be rendered page-by-page in PDF.js without external binary files.
 */

function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Creates a valid multi-page PDF Data URL from title, author, and text pages
 */
export function generateSimplePdfDataUrl(
  title: string,
  author: string,
  pages: string[]
): string {
  const safePages = pages.length > 0 ? pages : ['No content available'];
  const objects: string[] = [];
  const pageObjectIds: number[] = [];

  // Object 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');

  // Object 3: Font
  const fontObjId = 3;
  objects.push(`${fontObjId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`);

  let currentObjId = 4;

  for (let i = 0; i < safePages.length; i++) {
    const pageObjId = currentObjId++;
    const contentObjId = currentObjId++;
    pageObjectIds.push(pageObjId);

    const pageNum = i + 1;
    const lines = safePages[i].split('\n').slice(0, 36);

    let stream = 'BT\n/F1 16 Tf\n50 750 Td\n';
    if (pageNum === 1) {
      stream += `(${escapePdfText(title)}) Tj\n0 -24 Td\n/F1 12 Tf\n(${escapePdfText('Muallif: ' + author)}) Tj\n0 -30 Td\n`;
    } else {
      stream += `/F1 10 Tf\n(${escapePdfText(title + ' - Sahifa ' + pageNum)}) Tj\n0 -25 Td\n`;
    }

    stream += '/F1 11 Tf\n';
    for (const line of lines) {
      const truncated = line.length > 85 ? line.substring(0, 82) + '...' : line;
      if (truncated.trim().length > 0) {
        stream += `(${escapePdfText(truncated)}) Tj\n0 -16 Td\n`;
      } else {
        stream += `0 -10 Td\n`;
      }
    }

    // Page number footer
    stream += `\n0 -30 Td\n/F1 9 Tf\n(${escapePdfText('- ' + pageNum + ' / ' + safePages.length + ' -')}) Tj\nET`;

    const streamLength = Buffer.byteLength(stream, 'utf-8');

    objects.push(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj`
    );

    objects.push(
      `${contentObjId} 0 obj\n<< /Length ${streamLength} >>\nstream\n${stream}\nendstream\nendobj`
    );
  }

  // Object 2: Pages container
  const kidsStr = pageObjectIds.map((id) => `${id} 0 R`).join(' ');
  const pagesObj = `2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${pageObjectIds.length} >>\nendobj`;
  objects.splice(1, 0, pagesObj);

  // Assemble PDF
  let pdf = '%PDF-1.4\n';
  const xrefOffsets: number[] = [0];

  for (const obj of objects) {
    xrefOffsets.push(Buffer.byteLength(pdf, 'utf-8'));
    pdf += obj + '\n';
  }

  const startxref = Buffer.byteLength(pdf, 'utf-8');
  pdf += 'xref\n';
  pdf += `0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let i = 1; i <= objects.length; i++) {
    const offset = String(xrefOffsets[i]).padStart(10, '0');
    pdf += `${offset} 00000 n \n`;
  }

  pdf += 'trailer\n';
  pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += 'startxref\n';
  pdf += `${startxref}\n%%EOF\n`;

  const base64 = Buffer.from(pdf, 'utf-8').toString('base64');
  return `data:application/pdf;base64,${base64}`;
}
