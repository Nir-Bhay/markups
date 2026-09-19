/**
 * Premium toolbar chrome: menus, dead-control fixes, format toggle state.
 * Does not re-render #toolbar and does not rewrite wrapSelection.
 * @module features/toolbar/chrome
 */

import {
    DIAGRAM_PRESETS,
    TOOLBAR_CUSTOMIZATION_GROUPS,
    TOOLBAR_HELP,
} from './catalog.js';
import { prefs } from './preferences.js';
import { smartInsertLink } from './smart-link.js';
import {
    insertText,
    prefixLine,
    resolveEditor,
    wrapSelection,
} from './utils.js';

let bound = false;
let formatListener = null;
let onDocDown = null;
let onKeyDown = null;
let onResize = null;
let tooltipEl = null;
let tooltipTrigger = null;

const POPOVER_KEEP_OPEN = new Set(['toolbar-video', 'toolbar-table', 'callout-dropdown-btn']);

function closeAllMenus() {
    document.querySelectorAll('.toolbar-menu.is-open').forEach((menu) => {
        menu.classList.remove('is-open');
        menu.setAttribute('hidden', '');
    });
    document.querySelectorAll('.toolbar-btn-menu[aria-expanded="true"]').forEach((btn) => {
        btn.setAttribute('aria-expanded', 'false');
    });
    const customize = document.getElementById('toolbar-customize-sheet');
    if (customize) {
        customize.classList.remove('is-open');
        customize.setAttribute('hidden', '');
    }
    document.getElementById('toolbar-customize')?.setAttribute('aria-expanded', 'false');
}

function positionMenu(trigger, menu, align = 'start') {
    const rect = trigger.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${Math.round(rect.bottom + 6)}px`;
    menu.style.right = 'auto';
    menu.style.left = `${Math.round(rect.left)}px`;

    const width = menu.offsetWidth || 220;
    if (align === 'end' || rect.left + width > window.innerWidth - 8) {
        menu.style.left = 'auto';
        menu.style.right = '8px';
    }
}

function bindMenuKeyboard(menu) {
    menu.addEventListener('keydown', (event) => {
        const items = [...menu.querySelectorAll('[role="menuitem"]')];
        if (!items.length) return;
        const index = Math.max(0, items.indexOf(document.activeElement));

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            items[(index + 1) % items.length]?.focus();
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            items[(index - 1 + items.length) % items.length]?.focus();
        } else if (event.key === 'Home') {
            event.preventDefault();
            items[0]?.focus();
        } else if (event.key === 'End') {
            event.preventDefault();
            items[items.length - 1]?.focus();
        }
    });
}

function bindMenu(triggerId, menuId) {
    const trigger = document.getElementById(triggerId);
    const menu = document.getElementById(menuId);
    if (!trigger || !menu) return;

    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-controls', menuId);
    trigger.setAttribute('aria-expanded', 'false');

    trigger.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const open = menu.classList.contains('is-open');
        closeAllMenus();
        if (!open) {
            menu.classList.add('is-open');
            menu.removeAttribute('hidden');
            trigger.setAttribute('aria-expanded', 'true');
            positionMenu(trigger, menu);
            menu.querySelector('[role="menuitem"]')?.focus();
        }
    });

    menu.addEventListener('click', (event) => {
        const item = event.target.closest('[role="menuitem"]');
        if (item && POPOVER_KEEP_OPEN.has(item.id)) {
            requestAnimationFrame(() => closeAllMenus());
            return;
        }
        closeAllMenus();
    });

    bindMenuKeyboard(menu);
}

function applyHiddenPrefs() {
    const hidden = prefs.hiddenButtons || [];
    document.querySelectorAll('#toolbar [data-toolbar-id]').forEach((el) => {
        const id = el.getAttribute('data-toolbar-id');
        el.classList.toggle('toolbar-pref-hidden', hidden.includes(id));
        el.hidden = hidden.includes(id);
    });
}

function updateFormatToggles() {
    const editor = resolveEditor();
    const bold = document.getElementById('toolbar-bold');
    const italic = document.getElementById('toolbar-italic');
    const strike = document.getElementById('toolbar-strikethrough');
    if (!editor || !bold) return;

    const model = editor.getModel?.();
    const selection = editor.getSelection?.();
    if (!model || !selection) return;

    const startLine = model.getLineContent(selection.startLineNumber);
    const endLine = model.getLineContent(selection.endLineNumber);
    const before = startLine.slice(Math.max(0, selection.startColumn - 3), selection.startColumn - 1);
    const after = endLine.slice(selection.endColumn - 1, selection.endColumn + 2);

    bold.classList.toggle('active', before.endsWith('**') && after.startsWith('**'));
    italic.classList.toggle(
        'active',
        (before.endsWith('*') && after.startsWith('*') && !before.endsWith('**'))
    );
    strike?.classList.toggle('active', before.endsWith('~~') && after.startsWith('~~'));
}

function bindFormatToggles() {
    const editor = resolveEditor();
    if (!editor?.onDidChangeCursorSelection) return;
    formatListener?.dispose?.();
    formatListener = editor.onDidChangeCursorSelection(() => updateFormatToggles());
    updateFormatToggles();
}

function bindInsertExtras() {
    document.getElementById('toolbar-hr')?.addEventListener('click', () => {
        insertText('\n---\n');
    });
    document.getElementById('toolbar-h4')?.addEventListener('click', () => prefixLine('#### '));
    document.getElementById('toolbar-h5')?.addEventListener('click', () => prefixLine('##### '));
    document.getElementById('toolbar-h6')?.addEventListener('click', () => prefixLine('###### '));
    document.getElementById('toolbar-math')?.addEventListener('click', () => wrapSelection('$', '$'));
    document.getElementById('toolbar-math-block')?.addEventListener('click', () => {
        wrapSelection('\n$$\n', '\n$$\n');
    });
    document.getElementById('toolbar-footnote')?.addEventListener('click', () => {
        insertText('[^1]\n\n[^1]: Footnote text');
    });
    document.getElementById('toolbar-frontmatter')?.addEventListener('click', () => {
        insertText('---\ntitle: \ndescription: \n---\n\n');
    });
    document.getElementById('toolbar-cite')?.addEventListener('click', () => {
        insertText('[@citekey]');
    });
    document.getElementById('toolbar-details')?.addEventListener('click', () => {
        insertText('\n<details>\n<summary>More</summary>\n\nHidden content\n\n</details>\n');
    });
    document.getElementById('toolbar-video')?.addEventListener('click', () => {
        requestAnimationFrame(() => closeAllMenus());
    });

    DIAGRAM_PRESETS.forEach((preset) => {
        document.getElementById(`toolbar-diagram-${preset.id}`)?.addEventListener('click', () => {
            insertText(preset.insert);
        });
    });
}

function bindCustomize() {
    const btn = document.getElementById('toolbar-customize');
    const panel = document.getElementById('toolbar-customize-sheet');
    if (!btn || !panel) return;

    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-controls', panel.id);
    btn.setAttribute('aria-expanded', 'false');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');

    const list = panel.querySelector('[data-toolbar-customize-list]');
    if (list && list.childElementCount === 0) {
        TOOLBAR_CUSTOMIZATION_GROUPS.forEach(({ id, label, description }) => {
            const labelEl = document.createElement('label');
            labelEl.className = 'toolbar-customize-option';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.dataset.hideId = id;
            input.checked = !(prefs.hiddenButtons || []).includes(id);
            const copy = document.createElement('span');
            copy.className = 'toolbar-customize-copy';
            const title = document.createElement('strong');
            title.textContent = label;
            const help = document.createElement('small');
            help.textContent = description;
            copy.append(title, help);
            labelEl.append(input, copy);
            list.appendChild(labelEl);
        });
    }

    const setOpen = (isOpen) => {
        panel.classList.toggle('is-open', isOpen);
        panel.hidden = !isOpen;
        btn.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) {
            panel.querySelector('input')?.focus();
        } else if (panel.contains(document.activeElement)) {
            btn.focus({ preventScroll: true });
        }
    };

    btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const open = panel.classList.contains('is-open');
        closeAllMenus();
        setOpen(!open);
        if (!open) positionMenu(btn, panel, 'end');
    });

    panel.querySelectorAll('input[data-hide-id]').forEach((input) => {
        const id = input.getAttribute('data-hide-id');
        input.checked = !(prefs.hiddenButtons || []).includes(id);
        input.addEventListener('change', () => {
            prefs.toggleButtonVisibility(id);
            applyHiddenPrefs();
        });
    });

    panel.querySelector('[data-toolbar-preset="essentials"]')?.addEventListener('click', () => {
        prefs.setHiddenButtons(['headings', 'tools', 'modes', 'extras']);
        panel.querySelectorAll('input[data-hide-id]').forEach((input) => {
            input.checked = !prefs.hiddenButtons.includes(input.dataset.hideId);
        });
        applyHiddenPrefs();
    });
    panel.querySelector('[data-toolbar-preset="full"]')?.addEventListener('click', () => {
        prefs.setHiddenButtons([]);
        panel.querySelectorAll('input[data-hide-id]').forEach((input) => {
            input.checked = true;
        });
        applyHiddenPrefs();
    });
    panel.querySelector('[data-toolbar-preset="reset"]')?.addEventListener('click', () => {
        prefs.resetToolbar();
        panel.querySelectorAll('input[data-hide-id]').forEach((input) => {
            input.checked = true;
        });
        applyHiddenPrefs();
    });
}

function isToolbarChromeTarget(target) {
    if (!(target instanceof Node)) return false;
    return Boolean(target.closest?.(
        '.toolbar-menu-wrap, .toolbar-menu, .toolbar-overflow-sheet, .toolbar-overflow-btn, #toolbar-customize, #toolbar-customize-sheet'
    ));
}

function ensureTooltip() {
    if (tooltipEl) return tooltipEl;
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'toolbar-tooltip';
    tooltipEl.className = 'toolbar-tooltip';
    tooltipEl.setAttribute('role', 'tooltip');
    tooltipEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tooltipEl);
    return tooltipEl;
}

function showToolbarTooltip(trigger) {
    if (!trigger || trigger.hidden || trigger.disabled) return;
    const label = trigger.getAttribute('aria-label') || trigger.title;
    if (!label) return;

    const tooltip = ensureTooltip();
    const description = trigger.dataset.tooltipDescription
        || TOOLBAR_HELP[trigger.id]
        || `Use ${label.toLowerCase()} on the current document.`;
    const shortcut = trigger.dataset.shortcut;
    tooltip.replaceChildren();

    const title = document.createElement('strong');
    title.textContent = label;
    const detail = document.createElement('span');
    detail.textContent = description;
    tooltip.append(title, detail);
    if (shortcut) {
        const key = document.createElement('kbd');
        key.textContent = shortcut;
        tooltip.appendChild(key);
    }

    tooltipTrigger = trigger;
    tooltip.setAttribute('aria-hidden', 'false');
    const rect = trigger.getBoundingClientRect();
    tooltip.style.left = `${Math.max(8, Math.min(
        window.innerWidth - tooltip.offsetWidth - 8,
        rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)
    ))}px`;
    tooltip.style.top = `${Math.min(
        window.innerHeight - tooltip.offsetHeight - 8,
        rect.bottom + 8
    )}px`;
}

function hideToolbarTooltip(trigger = null) {
    if (trigger && tooltipTrigger !== trigger) return;
    if (tooltipEl) {
        tooltipEl.setAttribute('aria-hidden', 'true');
        tooltipEl.style.left = '-9999px';
    }
    tooltipTrigger = null;
}

function bindToolbarTooltips() {
    const toolbar = document.getElementById('toolbar');
    if (!toolbar) return;
    ensureTooltip();
    toolbar.querySelectorAll('button').forEach((button) => {
        const description = TOOLBAR_HELP[button.id];
        if (description && !button.dataset.tooltipDescription) {
            button.dataset.tooltipDescription = description;
        }
        if (button.title && !button.getAttribute('aria-label')) {
            button.setAttribute('aria-label', button.title);
        }
        button.setAttribute('aria-describedby', 'toolbar-tooltip');
        button.addEventListener('click', () => hideToolbarTooltip(button));
        button.addEventListener('pointerenter', () => showToolbarTooltip(button));
        button.addEventListener('pointerleave', () => hideToolbarTooltip(button));
        button.addEventListener('focus', () => showToolbarTooltip(button));
        button.addEventListener('blur', () => hideToolbarTooltip(button));
    });
}

export function initPremiumToolbarChrome() {
    if (bound || typeof document === 'undefined') return;
    if (!document.getElementById('toolbar')) return;
    bound = true;

    bindMenu('toolbar-heading-menu', 'toolbar-heading-menu-sheet');
    bindMenu('toolbar-insert-menu', 'toolbar-insert-menu-sheet');
    bindInsertExtras();
    bindCustomize();
    applyHiddenPrefs();
    bindToolbarTooltips();

    document.getElementById('toolbar-overflow-btn')?.addEventListener('click', () => {
        closeAllMenus();
    });

    onDocDown = (event) => {
        if (isToolbarChromeTarget(event.target)) return;
        closeAllMenus();
    };
    onKeyDown = (event) => {
        if (event.key === 'Escape') closeAllMenus();
    };
    onResize = () => closeAllMenus();

    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);

    bindFormatToggles();
    setTimeout(bindFormatToggles, 400);
}

export function resetPremiumToolbarChromeForTests() {
    bound = false;
    formatListener?.dispose?.();
    formatListener = null;
    if (onDocDown) document.removeEventListener('mousedown', onDocDown);
    if (onKeyDown) document.removeEventListener('keydown', onKeyDown);
    if (onResize) window.removeEventListener('resize', onResize);
    onDocDown = null;
    onKeyDown = null;
    onResize = null;
    hideToolbarTooltip();
    tooltipEl?.remove();
    tooltipEl = null;
}

export { smartInsertLink };
