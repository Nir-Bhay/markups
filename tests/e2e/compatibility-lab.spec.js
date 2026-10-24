import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { waitForApp, setMarkdown } from './helpers.js';

const fixture = readFileSync(resolve('public/qa/markdown-compatibility-fixture.md'), 'utf8');

test('Compatibility fixture renders HTML table, math and Mermaid flowchart in the actual editor', async ({ page }) => {
  await waitForApp(page);
  await setMarkdown(page, fixture);
  const output = page.locator('#output');
  await expect(output.locator('h1')).toContainText('Markdown compatibility fixture');
  await expect(output.locator('table')).toHaveCount(1);
  await expect(output.locator('pre code').first()).toBeVisible();
  await expect(output.locator('.katex').first()).toBeVisible({ timeout: 25_000 });
  await expect(output.locator('.mermaid svg').first()).toBeVisible({ timeout: 30_000 });
  await expect(output).not.toContainText('Syntax error in text', { timeout: 10_000 });
});

test('Compatibility Lab has no horizontal overflow on narrow viewports', async ({ page }) => {
  for (const width of [320, 375, 390, 768]) {
    await page.setViewportSize({ width, height: 812 });
    await page.goto('/seo/compatibility-lab');
    await expect(page.getByRole('heading', { name: 'Markdown Compatibility Lab' })).toBeVisible();
    const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    expect(size.viewport, JSON.stringify(size)).toBe(width);
    expect(size.scroll, JSON.stringify(size)).toBeLessThanOrEqual(width + 2);
    expect(size.body, JSON.stringify(size)).toBeLessThanOrEqual(width + 2);
  }
});

test('Mermaid remains rendered after leaving and reopening an editor tab', async ({ page }) => {
  test.setTimeout(90_000);
  await waitForApp(page);
  const markdown = [
    '# Persisted flowchart QA',
    '',
    '```mermaid',
    'flowchart LR',
    '  A[Write] --> B[Preview]',
    '  B --> C[Export]',
    '```',
    ''
  ].join('\n');
  await setMarkdown(page, markdown);
  const diagram = page.locator('#output .mermaid svg').first();
  await expect(diagram).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => diagram.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(40);
  await page.waitForTimeout(1800);
  await page.goto('/landing');
  await page.goto('/');
  await waitForApp(page);
  await expect(page.locator('#output')).toContainText('Persisted flowchart QA', { timeout: 30_000 });
  const restored = page.locator('#output .mermaid svg').first();
  await expect(restored).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => restored.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(40);
});
