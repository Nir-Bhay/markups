import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { waitForApp, setMarkdown } from './helpers.js';

const markdown = '# Export smoke test\n\nA small **document** with one table.\n\n| A | B |\n|---|---|\n| 1 | 2 |\n';

async function openFormat(page, format) {
  await waitForApp(page);
  await setMarkdown(page, markdown);
  await expect(page.locator('#output')).toContainText('Export smoke test');
  await page.locator('#export-btn').click();
  await expect(page.locator('#export-modal')).toHaveClass(/active/);
  await page.locator('.export-format-btn[data-format="' + format + '"]').click();
}

test('PDF export downloads a nonempty file with a valid PDF signature', async ({ page }, testInfo) => {
  test.setTimeout(120_000); // PDF is rasterized asynchronously in the browser.
  await openFormat(page, 'pdf');
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 100_000 }),
    page.locator('#export-confirm-btn').click()
  ]);
  expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  const error = await download.failure();
  expect(error).toBeNull();
  const path = await download.path();
  await download.saveAs(testInfo.outputPath('export-smoke.pdf'));
  const bytes = readFileSync(path);
  expect(bytes.length).toBeGreaterThan(1000);
  expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  // File validity does not prove text selection, annotations or every page's layout.
});

test('Word export is HTML wrapped as .doc and is not mislabeled native DOCX', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await openFormat(page, 'docx');
  await expect(page.locator('.export-format-btn[data-format="docx"] .btn-text')).toHaveText('Word (.doc)');
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 40_000 }),
    page.locator('#export-confirm-btn').click()
  ]);
  expect(download.suggestedFilename()).toMatch(/\.doc$/i);
  expect(await download.failure()).toBeNull();
  const bytes = readFileSync(await download.path());
  await download.saveAs(testInfo.outputPath('export-smoke.doc'));
  expect(bytes.length).toBeGreaterThan(500);
  const html = bytes.toString('utf8');
  expect(html).toMatch(/^<!DOCTYPE html>/i);
  expect(html).toContain('Export smoke test');
  expect(bytes.subarray(0, 2).toString('latin1')).not.toBe('PK'); // DOCX is ZIP/OOXML.
});

test('a multipage document with math and a diagram exports without capture errors', async ({ page }, testInfo) => {
  test.setTimeout(120000);
  await waitForApp(page);
  const paragraphs = Array.from({ length: 48 }, (_, index) => `## Section ${index + 1}\n\nA reproducible paragraph for pagination. Keep the source readable and verify the delivered document, including the final section.\n`).join('\n');
  await setMarkdown(page, '# Multipage export review\n\n$$E = mc^2$$\n\n```mermaid\nflowchart LR\n A[Draft] --> B[Review]\n```\n\n' + paragraphs + '\nFINAL EXPORT MARKER');
  await expect(page.locator('#output .mermaid svg')).toBeVisible();
  await expect(page.locator('#output .katex').first()).toBeVisible();
  await page.evaluate(() => {
    window.__exportDiagramSize = null;
    const observer = new MutationObserver(() => {
      const image = document.querySelector('[data-export-raster="mermaid"][data-loaded="true"]');
      if (image) {
        const rect = image.getBoundingClientRect();
        window.__exportDiagramSize = { width: rect.width, height: rect.height };
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
  await page.locator('#export-btn').click();
  await page.locator('.export-format-btn[data-format="pdf"]').click();
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: 100000 }), page.locator('#export-confirm-btn').click()]);
  expect(await download.failure()).toBeNull();
  const diagram = await page.evaluate(() => window.__exportDiagramSize);
  expect(diagram?.width).toBeGreaterThan(200);
  expect(diagram?.height).toBeGreaterThan(20);
  await download.saveAs(testInfo.outputPath('export-multipage.pdf'));
  expect(readFileSync(await download.path()).subarray(0, 5).toString()).toBe('%PDF-');
});
