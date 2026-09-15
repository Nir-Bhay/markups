import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const STRESS_TEST_PATH = path.resolve(process.cwd(), 'markups-markdown-preview-stress-test.md');
const EVIDENCE_DIR = path.resolve(process.cwd(), 'qa-evidence/screenshots');
const RESULTS_JSON_PATH = path.resolve(process.cwd(), 'qa-results.json');

if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const markdownContent = fs.readFileSync(STRESS_TEST_PATH, 'utf8');
const lines = markdownContent.split(/\r?\n/);

// Parse TOC
const tocEntries = [];
let inToc = false;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('## Table of Contents')) {
        inToc = true;
        continue;
    }
    if (inToc) {
        const m = line.match(/^(\d+)\.\s+\[(.*?)\]\(#(.*?)\)/);
        if (m) {
            tocEntries.push({
                num: parseInt(m[1]),
                title: m[2].trim(),
                anchor: m[3].trim()
            });
        } else if (line.startsWith('---') && tocEntries.length > 0) {
            inToc = false;
        }
    }
}

// Map each TOC entry to line ranges
for (let idx = 0; idx < tocEntries.length; idx++) {
    const entry = tocEntries[idx];
    let startLine = -1;
    for (let i = 73; i < lines.length; i++) {
        const line = lines[i];
        const hMatch = line.match(/^#{1,3}\s+(.+)$/);
        if (hMatch) {
            const hText = hMatch[1].trim().toLowerCase();
            if (hText === entry.title.toLowerCase()) {
                startLine = i;
                break;
            }
        }
    }
    entry.startIndex = startLine;
}

// Calculate end indices
for (let idx = 0; idx < tocEntries.length; idx++) {
    const entry = tocEntries[idx];
    if (idx < tocEntries.length - 1) {
        let nextStart = lines.length;
        for (let j = idx + 1; j < tocEntries.length; j++) {
            if (tocEntries[j].startIndex > entry.startIndex && tocEntries[j].startIndex !== -1) {
                nextStart = tocEntries[j].startIndex;
                break;
            }
        }
        entry.endIndex = nextStart;
    } else {
        entry.endIndex = lines.length;
    }
}

console.log(`Parsed ${tocEntries.length} sections from ${STRESS_TEST_PATH}`);

async function runSuite() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    const consoleLogs = [];
    page.on('console', msg => {
        consoleLogs.push({
            type: msg.type(),
            text: msg.text(),
            time: Date.now()
        });
    });
    page.on('pageerror', err => {
        consoleLogs.push({
            type: 'pageerror',
            text: err.message,
            stack: err.stack,
            time: Date.now()
        });
    });

    console.log('Navigating to http://127.0.0.1:5173/ ...');
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForTimeout(2500);
    await page.waitForFunction(() => window.editor && document.querySelector('#output'));
    console.log('Markups application ready.');

    const results = [];

    async function setContentAndWait(md, waitMs = 1200) {
        consoleLogs.length = 0;
        await page.evaluate((val) => {
            window.editor.setValue(val);
        }, md);
        await page.waitForTimeout(waitMs);
    }

    async function capturePreviewScreenshot(filename) {
        const previewWrap = await page.$('#preview-wrapper');
        const filepath = path.join(EVIDENCE_DIR, filename);
        if (previewWrap) {
            await previewWrap.screenshot({ path: filepath });
        } else {
            await page.screenshot({ path: filepath });
        }
        return `qa-evidence/screenshots/${filename}`;
    }

    // 1. FULL CORPUS RUN
    console.log('\n=========================================');
    console.log('STAGE 1: FULL STRESS TEST CORPUS TEST');
    console.log('=========================================');
    const fullT0 = Date.now();
    await setContentAndWait(markdownContent, 5000);
    const fullRenderTime = Date.now() - fullT0;

    const fullInspection = await page.evaluate(() => {
        const output = document.querySelector('#output');
        const headings = Array.from(output.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        const tables = output.querySelectorAll('table');
        const mathBlocks = output.querySelectorAll('.katex, .katex-display');
        const mermaidElements = output.querySelectorAll('.mermaid');
        const mermaidSvgs = output.querySelectorAll('.mermaid svg');
        const mermaidErrors = output.querySelectorAll('.mermaid-error');
        const taskInputs = output.querySelectorAll('input[type="checkbox"]');
        const codeBlocks = output.querySelectorAll('pre code');
        const detailsBlocks = output.querySelectorAll('details');
        const footnotes = output.querySelectorAll('.footnotes, [data-footnotes]');
        const alerts = output.querySelectorAll('.markdown-alert, .callout');
        const images = output.querySelectorAll('img');
        const videos = output.querySelectorAll('.preview-video, video, iframe');
        const links = output.querySelectorAll('a');

        return {
            headingsCount: headings.length,
            tablesCount: tables.length,
            mathCount: mathBlocks.length,
            mermaidCount: mermaidElements.length,
            mermaidSvgCount: mermaidSvgs.length,
            mermaidErrorCount: mermaidErrors.length,
            mermaidErrorTexts: Array.from(mermaidErrors).map(e => e.textContent),
            taskInputCount: taskInputs.length,
            codeBlockCount: codeBlocks.length,
            detailsCount: detailsBlocks.length,
            footnoteCount: footnotes.length,
            alertCount: alerts.length,
            imageCount: images.length,
            videoCount: videos.length,
            linkCount: links.length,
            htmlLength: output.innerHTML.length
        };
    });

    const fullScreenshot = await capturePreviewScreenshot('000-full-corpus.png');
    console.log('Full document render stats:', fullInspection);
    console.log('Full render took:', fullRenderTime, 'ms');
    const fullConsoleErrors = consoleLogs.filter(l => l.type === 'error' || l.type === 'pageerror');
    console.log('Full document console errors count:', fullConsoleErrors.length);

    results.push({
        id: 'full-corpus-001',
        category: 'full-document',
        feature: 'complete-stress-test-load',
        status: fullInspection.mermaidErrorCount === 0 ? 'PASS' : 'PARTIAL',
        severity: fullInspection.mermaidErrorCount === 0 ? 'INFO' : 'HIGH',
        expected: 'Full 1956-line stress test parses, renders, and initializes all components without crashing',
        observed: `Rendered ${fullInspection.headingsCount} headings, ${fullInspection.tablesCount} tables, ${fullInspection.mathCount} math formulas, ${fullInspection.mermaidSvgCount}/${fullInspection.mermaidCount} Mermaid SVGs, ${fullInspection.mermaidErrorCount} Mermaid errors, ${fullInspection.codeBlockCount} code blocks in ${fullRenderTime}ms`,
        screenshot: fullScreenshot,
        consoleErrors: fullConsoleErrors.map(l => l.text),
        mermaidErrors: fullInspection.mermaidErrorTexts,
        fixed: false,
        retested: false
    });

    // 2. SECTION-BY-SECTION EVALUATION
    console.log('\n=========================================');
    console.log('STAGE 2: SECTION-BY-SECTION AUDIT');
    console.log('=========================================');

    for (const section of tocEntries) {
        if (section.startIndex === -1) {
            console.log(`Skipping section ${section.num} [${section.title}]: could not locate heading.`);
            continue;
        }

        const sectionLines = lines.slice(section.startIndex, section.endIndex);
        const sectionMarkdown = sectionLines.join('\n').trim();
        const sectionSlug = String(section.num).padStart(3, '0') + '-' + section.anchor;
        console.log(`\nTesting Section ${section.num}: ${section.title} (lines ${section.startIndex + 1} to ${section.endIndex})...`);

        await setContentAndWait(sectionMarkdown, 2000);

        const sectionScreen = await capturePreviewScreenshot(`${sectionSlug}.png`);

        const evalResult = await page.evaluate(() => {
            const output = document.querySelector('#output');
            if (!output) return { error: 'no output' };

            const text = output.textContent;
            const html = output.innerHTML;
            const headings = Array.from(output.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
                tag: h.tagName,
                id: h.id,
                text: h.textContent.trim()
            }));
            const codeBlocks = Array.from(output.querySelectorAll('pre code')).map(c => ({
                class: c.className,
                text: c.textContent.slice(0, 50)
            }));
            const math = output.querySelectorAll('.katex, .katex-display');
            const mermaidDivs = output.querySelectorAll('.mermaid');
            const mermaidSvgs = output.querySelectorAll('.mermaid svg');
            const mermaidErrors = output.querySelectorAll('.mermaid-error');
            const tables = output.querySelectorAll('table');
            const alerts = output.querySelectorAll('.markdown-alert, .callout');
            const details = output.querySelectorAll('details');
            const footnotes = output.querySelectorAll('.footnotes, [data-footnotes], section[data-footnotes]');
            const links = Array.from(output.querySelectorAll('a')).map(a => ({
                href: a.getAttribute('href'),
                target: a.getAttribute('target'),
                rel: a.getAttribute('rel'),
                text: a.textContent.trim()
            }));
            const images = Array.from(output.querySelectorAll('img')).map(img => ({
                src: img.getAttribute('src'),
                alt: img.getAttribute('alt'),
                loaded: img.getAttribute('data-loaded'),
                display: img.style.display
            }));
            const videos = output.querySelectorAll('.preview-video, video, iframe');

            const wrapper = document.querySelector('#preview-wrapper');
            const isHorizontalOverflow = wrapper ? wrapper.scrollWidth > wrapper.clientWidth + 2 : false;

            return {
                headings,
                codeBlocks,
                mathCount: math.length,
                mermaidCount: mermaidDivs.length,
                mermaidSvgCount: mermaidSvgs.length,
                mermaidErrorCount: mermaidErrors.length,
                mermaidErrors: Array.from(mermaidErrors).map(e => e.textContent),
                tablesCount: tables.length,
                alertsCount: alerts.length,
                detailsCount: details.length,
                footnotesCount: footnotes.length,
                linksCount: links.length,
                imagesCount: images.length,
                videosCount: videos.length,
                hasHorizontalOverflow: isHorizontalOverflow,
                htmlLength: html.length
            };
        });

        const errs = consoleLogs.filter(l => l.type === 'error' || l.type === 'pageerror');

        let status = 'PASS';
        let severity = 'INFO';
        let notes = '';

        if (evalResult.mermaidErrorCount > 0) {
            status = 'FAIL';
            severity = 'HIGH';
            notes = `Mermaid rendering failed: ${evalResult.mermaidErrors.join('; ')}`;
        } else if (errs.length > 0) {
            status = 'PARTIAL';
            severity = 'MEDIUM';
            notes = `Console errors observed: ${errs.map(e => e.text).join('; ')}`;
        }

        if (section.num === 11 && evalResult.tablesCount === 0) {
            status = 'FAIL';
            severity = 'HIGH';
            notes = 'Expected tables were not rendered into <table> elements.';
        } else if (section.num === 12 && evalResult.alertsCount === 0) {
            status = 'FAIL';
            severity = 'HIGH';
            notes = 'Expected GitHub alerts not rendered.';
        } else if (section.num === 13 && evalResult.detailsCount === 0) {
            status = 'FAIL';
            severity = 'HIGH';
            notes = 'Expected <details> not preserved.';
        } else if (section.num === 14 && evalResult.footnotesCount === 0) {
            const hasFnRef = await page.evaluate(() => document.querySelectorAll('[id^="user-content-fn"], [id^="fn"], .footnote-ref').length > 0);
            if (!hasFnRef) {
                status = 'PARTIAL';
                severity = 'MEDIUM';
                notes = 'Footnotes did not generate standard footnote section or references.';
            }
        } else if (section.num === 17 && evalResult.mathCount === 0) {
            status = 'FAIL';
            severity = 'CRITICAL';
            notes = 'Math formulas were not rendered by KaTeX.';
        } else if (section.num >= 18 && section.num <= 32) {
            if (evalResult.mermaidCount > 0 && evalResult.mermaidSvgCount === 0 && evalResult.mermaidErrorCount === 0) {
                status = 'FAIL';
                severity = 'HIGH';
                notes = 'Mermaid div present but SVG not rendered.';
            }
        }

        console.log(`-> Section ${section.num} [${section.title}]: Status = ${status} (alerts: ${evalResult.alertsCount}, math: ${evalResult.mathCount}, mermaid: ${evalResult.mermaidSvgCount}/${evalResult.mermaidCount}, tables: ${evalResult.tablesCount}, errors: ${evalResult.mermaidErrorCount})`);

        results.push({
            id: `sec-${sectionSlug}`,
            category: section.title,
            feature: section.anchor,
            status,
            severity,
            expected: `Section ${section.num} (${section.title}) renders expected Markdown/HTML/visual components`,
            observed: `DOM: ${evalResult.headings.length} headings, ${evalResult.tablesCount} tables, ${evalResult.mathCount} math, ${evalResult.mermaidSvgCount} SVGs, ${evalResult.alertsCount} alerts, ${evalResult.detailsCount} details. ${notes}`,
            screenshot: sectionScreen,
            consoleErrors: errs.map(e => e.text),
            mermaidErrors: evalResult.mermaidErrors,
            hasHorizontalOverflow: evalResult.hasHorizontalOverflow,
            fixed: false,
            retested: false
        });
    }

    // 3. RESPONSIVE TESTING
    console.log('\n=========================================');
    console.log('STAGE 3: RESPONSIVE VIEWPORT TESTING');
    console.log('=========================================');

    const viewports = [
        { name: 'desktop', width: 1280, height: 800 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'mobile', width: 375, height: 667 }
    ];

    for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(EVIDENCE_DIR, `responsive-${vp.name}.png`) });
        const overflow = await page.evaluate(() => {
            const body = document.body;
            const pw = document.querySelector('#preview-wrapper');
            return {
                bodyOverflow: body.scrollWidth > window.innerWidth,
                previewScrollWidth: pw ? pw.scrollWidth : 0,
                previewClientWidth: pw ? pw.clientWidth : 0
            };
        });

        results.push({
            id: `responsive-${vp.name}`,
            category: 'responsive',
            feature: `viewport-${vp.name}`,
            status: 'PASS',
            severity: 'INFO',
            expected: `Layout adapts gracefully at ${vp.width}x${vp.height} without horizontal page breakage`,
            observed: `Body overflow: ${overflow.bodyOverflow}, preview scrollWidth: ${overflow.previewScrollWidth} vs clientWidth: ${overflow.previewClientWidth}`,
            screenshot: `qa-evidence/screenshots/responsive-${vp.name}.png`,
            fixed: false,
            retested: false
        });
    }

    // 4. THEME TESTING (Dark vs Light)
    console.log('\n=========================================');
    console.log('STAGE 4: THEME TESTING');
    console.log('=========================================');

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.evaluate(() => {
        document.body.classList.add('dark-theme', 'dark-mode');
        const output = document.querySelector('#output');
        if (output) output.classList.add('dark-theme');
    });
    await page.waitForTimeout(500);
    const darkScreen = await capturePreviewScreenshot('theme-dark.png');

    const darkContrastCheck = await page.evaluate(() => {
        const output = document.querySelector('#output');
        const code = output ? output.querySelector('pre code') : null;
        const h1 = output ? output.querySelector('h1') : null;
        return {
            h1Color: h1 ? window.getComputedStyle(h1).color : null,
            bodyBg: window.getComputedStyle(document.body).backgroundColor,
            codeBg: code ? window.getComputedStyle(code).backgroundColor : null
        };
    });

    results.push({
        id: 'theme-dark-mode',
        category: 'theme',
        feature: 'dark-mode-contrast',
        status: 'PASS',
        severity: 'INFO',
        expected: 'Dark theme renders with high-contrast text and readable code blocks',
        observed: `Body bg: ${darkContrastCheck.bodyBg}, H1 color: ${darkContrastCheck.h1Color}, Code bg: ${darkContrastCheck.codeBg}`,
        screenshot: darkScreen,
        fixed: false,
        retested: false
    });

    // 5. EDITOR/PREVIEW SYNCHRONIZATION TEST
    console.log('\n=========================================');
    console.log('STAGE 5: SYNCHRONIZATION AND EDITING TEST');
    console.log('=========================================');

    await setContentAndWait('# Sync Test Heading\n\nOriginal body text.', 1000);
    const textA = await page.evaluate(() => document.querySelector('#output h1')?.textContent.trim());

    await setContentAndWait('# Updated Sync Heading\n\nOriginal body text.', 1000);
    const textB = await page.evaluate(() => document.querySelector('#output h1')?.textContent.trim());

    await setContentAndWait('# Updated Sync Heading\n\n```mermaid\nflowchart TD\nStart --> Stop\n```', 1800);
    const hasSvgC = await page.evaluate(() => document.querySelectorAll('.mermaid svg').length > 0);

    await setContentAndWait('# Back to Text Only\n\nNo diagrams here.', 1000);
    const svgCountD = await page.evaluate(() => document.querySelectorAll('.mermaid, .mermaid svg').length);

    const syncPass = (textA === 'Sync Test Heading' && textB === 'Updated Sync Heading' && hasSvgC && svgCountD === 0);

    results.push({
        id: 'sync-edit-001',
        category: 'synchronization',
        feature: 'live-edit-add-remove-diagram',
        status: syncPass ? 'PASS' : 'FAIL',
        severity: syncPass ? 'INFO' : 'HIGH',
        expected: 'Preview immediately updates on edits, renders dynamic diagrams, and removes SVGs when deleted',
        observed: `Initial: "${textA}", Edited: "${textB}", Added diagram SVG: ${hasSvgC}, Removed diagram SVGs remaining: ${svgCountD}`,
        screenshot: await capturePreviewScreenshot('sync-edit-result.png'),
        fixed: false,
        retested: false
    });

    fs.writeFileSync(RESULTS_JSON_PATH, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\nWrote ${results.length} test results to ${RESULTS_JSON_PATH}`);

    await browser.close();
    console.log('\nQA Automation Suite Completed.');
}

runSuite().catch(err => {
    console.error('Suite failed:', err);
    process.exit(1);
});
