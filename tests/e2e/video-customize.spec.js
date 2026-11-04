import { test, expect } from '@playwright/test';

const THREE = [
  'https://example.com/a.mp4',
  'https://example.com/b.mp4',
  'https://example.com/c.mp4',
].join(' ');

test('video customize writes attrs to one sibling only and avoids preview blink', async ({ page }) => {
  await page.goto('/');

  await page.waitForFunction(() => typeof window.editor?.setValue === 'function');
  await page.getByRole('button', { name: 'Split view' }).click();

  await page.evaluate((md) => {
    window.editor.setValue(md);
  }, `## Videos test\n\n${THREE}\n`);

  await page.waitForTimeout(900);

  await page.evaluate(() => {
    const output = document.querySelector('#output');
    output.appendChild(Object.assign(document.createElement('span'), { id: 'g5-blink-marker' }));

    const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    window.__g5ConvertBlink = 0;
    Object.defineProperty(output, 'innerHTML', {
      set(v) {
        window.__g5ConvertBlink += 1;
        return desc.set.call(this, v);
      },
      get() {
        return desc.get.call(this);
      },
    });
  });

  const target = page.locator('#output .preview-video[data-video-url]').nth(1);
  await expect(page.locator('#output .preview-video[data-video-url]')).toHaveCount(3);
  await target.click({ force: true });
  await page.getByRole('button', { name: 'Set video width to 50 percent' }).click();
  await page.getByRole('button', { name: 'Align video right' }).click();
  await page.waitForTimeout(200);

  const result = await page.evaluate(() => {
    const text = window.editor.getValue();
    return {
      ok: (text.match(/\{video/g) || []).length === 1 && !!document.getElementById('g5-blink-marker') && window.__g5ConvertBlink === 0,
      videoBlocks: (text.match(/\{video/g) || []).length,
      convertBlink: window.__g5ConvertBlink,
      markerSurvived: !!document.getElementById('g5-blink-marker'),
      text,
    };
  });

  expect(result.videoBlocks).toBe(1);
  expect(result.convertBlink).toBe(0);
  expect(result.markerSurvived).toBe(true);
  expect(result.text).toContain('b.mp4 {video width=50% align=right}');
  expect(result.text).not.toMatch(/a\.mp4 \{video/);
  expect(result.text).not.toMatch(/c\.mp4 \{video/);
});
