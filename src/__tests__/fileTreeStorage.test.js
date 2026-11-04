import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../core/storage/database.js';
import { FileTreeStorageService, ROOT_FOLDER_ID } from '../core/storage/fileTreeStorage.js';

let storage;

describe('FileTreeStorageService', () => {
    beforeEach(async () => {
        FileTreeStorageService.instance = null;
        storage = new FileTreeStorageService();
        await db.file_nodes.clear();
        await db.notes.clear();
        await db.note_versions.clear();
        await db.cloud_links.clear();
        await db.media.clear();
    });

    afterEach(async () => {
        await db.file_nodes.clear();
        await db.notes.clear();
        await db.note_versions.clear();
        await db.cloud_links.clear();
        await db.media.clear();
    });

    it('creates root during initTree', async () => {
        await storage.initTree([]);
        const root = await db.file_nodes.get(ROOT_FOLDER_ID);
        expect(root).toBeDefined();
        expect(root.type).toBe('folder');
    });

    it('creates folder and unique file names', async () => {
        const folder = await storage.createNode({ type: 'folder', name: 'Docs' });
        const fileA = await storage.createNode({ type: 'file', name: 'Readme', parentId: folder.id, noteId: 1 });
        const fileB = await storage.createNode({ type: 'file', name: 'Readme', parentId: folder.id, noteId: 2 });

        expect(fileA.name).toBe('Readme');
        expect(fileB.name).toContain('Readme');
        expect(fileB.name).not.toBe(fileA.name);
    });

    it('moves node to another folder', async () => {
        const src = await storage.createNode({ type: 'folder', name: 'Source' });
        const dst = await storage.createNode({ type: 'folder', name: 'Archive' });
        const file = await storage.createNode({ type: 'file', name: 'Notes', parentId: src.id, noteId: 10 });

        await storage.moveNode(file.id, dst.id);
        const moved = await db.file_nodes.get(file.id);
        expect(moved.parentId).toBe(dst.id);
    });

    it('rejects moving a folder inside its own descendant', async () => {
        const parent = await storage.createNode({ type: 'folder', name: 'Parent' });
        const child = await storage.createNode({ type: 'folder', name: 'Child', parentId: parent.id });

        expect(await storage.moveNode(parent.id, child.id)).toBeNull();
        expect((await db.file_nodes.get(parent.id)).parentId).toBe(ROOT_FOLDER_ID);
    });

    it('moves a folder and its notes to Trash while preserving history and cloud links', async () => {
        const now = Date.now();
        const noteId = await db.notes.add({
            title: 'Child', content: '![local](markups-img:img_trash_42)', tags: [], category: null, favorite: false,
            legacyId: null, stableId: '00000000-0000-4000-8000-000000000042',
            createdAt: now, updatedAt: now, deletedAt: null
        });
        const folder = await storage.createNode({ type: 'folder', name: 'Parent' });
        const nested = await storage.createNode({ type: 'folder', name: 'Nested', parentId: folder.id });
        const childFile = await storage.createNode({ type: 'file', name: 'Child', parentId: nested.id, noteId });
        await db.media.put({ id: 'img_trash_42', bytes: 4, blob: new Blob(['image']), createdAt: now });
        const versionId = await db.note_versions.add({ noteId, content: 'older', createdAt: now });
        await db.cloud_links.put({ accountId: 'account-a', noteId, documentId: 'remote-child' });

        const result = await storage.deleteNodeRecursive(folder.id);
        expect(result.deletedNodeIds).toContain(folder.id);
        expect(result.deletedNodeIds).toContain(nested.id);
        expect(result.deletedNodeIds).toContain(childFile.id);
        expect(result.deletedNoteIds).toContain(noteId);

        const remaining = await storage.getTree();
        expect(remaining.find((node) => node.id === folder.id)).toBeUndefined();
        expect(await db.notes.get(noteId)).toMatchObject({ deletedAt: expect.any(Number) });
        expect(await db.note_versions.get(versionId)).toMatchObject({ noteId, content: 'older' });
        expect(await db.cloud_links.get(['account-a', noteId])).toMatchObject({ documentId: 'remote-child' });
        expect(await db.media.get('img_trash_42')).toMatchObject({ id: 'img_trash_42', bytes: 4 });
        expect((await storage.getTrashRoots()).map((node) => node.id)).toContain(folder.id);

        // A new sibling may take the old name while the item is in Trash.
        await storage.createNode({ type: 'folder', name: 'Parent' });
        const restored = await storage.restoreNodeRecursive(folder.id);
        expect(restored.restoredNodeIds).toEqual(expect.arrayContaining([folder.id, nested.id, childFile.id]));
        expect(await db.file_nodes.get(folder.id)).toMatchObject({ name: 'Parent (1)', deletedAt: null });
        expect(await db.file_nodes.get(nested.id)).toMatchObject({ parentId: folder.id, deletedAt: null });
        expect(await db.file_nodes.get(childFile.id)).toMatchObject({ parentId: nested.id, deletedAt: null });
        expect(await db.notes.get(noteId)).toMatchObject({ deletedAt: null });
        expect(await db.media.get('img_trash_42')).toMatchObject({ id: 'img_trash_42', bytes: 4 });
        expect(await storage.getTrashRoots()).toEqual([]);
    });

    // Phase 2.4: reorder persists atomically via transaction.
    it('reorderNode persists new order for all siblings', async () => {
        const folder = await storage.createNode({ type: 'folder', name: 'Board' });
        const a = await storage.createNode({ type: 'file', name: 'A', parentId: folder.id, noteId: 1 });
        const b = await storage.createNode({ type: 'file', name: 'B', parentId: folder.id, noteId: 2 });
        const c = await storage.createNode({ type: 'file', name: 'C', parentId: folder.id, noteId: 3 });

        const ok = await storage.reorderNode(c.id, 0);
        expect(ok).toBe(true);

        const kids = await storage.getChildren(folder.id);
        const ordered = [...kids].sort((x, y) => x.order - y.order).map((n) => n.id);
        expect(ordered).toEqual([c.id, a.id, b.id]);
    });

    it('reorderNode returns false for unknown id', async () => {
        await expect(storage.reorderNode('nope-missing', 0)).resolves.toBe(false);
    });

    it('restores a trashed standalone note and creates its file node atomically', async () => {
        const now = Date.now();
        const noteId = await db.notes.add({
            title: 'Orphan', content: 'body', tags: [], category: null, favorite: false,
            legacyId: null, stableId: '00000000-0000-4000-8000-000000000099',
            createdAt: now, updatedAt: now, deletedAt: now
        });

        const restored = await storage.restoreStandaloneNote(noteId);
        expect(restored.note).toMatchObject({ id: noteId, title: 'Orphan', deletedAt: null });
        expect(restored.node).toMatchObject({ type: 'file', name: 'Orphan', noteId, deletedAt: null });
        expect(await db.notes.get(noteId)).toMatchObject({ deletedAt: null });
        expect(await storage.getFileNodeByNoteId(noteId)).toMatchObject({ id: restored.node.id });
    });
});
