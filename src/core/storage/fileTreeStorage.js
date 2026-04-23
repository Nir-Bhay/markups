import { db } from './database.js';

const ROOT_ID = 'root';

const createNodeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

class FileTreeStorageService {
    static instance = null;

    constructor() {
        if (FileTreeStorageService.instance) {
            return FileTreeStorageService.instance;
        }
        FileTreeStorageService.instance = this;
    }

    async ensureRoot() {
        const root = await db.file_nodes.get(ROOT_ID);
        if (root) return root;
        const now = Date.now();
        const rootNode = {
            id: ROOT_ID,
            type: 'folder',
            name: 'Workspace',
            parentId: null,
            order: 0,
            createdAt: now,
            updatedAt: now
        };
        await db.file_nodes.put(rootNode);
        return rootNode;
    }

    async initTree(notes = []) {
        await this.ensureRoot();
        const fileCount = await db.file_nodes.where('type').equals('file').count();
        if (fileCount > 0) return;

        const now = Date.now();
        if (!Array.isArray(notes) || notes.length === 0) {
            return;
        }

        const nodes = notes.map((note, index) => ({
            id: createNodeId('file'),
            type: 'file',
            name: (note.title || 'Untitled').replace(/\.md$/i, ''),
            parentId: ROOT_ID,
            noteId: note.id,
            order: index,
            createdAt: note.createdAt || now,
            updatedAt: note.updatedAt || now
        }));
        await db.file_nodes.bulkPut(nodes);
    }

    async getTree() {
        return db.file_nodes.orderBy('updatedAt').toArray();
    }

    async getChildren(parentId = ROOT_ID) {
        return db.file_nodes.where('parentId').equals(parentId).sortBy('order');
    }

    async createNode({ type, name, parentId = ROOT_ID, noteId = null }) {
        const now = Date.now();
        let resolvedParentId = parentId || ROOT_ID;
        if (resolvedParentId !== ROOT_ID) {
            const parentNode = await db.file_nodes.get(resolvedParentId);
            if (!parentNode || parentNode.type !== 'folder') {
                resolvedParentId = ROOT_ID;
            }
        }

        const siblings = await this.getChildren(resolvedParentId);
        const finalName = await this.getUniqueName(resolvedParentId, name || (type === 'folder' ? 'New Folder' : 'Untitled'));
        const node = {
            id: createNodeId(type === 'folder' ? 'folder' : 'file'),
            type,
            name: finalName.replace(/\.md$/i, ''),
            parentId: resolvedParentId,
            noteId: type === 'file' ? noteId : null,
            order: siblings.length,
            createdAt: now,
            updatedAt: now
        };
        await db.file_nodes.put(node);
        return node;
    }

    async renameNode(id, name) {
        const node = await db.file_nodes.get(id);
        if (!node) return null;
        const finalName = await this.getUniqueName(node.parentId, name, id);
        const updated = {
            ...node,
            name: finalName.replace(/\.md$/i, ''),
            updatedAt: Date.now()
        };
        await db.file_nodes.put(updated);
        return updated;
    }

    async moveNode(id, newParentId) {
        const node = await db.file_nodes.get(id);
        if (!node || !newParentId || id === ROOT_ID) return null;
        const siblings = await this.getChildren(newParentId);
        const updated = {
            ...node,
            parentId: newParentId,
            order: siblings.length,
            updatedAt: Date.now()
        };
        await db.file_nodes.put(updated);
        return updated;
    }

    async reorderNode(id, toIndex) {
        const node = await db.file_nodes.get(id);
        if (!node) return false;
        const siblings = await this.getChildren(node.parentId);
        const fromIndex = siblings.findIndex((item) => item.id === id);
        if (fromIndex === -1) return false;
        const [moved] = siblings.splice(fromIndex, 1);
        siblings.splice(Math.max(0, Math.min(toIndex, siblings.length)), 0, moved);
        await Promise.all(siblings.map((item, idx) => db.file_nodes.update(item.id, { order: idx, updatedAt: Date.now() })));
        return true;
    }

    async deleteNodeRecursive(id) {
        const node = await db.file_nodes.get(id);
        if (!node || id === ROOT_ID) return { deletedNodeIds: [], deletedNoteIds: [] };

        const deletedNodeIds = [];
        const deletedNoteIds = [];
        const stack = [id];
        while (stack.length > 0) {
            const currentId = stack.pop();
            const current = await db.file_nodes.get(currentId);
            if (!current) continue;

            const children = await db.file_nodes.where('parentId').equals(current.id).toArray();
            children.forEach((child) => stack.push(child.id));

            deletedNodeIds.push(current.id);
            if (current.type === 'file' && current.noteId) {
                deletedNoteIds.push(current.noteId);
            }
        }

        if (deletedNodeIds.length > 0) {
            await db.file_nodes.bulkDelete(deletedNodeIds);
        }
        return { deletedNodeIds, deletedNoteIds };
    }

    async getFileNodeByNoteId(noteId) {
        if (!noteId) return null;
        return db.file_nodes.where('noteId').equals(noteId).first();
    }

    async getUniqueName(parentId, baseName, excludingId = null) {
        const safeBase = (baseName || 'Untitled').trim() || 'Untitled';
        const siblings = await this.getChildren(parentId);
        const siblingNames = siblings
            .filter((item) => item.id !== excludingId)
            .map((item) => item.name.toLowerCase());

        if (!siblingNames.includes(safeBase.toLowerCase())) {
            return safeBase;
        }

        let suffix = 1;
        let candidate = `${safeBase} (${suffix})`;
        while (siblingNames.includes(candidate.toLowerCase())) {
            suffix += 1;
            candidate = `${safeBase} (${suffix})`;
        }
        return candidate;
    }
}

export const ROOT_FOLDER_ID = ROOT_ID;
export const fileTreeStorage = new FileTreeStorageService();
export { FileTreeStorageService };
export default fileTreeStorage;
