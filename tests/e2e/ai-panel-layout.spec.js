import { test, expect } from '@playwright/test';

async function openAISettings(page, width = 1280) {
    await page.setViewportSize({ width, height: 820 });
    await page.goto('/');
    await expect(page.locator('#editor')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#ai-writer-button')).toHaveAttribute('data-ai-setup', 'true');
    const panel = page.locator('#ai-writer-panel');
    if (!(await panel.isVisible())) await page.locator('#ai-writer-button').click();
    await expect(panel).toBeVisible();
    if (!(await page.locator('#ai-settings-sheet').isVisible())) {
        await page.locator('#ai-settings-btn').click();
    }
    await expect(page.locator('#ai-settings-sheet')).toBeVisible();
}

test('AI settings stay compact and keep Save and Cancel visible while the form scrolls', async ({ page }) => {
    await openAISettings(page);

    const geometry = await page.evaluate(() => {
        const panel = document.querySelector('#ai-writer-panel');
        const body = document.querySelector('#ai-settings-body');
        const footer = document.querySelector('.ai-settings-sheet-footer');
        const save = document.querySelector('#ai-settings-save');
        const panelRect = panel.getBoundingClientRect();
        const footerRect = footer.getBoundingClientRect();
        const saveRect = save.getBoundingClientRect();
        return {
            panelHeight: panelRect.height,
            bodyHeight: body.clientHeight,
            bodyScrollHeight: body.scrollHeight,
            footerBottom: footerRect.bottom,
            saveBottom: saveRect.bottom,
            viewportHeight: window.innerHeight
        };
    });

    expect(geometry.bodyScrollHeight).toBeGreaterThan(geometry.bodyHeight);
    expect(geometry.footerBottom).toBeLessThanOrEqual(geometry.viewportHeight);
    expect(geometry.saveBottom).toBeLessThanOrEqual(geometry.viewportHeight);
    await expect(page.locator('#ai-set-layout')).toHaveValue('right');
    await expect(page.locator('#ai-settings-save')).toBeVisible();
    await expect(page.locator('#ai-settings-cancel')).toBeVisible();
});

test('AI composer remains visible at the bottom of the panel', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto('/');
    await expect(page.locator('#editor')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#ai-writer-button')).toHaveAttribute('data-ai-setup', 'true');
    const panel = page.locator('#ai-writer-panel');
    if (!(await panel.isVisible())) await page.locator('#ai-writer-button').click();
    await expect(panel).toBeVisible();
    if (!(await page.locator('#ai-settings-sheet').isVisible())) await page.locator('#ai-settings-btn').click();
    await expect(page.locator('#ai-settings-sheet')).toBeVisible();
    await page.locator('#ai-settings-cancel').click();

    const composer = page.locator('.ai-composer');
    await expect(composer).toBeVisible();
    const geometry = await composer.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const panel = document.querySelector('#ai-writer-panel').getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, panelBottom: panel.bottom, height: rect.height };
    });
    expect(geometry.height).toBeGreaterThan(48);
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.panelBottom + 1);
    await page.locator('#ai-input').fill('check composer');
    await expect(page.locator('#ai-input')).toHaveValue('check composer');
});

test('AI panel offers right, split, and floating layouts and remembers the selected layout', async ({ page }) => {
    await openAISettings(page);
    const layout = page.locator('#ai-set-layout');
    await expect(layout.locator('option')).toHaveText([
        'Right sidebar',
        'Wide split panel',
        'Floating panel'
    ]);

    await layout.selectOption('split');
    await page.locator('#ai-settings-save').click();
    await expect(page.locator('#ai-writer-panel')).toHaveAttribute('data-ai-layout', 'split');
    await expect.poll(() => page.locator('#ai-writer-panel').evaluate((panel) =>
        getComputedStyle(panel).width
    )).not.toBe('360px');

    await page.reload();
    await expect(page.locator('#editor')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#ai-writer-button')).toHaveAttribute('data-ai-setup', 'true');
    // The modular manager restores visibility as well as the layout. Do not
    // blindly toggle an already restored panel closed before checking settings.
    if (!(await page.locator('#ai-writer-panel').isVisible())) {
        await page.locator('#ai-writer-button').click();
    }
    await expect(page.locator('#ai-writer-panel')).toHaveAttribute('data-ai-layout', 'split');
    if (!(await page.locator('#ai-settings-sheet').isVisible())) {
        await page.locator('#ai-settings-btn').click();
    }
    await expect(page.locator('#ai-set-layout')).toHaveValue('split');
    await page.locator('#ai-set-layout').selectOption('floating');
    await page.locator('#ai-settings-save').click();
    await expect.poll(() => page.locator('#ai-writer-panel').evaluate((panel) =>
        getComputedStyle(panel).position
    )).toBe('fixed');
});
