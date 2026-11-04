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
            updatedAt: now,
            deletedAt: null
        };
        await db.file_nodes.put(rootNode);
        return rootNode;
    }

    async initTree(notes = []) {
        await this.ensureRoot();
        const fileCount = await db.file_nodes.where('type').equals('file')
            .filter((node) => node.deletedAt == null).count();
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
            updatedAt: note.updatedAt || now,
            deletedAt: null
        }));
        await db.file_nodes.bulkPut(nodes);
    }

    async getTree() {
        return (await db.file_nodes.orderBy('updatedAt').toArray())
            .filter((node) => node.deletedAt == null);
    }

    async getChildren(parentId = ROOT_ID) {
        return db.file_nodes.where('parentId').equals(parentId)
            .filter((node) => node.deletedAt == null).sortBy('order');
    }

    async createNode({ id = null, type, name, parentId = ROOT_ID, noteId = null }) {
        const now = Date.now();
        let resolvedParentId = parentId || ROOT_ID;
        if (resolvedParentId !== ROOT_ID) {
            const parentNode = await db.file_nodes.get(resolvedParentId);
            if (!parentNode || parentNode.type !== 'folder' || parentNode.deletedAt != null) {
                resolvedParentId = ROOT_ID;
            }
        }

        const siblings = await this.getChildren(resolvedParentId);
        const finalName = await this.getUniqueName(resolvedParentId, name || (type === 'folder' ? 'New Folder' : 'Untitled'));
        const requestedId = typeof id === 'string' && id.trim() ? id.trim() : null;
        const nodeId = requestedId || createNodeId(type === 'folder' ? 'folder' : 'file');
        if (await db.file_nodes.get(nodeId)) return null;
        const node = {
            id: nodeId,
            type,
            name: finalName.replace(/\.md$/i, ''),
            parentId: resolvedParentId,
            noteId: type === 'file' ? noteId : null,
            order: siblings.length,
            createdAt: now,
            updatedAt: now,
            deletedAt: null
        };
        await db.file_nodes.put(node);
        return node;
    }

    async renameNode(id, name) {
        const node = await db.file_nodes.get(id);
        if (!node || node.deletedAt != null) return null;
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
        if (!node || node.deletedAt != null || !newParentId || id === ROOT_ID) return null;
        const newParent = await db.file_nodes.get(newParentId);
        if (!newParent || newParent.type !== 'folder' || newParent.deletedAt != null) return null;
        if (node.type === 'folder') {
            const visited = new Set();
            let ancestor = newParent;
            while (ancestor && !visited.has(ancestor.id)) {
                if (ancestor.id === node.id) return null;
                visited.add(ancestor.id);
                ancestor = ancestor.parentId ? await db.file_nodes.get(ancestor.parentId) : null;
            }
        }
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
        if (!node || node.deletedAt != null) return false;
        const siblings = await this.getChildren(node.parentId);
        const fromIndex = siblings.findIndex((item) => item.id === id);
        if (fromIndex === -1) return false;
        const [moved] = siblings.splice(fromIndex, 1);
        siblings.splice(Math.max(0, Math.min(toIndex, siblings.length)), 0, moved);
        // Phase 2.4: single transaction — a partial failure rolls back instead
        // of leaving half-renumbered order. Returns false so callers can react.
        try {
            await db.transaction('rw', db.file_nodes, async () => {
                const now = Date.now();
                for (let idx = 0; idx < siblings.length; idx++) {
                    await db.file_nodes.update(siblings[idx].id, { order: idx, updatedAt: now });
                }
            });
            return true;
        } catch (error) {
            console.error(
                `reorderNode: transaction rolled back for ${siblings.length} sibling(s):`,
                error
            );
            return false;
        }
    }

    async deleteNodeRecursive(id) {
        const deletedAt = Date.now();
        return db.transaction('rw', db.file_nodes, db.notes, async () => {
            const root = await db.file_nodes.get(id);
            if (!root || root.deletedAt != null || id === ROOT_ID) {
                return { deletedNodeIds: [], deletedNoteIds: [] };
            }

            const allNodes = await db.file_nodes.toArray();
            const nodesById = new Map(allNodes.map((item) => [item.id, item]));
            const childrenByParent = new Map();
            for (const item of allNodes) {
                const children = childrenByParent.get(item.parentId) || [];
                children.push(item);
                childrenByParent.set(item.parentId, children);
            }

            const deletedNodeIds = [];
            const deletedNoteIds = new Set();
            const visited = new Set();
            const stack = [id];
            while (stack.length > 0) {
                const currentId = stack.pop();
                if (visited.has(currentId)) continue;
                visited.add(currentId);
                const current = nodesById.get(currentId);
                if (!current) continue;
                deletedNodeIds.push(current.id);
                for (const child of childrenByParent.get(current.id) || []) stack.push(child.id);
                if (current.type === 'file' && current.noteId) deletedNoteIds.add(current.noteId);
            }

            for (const nodeId of deletedNodeIds) {
                const node = nodesById.get(nodeId);
                await db.file_nodes.update(nodeId, { deletedAt: node.deletedAt ?? deletedAt, updatedAt: deletedAt });
            }
            for (const noteId of deletedNoteIds) {
                const note = await db.notes.get(noteId);
                if (note) await db.notes.update(noteId, { deletedAt: note.deletedAt ?? deletedAt });
            }
            return { deletedNodeIds, deletedNoteIds: [...deletedNoteIds] };
        });
    }

    async getTrashRoots() {
        const allNodes = await db.file_nodes.toArray();
        const nodesById = new Map(allNodes.map((node) => [node.id, node]));
        return allNodes
            .filter((node) => node.deletedAt != null && (node.parentId === ROOT_ID ||
                !nodesById.has(node.parentId) || nodesById.get(node.parentId).deletedAt == null))
            .sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
    }

    async getTrashNoteIds() {
        const deletedNodes = await db.file_nodes.filter((node) => node.deletedAt != null).toArray();
        return [...new Set(deletedNodes.map((node) => node.noteId).filter(Boolean))];
    }

    async restoreStandaloneNote(noteId) {
        const restoredAt = Date.now();
        return db.transaction('rw', db.file_nodes, db.notes, async () => {
            const note = await db.notes.get(noteId);
            if (!note || note.deletedAt == null) return null;

            const siblings = await db.file_nodes.where('parentId').equals(ROOT_ID)
                .filter((node) => node.deletedAt == null).toArray();
            const names = new Set(siblings.map((node) => node.name.toLocaleLowerCase()));
            const baseName = (note.title || 'Untitled').replace(/\.md$/i, '').trim() || 'Untitled';
            let name = baseName;
            let suffix = 1;
            while (names.has(name.toLocaleLowerCase())) name = `${baseName} (${suffix++})`;

            const node = {
                id: createNodeId('file'), type: 'file', name, parentId: ROOT_ID, noteId,
                order: siblings.length, createdAt: restoredAt, updatedAt: restoredAt, deletedAt: null
            };
            await db.file_nodes.add(node);
            await db.notes.update(noteId, { deletedAt: null, updatedAt: restoredAt, title: name });
            return { node, note: { ...note, deletedAt: null, updatedAt: restoredAt, title: name } };
        });
    }

    async restoreNodeRecursive(id) {
        const restoredAt = Date.now();
        return db.transaction('rw', db.file_nodes, db.notes, async () => {
            const root = await db.file_nodes.get(id);
            if (!root || root.deletedAt == null || id === ROOT_ID) return null;

            const allNodes = await db.file_nodes.toArray();
            const nodesById = new Map(allNodes.map((node) => [node.id, node]));
            const parent = nodesById.get(root.parentId);
            const destinationParentId = !parent || parent.deletedAt != null ? ROOT_ID : parent.id;
            const descendants = new Set([id]);
            let changed = true;
            while (changed) {
                changed = false;
                for (const node of allNodes) {
                    if (!descendants.has(node.id) && descendants.has(node.parentId)) {
                        descendants.add(node.id);
                        changed = true;
                    }
                }
            }

            const siblings = allNodes.filter((node) => node.parentId === destinationParentId &&
                node.deletedAt == null && node.id !== id).map((node) => node.name.toLocaleLowerCase());
            const baseName = (root.name || 'Untitled').trim() || 'Untitled';
            let name = baseName;
            let suffix = 1;
            while (siblings.includes(name.toLocaleLowerCase())) name = `${baseName} (${suffix++})`;

            const restoredNodeIds = [];
            const restoredNoteIds = new Set();
            for (const nodeId of descendants) {
                const node = nodesById.get(nodeId);
                if (!node || node.deletedAt == null) continue;
                const changes = { deletedAt: null, updatedAt: restoredAt };
                if (node.id === id) {
                    changes.parentId = destinationParentId;
                    changes.name = name;
                    changes.order = allNodes.filter((item) => item.parentId === destinationParentId && item.deletedAt == null).length;
                }
                await db.file_nodes.update(nodeId, changes);
                restoredNodeIds.push(nodeId);
                if (node.type === 'file' && node.noteId) {
                    const note = await db.notes.get(node.noteId);
                    if (note?.deletedAt != null) {
                        const noteChanges = { deletedAt: null, updatedAt: restoredAt };
                        if (node.id === id && name !== root.name) noteChanges.title = name;
                        await db.notes.update(node.noteId, noteChanges);
                        restoredNoteIds.add(node.noteId);
                    }
                }
            }
            return { restoredNodeIds, restoredNoteIds: [...restoredNoteIds], rootNode: { ...root, deletedAt: null, parentId: destinationParentId, name } };
        });
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
