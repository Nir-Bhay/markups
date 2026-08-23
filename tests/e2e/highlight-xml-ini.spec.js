import { expect, test } from '@playwright/test';
import { setMarkdown, waitForApp } from './helpers.js';

test('#42 XML: tag names (blue) + attribute names (purple) get Prism tokens & colors', async ({ page }) => {
    await waitForApp(page);
    await setMarkdown(page, '```xml\n<Sid Name="test" Timing="4" Flag="1" Condition="a &gt; 0 &amp; b" />\n```\n');
    await page.waitForTimeout(800);

    const xmlCode = page.locator('#output pre code.language-xml');
    await expect(xmlCode).toHaveCount(1);

    const tokens = await xmlCode.locator('[class*="token"]').count();
    expect(tokens).toBeGreaterThanOrEqual(10);

    // GitHub-style: tag name blue, attribute names purple, entity references blue
    const tagColor = await xmlCode.locator('.token.tag').first().evaluate((el) => getComputedStyle(el).color);
    const attrColor = await xmlCode.locator('.token.attr-name').first().evaluate((el) => getComputedStyle(el).color);
    const codeColor = await xmlCode.evaluate((el) => getComputedStyle(el).color);

    // Distinct from plain code color (i.e., not everything black)
    expect(tagColor).not.toBe(codeColor);
    expect(attrColor).not.toBe(codeColor);
    // tag/attr must differ too (blue vs purple)
    expect(tagColor).not.toBe(attrColor);
});

test('#44 ini: [Section] headers + keys get Prism tokens', async ({ page }) => {
    await waitForApp(page);
    await setMarkdown(page, '```ini\n[ID_1_Text_Label]\nName = Value\nAnother_key = 42\n```\n');
    await page.waitForTimeout(800);

    const iniCode = page.locator('#output pre code.language-ini');
    await expect(iniCode).toHaveCount(1);

    const tokens = await iniCode.locator('[class*="token"]').count();
    expect(tokens).toBeGreaterThanOrEqual(4);

    // Section header + keys get tokens (count-based avoids strict-mode on nesting)
    expect(await iniCode.locator('.token.section-name').count()).toBeGreaterThanOrEqual(1);
    expect(await iniCode.locator('.token.key').count()).toBeGreaterThanOrEqual(1);
});
