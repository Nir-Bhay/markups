import { describe, expect, it } from 'vitest';
import { LocalMediaStore, imageDataToBlob, MAX_LOCAL_MEDIA_TOTAL_BYTES } from '../core/storage/mediaStore.js';

const png = 'data:image/png;base64,iVBORw0KGgo=';

function createMediaDb() {
    const rows = new Map();
    return {
        rows,
        media: {
            get: async (id) => rows.get(id),
            put: async (row) => { rows.set(row.id, row); return row.id; },
            toArray: async () => [...rows.values()]
        }
    };
}

describe('LocalMediaStore', () => {
    it('copies valid legacy images to IndexedDB without removing the recovery copy', async () => {
        const database = createMediaDb();
        const store = new LocalMediaStore(database);
        const legacy = { img_1_a: png, malformed: 'not an image' };

        const result = await store.migrateLegacy(legacy);

        expect(result).toEqual({ copied: 1, invalid: 1 });
        expect(database.rows.get('img_1_a').blob.type).toBe('image/png');
        expect(legacy.img_1_a).toBe(png);
    });

    it('does not hide a durable-storage write failure during migration', async () => {
        const database = createMediaDb();
        database.media.put = async () => { throw new DOMException('Full', 'QuotaExceededError'); };
        const store = new LocalMediaStore(database);
        await expect(store.migrateLegacy({ img_1_a: png })).rejects.toMatchObject({ name: 'QuotaExceededError' });
    });

    it('falls back to binary storage when WebKit cannot persist Blobs', async () => {
        const database = createMediaDb();
        const put = database.media.put;
        database.media.put = async (row) => {
            if (row.blob) throw new DOMException('Error preparing Blob/File data to be stored in object store', 'UnknownError');
            return put(row);
        };
        const store = new LocalMediaStore(database);
        await store.putDataUrl('img_1_a', png);

        const row = database.rows.get('img_1_a');
        expect(row.blob).toBeUndefined();
        expect(row.data).toBeInstanceOf(ArrayBuffer);
        expect(row.bytes).toBe(row.data.byteLength);
        expect(row.type).toBe('image/png');
        await expect(new LocalMediaStore(database).getDataUrl('img_1_a')).resolves.toBe(png);
        await expect(store.portableMarkdown('![x](markups-img:img_1_a)')).resolves.toContain(png);
        await expect(store.migrateLegacy({ img_1_a: png })).resolves.toEqual({ copied: 0, invalid: 0 });
    });

    it('does not retry quota errors or hide a failed binary fallback', async () => {
        const database = createMediaDb();
        const quota = new DOMException('Full', 'QuotaExceededError');
        const writes = [];
        database.media.put = async (row) => {
            writes.push(row);
            throw quota;
        };
        const store = new LocalMediaStore(database);
        await expect(store.putDataUrl('img_1_a', png)).rejects.toBe(quota);
        expect(writes).toHaveLength(1);
        database.media.put = async (row) => {
            if (row.blob) throw new DOMException('Error preparing Blob/File data to be stored in object store', 'UnknownError');
            throw quota;
        };
        await expect(store.putDataUrl('img_1_a', png)).rejects.toBe(quota);
    });

    it('enforces a bounded aggregate local image budget before adding media', async () => {
        const database = createMediaDb();
        database.rows.set('img_existing', { id: 'img_existing', bytes: MAX_LOCAL_MEDIA_TOTAL_BYTES - 4, blob: new Blob(['x']) });
        const store = new LocalMediaStore(database);
        await expect(store.putDataUrl('img_1_a', png)).rejects.toMatchObject({ name: 'QuotaExceededError' });
        expect(database.rows.has('img_1_a')).toBe(false);
    });

    it('embeds validated local media in portable Markdown', async () => {
        const database = createMediaDb();
        const store = new LocalMediaStore(database);
        await store.putDataUrl('img_1_a', png);

        const portable = await store.portableMarkdown('![first](markups-img:img_1_a)\n![again](markups-img:img_1_a)');

        expect(portable.match(/data:image\/png;base64,/g)).toHaveLength(2);
        expect(portable).not.toContain('markups-img:');
    });

    it('can recreate an export-safe data URL from its persisted binary after reload', async () => {
        const database = createMediaDb();
        await new LocalMediaStore(database).putDataUrl('img_1_a', png);
        const reloadedStore = new LocalMediaStore(database);
        await expect(reloadedStore.getDataUrl('img_1_a')).resolves.toBe(png);
    });

    it('uses the legacy backup as an export fallback when an IDB entry is missing', async () => {
        const store = new LocalMediaStore(createMediaDb());
        const fallback = new Map([['img_1_a', png]]);
        await expect(store.portableMarkdown('![x](markups-img:img_1_a)', fallback))
            .resolves.toContain(png);
    });

    it('fails clearly when a document references an image that cannot be recovered', async () => {
        const store = new LocalMediaStore(createMediaDb());
        await expect(store.portableMarkdown('![x](markups-img:img_1_a)'))
            .rejects.toThrow(/missing local image/i);
    });

    it('rejects a MIME type whose bytes do not match the declared image type', () => {
        expect(() => imageDataToBlob('data:image/png;base64,SGVsbG8='))
            .toThrow(/contents do not match/i);
    });
});
