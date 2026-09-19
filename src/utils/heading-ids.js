/**
 * GFM-style heading slug + duplicate uniquify for live preview / TOC.
 * First occurrence: "repeated"; then "repeated-1", "repeated-2", …
 */

export function slugifyHeading(text) {
    return String(text || '')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * @returns {(text: string) => string}
 */
export function createHeadingIdAllocator() {
    const counts = new Map();
    return (text) => {
        const base = slugifyHeading(text) || 'heading';
        const n = counts.get(base) || 0;
        counts.set(base, n + 1);
        return n === 0 ? base : `${base}-${n}`;
    };
}
