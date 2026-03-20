import { dbService } from './database.js';

/**
 * FileMetadataService - Manages lightweight file/folder metadata for fast UI rendering.
 * Implements lazy-loading and efficient search.
 * @module core/storage/metadata
 */

class FileMetadataService {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Get metadata for a specific folder's children (Lazy-loading)
     * @param {string|null} parentId 
     * @returns {Promise<Array>}
     */
    async getChildren(parentId = null) {
        const allDocs = await dbService.getAllDocuments();
        // Return only metadata (id, title, parentId, type) to keep it lightweight
        return allDocs
            .filter(doc => doc.parentId === parentId)
            .map(({ id, title, parentId, type, updatedAt }) => ({
                id,
                title,
                parentId,
                type: type || 'file',
                updatedAt
            }));
    }

    /**
     * Search for files by title across the entire workspace
     * @param {string} query 
     */
    async search(query) {
        const allDocs = await dbService.getAllDocuments();
        const lowerQuery = query.toLowerCase();
        return allDocs
            .filter(doc => doc.title.toLowerCase().includes(lowerQuery))
            .map(({ id, title, parentId }) => ({ id, title, parentId }));
    }

    /**
     * Get the count of files in a folder without loading their full content
     */
    async getFolderSize(folderId) {
        const allDocs = await dbService.getAllDocuments();
        return allDocs.filter(doc => doc.parentId === folderId).length;
    }
}

export const metadataService = new FileMetadataService();
export default metadataService;
