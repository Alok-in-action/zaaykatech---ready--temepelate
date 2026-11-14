import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import '@/lib/polyfills/dommatrix';
import {
  extractTextFromImage,
  extractTextFromPdf,
  createOCRWorker,
  preprocessImageForOCR,
} from '../src/lib/ocr/engine';
import { parseMenuText } from '../src/lib/ocr/parser';
import { AIMenuExtractionOutputSchema } from '../src/validations/ai';

async function runTests() {
  console.log('🚀 Running OCR Pipeline Benchmark & Lifecycle Tests...\n');

  // Test 1: Selectable PDF (menu-text.pdf) - MUST use fast text extraction without OCR
  console.log('1. Testing Selectable PDF (menu-text.pdf) - Fast text extraction...');
  const textPdfPath = path.join(process.cwd(), 'tests/fixtures/menu-text.pdf');
  const textPdfBuffer = fs.readFileSync(textPdfPath);

  const t0 = performance.now();
  const textPdfResult = await extractTextFromPdf(textPdfBuffer);
  const textPdfDuration = performance.now() - t0;

  console.log(`   - Execution duration: ${textPdfDuration.toFixed(2)} ms`);
  console.log(`   - Confidence: ${textPdfResult.confidence}`);
  console.log(`   - Scanned PDF flag: ${textPdfResult.isScannedPdf}`);

  assert.strictEqual(textPdfResult.isScannedPdf, false, 'Text PDF must not be flagged as scanned');
  assert.strictEqual(textPdfResult.confidence, 0.95, 'Selectable text should have 0.95 confidence');
  assert.ok(textPdfResult.text.includes('Espresso') && textPdfResult.text.includes('Cappuccino'));

  const parsedTextPdf = parseMenuText(textPdfResult.text, 'pdf', textPdfResult.confidence);
  const validatedTextPdf = AIMenuExtractionOutputSchema.safeParse(parsedTextPdf);
  assert.strictEqual(validatedTextPdf.success, true, 'Parsed text PDF output must validate with Zod');
  const totalItemsTextPdf = parsedTextPdf.categories.reduce((acc, c) => acc + c.items.length, 0);
  assert.ok(totalItemsTextPdf >= 3, `Expected at least 3 items, got ${totalItemsTextPdf}`);
  console.log(`   ✔ Extracted ${totalItemsTextPdf} items in ${textPdfDuration.toFixed(2)} ms without OCR.\n`);

  // Test 2: Scanned PDF (menu-scanned.pdf) - Hybrid fallback triggers OCR
  console.log('2. Testing Scanned PDF (menu-scanned.pdf) - OCR fallback...');
  const scannedPdfPath = path.join(process.cwd(), 'tests/fixtures/menu-scanned.pdf');
  const scannedPdfBuffer = fs.readFileSync(scannedPdfPath);

  const t1 = performance.now();
  const scannedPdfResult = await extractTextFromPdf(scannedPdfBuffer);
  const scannedPdfDuration = performance.now() - t1;

  console.log(`   - Execution duration: ${scannedPdfDuration.toFixed(2)} ms`);
  console.log(`   - Confidence: ${scannedPdfResult.confidence.toFixed(2)}`);
  console.log(`   - Scanned PDF flag: ${scannedPdfResult.isScannedPdf}`);

  assert.strictEqual(scannedPdfResult.isScannedPdf, true, 'Scanned PDF must be flagged as isScannedPdf');
  assert.ok(scannedPdfResult.text.includes('STARTERS') || scannedPdfResult.text.includes('Paneer') || scannedPdfResult.text.includes('280'));

  const parsedScannedPdf = parseMenuText(scannedPdfResult.text, 'pdf', scannedPdfResult.confidence);
  const validatedScannedPdf = AIMenuExtractionOutputSchema.safeParse(parsedScannedPdf);
  assert.strictEqual(validatedScannedPdf.success, true, 'Parsed scanned PDF output must validate with Zod');
  const totalItemsScanned = parsedScannedPdf.categories.reduce((acc, c) => acc + c.items.length, 0);
  assert.ok(totalItemsScanned >= 2, `Expected at least 2 items, got ${totalItemsScanned}`);
  console.log(`   ✔ Extracted ${totalItemsScanned} items in ${scannedPdfDuration.toFixed(2)} ms via page OCR.\n`);

  // Test 3: Standard JPG Image (menu.jpg) - Sharp preprocessing + OCR
  console.log('3. Testing Menu Image (menu.jpg)...');
  const jpgPath = path.join(process.cwd(), 'tests/fixtures/menu.jpg');
  const jpgBuffer = fs.readFileSync(jpgPath);

  const t2 = performance.now();
  const jpgResult = await extractTextFromImage(jpgBuffer);
  const jpgDuration = performance.now() - t2;

  console.log(`   - Execution duration: ${jpgDuration.toFixed(2)} ms`);
  console.log(`   - Confidence: ${jpgResult.confidence.toFixed(2)}`);

  assert.ok(jpgResult.text.includes('STARTERS') || jpgResult.text.includes('Paneer') || jpgResult.text.includes('280'));
  const parsedJpg = parseMenuText(jpgResult.text, 'image', jpgResult.confidence);
  const totalItemsJpg = parsedJpg.categories.reduce((acc, c) => acc + c.items.length, 0);
  assert.ok(totalItemsJpg >= 2, `Expected at least 2 items from JPG, got ${totalItemsJpg}`);
  console.log(`   ✔ Extracted ${totalItemsJpg} items in ${jpgDuration.toFixed(2)} ms from JPG.\n`);

  // Test 4: Single Worker Reuse across multiple pages/documents
  console.log('4. Testing OCR Worker Reuse (single worker across multiple recognitions)...');
  const t3 = performance.now();
  const worker = await createOCRWorker();
  try {
    const p1 = await extractTextFromImage(jpgBuffer, worker);
    const p2 = await extractTextFromImage(jpgBuffer, worker);
    assert.ok(p1.text.length > 0 && p2.text.length > 0);
    console.log(`   ✔ Successfully reused single Tesseract worker across multiple passes in ${(performance.now() - t3).toFixed(2)} ms.`);
  } finally {
    await worker.terminate();
    console.log('   ✔ Worker terminated cleanly.\n');
  }

  // Test 5: Bounded execution timeout & clear retryable error
  console.log('5. Testing Bounded Timeout & Clean Error Handling...');
  let timeoutCaught = false;
  try {
    // Pass ultra-short timeout to trigger bounded rejection
    await extractTextFromImage(jpgBuffer, undefined, { timeoutMs: 1 });
  } catch (err: any) {
    timeoutCaught = true;
    assert.ok(err.message.includes('timed out'), `Expected timeout error message, got: ${err.message}`);
    console.log(`   ✔ Bounded execution error caught: "${err.message}"`);
  }
  assert.strictEqual(timeoutCaught, true, 'Ultra-short timeout must reject cleanly');

  // Test 6: Uncertain prices preserved for review (₹0 flag, low confidence)
  console.log('6. Testing Uncertain Prices Preserved for Review...');
  const menuWithUncertainPrice = `
Starters:
Paneer Tikka - Charcoal grilled - ₹280
Special Seasonal Chaat
`;
  const parsedUncertain = parseMenuText(menuWithUncertainPrice, 'text', 0.95);
  const starterCat = parsedUncertain.categories[0];
  const unpricedItem = starterCat.items.find((i) => i.name.includes('Special Seasonal Chaat'));

  assert.ok(unpricedItem, 'Unpriced item must be detected');
  assert.strictEqual(unpricedItem.pricePaise, 0, 'Uncertain price must default to 0 paise');
  assert.ok(unpricedItem.confidence < 0.8, 'Unpriced item must have lower confidence');
  console.log(`   ✔ Item "${unpricedItem.name}" flagged with price ₹0 and confidence ${unpricedItem.confidence.toFixed(2)} for review.\n`);

  console.log('🎉 ALL OCR PIPELINE BENCHMARK TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('❌ Benchmark test failed:', err);
  process.exit(1);
});
