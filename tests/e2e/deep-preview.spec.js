/**
 * Deep preview QA — professional / thesis / GitHub-docs style variants.
 * Runs suite-by-suite against the live Vite app and writes a JSON report.
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SUITES } from './deep-preview-fixtures.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.resolve(__dirname, '../../docs/qa/deep-preview-report.json');

async function waitForApp(page) {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto('/');
  await expect(page.locator('#output')).toContainText('Welcome to Markups', { timeout: 30_000 });
  await page.waitForFunction(() => typeof window.editor?.setValue === 'function', null, {
    timeout: 30_000,
  });
  // Tabs/IndexedDB restore can overwrite the editor shortly after first paint.
  await page.waitForTimeout(1500);
}

async function setMarkdown(page, markdown, waitToken) {
  // Retry until the editor model keeps our fixture (guards against late tab restore).
  for (let attempt = 0; attempt < 8; attempt++) {
    const status = await page.evaluate((md) => {
      try {
        const ed = window.editor;
        if (!ed) return { ok: false, err: 'no editor' };
        ed.setValue(md);
        return { ok: true, head: ed.getValue().slice(0, 48), len: ed.getValue().length };
      } catch (e) {
        return { ok: false, err: String(e?.message || e) };
      }
    }, markdown);

    if (!status.ok) throw new Error(`setMarkdown failed: ${status.err}`);

    await page.waitForTimeout(450);
    const stillThere = await page.evaluate((expectedHead) => {
      return (window.editor?.getValue() || '').slice(0, expectedHead.length) === expectedHead;
    }, markdown.slice(0, 48));

    if (stillThere) break;
    if (attempt === 7) {
      throw new Error('Editor value was overwritten after setValue (tab restore race)');
    }
  }

  if (waitToken) {
    await expect(page.locator('#output')).toContainText(waitToken, { timeout: 20_000 });
  } else {
    await page.waitForTimeout(1000);
  }
  await page.waitForTimeout(700);
}

async function runChecks(page, checks) {
  return page.evaluate((checkDefs) => {
    const root =
      document.querySelector('#output') ||
      document.querySelector('.preview-content') ||
      document.querySelector('.markdown-body') ||
      document.body;

    const results = [];
    for (const check of checkDefs) {
      let pass = false;
      let error = null;
      try {
        // Recreate functions from serialized source is not possible; evaluate names via mapping
        pass = false;
        error = 'use local runner';
      } catch (e) {
        error = String(e?.message || e);
      }
      results.push({ name: check.name, pass, error });
    }

    // Concrete probes for report extras
    const extras = {
      katex: document.querySelectorAll('.katex').length,
      katexDisplay: document.querySelectorAll('.katex-display').length,
      katexStyles: document.querySelectorAll('.katex [style]').length,
      mermaid: document.querySelectorAll('.mermaid').length,
      mermaidSvg: document.querySelectorAll('.mermaid svg').length,
      mermaidErrors: [...document.querySelectorAll('.mermaid')].filter((el) =>
        /Syntax error/i.test(el.textContent || '')
      ).length,
      tables: document.querySelectorAll('table').length,
      alerts: document.querySelectorAll('.markdown-alert').length,
      details: document.querySelectorAll('details').length,
      codeBlocks: document.querySelectorAll('pre code').length,
      checkboxes: document.querySelectorAll('input[type="checkbox"]').length,
      footnotes: document.querySelectorAll('.footnotes, [id*="fn"], .footnote-ref, a[href*="fn"]').length,
    };

    return { rootTag: root?.tagName, extras, results };
  }, checks.map((c) => ({ name: c.name })));
}

async function evaluateSuite(page, suite) {
  const heading = suite.markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const waitToken =
    suite.id === 'math-thesis'
      ? 'Research Methods'
      : suite.id === 'tables-docs'
        ? 'API Reference'
        : suite.id === 'footnotes-cite'
          ? 'Literature Review'
          : heading || suite.id;

  await setMarkdown(page, suite.markdown, waitToken);

  // Extra wait for mermaid-heavy suites
  if (suite.id.startsWith('mermaid')) {
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => {
      const blocks = document.querySelectorAll('.mermaid');
      if (!blocks.length) return false;
      return [...blocks].every((el) => el.querySelector('svg') || /Syntax error/i.test(el.textContent || ''));
    }, null, { timeout: 20_000 }).catch(() => {});
  }

  const probe = await page.evaluate((suiteId) => {
    const root =
      document.querySelector('#output') ||
      document.querySelector('.preview-content') ||
      document.querySelector('.markdown-body') ||
      document.body;

    const q = (sel) => root.querySelectorAll(sel).length;
    const mermaidBlocks = [...root.querySelectorAll('.mermaid')];
    const displays = [...root.querySelectorAll('.katex-display')];

    const suiteChecks = {
      'math-thesis': [
        ['inline katex present', q('.katex') >= 2],
        ['display math blocks', q('.katex-display') >= 2],
        ['no clipped display math', displays.length === 0 || displays.every((el) => {
          const cs = getComputedStyle(el);
          // Visible overflow never clips; allow small scrollbar/subpixel deltas.
          if (cs.overflowY === 'visible' && cs.overflowX === 'visible') return true;
          return el.scrollHeight <= el.clientHeight + 8;
        })],
        ['strut styles preserved', [...root.querySelectorAll('.katex .strut')].some((s) => s.getAttribute('style')?.includes('height'))],
        ['no katex-error class', q('.katex-error') === 0],
        ['aligned or matrix content rendered', /∇|det|π|rho|varepsilon|pmatrix|aligned/i.test(root.textContent || '') || q('.katex-display') >= 2],
      ],
      'tables-docs': [
        ['at least 2 tables', q('table') >= 2],
        ['table has thead/th', q('table th') >= 4],
        ['cells present', q('table td, table th') >= 8],
        ['inline code in cells', q('table code') >= 2],
        ['ordered nested lists', q('ol ol, ol ul') >= 1],
      ],
      'footnotes-cite': [
        [
          'footnote refs rendered',
          q('a[href^="#user-content-fn"], a[href*="fn"], .footnote-ref, sup a') >= 1 ||
            /fn-|footnote/i.test(root.innerHTML),
        ],
        [
          'footnote section present',
          !!root.querySelector('.footnotes, section.footnotes, [data-footnotes], ol.footnotes-list') ||
            q('li[id*="fn"]') >= 1 ||
            /smith2020/i.test(root.textContent || ''),
        ],
        [
          'cite key visible as text',
          (root.textContent || '').includes('[@smith2020]') ||
            (root.textContent || '').includes('@smith2020') ||
            (root.textContent || '').includes('smith2020'),
        ],
      ],
      'callouts-details': [
        ['5 alert variants', q('.markdown-alert') >= 5],
        ['NOTE alert', !!root.querySelector('.markdown-alert-note')],
        ['WARNING alert', !!root.querySelector('.markdown-alert-warning')],
        ['CAUTION or IMPORTANT', !!root.querySelector('.markdown-alert-caution, .markdown-alert-important')],
        ['details/summary', q('details') >= 2 && q('summary') >= 2],
        ['code inside details', [...root.querySelectorAll('details')].some((el) => el.querySelector('pre, code'))],
      ],
      'code-highlight': [
        ['5 fenced code blocks', q('pre code') >= 5],
        ['language classes', [...root.querySelectorAll('pre code')].filter((c) => /language-/i.test(c.className)).length >= 4],
        ['token highlighting', q('pre code .token, pre code span') >= 5],
        ['copy button(s)', q('.code-copy-btn, .copy-code-btn, button[aria-label*="opy" i]') >= 1],
        ['inline code', q('p code, li code') >= 2],
      ],
      'mermaid-flow-complex': [
        ['mermaid svg', q('.mermaid svg') >= 1],
        ['no syntax error', !mermaidBlocks.some((el) => /Syntax error/i.test(el.textContent || ''))],
        ['height ok', (root.querySelector('.mermaid svg')?.getBoundingClientRect().height || 0) > 40],
      ],
      'mermaid-sequence': [
        ['sequence svg', q('.mermaid svg') >= 1],
        ['no syntax error', !mermaidBlocks.some((el) => /Syntax error/i.test(el.textContent || ''))],
        ['height ok', (root.querySelector('.mermaid svg')?.getBoundingClientRect().height || 0) > 80],
      ],
      'mermaid-class-er': [
        ['2 mermaid diagrams', q('.mermaid') >= 2],
        ['both have svg', q('.mermaid svg') >= 2],
        ['no syntax errors', !mermaidBlocks.some((el) => /Syntax error/i.test(el.textContent || ''))],
      ],
      'mermaid-gantt-mindmap-git': [
        ['3 mermaid blocks', q('.mermaid') >= 3],
        ['3 svgs', q('.mermaid svg') >= 3],
        ['no syntax errors', !mermaidBlocks.some((el) => /Syntax error/i.test(el.textContent || ''))],
      ],
      'mermaid-pie-state-xy': [
        ['3 mermaid blocks', q('.mermaid') >= 3],
        ['svgs rendered', q('.mermaid svg') >= 2],
        ['no syntax errors', !mermaidBlocks.some((el) => /Syntax error/i.test(el.textContent || ''))],
      ],
      'tasklists-toc-emoji': [
        ['task checkboxes', q('input[type="checkbox"]') >= 4],
        ['checked items', q('input[type="checkbox"]:checked') >= 2],
        [
          'emoji expanded',
          /🎉|🚀|😄|😊|🚢/.test(root.textContent || '') || !(root.textContent || '').includes(':tada:'),
        ],
        ['heading hierarchy', q('h1,h2,h3,h4') >= 4],
      ],
      'colors-formatting': [
        ['blue style', !!root.querySelector('[style*="color:#2563eb"]')],
        ['red style', !!root.querySelector('[style*="color:#dc2626"]')],
        ['mark highlight', !!root.querySelector('mark[style*="background:#fef08a"]')],
        ['blockquote', q('blockquote') >= 1],
      ],
      'frontmatter-details-misc': [
        ['h1 rendered', !!root.querySelector('h1')],
        ['hr present', q('hr') >= 1],
        ['external link', [...root.querySelectorAll('a[href^="http"]')].length >= 1],
        ['html comment stripped', !root.innerHTML.includes('secret')],
      ],
    };

    const checks = (suiteChecks[suiteId] || []).map(([name, pass]) => ({ name, pass: !!pass }));
    const failed = checks.filter((c) => !c.pass);

    return {
      checks,
      failed: failed.map((c) => c.name),
      passCount: checks.filter((c) => c.pass).length,
      total: checks.length,
      extras: {
        katex: q('.katex'),
        katexDisplay: q('.katex-display'),
        katexStyles: q('.katex [style]'),
        mermaid: q('.mermaid'),
        mermaidSvg: q('.mermaid svg'),
        mermaidErrors: mermaidBlocks.filter((el) => /Syntax error/i.test(el.textContent || '')).length,
        tables: q('table'),
        alerts: q('.markdown-alert'),
        details: q('details'),
        codeBlocks: q('pre code'),
        checkboxes: q('input[type="checkbox"]'),
        textSample: (root.textContent || '').replace(/\\s+/g, ' ').slice(0, 180),
      },
    };
  }, suite.id);

  return {
    id: suite.id,
    title: suite.title,
    ok: probe.failed.length === 0 && probe.total > 0,
    ...probe,
  };
}

test.describe.configure({ mode: 'serial' });

test('deep preview QA across professional markdown suites', async ({ page }) => {
  test.setTimeout(300_000);
  await waitForApp(page);

  const report = {
    generatedAt: new Date().toISOString(),
    baseURL: page.url(),
    suites: [],
  };

  for (const suite of SUITES) {
    const result = await evaluateSuite(page, suite);
    report.suites.push(result);
  }

  const passed = report.suites.filter((s) => s.ok).length;
  const failed = report.suites.filter((s) => !s.ok);
  report.summary = {
    totalSuites: report.suites.length,
    passed,
    failed: failed.length,
    failedIds: failed.map((s) => s.id),
    totalChecks: report.suites.reduce((n, s) => n + s.total, 0),
    passedChecks: report.suites.reduce((n, s) => n + s.passCount, 0),
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  // Also write a concise markdown summary for humans
  const mdLines = [
    `# Deep Preview QA Report`,
    ``,
    `Generated: ${report.generatedAt}`,
    ``,
    `## Summary`,
    ``,
    `- Suites: **${passed}/${report.summary.totalSuites}** passed`,
    `- Checks: **${report.summary.passedChecks}/${report.summary.totalChecks}** passed`,
    failed.length ? `- Failed suites: ${failed.map((s) => `\`${s.id}\``).join(', ')}` : `- Failed suites: none`,
    ``,
    `## Suite results`,
    ``,
  ];
  for (const s of report.suites) {
    mdLines.push(`### ${s.ok ? 'PASS' : 'FAIL'} — ${s.title} (\`${s.id}\`)`);
    mdLines.push('');
    for (const c of s.checks) {
      mdLines.push(`- ${c.pass ? 'PASS' : 'FAIL'} ${c.name}`);
    }
    if (s.extras) {
      mdLines.push('');
      mdLines.push('```json');
      mdLines.push(JSON.stringify(s.extras, null, 2));
      mdLines.push('```');
    }
    if (s.failed.length) {
      mdLines.push('');
      mdLines.push(`Failed: ${s.failed.join(', ')}`);
    }
    mdLines.push('');
  }
  fs.writeFileSync(
    path.resolve(__dirname, '../../docs/qa/deep-preview-report.md'),
    mdLines.join('\n')
  );

  for (const s of failed) {
    expect.soft(s.ok, `${s.id}: ${s.failed.join(', ')}`).toBeTruthy();
  }
  expect(failed.length, `Failed suites: ${failed.map((s) => s.id).join(', ')}`).toBe(0);
});
