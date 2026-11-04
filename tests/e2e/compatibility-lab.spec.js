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
  const diagram = output.locator('.mermaid > svg, .mermaid-diagram > svg').first();
  await expect(diagram).toBeVisible({ timeout: 30_000 });
  await expect(diagram.locator('math')).toHaveCount(2, { timeout: 30_000 });
  await expect(output).not.toContainText('Syntax error in text', { timeout: 10_000 });
});

test('Mermaid rich labels keep MathML while blocking active HTML', async ({ page }) => {
  await waitForApp(page);
  await page.evaluate(() => { window.__mermaidLabelXss = false; });
  await setMarkdown(page, [
    '# Mermaid label safety',
    '',
    '```mermaid',
    'flowchart TD',
    'A["$$x^2$$"] --> B["<img src=x onerror=window.__mermaidLabelXss=true>"]',
    '```'
  ].join('\n'));

  const diagram = page.locator('#output .mermaid > svg, #output .mermaid-diagram > svg').first();
  await expect(diagram).toBeVisible({ timeout: 30_000 });
  await expect(diagram.locator('math')).toHaveCount(1, { timeout: 30_000 });
  await expect(diagram.locator('script, iframe, [onerror], [onclick]')).toHaveCount(0);
  expect(await page.evaluate(() => window.__mermaidLabelXss)).toBe(false);
});
