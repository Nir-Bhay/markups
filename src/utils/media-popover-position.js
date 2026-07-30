/**
 * Position a fixed media layout bar next to its anchor element.
 * Measures after temporarily making the popover measurable (even if hidden).
 * Prefers above/below based on available viewport space and flips when needed.
 *
 * @param {HTMLElement} popover
 * @param {HTMLElement} anchor
 * @param {{ gap?: number, prefer?: 'above' | 'below', margin?: number }} [options]
 */
export function positionMediaPopover(popover, anchor, options = {}) {
    if (!popover || !anchor) return;

    const gap = Number.isFinite(options.gap) ? options.gap : 10;
    const prefer = options.prefer === 'below' ? 'below' : 'above';
    const margin = Number.isFinite(options.margin) ? options.margin : 12;

    // Stay below app chrome (header + formatting toolbar) when possible.
    let chromeBottom = margin;
    const header = typeof document !== 'undefined' ? document.querySelector('.premium-header') : null;
    const formatBar = typeof document !== 'undefined' ? document.querySelector('.premium-toolbar') : null;
    if (header) chromeBottom = Math.max(chromeBottom, header.getBoundingClientRect().bottom + 8);
    if (formatBar) {
        const barRect = formatBar.getBoundingClientRect();
        if (barRect.height > 0) chromeBottom = Math.max(chromeBottom, barRect.bottom + 8);
    }

    const wasHidden = popover.classList.contains('hidden');
    const prevVisibility = popover.style.visibility;
    if (wasHidden) {
        popover.style.visibility = 'hidden';
        popover.classList.remove('hidden');
    }

    const rect = anchor.getBoundingClientRect();
    const toolbarRect = popover.getBoundingClientRect();
    const width = toolbarRect.width || popover.offsetWidth || 280;
    const height = toolbarRect.height || popover.offsetHeight || 44;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const spaceAbove = rect.top - chromeBottom;
    const spaceBelow = vh - rect.bottom - margin;
    let placeBelow = prefer === 'below';
    if (prefer === 'above' && spaceAbove < height + gap && spaceBelow > spaceAbove) {
        placeBelow = true;
    } else if (prefer === 'below' && spaceBelow < height + gap && spaceAbove > spaceBelow) {
        placeBelow = false;
    }

    let top = placeBelow
        ? rect.bottom + gap
        : rect.top - height - gap;
    top = Math.min(Math.max(chromeBottom, top), Math.max(chromeBottom, vh - height - margin));

    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.min(Math.max(margin, left), Math.max(margin, vw - width - margin));

    popover.style.top = `${Math.round(top)}px`;
    popover.style.left = `${Math.round(left)}px`;
    popover.dataset.placement = placeBelow ? 'below' : 'above';

    if (wasHidden) {
        popover.classList.add('hidden');
        popover.style.visibility = prevVisibility;
    }
}
