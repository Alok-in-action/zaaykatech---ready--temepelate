import '@/lib/polyfills/dommatrix';
import os from 'node:os';

export interface OCRExtractionResult {
  text: string;
  confidence: number;
  lines: Array<{ text: string; confidence: number }>;
  isScannedPdf?: boolean;
}

/**
 * Executes a promise with a bounded timeout, rejecting with a user-friendly error.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(
        new Error(
          `${operationName} timed out after ${Math.round(timeoutMs / 1000)} seconds. Please upload a smaller file or paste your menu text directly.`
        )
      );
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
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
    const sharpModule = await import('sharp');
    const sharp = sharpModule.default || sharpModule;

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
 * Creates and initializes a Tesseract worker with cachePath configured to os.tmpdir().
 * This prevents EROFS (Read-only file system) errors on Vercel and serverless platforms.
 */
export async function createOCRWorker(logger?: (m: any) => void) {
  const tesseractModule = await import('tesseract.js');
  const { createWorker } = tesseractModule.default || tesseractModule;

  const options: Record<string, any> = {
    cachePath: os.tmpdir(),
  };
  if (typeof logger === 'function') {
    options.logger = logger;
  }

  return await createWorker('eng', 1, options);
}

/**
 * Extracts raw text and line-level confidence from an image using Tesseract.js.
 * Can optionally accept an existing worker to reuse across multiple pages/images.
 */
export async function extractTextFromImage(
  buffer: Buffer,
  existingWorker?: any,
  options: { timeoutMs?: number } = {}
): Promise<OCRExtractionResult> {
  const timeoutMs = options.timeoutMs || 35000;
  const processedBuffer = await preprocessImageForOCR(buffer);

  let worker = existingWorker;
  const shouldTerminate = !existingWorker;

  const runOCR = async (): Promise<OCRExtractionResult> => {
    try {
      if (!worker) {
        worker = await createOCRWorker();
      }

      const { data } = await worker.recognize(processedBuffer);
      const overallConfidence = Math.max(0, Math.min(1, (data.confidence || 0) / 100));

      const rawText = data.text || '';
      const lines: Array<{ text: string; confidence: number }> = rawText
        .split(/\r?\n/)
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0)
        .map((text: string) => ({
          text,
          confidence: overallConfidence,
        }));

      return {
        text: rawText,
        confidence: overallConfidence,
        lines,
      };
    } finally {
      if (shouldTerminate && worker) {
        await worker.terminate().catch((err: any) => {
          console.warn('Error terminating OCR worker:', err);
        });
      }
    }
  };

  return withTimeout(runOCR(), timeoutMs, 'Image OCR');
}

/**
 * Extracts text from a PDF buffer using a smart hybrid per-page strategy:
 * 1. Inspects each page's selectable text layer via pdf-parse.
 * 2. If a page has usable selectable text (>= 30 alphanumeric characters), extracts it directly without OCR.
 * 3. If a page is scanned / lacks selectable text, extracts its screenshot and OCRs it.
 * 4. Reuses a single Tesseract worker across all scanned pages within the job.
 * 5. Guarantees worker and parser termination in finally block, bounded by execution timeout.
 */
export async function extractTextFromPdf(
  buffer: Buffer,
  options: { timeoutMs?: number } = {}
): Promise<OCRExtractionResult> {
  const timeoutMs = options.timeoutMs || 45000;

  const runPdfExtraction = async (): Promise<OCRExtractionResult> => {
    let parser: any = null;
    let worker: any = null;

    try {
      const pdfParseModule = (await import('pdf-parse')) as any;
      const PDFParse =
        pdfParseModule.PDFParse ||
        pdfParseModule.default?.PDFParse ||
        pdfParseModule.default ||
        pdfParseModule;

      parser = new PDFParse({ data: buffer });
      const textOutput = await parser.getText();
      const rawPages = textOutput?.pages || [];
      const totalPages = rawPages.length || (textOutput?.total ?? 1);

      const pageResults: Array<{ text: string; confidence: number; isOcr: boolean }> = [];
      let scannedPagesCount = 0;
      let cachedScreenshot: any = null;

      for (let i = 0; i < totalPages; i++) {
        const pageTextObj = rawPages[i];
        const pageText = typeof pageTextObj?.text === 'string' ? pageTextObj.text.trim() : '';
        const alphaCount = (pageText.match(/[a-zA-Z0-9]/g) || []).length;

        // Check if page has sufficient digital/selectable text
        if (alphaCount >= 30) {
          pageResults.push({
            text: pageText,
            confidence: 0.95,
            isOcr: false,
          });
        } else {
          // Scanned page: needs screenshot and OCR
          scannedPagesCount++;

          if (!cachedScreenshot) {
            cachedScreenshot = await parser.getScreenshot().catch((err: any) => {
              console.warn('Failed to capture PDF screenshot:', err);
              return null;
            });
          }

          const pageScreenshotData =
            cachedScreenshot?.pages?.[i]?.data ||
            (i === 0 ? cachedScreenshot?.data : null);

          if (pageScreenshotData) {
            // Lazy-initialize single reusable OCR worker
            if (!worker) {
              worker = await createOCRWorker();
            }

            const imgBuffer = Buffer.from(pageScreenshotData);
            const ocrRes = await extractTextFromImage(imgBuffer, worker, {
              timeoutMs: 25000,
            });

            pageResults.push({
              text: ocrRes.text,
              confidence: ocrRes.confidence,
              isOcr: true,
            });
          } else {
            // Fallback: minimal text available
            pageResults.push({
              text: pageText,
              confidence: 0.2,
              isOcr: false,
            });
          }
        }
      }

      const combinedText = pageResults.map((p) => p.text).filter(Boolean).join('\n\n');
      const avgConfidence =
        pageResults.length > 0
          ? pageResults.reduce((acc, p) => acc + p.confidence, 0) / pageResults.length
          : 0.1;

      const lines = combinedText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .map((text) => ({ text, confidence: avgConfidence }));

      return {
        text: combinedText,
        confidence: avgConfidence,
        lines,
        isScannedPdf: scannedPagesCount > 0,
      };
    } finally {
      if (worker) {
        await worker.terminate().catch((err: any) => {
          console.warn('Error terminating OCR worker from PDF extraction:', err);
        });
      }
      if (parser && typeof parser.destroy === 'function') {
        await parser.destroy().catch((err: any) => {
          console.warn('Error destroying PDF parser:', err);
        });
      }
    }
  };

  return withTimeout(runPdfExtraction(), timeoutMs, 'PDF extraction');
}
