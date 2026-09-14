/**
 * Share services index (no-server, free-first).
 * @module services/share
 */

export * from './linkShare.js';
export * from './fileShare.js';
export * from './pasteFallback.js';
export { buildQrSvg, qrFits, QR_MAX_CHARS } from './qr.js';
