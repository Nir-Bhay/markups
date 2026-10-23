import { test, expect } from '@playwright/test';

const pages = [
  ['/landing','Your Markdown.'],
  ['/privacy-policy','Privacy Policy'],
  ['/terms','Terms of Service'],
  ['/cookie-policy','Cookie Policy'],
  ['/accessibility','Accessibility Statement']
];
for(const [path,heading] of pages){
  test('public page '+path,async({page})=>{
    const response=await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText(heading);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://markups.dev'+path);
  });
}
test('landing sample tabs work via click and keyboard',async({page})=>{
  await page.goto('/landing');
  await expect(page.getByRole('tab',{name:'README.md'})).toHaveAttribute('aria-selected','true');
  await page.getByRole('tab',{name:'Diagram.md'}).click();
  await expect(page.locator('#sample-mermaid')).toBeVisible();
  await page.getByRole('tab',{name:'Diagram.md'}).press('ArrowRight');
  await expect(page.getByRole('tab',{name:'Math.md'})).toHaveAttribute('aria-selected','true');
  await expect(page.locator('#sample-math')).toBeVisible();
});
test('landing links to real editor and correct Open Graph asset',async({page})=>{
  await page.goto('/landing');
  await expect(page.getByRole('link',{name:/start writing for free/i})).toHaveAttribute('href','/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content','https://markups.dev/image/og-image.png');
});

test('privacy policy accurately explains optional AI and share-link data handling', async ({ page }) => {
  await page.goto('/privacy-policy');
  await expect(page.getByRole('heading', { name: 'Optional AI Writer and document sharing' })).toBeVisible();
  await expect(page.locator('#ai-and-sharing')).toContainText('endpoint you configure');
  await expect(page.locator('#ai-and-sharing')).toContainText('URL fragment');
  await expect(page.locator('#ai-and-sharing')).toContainText('session-only key');
  await expect(page.getByText('editor_start', { exact: true })).toBeVisible();
  await expect(page.getByText('export_completed', { exact: true })).toBeVisible();
});

test('landing exposes six accessible, crawlable guide links across mobile layouts',async({page})=>{
  await page.setViewportSize({width:375,height:812});
  const response=await page.goto('/landing');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading',{name:'Less searching. More creating.'})).toBeVisible();
  const cards=page.locator('#guides a.resource-card');
  await expect(cards).toHaveCount(6);
  const targets=[
    '/seo/cheatsheet','/seo/examples/mermaid','/seo/examples/math',
    '/seo/tutorials/markdown-to-pdf','/seo/markdown-to-html','/seo/markdown-live-preview-editor'
  ];
  for(const target of targets){
    await expect(page.locator('#guides a.resource-card[href="'+target+'"]')).toHaveCount(1);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
  // Five-link desktop navigation must not squeeze the header on small tablets.
  await page.setViewportSize({width:860,height:950});
  await expect(page.locator('.desktop-nav')).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
});

test('Compatibility Lab is crawlable with real Markdown fixture and honest export limits', async ({ page, request }) => {
  const response = await page.goto('/seo/compatibility-lab');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Markdown Compatibility Lab' })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://markups.dev/seo/compatibility-lab');
  await expect(page.getByText('image-based PDF', { exact: false })).toBeVisible();
  await expect(page.getByText('not a native', { exact: false })).toBeVisible();
  const download = await request.get('/qa/markdown-compatibility-fixture.md');
  expect(download.ok()).toBeTruthy();
  const body = await download.text();
  for (const token of ['flowchart LR', '$$', '| Field | Type | Required |', 'function percentage(']) {
    expect(body).toContain(token);
  }
  await page.goto('/landing');
  await expect(page.locator('a[href="/seo/compatibility-lab"]')).toBeVisible();
});

test('PDF content matches raster export behavior and avoids unsupported guarantees', async ({ page }) => {
  for (const route of ['/seo/markdown-to-pdf','/seo/tutorials/markdown-to-pdf']) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    const content = await page.locator('main').innerText();
    expect(content).toMatch(/image-based/i);
    expect(content).not.toMatch(/90% of layout issues|clickable links in the PDF|under a minute|what you see is what you get|without breaking layout/i);
    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(() => JSON.parse(jsonLd)).not.toThrow();
    expect(jsonLd).not.toMatch(/without breaking layout|all render correctly/i);
  }
});
