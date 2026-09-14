/**
 * Smart link insert: selected URL becomes [hostname](url).
 * @module features/toolbar/smart-link
 */

import { getSelection, insertLink, replaceSelection } from './utils.js';

const BARE_URL = /^https?:\/\/[^\s]+$/;

export function hostnameFromUrl(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, '') || 'link';
    } catch {
        return 'link';
    }
}

export function smartInsertLink() {
    const selected = String(getSelection() || '').trim();
    if (selected && BARE_URL.test(selected)) {
        replaceSelection(`[${hostnameFromUrl(selected)}](${selected})`);
        return;
    }
    insertLink();
}
