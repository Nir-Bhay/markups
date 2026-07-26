/**
 * Image resize utility helpers
 * @module features/image-resize/utils
 */

export function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
}

export function uid() {
    return 'ir_' + Math.random().toString(36).slice(2, 9);
}

export function debounce(fn, ms) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(null, args), ms);
    };
}

export function throttle(fn, ms) {
    let last = 0;
    return (...args) => {
        const now = Date.now();
        if (now - last >= ms) {
            last = now;
            fn.apply(null, args);
        }
    };
}

export function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

export function escapeRegex(str) {
    if (!str || str.length > 1000) return '';
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
