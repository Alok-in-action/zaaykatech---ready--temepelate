#!/usr/bin/env node
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROUTES = [
  { name: 'Marketing Homepage', path: '/' },
  { name: 'Pricing Page', path: '/pricing' },
  { name: 'Public Restaurant Menu', path: '/r/demo' },
];

const BASE_URL = process.env.AUDIT_BASE_URL || 'http://localhost:3000';
const OUT_DIR = process.env.AUDIT_OUT_DIR || path.join(process.cwd(), 'lighthouse-reports');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

console.log('====================================================');
console.log('⚡ ZaaykaTech Automated Lighthouse Audit Runner');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Output Directory: ${OUT_DIR}`);
console.log('====================================================\n');

const results = [];

for (const route of ROUTES) {
  for (const preset of ['mobile', 'desktop']) {
    const targetUrl = `${BASE_URL}${route.path}`;
    const safeName = `${route.name.toLowerCase().replace(/\s+/g, '-')}-${preset}`;
    const outputPath = path.join(OUT_DIR, `${safeName}.json`);

    console.log(`Running audit: ${route.name} (${preset}) -> ${targetUrl}...`);

    const args = [
      'lighthouse',
      targetUrl,
      '--no-enable-error-reporting',
      '--chrome-flags="--headless --no-sandbox"',
      '--output=json',
      `--output-path=${outputPath}`,
    ];

    if (preset === 'desktop') {
      args.push('--preset=desktop');
    }

    const run = spawnSync('npx', args, {
      shell: true,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 120000,
    });

    if (!fs.existsSync(outputPath)) {
      console.error(`Audit failed for ${route.name} (${preset}): ${run.stderr || 'No output generated'}`);
      continue;
    }

    try {
      const data = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      const cats = data.categories || {};
      const audits = data.audits || {};

      const perf = Math.round((cats.performance?.score || 0) * 100);
      const a11y = Math.round((cats.accessibility?.score || 0) * 100);
      const bp = Math.round((cats['best-practices']?.score || 0) * 100);
      const seo = Math.round((cats.seo?.score || 0) * 100);

      const lcp = audits['largest-contentful-paint']?.displayValue || 'N/A';
      const cls = audits['cumulative-layout-shift']?.displayValue || 'N/A';
      const tbt = audits['total-blocking-time']?.displayValue || 'N/A';

      // Collect top opportunities
      const opportunities = [];
      const oppKeys = [
        'render-blocking-resources',
        'modern-image-formats',
        'offscreen-images',
        'uses-optimized-images',
        'unused-javascript',
        'unused-css-rules',
      ];
      for (const k of oppKeys) {
        if (audits[k] && audits[k].score !== null && audits[k].score < 0.9 && audits[k].displayValue) {
          opportunities.push(`${audits[k].title}: ${audits[k].displayValue}`);
        }
      }

      results.push({
        route: route.name,
        path: route.path,
        preset,
        perf,
        a11y,
        bp,
        seo,
        lcp,
        cls,
        tbt,
        opportunities,
      });

      console.log(`✓ Completed ${route.name} (${preset}): Perf=${perf}, A11y=${a11y}, BP=${bp}, SEO=${seo}, LCP=${lcp}, CLS=${cls}, TBT=${tbt}\n`);
    } catch (parseErr) {
      console.error(`Failed parsing audit for ${route.name} (${preset}):`, parseErr);
    }
  }
}

// Summary Report
console.log('\n====================================================');
console.log('📊 LIGHTHOUSE AUDIT RESULTS SUMMARY');
console.log('====================================================\n');
console.table(
  results.map((r) => ({
    Route: r.route,
    Device: r.preset,
    'Perf (%)': r.perf,
    'A11y (%)': r.a11y,
    'BP (%)': r.bp,
    'SEO (%)': r.seo,
    LCP: r.lcp,
    CLS: r.cls,
    TBT: r.tbt,
  }))
);

const summaryPath = path.join(OUT_DIR, 'summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
console.log(`\nDetailed summary saved to: ${summaryPath}`);

if (process.env.STRICT_QUALITY_GATE === 'true') {
  const hasFailingPerf = results.some((r) => r.perf < 50);
  if (hasFailingPerf) {
    console.error('Strict quality gate failed: One or more routes scored below 50% performance.');
    process.exit(1);
  }
}

process.exit(0);
