export interface ExtractedFileResult {
  text: string;
  filename: string;
  pages: number;
  chars: number;
  sourceType: 'pdf' | 'text' | 'markdown' | 'document';
}

/**
 * Universal file text extractor supporting PDFs (client-side PDF.js + server fallback),
 * Markdown, plain text, and clinical note documents.
 */
export async function extractTextFromFile(
  file: File,
  onProgress?: (status: string) => void
): Promise<ExtractedFileResult> {
  const filename = file.name || 'study_document';
  const lowerName = filename.toLowerCase();

  if (lowerName.endsWith('.pdf')) {
    onProgress?.(`Reading PDF: ${filename}...`);

    // 1. Client-side PDF.js extraction
    const pdfjs = typeof window !== 'undefined' ? (window as any).pdfjsLib : null;
    if (pdfjs) {
      try {
        onProgress?.('Initializing high-speed PDF reader...');
        pdfjs.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;
        const totalPages = pdfDoc.numPages;
        const extractedPages: string[] = [];

        for (let i = 1; i <= totalPages; i++) {
          onProgress?.(`Extracting page ${i} of ${totalPages}...`);
          const page = await pdfDoc.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str || '');
          const pageText = strings.join(' ').trim();
          if (pageText) {
            extractedPages.push(`--- PAGE ${i} ---\n${pageText}`);
          }
        }

        const fullExtracted = extractedPages.join('\n\n').trim();
        if (fullExtracted.length > 20) {
          return {
            text: fullExtracted,
            filename,
            pages: totalPages,
            chars: fullExtracted.length,
            sourceType: 'pdf',
          };
        }
      } catch (clientErr) {
        console.warn('Client-side PDF.js failed, trying backend extraction endpoint:', clientErr);
      }
    }

    // 2. Server-side PDF extraction fallback
    onProgress?.('Extracting text via clinical document server...');
    const reader = new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = () => reject(new Error('Failed to read PDF into memory.'));
      fr.readAsDataURL(file);
    });

    const base64Data = await reader;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    try {
      const res = await fetch('/api/pdf/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, filename }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server extraction failed.');
      }
      return {
        text: data.text || '',
        filename,
        pages: data.pageCount || data.pages || 1,
        chars: data.charCount || data.characters || (data.text ? data.text.length : 0),
        sourceType: 'pdf',
      };
    } catch (serverErr: any) {
      clearTimeout(timeoutId);
      if (serverErr.name === 'AbortError') {
        throw new Error('PDF extraction timed out after 9s. Please try pasting the notes directly.');
      }
      throw serverErr;
    }
  }

  // Plain text / Markdown / Source notes
  onProgress?.(`Reading text notes: ${filename}...`);
  try {
    const raw = await file.text();
    const cleaned = raw.replace(/\r\n/g, '\n').trim();
    const isMd = lowerName.endsWith('.md') || lowerName.endsWith('.markdown');

    return {
      text: cleaned,
      filename,
      pages: Math.max(1, Math.ceil(cleaned.length / 2800)),
      chars: cleaned.length,
      sourceType: isMd ? 'markdown' : 'text',
    };
  } catch (err: any) {
    throw new Error(`Failed to read file ${filename}: ${err?.message || 'Unknown format'}`);
  }
}

/**
 * Validates whether the text has sufficient clinical substance for MCQ generation
 */
export function validateMaterialForMCQs(text: string): { valid: boolean; wordCount: number; message?: string } {
  if (!text || !text.trim()) {
    return { valid: false, wordCount: 0, message: 'Please provide or upload study notes.' };
  }
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 15) {
    return {
      valid: false,
      wordCount: words.length,
      message: 'Study notes are too short. Please provide at least 15-20 words for meaningful question generation.',
    };
  }
  return { valid: true, wordCount: words.length };
}
