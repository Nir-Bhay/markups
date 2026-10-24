#!/usr/bin/env node
/**
 * Markups read-only technical SEO/GEO contract checks.
 * Run: node scripts/qa/check-seo-geo-static.mjs
 * This intentionally FAILS the 2026-10-23 baseline until real issues are fixed.
 * It does not make HTTP requests and cannot substitute for a built-site smoke test.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.cwd());
const issues = [];
const warnings = [];
const note = (kind, code, detail) => (kind === 'error' ? issues : warnings).push({ code, detail });
const get = (rel) => readFileSync(join(root, rel), 'utf8');
const has = (rel) => existsSync(join(root, rel));
const home = get('index.html');
const vite = get('vite.config.js');
const sitemap = get('public/sitemap.xml');
const entries = [
  ['/', 'index.html'],
  ['/landing', 'landing/index.html'],
  ['/seo/online-markdown-editor', 'seo/online-markdown-editor/index.html'],
  ['/seo/markdown-to-pdf', 'seo/markdown-to-pdf/index.html'],
  ['/seo/markdown-to-html', 'seo/markdown-to-html/index.html'],
  ['/seo/markdown-live-preview-editor', 'seo/markdown-live-preview-editor/index.html'],
  ['/seo/cheatsheet', 'seo/cheatsheet/index.html'],
  ['/seo/examples/mermaid', 'seo/examples/mermaid/index.html'],
  ['/seo/examples/math', 'seo/examples/math/index.html'],
  ['/seo/tutorials/markdown-to-pdf', 'seo/tutorials/markdown-to-pdf/index.html'],
  ['/seo/stackedit-alternative', 'seo/stackedit-alternative/index.html'],
  ['/seo/typora-alternative', 'seo/typora-alternative/index.html'],
  ['/seo/markups-vs-typora', 'seo/markups-vs-typora/index.html'],
  ['/seo/best-markdown-editor-for-developers', 'seo/best-markdown-editor-for-developers/index.html'],
  ['/seo/markdown-to-docx', 'seo/markdown-to-docx/index.html'],
  ['/seo/global-growth-playbook', 'seo/global-growth-playbook/index.html'],
  ['/privacy-policy', 'privacy-policy/index.html'],
  ['/terms', 'terms/index.html'],
  ['/accessibility', 'accessibility/index.html'],
  ['/cookie-policy', 'cookie-policy/index.html']
];

for (const folder of ['privacy-policy', 'terms', 'accessibility', 'cookie-policy']) {
  if (!vite.includes("'" + folder + "'") && !vite.includes('"' + folder + '"')) {
    note('error', 'MISSING_VITE_HTML_INPUT', folder + ' not visibly included in vite.config.js multi-page input scan');
  }
}
const urlSet = new Set([...sitemap.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map((m) => m[1].trim()));
for (const [path, file] of entries) {
  if (!has(file)) { note('error', 'MISSING_SOURCE', file); continue; }
  const html = get(file);
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1];
  const robots = html.match(/<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']+)/i)?.[1] || '';
  const noindex = /noindex/i.test(robots);
  const expectedUrl = 'https://markups.dev' + (path === '/' ? '/' : path);
  if (!title) note('error', 'MISSING_TITLE', file);
  if (!canonical) note('error', 'MISSING_CANONICAL', file);
  if (!/<h1\b/i.test(html)) note('warning', 'MISSING_H1', file);
  if (noindex && urlSet.has(expectedUrl)) note('error', 'NOINDEX_IN_SITEMAP', path);
  if (!noindex && canonical === expectedUrl && path.startsWith('/seo/') && !urlSet.has(expectedUrl)) {
    note('error', 'MISSING_INDEXABLE_SEO_URL', path);
  }
  if (!noindex && canonical && canonical !== expectedUrl && path !== '/landing') {
    note('warning', 'CANONICAL_DIFFERS_FROM_ROUTE', path + ' -> ' + canonical);
  }
  const matches = [...html.matchAll(/https:\/\/markups\.dev\/images\/[^"'\s<>]+/g)];
  for (const match of matches) note('error', 'INVALID_PUBLIC_ASSET_PATH', file + ': ' + match[0]);
}
if (!has('public/image/og-image.png')) note('error', 'MISSING_OG_IMAGE', 'public/image/og-image.png');
if (!/rel=["']canonical["']/i.test(home)) note('error', 'HOME_MISSING_CANONICAL', 'index.html');
if (!has('public/robots.txt') || !has('public/llms.txt')) note('error', 'MISSING_CRAWLER_SOURCE', 'public/robots.txt or public/llms.txt');
if (!urlSet.has('https://markups.dev/')) note('error', 'HOME_NOT_IN_SITEMAP', 'https://markups.dev/');
for (const path of ['/privacy-policy','/terms','/accessibility','/cookie-policy']) {
  if (!urlSet.has('https://markups.dev' + path)) note('warning', 'TRUST_URL_NOT_IN_SITEMAP', path + ' — optional after route is live');
}
const out = { checked: entries.length, errors: issues.length, warnings: warnings.length, issues, warnings, scope: 'repository-only static check, NOT deployed HTTP or Google indexing' };
process.stdout.write(JSON.stringify(out, null, 2) + '\n');
process.exitCode = issues.length ? 1 : 0;
