import { expect, test } from '@playwright/test';
import { getMarkdown, setMarkdown, waitForApp } from './helpers.js';

const ISSUE_40_GITHUB_VIDEO = 'https://github.com/user-attachments/assets/80b44104-49c5-4b46-aa37-acf5c4957062';

test.describe('Issue #40 runtime behavior', () => {
    test('renders direct and GitHub attachment video links as inline preview players', async ({ page }) => {
        await waitForApp(page);

        await setMarkdown(page, [
            `${ISSUE_40_GITHUB_VIDEO},`,
            '',
            'https://example.com/demo.mp4'
        ].join('\n'));

        await expect(page.locator('#output video')).toHaveCount(2);
        await expect(page.locator('#output video').first()).toHaveAttribute('src', ISSUE_40_GITHUB_VIDEO);
        await expect(page.locator('#output video').nth(1)).toHaveAttribute('src', 'https://example.com/demo.mp4');
    });

    test('video preview controls persist width and alignment back to Markdown', async ({ page }) => {
        await waitForApp(page);

        await setMarkdown(page, 'https://example.com/demo.mp4');
        const videoCard = page.locator('#output .preview-video').first();
        await expect(videoCard).toBeVisible();

        await videoCard.click();
        await page.locator('.video-controls-popover [data-video-width="50%"]').click();
        await page.locator('.video-controls-popover [data-video-align="right"]') .click();

        await expect.poll(async () => getMarkdown(page)).toBe('https://example.com/demo.mp4 {video width=50% align=right}');
        await expect(videoCard).toHaveAttribute('data-video-width', '50%');
        await expect(videoCard).toHaveAttribute('data-video-align', 'right');
    });

    test('renders YouTube links as privacy-friendly embeds', async ({ page }) => {
        await waitForApp(page);

        await setMarkdown(page, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

        const iframe = page.locator('#output iframe');
        await expect(iframe).toHaveCount(1);
        await expect(iframe).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
        await expect(iframe).toHaveAttribute('loading', 'lazy');
    });

    test('syncs simple Live Edit changes back to Markdown source', async ({ page }) => {
        await waitForApp(page);

        await setMarkdown(page, '# Old title\n\nOld paragraph');
        await expect(page.locator('#output h1')).toHaveText('Old title');

        await page.locator('#live-preview-edit-toggle').click();
        await expect(page.locator('#live-preview-edit-toggle')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#markdown-mode-toggle')).toHaveAttribute('aria-pressed', 'false');
        await expect(page.locator('#output')).toHaveAttribute('contenteditable', 'true');

        await page.locator('#output').evaluate((output) => {
            output.innerHTML = '<h1>New title</h1><p>Updated paragraph</p>';
            output.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'Updated paragraph' }));
        });

        await expect.poll(async () => getMarkdown(page)).toContain('# New title\n\nUpdated paragraph');

        await page.locator('#markdown-mode-toggle').click();
        await expect(page.locator('#live-preview-edit-toggle')).toHaveAttribute('aria-pressed', 'false');
        await expect(page.locator('#markdown-mode-toggle')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#output')).toHaveAttribute('contenteditable', 'false');
        await expect(page.locator('#output h1')).toHaveText('New title');
    });
});
