import { expect, test } from '@playwright/test';
import { setMarkdown, waitForApp } from './helpers.js';

test('#45: GitHub emoji shortcodes render as emoji in the preview', async ({ page }) => {
    await waitForApp(page);
    await setMarkdown(page, 'Hello :smile: :tada: :heart: :rocket: :+1:');
    await page.waitForTimeout(800);

    const out = page.locator('#output');
    await expect(out.locator('p').first()).toContainText('😄');
    await expect(out.locator('p').first()).toContainText('🎉');
    await expect(out.locator('p').first()).toContainText('❤️');
    await expect(out.locator('p').first()).toContainText('🚀');
    await expect(out.locator('p').first()).toContainText('👍');
    await expect(out.locator('p').first()).not.toContainText(':smile:');
});

test('#45: unknown shortcodes and real content stay literal', async ({ page }) => {
    await waitForApp(page);
    await setMarkdown(page, 'A :definitely_not_a_shortcode: b, time 12:30, css :hover rule');
    await page.waitForTimeout(800);

    const txt = await page.locator('#output').innerText();
    expect(txt).toContain(':definitely_not_a_shortcode:');
    expect(txt).toContain('12:30');
    expect(txt).toContain(':hover');
});
