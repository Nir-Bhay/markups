import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

// Regression captures for the rebuilt public landing page on realistic widths.
// Screenshots are evidence/artifacts, not visual-appearance approval.
for (const width of [320, 390, 768, 1440]) {
  test('landing responsive layout at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto('/landing');
    expect(response?.status()).toBe(200);
    await expect(page.locator('.hero h1')).toBeVisible();
    await expect(page.locator('.editor-frame')).toBeVisible();
    await expect(page.locator('#faq h2')).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }));
    expect(dimensions.scrollWidth, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.viewport + 2);
    expect(dimensions.bodyWidth, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.viewport + 2);

    mkdirSync('test-results/landing-screenshots', { recursive: true });
    await page.screenshot({ path: 'test-results/landing-screenshots/landing-' + width + '.png', fullPage: true });
  });
}

test('landing metadata and resource destinations resolve on local app server', async ({ page, request }) => {
  await page.goto('/landing');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://markups.dev/landing');
  const jsonld = await page.locator('script[type="application/ld+json"]').textContent();
  const graph = JSON.parse(jsonld)['@graph'];
  expect(graph.some((item) => item['@type'] === 'WebApplication')).toBe(true);
  for (const link of ['/seo/online-markdown-editor', '/seo/examples/mermaid', '/seo/examples/math', '/privacy-policy']) {
    const response = await request.get(link);
    expect(response.status(), link).toBe(200);
  }
});
