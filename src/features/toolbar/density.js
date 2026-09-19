/**
 * Responsive toolbar density controller.
 * Keeps the static production toolbar one-click friendly while allowing
 * users to reveal secondary groups on smaller screens.
 * @module features/toolbar/density
 */

import { prefs } from './preferences.js';

const DENSITIES = new Set(['compact', 'default', 'expanded']);
const SECONDARY_SELECTORS = [
    '.toolbar-tools-group',
    '.toolbar-modes-group',
    '.toolbar-extras-group',
];

let initialized = false;
let resizeHandler = null;

function isMobileViewport() {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
}

function isSmallViewport() {
    return typeof window !== 'undefined' && window.innerWidth <= 900;
}

function resolveDensity(value = prefs.density) {
    if (DENSITIES.has(value)) return value;
    if (isMobileViewport()) return 'compact';
    return isSmallViewport() ? 'compact' : 'expanded';
}

function setSecondaryVisibility(toolbar, density) {
    const shouldShow = density === 'expanded';
    SECONDARY_SELECTORS.forEach((selector) => {
        toolbar.querySelectorAll(selector).forEach((group) => {
            group.classList.toggle('toolbar-density-hidden', !shouldShow);
        });
    });
    toolbar.querySelectorAll('.toolbar-secondary-divider').forEach((divider) => {
        divider.classList.toggle('toolbar-density-hidden', !shouldShow);
    });
}

function updateTrigger(trigger, density) {
    if (!trigger) return;
    const expanded = density === 'expanded';
    trigger.setAttribute('aria-expanded', String(expanded));
    trigger.setAttribute('aria-label', expanded ? 'Collapse toolbar' : 'Expand toolbar');
    trigger.title = expanded ? 'Collapse toolbar' : 'Expand toolbar';
    trigger.classList.toggle('active', expanded);
}

export function applyToolbarDensity(density, { persist = true } = {}) {
    const toolbar = document.getElementById('toolbar');
    const trigger = document.getElementById('toolbar-density-toggle');
    if (!toolbar) return resolveDensity(density);

    const next = DENSITIES.has(density) ? density : resolveDensity(density);
    toolbar.dataset.toolbarDensity = next;
    toolbar.classList.toggle('toolbar-expanded', next === 'expanded');
    toolbar.classList.toggle('toolbar-compact', next !== 'expanded');
    setSecondaryVisibility(toolbar, next);
    updateTrigger(trigger, next);
    if (persist) prefs.setDensity(next);
    return next;
}

export function initToolbarDensity() {
    if (initialized || typeof document === 'undefined') return;
    const toolbar = document.getElementById('toolbar');
    const trigger = document.getElementById('toolbar-density-toggle');
    if (!toolbar || !trigger) return;

    initialized = true;
    // Mobile: always start collapsed (single row). Desktop uses saved/auto density.
    const initial = isMobileViewport() ? 'compact' : resolveDensity();
    applyToolbarDensity(initial, { persist: false });

    trigger.addEventListener('click', (event) => {
        event.preventDefault();
        const current = toolbar.dataset.toolbarDensity || initial;
        applyToolbarDensity(current === 'expanded' ? 'compact' : 'expanded');
    });

    resizeHandler = () => {
        if (isMobileViewport()) {
            // Keep whatever the user chose this session; don't auto-expand on rotate
            if (!toolbar.dataset.toolbarDensity) {
                applyToolbarDensity('compact', { persist: false });
            }
            return;
        }
        if (prefs.density !== 'auto') return;
        applyToolbarDensity(resolveDensity('auto'), { persist: false });
    };
    window.addEventListener('resize', resizeHandler);
}

export function resetToolbarDensityForTests() {
    initialized = false;
    if (resizeHandler && typeof window !== 'undefined') {
        window.removeEventListener('resize', resizeHandler);
    }
    resizeHandler = null;
}

export { DENSITIES };
