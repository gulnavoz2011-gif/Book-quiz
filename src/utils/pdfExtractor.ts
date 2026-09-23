import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface ExtractedPdfData {
  fileName: string;
  fileSize: number;
  numPages: number;
  wordCount: number;
  charCount: number;
  fullText: string;
  pageTexts: string[];
}

export interface ExtractionProgress {
  currentPage: number;
  totalPages: number;
  percent: number;
  status: string;
}

/**
 * Extracts readable text from a PDF File with progress updates
 */
export async function extractTextFromPdf(
  file: File,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<ExtractedPdfData> {
  // Validate file
  if (!file) {
    throw new Error('No file provided.');
  }

  const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
  if (!isPdf) {
    throw new Error('Invalid file format. Please upload a valid PDF document (.pdf).');
  }

  if (file.size === 0) {
    throw new Error('The uploaded file is completely empty (0 bytes).');
  }

  // Maximum file size check (500MB limit)
  const MAX_SIZE = 500 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('File size exceeds the 500MB limit. Please upload a PDF under 500MB.');
  }

  onProgress?.({
    currentPage: 0,
    totalPages: 0,
    percent: 5,
    status: 'Reading PDF data...',
  });

  const arrayBuffer = await file.arrayBuffer();

  // Validate PDF magic bytes (%PDF)
  const headerBytes = new Uint8Array(arrayBuffer.slice(0, 5));
  const headerStr = String.fromCharCode(...headerBytes);
  if (!headerStr.startsWith('%PDF')) {
    throw new Error('Invalid PDF signature. The file appears to be corrupted or not a valid PDF.');
  }

  onProgress?.({
    currentPage: 0,
    totalPages: 0,
    percent: 15,
    status: 'Parsing document structure...',
  });

  let loadingTask;
  try {
    loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
    });
  } catch (err: any) {
    throw new Error(`Failed to initialize PDF reader: ${err?.message || 'Unknown error'}`);
  }

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  if (numPages === 0) {
    throw new Error('The PDF contains 0 pages.');
  }

  const pageTexts: string[] = [];
  let totalTextLength = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Reconstruct lines with proper spacing
    const items = textContent.items as any[];
    let lastY: number | null = null;
    let pageStr = '';

    for (const item of items) {
      if (!item.str) continue;

      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
        pageStr += '\n' + item.str;
      } else {
        pageStr += (pageStr.endsWith(' ') || pageStr.length === 0 ? '' : ' ') + item.str;
      }
      lastY = item.transform[5];
    }

    const cleanedPageText = pageStr.trim();
    if (cleanedPageText) {
      pageTexts.push(cleanedPageText);
      totalTextLength += cleanedPageText.length;
    }

    const currentPercent = 15 + Math.round((pageNum / numPages) * 75);
    onProgress?.({
      currentPage: pageNum,
      totalPages: numPages,
      percent: currentPercent,
      status: `Extracting text: page ${pageNum} of ${numPages}...`,
    });
  }

  const fullText = pageTexts.join('\n\n--- Page Break ---\n\n').trim();

  // Validate readable text existence
  if (totalTextLength < 50) {
    throw new Error(
      'This PDF does not contain readable digital text. It may be a scanned document, image-only book, or protected without selectable text.'
    );
  }

  // Count words
  const words = fullText.split(/\s+/).filter(Boolean);

  onProgress?.({
    currentPage: numPages,
    totalPages: numPages,
    percent: 100,
    status: 'Text extraction complete!',
  });

  return {
    fileName: file.name,
    fileSize: file.size,
    numPages,
    wordCount: words.length,
    charCount: totalTextLength,
    fullText,
    pageTexts,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
