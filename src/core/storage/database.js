/**
 * DatabaseService - Handles IndexedDB operations for large-scale document storage.
 * Provides a robust, offline-first alternative to localStorage.
 * @module core/storage/database
 */

const DB_NAME = 'MarkupsDB';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

class DatabaseService {
    constructor() {
        this.db = null;
    }

    /**
     * Initialize the database
     * @returns {Promise<IDBDatabase>}
     */
    async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error('IndexedDB open error:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * Save a document
     * @param {Object} doc - Document object { id, content, title, updatedAt }
     */
    async saveDocument(doc) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put({
                ...doc,
                updatedAt: Date.now()
            });

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get a document by ID
     * @param {string} id 
     */
    async getDocument(id) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all documents
     */
    async getAllDocuments() {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete a document
     * @param {string} id 
     */
    async deleteDocument(id) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
}

export const dbService = new DatabaseService();
export default dbService;
