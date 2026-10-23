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
});
