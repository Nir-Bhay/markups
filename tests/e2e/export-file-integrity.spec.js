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

test('PDF export downloads a nonempty file with a valid PDF signature', async ({ page }) => {
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
  const bytes = readFileSync(path);
  expect(bytes.length).toBeGreaterThan(1000);
  expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  // File validity does not prove text selection, annotations or every page's layout.
});

test('Word export is HTML wrapped as .doc and is not mislabeled native DOCX', async ({ page }) => {
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
  expect(bytes.length).toBeGreaterThan(500);
  const html = bytes.toString('utf8');
  expect(html).toMatch(/^<!DOCTYPE html>/i);
  expect(html).toContain('Export smoke test');
  expect(bytes.subarray(0, 2).toString('latin1')).not.toBe('PK'); // DOCX is ZIP/OOXML.
});

test('Word-compatible .doc preserves structured fraction MathML without browser-only KaTeX spans', async ({ page }) => {
  test.setTimeout(60_000);
  await waitForApp(page);
  const source = ['# Math QA', '', '$$', String.raw`\frac{a}{b}=c`, '$$', ''].join('\n');
  await setMarkdown(page, source);
  await expect(page.locator('#output .katex').first()).toBeVisible({ timeout: 30_000 });
  await page.locator('#export-btn').click();
  await page.locator('.export-format-btn[data-format="docx"]').click();
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 40_000 }),
    page.locator('#export-confirm-btn').click()
  ]);
  const html = readFileSync(await download.path(), 'utf8');
  expect(html).toMatch(/<math[\s>]/i);
  expect(html).not.toContain('class="katex-html"');
});
