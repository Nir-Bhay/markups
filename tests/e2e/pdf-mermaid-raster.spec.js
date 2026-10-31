import { test, expect } from '@playwright/test';
import { waitForApp, setMarkdown } from './helpers.js';

// Regression: the generated HTMLImageElement must contain visible pixels and
// finish decoding before PDF page capture. This checks the actual rasterized
// Mermaid image, not merely the existence of a valid downloaded PDF.
test('Mermaid PDF workbench converts a visible diagram to decoded nonblank PNG', async ({ page }) => {
  test.setTimeout(90_000);
  await waitForApp(page);
  await setMarkdown(page, [
    '# Canvas diagram export QA',
    '',
    '```mermaid',
    'flowchart LR',
    '  A[Draft] --> B[Render]',
    '  B --> C[Export]',
    '```',
    ''
  ].join('\n'));
  await expect(page.locator('#output .mermaid svg').first()).toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => page.locator('#output .mermaid svg').first().evaluate(
    el => el.getBoundingClientRect().width
  )).toBeGreaterThan(150);
  // Mermaid may place an initial SVG container into the DOM before populating
  // its renderable viewBox/paths; wait for the actual final SVG, not its shell.
  await expect.poll(async () => page.locator('#output .mermaid svg').first().evaluate(
    el => Boolean(el.getAttribute('viewBox')) && el.querySelectorAll('g').length > 0
  ), { timeout: 30_000 }).toBe(true);

  const result = await page.evaluate(async () => {
    const { createExportWorkbench, convertMermaidSvgsToImages, destroyExportWorkbench } =
      await import('/src/services/export/pdfPrep.js');
    const source = document.querySelector('#output');
    const workbench = createExportWorkbench(source, { widthCss: '7.5in' });
    try {
      const originalSvg = workbench.querySelector('.mermaid svg');
      const original = {
        width: originalSvg?.getAttribute('width'),
        height: originalSvg?.getAttribute('height'),
        viewBox: originalSvg?.getAttribute('viewBox')
      };
      const stats = await convertMermaidSvgsToImages(workbench);
      const img = workbench.querySelector('img[data-export-raster="mermaid"]');
      if (!img) return { ...stats, original, error: 'No raster output' };
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let visiblePixels = 0;
      let darkPixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 48) visiblePixels++;
        if (data[i + 3] > 48 && Math.min(data[i], data[i + 1], data[i + 2]) < 180) darkPixels++;
      }
      return {
        ...stats, original, rasterWidth: canvas.width, rasterHeight: canvas.height,
        visiblePixels, darkPixels
      };
    } finally {
      destroyExportWorkbench(workbench);
    }
  });
  console.log('MERMAID_RASTER_QA:', JSON.stringify(result));
  expect(result.total, JSON.stringify(result)).toBe(1);
  expect(result.converted, JSON.stringify(result)).toBe(1);
  expect(result.rasterWidth, JSON.stringify(result)).toBeGreaterThan(250);
  expect(result.darkPixels, JSON.stringify(result)).toBeGreaterThan(200);
});
