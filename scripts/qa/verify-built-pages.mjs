#!/usr/bin/env node
// Assert that the PRODUCTION Vite build emits trust pages and the correct OG asset.
// Run AFTER: npm run build && node scripts/qa/verify-built-pages.mjs
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
const root = resolve('dist');
const required = [
 'index.html', 'landing/index.html', 'privacy-policy/index.html',
 'terms/index.html', 'cookie-policy/index.html', 'accessibility/index.html',
 'seo/online-markdown-editor/index.html', 'seo/markdown-to-pdf/index.html',
 'image/og-image.png'
];
const failures=[];
for(const path of required){
  if(!existsSync(join(root,path))) failures.push('missing: dist/'+path);
}
if(existsSync(join(root,'index.html'))) {
  const home=readFileSync(join(root,'index.html'),'utf8');
  if(!home.includes('markups.dev')) failures.push('home missing canonical brand');
}
for(const path of required.filter(x=>x.endsWith('index.html'))) {
  const file=join(root,path);
  if(!existsSync(file)) continue;
  const html=readFileSync(file,'utf8');
  if(/https:\/\/markups\.dev\/images\/og-image\.png/.test(html)) failures.push('stale OG image URL in '+path);
  if(!/<title[^>]*>/.test(html)) failures.push('missing title: '+path);
}
console.log(JSON.stringify({check:'built-pages',checked:required.length,failures},null,2));
if(failures.length) process.exitCode=1;
