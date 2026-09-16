import { test, expect } from '@playwright/test';

const THREE = [
  '![Simple image](https://images.unsplash.com/photo-1?w=1200)',
  '![Image with long alternate text that should wrap carefully](https://images.unsplash.com/photo-2?w=1600)',
  '[![Linked image](https://images.unsplash.com/photo-3?w=1200)](https://example.com)',
].join(' ');

test('image resize writes data-ir to one sibling only and avoids preview blink', async ({ page }) => {
  await page.goto('/');

  await page.waitForFunction(() => !!window.editor);
  await page.evaluate(async () => {
    const mod = await import('/src/features/image-resize/index.js');
    const manager = mod.getImageResizeManager();
    manager.destroy?.();
    manager.initialize({
      editor: window.editor,
      onMarkdownChange: (markdown) => {
        const model = window.editor.getModel();
        window.editor.executeEdits('image-resize-test', [{
          range: model.getFullModelRange(),
          text: markdown,
          forceMoveMarkers: true,
        }]);
      },
    });
  });

  await page.getByRole('button', { name: 'Split view' }).click();

  await page.evaluate((md) => {
    window.editor.setValue(md);
  }, `## Images test\n\n${THREE}\n`);

  await page.waitForTimeout(900);

  const result = await page.evaluate(async () => {
    const output = document.querySelector('#output');
    const marker = document.createElement('span');
    marker.id = 'g4-blink-marker';
    output.appendChild(marker);

    const imgs = [...output.querySelectorAll('img')].filter((i) => !i.closest('.preview-video'));
    const target = imgs[0];
    target.style.width = '440px';
    target.style.height = '214px';

    let convertBlink = 0;
    const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    Object.defineProperty(output, 'innerHTML', {
      set(v) {
        convertBlink += 1;
        return desc.set.call(this, v);
      },
      get() {
        return desc.get.call(this);
      },
    });

    const mod = await import('/src/features/image-resize/index.js');
    const manager = mod.getImageResizeManager();
    manager._updateMarkdownSource(target);
    await new Promise((r) => setTimeout(r, 250));

    const text = window.editor.getValue();
    const attrCount = (text.match(/data-ir=/g) || []).length;
    return {
      attrCount,
      convertBlink,
      markerSurvived: !!document.getElementById('g4-blink-marker'),
      irIndex: target.dataset.irIndex,
      widths: imgs.map((i) => i.style.width),
      text,
    };
  });

  expect(result.attrCount).toBe(1);
  expect(result.convertBlink).toBe(0);
  expect(result.markerSurvived).toBe(true);
  expect(result.widths[0]).toBe('440px');
  expect(result.widths[1]).toBe('');
  expect(result.widths[2]).toBe('');
  expect(result.text).toContain('photo-1?w=1200) {data-ir=');
  expect(result.text).not.toMatch(/photo-2\?w=1600\) \{data-ir=/);
});
