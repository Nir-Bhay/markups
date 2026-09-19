/**
 * PDF / image export preparation helpers.
 * Clone preview DOM, strip editor chrome, rasterize Mermaid SVGs for html2canvas.
 * Keeps the live preview untouched and avoids hanging on complex SVG trees.
 */

/** Max canvas edge (px) — caps memory while keeping diagram detail readable. */
const MAX_SVG_EDGE = 2400;
/** Hard pixel budget (~48MP) to avoid OOM on pathological SVGs. */
const MAX_SVG_PIXELS = 12_000_000;
const SVG_LOAD_TIMEOUT_MS = 4000;

/**
 * Adaptive html2canvas scale for tall documents.
 * @param {number} contentHeightPx
 * @returns {number}
 */
export function pickHtml2CanvasScale(contentHeightPx, opts = {}) {
    const h = Number(contentHeightPx) || 0;
    const diagrams = Number(opts.diagramCount) || 0;
    // Diagram-heavy pages cost far more than plain text at the same height.
    if (diagrams >= 10 || h > 45000) return 1.15;
    if (diagrams >= 5 || h > 28000) return 1.25;
    if (h > 16000) return 1.5;
    return 1.75;
}

/**
 * Soft timeout for very large exports (ms).
 * @param {number} contentHeightPx
 * @returns {number}
 */
export function pickExportTimeoutMs(contentHeightPx) {
    const h = Number(contentHeightPx) || 0;
    if (h > 40000) return 180_000;
    if (h > 20000) return 120_000;
    return 90_000;
}

/**
 * Remove interactive preview chrome that must not appear in exports.
 * @param {HTMLElement} root
 */
export function stripExportChrome(root) {
    if (!root) return;
    const junk = root.querySelectorAll([
        '.code-copy-btn',
        '.code-block-header',
        '.preview-video-edit-btn',
        '.video-layout-bar',
        '.video-controls-popover',
        '.preview-video-hitbox',
        '.image-controls-toolbar',
        '.resize-handle',
        '.html2canvas-container',
        '[data-export-ignore]'
    ].join(','));
    junk.forEach((el) => el.remove());

    // Nested iframes/videos cannot be cloned by html2canvas and can throw
    // "Unable to find element in cloned iframe".
    root.querySelectorAll('iframe, video').forEach((el) => {
        const note = document.createElement('p');
        note.setAttribute('data-export-media-placeholder', '');
        note.style.cssText = 'margin:12px 0;padding:12px;border:1px dashed #cbd5e1;color:#64748b;font-size:13px;';
        note.textContent = el.tagName === 'VIDEO' ? '[Video]' : '[Embedded media]';
        el.replaceWith(note);
    });

    root.querySelectorAll('[id]').forEach((el) => {
        el.removeAttribute('id');
    });

    root.querySelectorAll('[contenteditable]').forEach((el) => {
        el.removeAttribute('contenteditable');
    });
    root.querySelectorAll('.preview-video--selected, .preview-image--selected').forEach((el) => {
        el.classList.remove('preview-video--selected', 'preview-image--selected');
    });
}

/**
 * @param {SVGElement} svg
 * @returns {{ width: number, height: number }}
 */
function readSvgSize(svg) {
    const vb = svg.getAttribute('viewBox');
    const attrW = parseFloat(svg.getAttribute('width') || '0');
    const attrH = parseFloat(svg.getAttribute('height') || '0');
    let width = attrW;
    let height = attrH;
    if ((!width || !height) && vb) {
        const parts = vb.split(/[\s,]+/).map(Number);
        if (parts.length === 4) {
            width = width || parts[2];
            height = height || parts[3];
        }
    }
    // Fallback to layout box when attrs missing (clone may lack layout).
    if ((!width || !height) && typeof svg.getBoundingClientRect === 'function') {
        const rect = svg.getBoundingClientRect();
        width = width || rect.width;
        height = height || rect.height;
    }
    width = Math.max(1, Math.round(width || 400));
    height = Math.max(1, Math.round(height || 300));

    // Cap edges / pixels for memory safety without collapsing aspect ratio.
    const scale = Math.min(
        1,
        MAX_SVG_EDGE / width,
        MAX_SVG_EDGE / height,
        Math.sqrt(MAX_SVG_PIXELS / (width * height))
    );
    return {
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale))
    };
}

/**
 * Load an image from a data URL with timeout.
 * @param {string} src
 * @param {AbortSignal} [signal]
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(src, signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new DOMException('Export cancelled', 'AbortError'));
            return;
        }
        const img = new Image();
        const timer = setTimeout(() => {
            cleanup();
            reject(new Error('SVG image load timeout'));
        }, SVG_LOAD_TIMEOUT_MS);

        const onAbort = () => {
            cleanup();
            reject(new DOMException('Export cancelled', 'AbortError'));
        };

        const cleanup = () => {
            clearTimeout(timer);
            img.onload = null;
            img.onerror = null;
            signal?.removeEventListener?.('abort', onAbort);
        };

        img.onload = () => {
            cleanup();
            resolve(img);
        };
        img.onerror = () => {
            cleanup();
            reject(new Error('SVG image failed to load'));
        };
        signal?.addEventListener?.('abort', onAbort, { once: true });
        img.src = src;
    });
}

/**
 * Rasterize Mermaid (and similar) SVGs to PNG <img> for reliable html2canvas.
 * Live preview uses `.mermaid > svg`; MarkdownService uses `.mermaid-diagram > svg`.
 *
 * @param {HTMLElement} container
 * @param {{ signal?: AbortSignal, onProgress?: (done: number, total: number) => void }} [opts]
 * @returns {Promise<{ total: number, converted: number, skipped: number, errors: number }>}
 */
export async function convertMermaidSvgsToImages(container, opts = {}) {
    const { signal, onProgress } = opts;
    const svgList = Array.from(container.querySelectorAll(
        '.mermaid > svg, .mermaid-diagram > svg'
    ));
    const stats = { total: svgList.length, converted: 0, skipped: 0, errors: 0 };
    if (!svgList.length) return stats;

    let done = 0;
    for (const svg of svgList) {
        if (signal?.aborted) {
            throw new DOMException('Export cancelled', 'AbortError');
        }
        try {
            if (!svg.parentNode) {
                stats.skipped++;
                done++;
                onProgress?.(done, stats.total);
                continue;
            }

            const { width, height } = readSvgSize(svg);
            const svgClone = svg.cloneNode(true);
            svgClone.setAttribute('width', String(width));
            svgClone.setAttribute('height', String(height));
            if (!svgClone.getAttribute('xmlns')) {
                svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            }

            const svgData = new XMLSerializer().serializeToString(svgClone);
            // Defense: never embed raw scriptable foreign markup into export canvas path.
            if (/<script[\s>]/i.test(svgData)) {
                stats.skipped++;
                done++;
                onProgress?.(done, stats.total);
                continue;
            }

            const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;
            const tmpImg = await loadImage(svgDataUrl, signal);

            const canvas = document.createElement('canvas');
            // 2x for retina sharpness inside PDF/PNG without full-page scale 2 cost.
            const pixelRatio = 2;
            canvas.width = width * pixelRatio;
            canvas.height = height * pixelRatio;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                stats.skipped++;
                done++;
                onProgress?.(done, stats.total);
                continue;
            }
            ctx.scale(pixelRatio, pixelRatio);
            ctx.drawImage(tmpImg, 0, 0, width, height);

            const imgEl = document.createElement('img');
            imgEl.src = canvas.toDataURL('image/png');
            imgEl.alt = svg.getAttribute('aria-label') || 'Diagram';
            imgEl.style.maxWidth = '100%';
            imgEl.style.height = 'auto';
            imgEl.setAttribute('data-export-raster', 'mermaid');
            svg.parentNode.replaceChild(imgEl, svg);
            stats.converted++;
        } catch (e) {
            if (e?.name === 'AbortError') throw e;
            console.warn('SVG conversion skipped:', e);
            stats.errors++;
            stats.skipped++;
        }
        done++;
        onProgress?.(done, stats.total);
    }
    return stats;
}

/**
 * Off-screen workbench clone of preview content for export.
 * @param {HTMLElement} sourceElement
 * @param {{ widthCss: string, className?: string }} options
 * @returns {HTMLElement}
 */
export function createExportWorkbench(sourceElement, { widthCss, className = 'markdown-body' } = {}) {
    const host = document.createElement('div');
    host.setAttribute('data-export-host', 'true');
    // Stay in the layout viewport so html2canvas can clone the node, but clip
    // so the live editor is not covered. Loading overlay sits above this.
    host.style.cssText = [
        'position:fixed',
        'left:0',
        'top:0',
        'width:8.5in',
        'height:64px',
        'overflow:hidden',
        'pointer-events:none',
        'z-index:0'
    ].join(';');

    const workbench = document.createElement('div');
    workbench.className = className;
    workbench.setAttribute('data-export-workbench', 'true');
    workbench.style.cssText = [
        'position:relative',
        'left:0',
        'top:0',
        `width:${widthCss || '7.5in'}`,
        'background:#ffffff',
        'color:#24292e',
        'padding:0',
        'margin:0',
        'pointer-events:none',
        'overflow:visible'
    ].join(';');

    const clone = sourceElement.cloneNode(true);
    stripExportChrome(clone);
    workbench.appendChild(clone);
    host.appendChild(workbench);
    document.body.appendChild(host);
    return workbench;
}

/**
 * Remove workbench node if still attached.
 * @param {HTMLElement | null} workbench
 */
export function destroyExportWorkbench(workbench) {
    const host = workbench?.closest?.('[data-export-host]') || workbench;
    if (host?.parentNode) {
        host.parentNode.removeChild(host);
    }
}

const KEEP_IN_CLONE = new Set(['HTML', 'HEAD', 'BODY', 'STYLE', 'LINK', 'META', 'TITLE']);

export function isHtml2CanvasCloneError(err) {
    return /cloned iframe|Unable to find element/i.test(String(err?.message || err || ''));
}

/**
 * html2canvas clones the whole document. Ignore app chrome (Monaco, etc.) so
 * the clone iframe can still locate the export subtree.
 * @param {Element} el
 * @param {HTMLElement} root
 * @returns {boolean}
 */
export function ignoreElementsOutsideSubtree(el, root) {
    if (!el || el === root) return false;
    const tag = (el.tagName || '').toUpperCase();
    if (KEEP_IN_CLONE.has(tag)) return false;
    if (root.contains(el)) return false;
    // Never skip ancestors — ignoring the export host drops the workbench
    // from the clone iframe ("Unable to find element in cloned iframe").
    if (typeof el.contains === 'function' && el.contains(root)) return false;
    return true;
}

/**
 * Capture a DOM subtree with html2canvas, retrying without crop options if
 * the clone iframe cannot locate the element.
 * @param {(el: HTMLElement, opts: object) => Promise<HTMLCanvasElement>} html2canvas
 * @param {HTMLElement} root
 * @param {object} [opts]
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function captureSubtreeCanvas(html2canvas, root, opts = {}) {
    const { extraIgnore, ...rest } = opts;
    const ignore = (el) => ignoreElementsOutsideSubtree(el, root) || Boolean(extraIgnore?.(el));

    const onclone = (clonedDoc) => {
        const clonedRoot = clonedDoc.querySelector('[data-export-workbench="true"]') || clonedDoc.body;
        const host = clonedRoot?.closest?.('[data-export-host]');
        if (host) {
            host.style.height = 'auto';
            host.style.overflow = 'visible';
            host.style.opacity = '1';
        }
        if (typeof rest.onclone === 'function') rest.onclone(clonedDoc);
    };

    const base = {
        useCORS: true,
        allowTaint: false,
        logging: false,
        letterRendering: false,
        backgroundColor: '#ffffff',
        imageTimeout: 10_000,
        removeContainer: true,
        ignoreElements: ignore,
        onclone,
        ...rest,
        ignoreElements: ignore,
        onclone
    };

    try {
        return await html2canvas(root, base);
    } catch (err) {
        if (!isHtml2CanvasCloneError(err)) throw err;
        return await html2canvas(root, {
            ...base,
            x: 0,
            y: rest.y || 0,
            width: rest.width,
            height: rest.height,
            windowWidth: Math.max(root.scrollWidth || rest.width || 800, 800),
            windowHeight: Math.max(root.scrollHeight || rest.height || 600, 600),
            ignoreElements: (el) => ignoreElementsOutsideSubtree(el, root)
        });
    }
}

/**
 * Race a promise against abort + timeout.
 * @template T
 * @param {Promise<T>} promise
 * @param {{ signal?: AbortSignal, timeoutMs?: number, label?: string }} opts
 * @returns {Promise<T>}
 */
export function raceExportJob(promise, { signal, timeoutMs = 90_000, label = 'Export' } = {}) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new DOMException('Export cancelled', 'AbortError'));
            return;
        }

        let settled = false;
        const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)}s. Try a shorter document or HTML export.`));
        }, timeoutMs);

        const onAbort = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            reject(new DOMException('Export cancelled', 'AbortError'));
        };

        signal?.addEventListener?.('abort', onAbort, { once: true });

        promise.then(
            (value) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                signal?.removeEventListener?.('abort', onAbort);
                resolve(value);
            },
            (err) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                signal?.removeEventListener?.('abort', onAbort);
                reject(err);
            }
        );
    });
}

function yieldToMain() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Stamp absolute Y bands on block boxes so page renders can skip off-screen nodes.
 * @param {HTMLElement} root
 */
export function annotateExportBands(root) {
    if (!root) return;
    const rootRect = root.getBoundingClientRect();
    const nodes = root.querySelectorAll('body, div, section, article, p, h1, h2, h3, h4, h5, h6, pre, table, ul, ol, blockquote, hr, img, svg, .mermaid, .mermaid-diagram, .katex-display, .katex, li, tr');
    nodes.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (!rect.width && !rect.height) return;
        const top = Math.round(rect.top - rootRect.top);
        const bottom = Math.round(rect.bottom - rootRect.top);
        el.setAttribute('data-export-top', String(top));
        el.setAttribute('data-export-bottom', String(bottom));
    });
}

/**
 * Page-by-page PDF render so cancel/timeout can run and memory stays bounded.
 * Maps workbench CSS pixels → PDF inches using content width.
 *
 * @param {HTMLElement} workbench
 * @param {object} opts
 * @param {(el: HTMLElement, opts: object) => Promise<HTMLCanvasElement>} opts.html2canvas
 * @param {typeof import('jspdf').jsPDF} opts.JsPDF
 * @param {string|number[]} opts.format
 * @param {'portrait'|'landscape'} opts.orientation
 * @param {[number, number, number, number]} opts.margin - [top, right, bottom, left] inches
 * @param {number} opts.scale
 * @param {number} [opts.quality]
 * @param {boolean} [opts.pageNumbers]
 * @param {AbortSignal} [opts.signal]
 * @param {(page: number, totalGuess: number) => void} [opts.onProgress]
 * @returns {Promise<import('jspdf').jsPDF>}
 */
export async function renderWorkbenchToPdf(workbench, opts) {
    const {
        html2canvas,
        JsPDF,
        format = 'letter',
        orientation = 'portrait',
        margin = [0.5, 0.5, 0.5, 0.5],
        scale = 1.5,
        quality = 0.92,
        pageNumbers = true,
        signal,
        onProgress
    } = opts;

    if (signal?.aborted) {
        throw new DOMException('Export cancelled', 'AbortError');
    }

    const pdf = new JsPDF({ unit: 'in', format, orientation });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const [mTop, mRight, mBottom, mLeft] = margin;
    const usableW = Math.max(0.5, pageW - mLeft - mRight);
    const usableH = Math.max(0.5, pageH - mTop - mBottom);

    // Ensure workbench has a stable layout width before measuring.
    const workbenchWidthPx = Math.max(1, workbench.scrollWidth || workbench.offsetWidth || 720);
    const totalHeight = Math.max(1, workbench.scrollHeight || workbench.offsetHeight || 1);
    // CSS px that fit one PDF content page (width maps to usableW inches).
    const slicePx = Math.max(200, Math.floor(usableH * (workbenchWidthPx / usableW)));
    const totalGuess = Math.max(1, Math.ceil(totalHeight / slicePx));

    annotateExportBands(workbench);
    await yieldToMain();

    let y = 0;
    let pageIndex = 0;

    while (y < totalHeight - 0.5) {
        if (signal?.aborted) {
            throw new DOMException('Export cancelled', 'AbortError');
        }

        const sliceHeight = Math.min(slicePx, totalHeight - y);
        const bandTop = y;
        const bandBottom = y + sliceHeight;
        onProgress?.(pageIndex + 1, totalGuess);

        // Capture only this vertical band. ignoreElements skips off-band boxes so
        // html2canvas does not re-paint the entire tall document every page.
        const canvas = await captureSubtreeCanvas(html2canvas, workbench, {
            scale,
            x: 0,
            y,
            width: workbenchWidthPx,
            height: sliceHeight,
            windowWidth: workbenchWidthPx,
            windowHeight: Math.max(sliceHeight, 400),
            scrollX: 0,
            scrollY: 0,
            extraIgnore: (el) => {
                if (el.getAttribute?.('data-export-ignore') != null) return true;
                const top = Number(el.getAttribute?.('data-export-top'));
                const bottom = Number(el.getAttribute?.('data-export-bottom'));
                if (!Number.isFinite(top) || !Number.isFinite(bottom)) return false;
                return bottom < bandTop - 2 || top > bandBottom + 2;
            }
        });

        if (signal?.aborted) {
            throw new DOMException('Export cancelled', 'AbortError');
        }

        const imgData = canvas.toDataURL('image/jpeg', quality);
        if (pageIndex > 0) pdf.addPage();

        const imgHeightIn = (sliceHeight / workbenchWidthPx) * usableW;
        pdf.addImage(imgData, 'JPEG', mLeft, mTop, usableW, Math.min(imgHeightIn, usableH + 0.01));

        pageIndex += 1;
        y += sliceHeight;
        await yieldToMain();
    }

    if (pageNumbers && pageIndex > 0) {
        for (let i = 1; i <= pageIndex; i++) {
            if (signal?.aborted) {
                throw new DOMException('Export cancelled', 'AbortError');
            }
            pdf.setPage(i);
            pdf.setFontSize(9);
            pdf.setTextColor(128);
            pdf.text(`Page ${i} of ${pageIndex}`, pageW / 2, pageH - 0.3, { align: 'center' });
        }
    }

    return pdf;
}

export default {
    pickHtml2CanvasScale,
    pickExportTimeoutMs,
    stripExportChrome,
    convertMermaidSvgsToImages,
    createExportWorkbench,
    destroyExportWorkbench,
    raceExportJob,
    annotateExportBands,
    renderWorkbenchToPdf,
    captureSubtreeCanvas,
    ignoreElementsOutsideSubtree,
    isHtml2CanvasCloneError
};
