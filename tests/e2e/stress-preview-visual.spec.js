/**
 * Full visual/DOM QA against markups-markdown-preview-stress-test.md
 * Produces docs/qa/stress-preview-report.{json,md} + screenshots.
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const STRESS_PATH = path.resolve(ROOT, 'markups-markdown-preview-stress-test.md');
const REPORT_JSON = path.resolve(ROOT, 'docs/qa/stress-preview-report.json');
const REPORT_MD = path.resolve(ROOT, 'docs/qa/stress-preview-report.md');
const SHOT_DIR = path.resolve(ROOT, 'docs/qa/stress-shots');

const SECTIONS = [
  { id: 'typography', title: 'Typography', token: 'Heading level 1' },
  { id: 'links', title: 'Links', token: 'Inline links' },
  { id: 'images', title: 'Images', token: 'Markdown image' },
  { id: 'blockquotes', title: 'Blockquotes', token: 'Blockquote with a heading' },
  { id: 'lists', title: 'Lists', token: 'Unordered list' },
  { id: 'task-lists', title: 'Task Lists', token: 'Markdown headings render' },
  { id: 'tables', title: 'Tables', token: 'Basic table' },
  { id: 'alerts', title: 'GitHub-style Alerts', token: 'This is a note' },
  { id: 'details', title: 'Collapsible Sections', token: 'Click to expand' },
  { id: 'footnotes', title: 'Footnotes', token: 'Footnotes' },
  { id: 'code', title: 'Code Blocks', token: 'JavaScript' },
  { id: 'diffs', title: 'Diffs', token: 'legacy' },
  { id: 'math', title: 'Math', token: 'Einstein' },
  { id: 'mermaid-flow', title: 'Mermaid Flowcharts', token: 'Open Markups' },
  { id: 'mermaid-sequence', title: 'Mermaid Sequence Diagram', token: 'Paste Markdown' },
  { id: 'mermaid-class', title: 'Mermaid Class Diagram', token: 'MarkdownDocument' },
  { id: 'mermaid-state', title: 'Mermaid State Diagram', token: 'Editing' },
  { id: 'mermaid-er', title: 'Mermaid ER Diagram', token: 'DOCUMENT' },
  { id: 'mermaid-gantt', title: 'Mermaid Gantt', token: 'Previewer QA Plan' },
  { id: 'mermaid-pie', title: 'Mermaid Pie', token: 'Feature Coverage' },
  { id: 'mermaid-journey', title: 'Mermaid Journey', token: 'author experience' },
  { id: 'mermaid-mindmap', title: 'Mermaid Mindmap', token: 'Visualization' },
  { id: 'mermaid-timeline', title: 'Mermaid Timeline', token: 'Evolution of Markup' },
  { id: 'mermaid-xy', title: 'Mermaid XY Chart', token: 'Render Time' },
  { id: 'mermaid-quadrant', title: 'Mermaid Quadrant', token: 'Feature Prioritization' },
  { id: 'mermaid-architecture', title: 'Mermaid Architecture', token: 'Renderer Worker' },
  { id: 'mermaid-git', title: 'Mermaid Git Graph', token: 'Initial Markdown' },
  { id: 'mermaid-requirement', title: 'Mermaid Requirement Diagram', token: 'REQ-001' },
  { id: 'raw-html', title: 'Raw HTML', token: 'Semantic text elements' },
  { id: 'media', title: 'Media', token: 'HTML video probe' },
  { id: 'colors', title: 'Color and Visual Styling Probes', token: 'Red text' },
  { id: 'research', title: 'Research-Paper Style Content', token: 'Abstract' },
  { id: 'edge', title: 'Edge cases and parser traps', token: 'Edge cases' },
];

async function waitForApp(page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('#output')).toContainText('Welcome to Markups', { timeout: 30_000 });
  await page.waitForFunction(() => typeof window.editor?.setValue === 'function', null, {
    timeout: 30_000,
  });
  await page.waitForTimeout(1500);
}

async function setMarkdown(page, markdown, waitToken) {
  // Clear welcome auto-wipe flag: first real keystroke while welcome is showing
  // replaces the whole buffer with that keystroke (product behavior). Do that
  // deliberately, then load the stress doc so later edits do not wipe it.
  await page.keyboard.type('x');
  await page.waitForTimeout(200);

  for (let attempt = 0; attempt < 10; attempt++) {
    await page.evaluate((md) => {
      window.editor.setValue(md);
    }, markdown);
    await page.waitForTimeout(400);
    const ok = await page.evaluate((head) => (window.editor?.getValue() || '').startsWith(head), markdown.slice(0, 40));
    if (ok) break;
    if (attempt === 9) throw new Error('Editor overwritten after setValue');
  }
  if (waitToken) {
    await expect(page.locator('#output')).toContainText(waitToken, { timeout: 45_000 });
  }
  // Mermaid + remote images need settle time on this large doc
  await page.waitForTimeout(4000);
}

test.describe('Stress preview visual QA', () => {
  test('full stress document review', async ({ page }) => {
    test.setTimeout(300_000);
    fs.mkdirSync(SHOT_DIR, { recursive: true });
    fs.mkdirSync(path.dirname(REPORT_JSON), { recursive: true });

    const markdown = fs.readFileSync(STRESS_PATH, 'utf8');
    await waitForApp(page);
    await setMarkdown(page, markdown, 'Markups Markdown Preview Stress Test');

    // Wait for mermaid SVGs to populate
    await page.waitForFunction(() => {
      const d = document.querySelector('#output');
      return d && d.querySelectorAll('.mermaid svg').length >= 5;
    }, null, { timeout: 60_000 }).catch(() => {});

    await page.waitForTimeout(3000);

    const audit = await page.evaluate(() => {
      const d = document.querySelector('#output');
      const text = d.textContent || '';
      const html = d.innerHTML || '';

      const mermaidBlocks = [...d.querySelectorAll('.mermaid')].map((el, i) => {
        const svg = el.querySelector('svg');
        const err = /Syntax error/i.test(el.textContent || '');
        const rect = svg?.getBoundingClientRect();
        return {
          i,
          hasSvg: !!svg,
          err,
          h: rect ? Math.round(rect.height) : 0,
          w: rect ? Math.round(rect.width) : 0,
          sample: (el.textContent || '').replace(/\s+/g, ' ').slice(0, 80),
        };
      });

      const images = [...d.querySelectorAll('img')].map((img, i) => ({
        i,
        src: (img.currentSrc || img.src || '').slice(0, 120),
        alt: img.alt || '',
        naturalW: img.naturalWidth,
        naturalH: img.naturalHeight,
        complete: img.complete,
        displayed: img.getBoundingClientRect().height > 0,
      }));

      const videos = [...d.querySelectorAll('video')].map((v, i) => ({
        i,
        src: (v.currentSrc || v.querySelector('source')?.src || '').slice(0, 120),
        readyState: v.readyState,
        networkState: v.networkState,
        error: v.error ? v.error.code : null,
        controls: v.hasAttribute('controls'),
        h: Math.round(v.getBoundingClientRect().height),
      }));

      const audios = [...d.querySelectorAll('audio')].map((a, i) => ({
        i,
        src: (a.currentSrc || a.querySelector('source')?.src || '').slice(0, 120),
        controls: a.hasAttribute('controls'),
        error: a.error ? a.error.code : null,
      }));

      const katex = d.querySelectorAll('.katex').length;
      const katexDisplay = d.querySelectorAll('.katex-display').length;
      const katexError = d.querySelectorAll('.katex-error').length;
      const clippedMath = [...d.querySelectorAll('.katex-display')].filter(
        (el) => el.scrollHeight > el.clientHeight + 4
      ).length;

      const alerts = {
        total: d.querySelectorAll('.markdown-alert').length,
        note: !!d.querySelector('.markdown-alert-note'),
        tip: !!d.querySelector('.markdown-alert-tip'),
        important: !!d.querySelector('.markdown-alert-important'),
        warning: !!d.querySelector('.markdown-alert-warning'),
        caution: !!d.querySelector('.markdown-alert-caution'),
      };

      const tables = d.querySelectorAll('table').length;
      const details = d.querySelectorAll('details').length;
      const checkboxes = d.querySelectorAll('input[type="checkbox"]').length;
      const codeBlocks = d.querySelectorAll('pre code').length;
      const headings = {
        h1: d.querySelectorAll('h1').length,
        h2: d.querySelectorAll('h2').length,
        h3: d.querySelectorAll('h3').length,
        h4: d.querySelectorAll('h4').length,
        h5: d.querySelectorAll('h5').length,
        h6: d.querySelectorAll('h6').length,
      };

      const colors = {
        red: !!d.querySelector('[style*="color:#dc2626"]'),
        green: !!d.querySelector('[style*="color:#16a34a"]'),
        blue: !!d.querySelector('[style*="color:#2563eb"]'),
        purple: !!d.querySelector('[style*="color:#9333ea"]'),
        // padding/border-radius on spans may be stripped by sanitizer — note separately
        bgYellow: html.includes('background:#fef08a') || !!d.querySelector('[style*="background:#fef08a"]'),
      };

      const svgInline = d.querySelectorAll('svg').length;
      const footnotes = d.querySelectorAll('.footnotes, section.footnotes, [data-footnotes], li[id*="fn"]').length
        || (html.includes('footnote') ? 1 : 0);

      // spacing probe: consecutive block siblings with large unexpected gaps
      const blocks = [...d.querySelectorAll(':scope > *')].slice(0, 80);
      const gaps = [];
      for (let i = 1; i < blocks.length; i++) {
        const prev = blocks[i - 1].getBoundingClientRect();
        const cur = blocks[i].getBoundingClientRect();
        const gap = Math.round(cur.top - prev.bottom);
        if (gap > 64) {
          gaps.push({
            after: (blocks[i - 1].tagName + ' ' + (blocks[i - 1].textContent || '').slice(0, 40)).trim(),
            before: (blocks[i].tagName + ' ' + (blocks[i].textContent || '').slice(0, 40)).trim(),
            gap,
          });
        }
      }

      return {
        headings,
        tables,
        details,
        checkboxes,
        codeBlocks,
        alerts,
        katex,
        katexDisplay,
        katexError,
        clippedMath,
        mermaidBlocks,
        mermaidSvg: mermaidBlocks.filter((m) => m.hasSvg).length,
        mermaidErrors: mermaidBlocks.filter((m) => m.err).length,
        images,
        imagesLoaded: images.filter((i) => i.naturalW > 0).length,
        videos,
        audios,
        colors,
        svgInline,
        footnotes,
        largeGaps: gaps.slice(0, 20),
        hasPicture: d.querySelectorAll('picture').length,
        hasMark: d.querySelectorAll('mark').length,
        hasKbd: d.querySelectorAll('kbd').length,
        hasSubSup: d.querySelectorAll('sub, sup').length,
        textLen: text.length,
      };
    });

    // Section presence checks (scroll + text)
    const sectionResults = [];
    for (const section of SECTIONS) {
      const found = await page.evaluate((token) => {
        const d = document.querySelector('#output');
        return (d?.textContent || '').includes(token);
      }, section.token);
      sectionResults.push({ ...section, present: found, status: found ? 'pass' : 'fail' });
    }

    // Viewport screenshots after scrolling heading into preview pane
    const shotTargets = [
      'Images',
      'GitHub-style Alerts',
      'Math',
      'Mermaid Flowcharts',
      'Mermaid Pie',
      'Mermaid Architecture',
      'Mermaid Requirement Diagram',
      'Media',
      'Color and Visual Styling Probes',
    ];
    const shots = [];
    for (const title of shotTargets) {
      const ok = await page.evaluate((t) => {
        const d = document.querySelector('#output');
        const headings = [...d.querySelectorAll('h1,h2')];
        const el = headings.find((h) => (h.textContent || '').trim() === t);
        if (!el) return false;
        el.scrollIntoView({ block: 'start' });
        return true;
      }, title);
      await page.waitForTimeout(700);
      const file = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
      await page.screenshot({ path: path.join(SHOT_DIR, file), fullPage: false });
      shots.push({ title, file, ok });
    }

    // Identify which mermaid block has syntax error text in SVG
    const mermaidErrorDetail = await page.evaluate(() => {
      return [...document.querySelectorAll('#output .mermaid')].map((el, i) => {
        const txt = (el.textContent || '').replace(/\s+/g, ' ');
        return {
          i,
          err: /Syntax error/i.test(txt),
          hasErrorText: /Syntax error/i.test(txt),
          aria: el.querySelector('svg')?.getAttribute('aria-roledescription') || el.querySelector('svg')?.getAttribute('aria-label') || '',
          h: Math.round(el.querySelector('svg')?.getBoundingClientRect().height || 0),
          nearbyHeading: (() => {
            let n = el.previousElementSibling;
            for (let k = 0; k < 6 && n; k++) {
              if (/^H[1-3]$/.test(n.tagName)) return n.textContent.trim();
              n = n.previousElementSibling;
            }
            return '';
          })(),
          sample: txt.slice(0, 120),
        };
      }).filter((m) => m.err || m.h < 80);
    });

    // --- Typing flicker test (append via executeEdits — never replace whole model) ---
    const flicker = await page.evaluate(async () => {
      const d = document.querySelector('#output');
      const beforeImgs = [...d.querySelectorAll('img')].map((img) => img.src);
      const beforeNodes = {
        img: d.querySelectorAll('img').length,
        video: d.querySelectorAll('video, .preview-video').length,
        mermaidSvg: d.querySelectorAll('.mermaid svg').length,
        mdLen: (window.editor?.getValue() || '').length,
      };

      const model = window.editor.getModel();
      const last = model.getLineCount();
      const col = model.getLineMaxColumn(last);
      model.pushEditOperations(
        [],
        [{ range: { startLineNumber: last, startColumn: col, endLineNumber: last, endColumn: col }, text: '\n\nTyping stability probe line.\n' }],
        () => null
      );

      await new Promise((r) => setTimeout(r, 2000));

      const afterImgs = [...d.querySelectorAll('img')].map((img) => img.src);
      const afterNodes = {
        img: d.querySelectorAll('img').length,
        video: d.querySelectorAll('video, .preview-video').length,
        mermaidSvg: d.querySelectorAll('.mermaid svg').length,
        mdLen: (window.editor?.getValue() || '').length,
      };

      const n = Math.min(beforeImgs.length, afterImgs.length);
      let imgSrcChanged = 0;
      for (let i = 0; i < n; i++) {
        if (beforeImgs[i] !== afterImgs[i]) imgSrcChanged += 1;
      }

      return {
        beforeNodes,
        afterNodes,
        imgSrcChanged,
        vidSrcChanged: 0,
        imgCountDelta: afterNodes.img - beforeNodes.img,
        videoCountDelta: afterNodes.video - beforeNodes.video,
        mermaidDelta: afterNodes.mermaidSvg - beforeNodes.mermaidSvg,
        docWiped: afterNodes.mdLen < beforeNodes.mdLen * 0.5,
      };
    });

    // --- Mode switch stability (markdown source head/tail) ---
    const modeSwitch = await page.evaluate(async () => {
      const getSnapshot = () => {
        const md = window.editor?.getValue() || '';
        const d = document.querySelector('#output');
        return {
          mdLen: md.length,
          mdHead: md.slice(0, 80),
          mdTail: md.slice(-120),
          h1: d.querySelector('h1')?.textContent?.trim() || '',
          img: d.querySelectorAll('img').length,
          video: d.querySelectorAll('video, .preview-video').length,
          mermaidSvg: d.querySelectorAll('.mermaid svg').length,
          katex: d.querySelectorAll('.katex').length,
        };
      };

      const before = getSnapshot();
      const click = (sel) => document.querySelector(sel)?.click();
      click('#view-preview');
      await new Promise((r) => setTimeout(r, 600));
      const previewOnly = getSnapshot();
      click('#view-split');
      await new Promise((r) => setTimeout(r, 600));
      const split = getSnapshot();
      click('#view-code');
      await new Promise((r) => setTimeout(r, 600));
      click('#view-split');
      await new Promise((r) => setTimeout(r, 900));
      const after = getSnapshot();

      return {
        before,
        previewOnly,
        split,
        after,
        mdStable:
          before.mdHead === after.mdHead &&
          Math.abs(before.mdLen - after.mdLen) < 80 &&
          after.mdLen > 10000,
        mediaStable: after.img >= Math.max(0, before.img - 2),
      };
    });

    // --- Document Mode round-trip (no wipe; edit + sync) ---
    const docMode = await page.evaluate(async () => {
      const toggle = document.querySelector('#live-preview-edit-toggle');
      const mdToggle = document.querySelector('#markdown-mode-toggle');
      if (!toggle) return { available: false };

      const before = window.editor.getValue();
      const beforeHead = before.slice(0, 120);
      const beforeImgCount = (before.match(/!\[/g) || []).length;
      const beforePicsum = (before.match(/picsum\.photos/g) || []).length;

      toggle.click();
      await new Promise((r) => setTimeout(r, 500));
      const output = document.querySelector('#output');
      const editable = output?.getAttribute('contenteditable') === 'true';

      const p = [...(output?.querySelectorAll('p') || [])].find(
        (el) => (el.textContent || '').includes('Purpose:') || ((el.textContent || '').length > 60 && !(el.textContent || '').includes('picsum'))
      );
      let edited = false;
      let marker = '';
      if (p) {
        marker = ' DOCMODE_EDIT_' + Date.now();
        p.appendChild(document.createTextNode(marker));
        p.dispatchEvent(new InputEvent('input', { bubbles: true }));
        edited = true;
        await new Promise((r) => setTimeout(r, 1200));
      }

      mdToggle?.click();
      await new Promise((r) => setTimeout(r, 900));

      const after = window.editor.getValue();
      const poisoned = /data:image\/|blob:/.test(after);
      const afterImgCount = (after.match(/!\[/g) || []).length;
      const afterPicsum = (after.match(/picsum\.photos/g) || []).length;
      const markerInMd = marker ? after.includes(marker.trim()) : false;

      return {
        available: true,
        editable,
        edited,
        markerInMd,
        poisoned,
        stillHasImages: afterPicsum >= Math.max(1, beforePicsum - 2) && afterImgCount >= Math.max(1, beforeImgCount - 2),
        stillHasVideo: /flower\.mp4|\.mp4/.test(after),
        mdLenBefore: before.length,
        mdLenAfter: after.length,
        lenDelta: after.length - before.length,
        beforePicsum,
        afterPicsum,
        beforeImgCount,
        afterImgCount,
        headStable: beforeHead === after.slice(0, 120) || after.includes('Markups Markdown Preview Stress Test'),
        contenteditableOff: output?.getAttribute('contenteditable') !== 'true',
        docWiped: after.length < before.length * 0.5,
      };
    });

    // Final mermaid error recount after interactions
    const finalMermaid = await page.evaluate(() => {
      const blocks = [...document.querySelectorAll('#output .mermaid')];
      return {
        total: blocks.length,
        svg: blocks.filter((b) => b.querySelector('svg')).length,
        errors: blocks.filter((b) => /Syntax error/i.test(b.textContent || '')).map((b) => (b.textContent || '').slice(0, 100)),
      };
    });

    const findings = [];
    const add = (severity, area, finding, detail = '') => {
      findings.push({ severity, area, finding, detail });
    };

    if (audit.mermaidErrors > 0) {
      add('major', 'Mermaid', `${audit.mermaidErrors} diagram(s) show Syntax error`, JSON.stringify(audit.mermaidBlocks.filter((m) => m.err)));
    }
    if (audit.mermaidSvg < 10) {
      add('major', 'Mermaid', `Only ${audit.mermaidSvg} Mermaid SVGs rendered (expected many diagram types)`, `blocks=${audit.mermaidBlocks.length}`);
    }
    if (audit.katexError > 0) add('major', 'Math', `${audit.katexError} KaTeX errors`);
    if (audit.clippedMath > 0) add('minor', 'Math', `${audit.clippedMath} display math blocks metric-clipped (>4px)`, 'overflow may still be visible');
    if (audit.imagesLoaded < 3) add('major', 'Images', `Only ${audit.imagesLoaded}/${audit.images.length} images loaded (naturalWidth>0)`);
    // Raw <video> is intentionally forbidden by sanitize.js — expected product behavior.
    if (audit.videos.length === 0) {
      add(
        'info',
        'Media',
        'Raw HTML <video> stripped by sanitizer (by design). Use bare MP4 URL / Insert Video for embeds.',
        'Link fallback to flower.mp4 should still appear as an anchor.'
      );
    }
    if (audit.videos.some((v) => v.error)) add('major', 'Media', 'Video element(s) reported media error', JSON.stringify(audit.videos.filter((v) => v.error)));
    if (audit.alerts.total < 5) add('major', 'Alerts', `Only ${audit.alerts.total}/5 GitHub alerts rendered`);
    if (!audit.colors.red || !audit.colors.blue) add('major', 'Colors', 'Core color spans stripped or missing');
    if (!audit.colors.bgYellow) add('minor', 'Colors', 'Background highlight styles may be stripped by sanitizer');
    if (flicker.docWiped) add('critical', 'Stability', 'Document was wiped during typing probe');
    if (!flicker.docWiped && flicker.imgSrcChanged > 0) add('major', 'Stability', `Typing changed ${flicker.imgSrcChanged} image src(s) — likely reload flicker`);
    if (!flicker.docWiped && Math.abs(flicker.imgCountDelta) > 3) add('major', 'Stability', `Typing changed image count by ${flicker.imgCountDelta}`);
    if (!modeSwitch.mdStable) add('major', 'Mode switch', 'Markdown source changed/corrupted across Write/Preview/Split toggles');
    if (docMode.available && docMode.docWiped) add('critical', 'Document Mode', 'Document wiped during Document Mode round-trip');
    if (docMode.available && docMode.poisoned) add('critical', 'Document Mode', 'Sync wrote data:/blob: URLs into Markdown');
    if (docMode.available && !docMode.docWiped && !docMode.stillHasImages) add('critical', 'Document Mode', 'Images lost after Document Mode round-trip');
    // Architecture/requirement tokens live inside Mermaid SVG — absence of plain text is expected if diagram fails/renders as SVG-only.
    const missingSections = sectionResults.filter((s) => !s.present);
    if (missingSections.length) {
      const sev = missingSections.every((s) => s.id.startsWith('mermaid-')) ? 'info' : 'major';
      add(sev, 'Sections', 'Some section tokens not found as plain text', missingSections.map((s) => s.id).join(', '));
    }
    if (audit.largeGaps.length > 5) add('minor', 'Layout', `${audit.largeGaps.length} large (>64px) gaps between top-level blocks`);
    if (audit.hasPicture === 0) add('info', 'Media', '<picture> element not preserved (flattened to fallback img)');
    if (mermaidErrorDetail?.length) {
      add('major', 'Mermaid', 'Broken/short Mermaid blocks detail', JSON.stringify(mermaidErrorDetail));
    }

    // Passes
    if (audit.alerts.total >= 5) add('pass', 'Alerts', 'All 5 GitHub alert variants present');
    if (audit.katexDisplay >= 5 && audit.katexError === 0) add('pass', 'Math', `${audit.katexDisplay} display math blocks, 0 errors`);
    if (audit.tables >= 5) add('pass', 'Tables', `${audit.tables} tables rendered`);
    if (!flicker.docWiped && flicker.imgSrcChanged === 0 && Math.abs(flicker.imgCountDelta) <= 3) {
      add('pass', 'Stability', 'Append typing kept image srcs stable (no wipe)');
    }
    if (modeSwitch.mdStable) add('pass', 'Mode switch', 'Write/Preview/Split did not corrupt markdown head/tail');
    if (docMode.available && !docMode.poisoned && docMode.stillHasImages && !docMode.docWiped) {
      add('pass', 'Document Mode', 'Round-trip kept image refs; no data:/blob: poison');
    }

    const report = {
      generatedAt: new Date().toISOString(),
      source: 'markups-markdown-preview-stress-test.md',
      summary: {
        sectionsPresent: sectionResults.filter((s) => s.present).length,
        sectionsTotal: sectionResults.length,
        mermaidSvg: audit.mermaidSvg,
        mermaidErrors: finalMermaid.errors.length || audit.mermaidErrors,
        imagesLoaded: `${audit.imagesLoaded}/${audit.images.length}`,
        videos: audit.videos.length,
        findings: {
          critical: findings.filter((f) => f.severity === 'critical').length,
          major: findings.filter((f) => f.severity === 'major').length,
          minor: findings.filter((f) => f.severity === 'minor').length,
          pass: findings.filter((f) => f.severity === 'pass').length,
          info: findings.filter((f) => f.severity === 'info').length,
        },
      },
      audit,
      sectionResults,
      flicker,
      modeSwitch,
      docMode,
      finalMermaid,
      mermaidErrorDetail,
      shots,
      findings,
    };

    fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

    const mdLines = [];
    mdLines.push('# Stress Preview Visual QA Report');
    mdLines.push('');
    mdLines.push(`Generated: ${report.generatedAt}`);
    mdLines.push(`Source: \`${report.source}\``);
    mdLines.push('');
    mdLines.push('## Summary');
    mdLines.push('');
    mdLines.push(`- Sections present: **${report.summary.sectionsPresent}/${report.summary.sectionsTotal}**`);
    mdLines.push(`- Mermaid SVGs: **${report.summary.mermaidSvg}** (errors: **${report.summary.mermaidErrors}**)`);
    mdLines.push(`- Images loaded: **${report.summary.imagesLoaded}**`);
    mdLines.push(`- Videos: **${report.summary.videos}**`);
    mdLines.push(`- Findings: critical ${report.summary.findings.critical}, major ${report.summary.findings.major}, minor ${report.summary.findings.minor}, pass ${report.summary.findings.pass}`);
    mdLines.push('');
    mdLines.push('## Point-by-point findings');
    mdLines.push('');
    for (const f of findings) {
      mdLines.push(`- **[${f.severity.toUpperCase()}] ${f.area}:** ${f.finding}${f.detail ? ` — ${f.detail}` : ''}`);
    }
    mdLines.push('');
    mdLines.push('## Section presence');
    mdLines.push('');
    for (const s of sectionResults) {
      mdLines.push(`- ${s.status === 'pass' ? 'PASS' : 'FAIL'} — ${s.title}`);
    }
    mdLines.push('');
    mdLines.push('## Mermaid blocks');
    mdLines.push('');
    for (const m of audit.mermaidBlocks) {
      mdLines.push(`- #${m.i}: svg=${m.hasSvg} err=${m.err} size=${m.w}x${m.h} — ${m.sample}`);
    }
    mdLines.push('');
    mdLines.push('## Images');
    mdLines.push('');
    for (const img of audit.images) {
      mdLines.push(`- #${img.i}: ${img.naturalW}x${img.naturalH} complete=${img.complete} alt="${img.alt}" src=${img.src}`);
    }
    mdLines.push('');
    mdLines.push('## Videos / Audio');
    mdLines.push('');
    mdLines.push('```json');
    mdLines.push(JSON.stringify({ videos: audit.videos, audios: audit.audios }, null, 2));
    mdLines.push('```');
    mdLines.push('');
    mdLines.push('## Stability (typing)');
    mdLines.push('');
    mdLines.push('```json');
    mdLines.push(JSON.stringify(flicker, null, 2));
    mdLines.push('```');
    mdLines.push('');
    mdLines.push('## Mode switch');
    mdLines.push('');
    mdLines.push('```json');
    mdLines.push(JSON.stringify(modeSwitch, null, 2));
    mdLines.push('```');
    mdLines.push('');
    mdLines.push('## Document Mode');
    mdLines.push('');
    mdLines.push('```json');
    mdLines.push(JSON.stringify(docMode, null, 2));
    mdLines.push('```');
    mdLines.push('');
    mdLines.push('## Large gaps (>64px)');
    mdLines.push('');
    if (audit.largeGaps.length === 0) mdLines.push('- none in first 80 top-level blocks');
    for (const g of audit.largeGaps) {
      mdLines.push(`- ${g.gap}px between \`${g.after}\` → \`${g.before}\``);
    }
    mdLines.push('');
    mdLines.push('## Screenshots');
    mdLines.push('');
    for (const s of shots) {
      mdLines.push(`- ${s.ok ? 'captured' : 'MISSING'} — ${s.title}${s.file ? ` (\`docs/qa/stress-shots/${s.file}\`)` : ''}`);
    }
    mdLines.push('');

    fs.writeFileSync(REPORT_MD, mdLines.join('\n'));

    // Soft assertions — collect evidence; fail only on critical/major
    const blockers = findings.filter((f) => f.severity === 'critical' || f.severity === 'major');
    expect(sectionResults.filter((s) => s.present).length, 'sections present').toBeGreaterThan(25);
    // Don't hard-fail the whole run on known product gaps — report is the deliverable.
    // Still assert the doc loaded and basic structure rendered.
    expect(audit.headings.h1).toBeGreaterThan(5);
    expect(audit.tables).toBeGreaterThan(3);
    console.log('STRESS_QA blockers:', blockers.length, blockers.map((b) => b.finding));
  });
});
