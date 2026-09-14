/**
 * Client-side QR codes for share links (no server, no network, no leak).
 * Vendored MIT generator in `./vendor/qrcode.js` — runs fully offline so the
 * shared document never leaves the device for QR rendering.
 * @module services/share/qr
 */

import qrcodeFactory from './vendor/qrcode.js';

// Byte-mode QR v40-L holds 2953 bytes; stay well under for reliable scanning.
export const QR_MAX_CHARS = 2000;

export function qrFits(text) {
    return String(text ?? '').length > 0 && String(text ?? '').length <= QR_MAX_CHARS;
}

/**
 * Build an accessible SVG string for `text`. Throws when too long.
 */
export function buildQrSvg(text, { cellSize = 4, margin = 2 } = {}) {
    const value = String(text ?? '');
    if (!qrFits(value)) {
        throw new Error(
            `Link is ${value.length} chars; QR stays scannable under ${QR_MAX_CHARS}. Use the short public paste link instead.`
        );
    }
    const qr = qrcodeFactory(0, 'M');
    qr.addData(value);
    qr.make();
    return qr.createSvgTag({
        cellSize,
        margin,
        scalable: true,
        title: { text: 'Share link QR code' }
    });
}

/**
 * Render QR svg into a container element. Returns true on success.
 */
export function renderQrInto(container, text) {
    if (!container) return false;
    try {
        container.innerHTML = buildQrSvg(text);
        return true;
    } catch {
        return false;
    }
}

/**
 * Download the currently rendered QR svg as a PNG file.
 */
export async function downloadQrPng(svgString, filename = 'markups-share-qr.png') {
    const svg = String(svgString ?? '');
    if (!svg) throw new Error('No QR to download yet.');
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    try {
        const img = await new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('Could not rasterize the QR image.'));
            image.src = url;
        });
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        const png = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!png) throw new Error('Could not rasterize the QR image.');
        const pngUrl = URL.createObjectURL(png);
        const anchor = document.createElement('a');
        anchor.href = pngUrl;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
    } finally {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}
