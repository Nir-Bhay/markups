import { db } from './database.js';
import { sanitizeSvgToDataUrl, validateImageSignature } from '../../utils/file.js';

const ID_PATTERN = /^img_[a-zA-Z0-9_]{1,120}$/;
const REF_PATTERN = /markups-img:(img_\w+)/g;
export const MAX_LOCAL_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_LOCAL_MEDIA_TOTAL_BYTES = 100 * 1024 * 1024;
export const MAX_PORTABLE_MARKDOWN_BYTES = 20 * 1024 * 1024;

export function imageDataToBlob(value) {
    if (typeof value !== 'string' || value.length > MAX_LOCAL_IMAGE_BYTES * 1.4 + 256) {
        throw new Error('Image exceeds the local image limit.');
    }
    const match = /^data:(image\/(?:png|jpeg|gif|webp|svg\+xml));base64,([A-Za-z0-9+/]*={0,2})$/.exec(value);
    if (!match) throw new Error('Unsupported or invalid image data.');
    let bytes = Uint8Array.from(atob(match[2]), c => c.charCodeAt(0));
    if (!bytes.length || bytes.length > MAX_LOCAL_IMAGE_BYTES) throw new Error('Image exceeds the local image limit.');
    if (match[1] === 'image/svg+xml') {
        const clean = sanitizeSvgToDataUrl(new TextDecoder().decode(bytes));
        if (!clean) throw new Error('SVG contains no safe image content.');
        bytes = Uint8Array.from(atob(clean.split(',')[1]), c => c.charCodeAt(0));
    } else if (!validateImageSignature(bytes, match[1])) {
        throw new Error('Image contents do not match its type.');
    }
    return new Blob([bytes], { type: match[1] });
}

export function blobToImageData(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read the saved image.'));
        reader.readAsDataURL(blob);
    });
}

export class LocalMediaStore {
    constructor(database = db) { this.db = database; }

    async storeBlob(id, blob) {
        const write = async () => {
            const existing = await this.db.media.get(id);
            const rows = await this.db.media.toArray();
            const total = rows.reduce((sum, row) => sum + (Number(row.bytes) || Number(row.blob?.size) || 0), 0);
            if (total - (Number(existing?.bytes) || Number(existing?.blob?.size) || 0) + blob.size > MAX_LOCAL_MEDIA_TOTAL_BYTES) {
                throw new DOMException('Local image storage limit reached.', 'QuotaExceededError');
            }
            await this.db.media.put({ id, blob, bytes: blob.size, createdAt: Date.now() });
        };
        if (typeof this.db.transaction === 'function') await this.db.transaction('rw', this.db.media, write);
        else await write();
    }

    async putDataUrl(id, value) {
        if (!ID_PATTERN.test(id)) throw new Error('Invalid image identifier.');
        const blob = imageDataToBlob(value);
        await this.storeBlob(id, blob);
        return blob;
    }

    async getDataUrl(id, fallback = null) {
        if (!ID_PATTERN.test(id)) return null;
        const row = await this.db.media.get(id);
        if (row?.blob) return blobToImageData(row.blob);
        if (typeof fallback === 'string' && fallback.startsWith('data:image/')) {
            return blobToImageData(imageDataToBlob(fallback));
        }
        return null;
    }

    async migrateLegacy(saved) {
        // Copy before switching readers. Do not delete the legacy recovery copy.
        const result = { copied: 0, invalid: 0 };
        if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return result;
        for (const [id, value] of Object.entries(saved)) {
            if (!ID_PATTERN.test(id) || typeof value !== 'string' || !value.startsWith('data:image/')) {
                result.invalid++;
                continue;
            }
            if (await this.db.media.get(id)) continue;
            let blob;
            try { blob = imageDataToBlob(value); }
            catch { result.invalid++; continue; }
            await this.storeBlob(id, blob);
            result.copied++;
        }
        return result;
    }

    async previewEntries() {
        const rows = await this.db.media.toArray();
        return Promise.all(rows.map(async row => [row.id,
            typeof URL.createObjectURL === 'function' ? URL.createObjectURL(row.blob) : await blobToImageData(row.blob)
        ]));
    }

    async portableMarkdown(markdown, fallback = new Map()) {
        const source = String(markdown ?? '');
        if (new TextEncoder().encode(source).length > MAX_PORTABLE_MARKDOWN_BYTES) throw new Error('Portable Markdown exceeds 20 MiB.');
        const ids = [...new Set([...source.matchAll(REF_PATTERN)].map(m => m[1]))];
        const data = new Map();
        for (const id of ids) {
            const row = await this.db.media.get(id);
            if (row?.blob) data.set(id, await blobToImageData(row.blob));
            else if (typeof fallback.get(id) === 'string' && fallback.get(id).startsWith('data:image/')) {
                const cleanBlob = imageDataToBlob(fallback.get(id));
                data.set(id, await blobToImageData(cleanBlob));
            } else throw new Error('This document references a missing local image. Restore the image before sharing or exporting.');
        }
        const result = source.replace(REF_PATTERN, (_ref, id) => data.get(id));
        if (new TextEncoder().encode(result).length > MAX_PORTABLE_MARKDOWN_BYTES) throw new Error('Portable Markdown exceeds 20 MiB. Export fewer images at a time.');
        return result;
    }
}

export const localMediaStore = new LocalMediaStore();
