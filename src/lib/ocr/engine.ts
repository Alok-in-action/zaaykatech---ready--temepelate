import sharp from 'sharp';
import Tesseract from 'tesseract.js';
import { PDFParse } from 'pdf-parse';

export interface OCRExtractionResult {
  text: string;
  confidence: number;
  lines: Array<{ text: string; confidence: number }>;
  isScannedPdf?: boolean;
}

/**
 * Preprocesses an image buffer using Sharp for optimal OCR readability:
 * - Resize to max 2000px width (without enlargement)
 * - Convert to grayscale
 * - Normalize contrast
 * - Apply gentle sharpening
 */
export async function preprocessImageForOCR(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize({ width: 2000, withoutEnlargement: true })
      .grayscale()
      .normalize()
      .sharpen({ sigma: 1.2 })
      .png()
      .toBuffer();
  } catch (err) {
    console.warn('Sharp preprocessing error, using raw image buffer:', err);
    return buffer;
  }
}

/**
 * Extracts raw text and line-level confidence from an image using Tesseract.js.
 */
export async function extractTextFromImage(buffer: Buffer): Promise<OCRExtractionResult> {
  const processedBuffer = await preprocessImageForOCR(buffer);

  try {
    const { data } = await Tesseract.recognize(processedBuffer, 'eng');

    const lines: Array<{ text: string; confidence: number }> = [];
    const rawLines = (data as any)?.lines;
    if (rawLines && Array.isArray(rawLines)) {
      for (const line of rawLines) {
        const cleanLine = typeof line.text === 'string' ? line.text.trim() : '';
        if (cleanLine.length > 0) {
          lines.push({
            text: cleanLine,
            confidence: Math.max(0, Math.min(1, (line.confidence || 0) / 100)),
          });
        }
      }
    }

    const overallConfidence = Math.max(0, Math.min(1, (data.confidence || 0) / 100));

    return {
      text: data.text || '',
      confidence: overallConfidence,
      lines,
    };
  } catch (err: any) {
    console.error('Tesseract OCR error:', err);
    throw new Error(`OCR processing failed: ${err.message || 'Unable to scan document'}`);
  }
}

/**
 * Extracts text from a PDF buffer.
 * - First attempts fast, high-accuracy selectable text extraction via pdf-parse.
 * - If selectable text is empty or too short (scanned PDF), renders/extracts image and runs OCR.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<OCRExtractionResult> {
  let selectableText = '';
  let isScanned = false;

  try {
    const parser = new PDFParse({ data: buffer });
    const textOutput = await parser.getText();
    await parser.destroy();

    selectableText = typeof textOutput === 'string' ? textOutput : (textOutput as any)?.text || '';
  } catch (pdfErr) {
    console.warn('pdf-parse selectable text extraction failed or encrypted:', pdfErr);
  }

  // If selectable text contains sufficient content (e.g. > 40 alphanumeric characters)
  const alphanumericCount = (selectableText.match(/[a-zA-Z0-9]/g) || []).length;
  if (alphanumericCount > 40) {
    const lines = selectableText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map((text) => ({ text, confidence: 0.95 }));

    return {
      text: selectableText,
      confidence: 0.95,
      lines,
      isScannedPdf: false,
    };
  }

  // Otherwise, fallback: scanned PDF without selectable text layer
  isScanned = true;
  console.log('PDF contains minimal selectable text; falling back to OCR on rendered/embedded images...');

  try {
    const parser = new PDFParse({ data: buffer });
    const screenshot = (await parser.getScreenshot().catch(() => null)) as any;
    await parser.destroy();

    if (screenshot && (screenshot.data || screenshot.pages?.[0]?.data)) {
      const rawData = screenshot.data || screenshot.pages[0].data;
      const imgBuffer = Buffer.from(rawData);
      const ocrResult = await extractTextFromImage(imgBuffer);
      return {
        ...ocrResult,
        isScannedPdf: true,
      };
    }
  } catch (scannedErr) {
    console.warn('Scanned PDF screenshot extraction failed:', scannedErr);
  }

  // If text is still empty, return low-confidence fallback
  return {
    text: selectableText || '',
    confidence: selectableText.length > 10 ? 0.4 : 0.1,
    lines: [],
    isScannedPdf: isScanned,
  };
}
