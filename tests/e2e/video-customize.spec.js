import { test, expect } from '@playwright/test';

const THREE = [
  'https://example.com/a.mp4',
  'https://example.com/b.mp4',
  'https://example.com/c.mp4',
].join(' ');

test('video customize writes attrs to one sibling only and avoids preview blink', async ({ page }) => {
  await page.goto('/');

  await page.waitForFunction(() => !!window.editor);
  await page.getByRole('button', { name: 'Split view' }).click();

  await page.evaluate((md) => {
    window.editor.setValue(md);
  }, `## Videos test\n\n${THREE}\n`);

  await page.waitForTimeout(900);

  const result = await page.evaluate(async () => {
    const output = document.querySelector('#output');
    output.appendChild(Object.assign(document.createElement('span'), { id: 'g5-blink-marker' }));

    const videos = [...output.querySelectorAll('.preview-video[data-video-url]')];
    const target = videos[1];
    if (!target) return { ok: false, reason: 'missing middle video' };

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

    const mod = await import('/src/features/video-controls/index.js');
    let markdown = window.editor.getValue();
    const onMarkdownChange = (next) => {
      const model = window.editor.getModel();
      window.editor.executeEdits('video-test', [{
        range: model.getFullModelRange(),
        text: next,
        forceMoveMarkers: true,
      }]);
      markdown = next;
    };

    const controller = new mod.VideoControlsController({
      output,
      getMarkdown: () => markdown,
      onMarkdownChange,
    });
    controller.initialize();
    controller.show(target);
    controller._persist({ width: '50%', align: 'right', mode: 'smart' });
    await new Promise((r) => setTimeout(r, 200));

    const text = window.editor.getValue();
    return {
      ok: (text.match(/\{video/g) || []).length === 1 && !!document.getElementById('g5-blink-marker') && convertBlink === 0,
      videoBlocks: (text.match(/\{video/g) || []).length,
      convertBlink,
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
