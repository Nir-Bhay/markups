import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../core/storage/database.js';
import { FileTreeStorageService, ROOT_FOLDER_ID } from '../core/storage/fileTreeStorage.js';

let storage;

describe('FileTreeStorageService', () => {
    beforeEach(async () => {
        FileTreeStorageService.instance = null;
        storage = new FileTreeStorageService();
        await db.file_nodes.clear();
    });

    afterEach(async () => {
        await db.file_nodes.clear();
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

    it('deletes folder recursively and returns deleted IDs', async () => {
        const folder = await storage.createNode({ type: 'folder', name: 'Parent' });
        const childFile = await storage.createNode({ type: 'file', name: 'Child', parentId: folder.id, noteId: 42 });

        const result = await storage.deleteNodeRecursive(folder.id);
        expect(result.deletedNodeIds).toContain(folder.id);
        expect(result.deletedNodeIds).toContain(childFile.id);
        expect(result.deletedNoteIds).toContain(42);

        const remaining = await storage.getTree();
        expect(remaining.find((node) => node.id === folder.id)).toBeUndefined();
    });
});
