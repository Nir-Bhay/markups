/**
 * StorageService - Handles all storage operations (IndexedDB & LocalStorage)
 * @module core/storage
 */

import { STORAGE_KEYS, NAMESPACE } from './keys.js';
import { dbService } from './database.js';

class StorageService {
    constructor(namespace = NAMESPACE) {
        this.namespace = namespace;
    }

    /**
     * Get full key with namespace
     * @private
     */
    _getKey(key) {
        return `${this.namespace}.${key}`;
    }

    /**
     * Set a value in storage
     * If key is DOCUMENTS, it saves to IndexedDB
     */
    async set(key, value, ttlMs = null, session = false) {
        try {
            // Handle large documents via IndexedDB
            if (key === STORAGE_KEYS.DOCUMENTS || key === STORAGE_KEYS.LAST_STATE) {
                await dbService.saveDocument({ id: key, value, updatedAt: Date.now() });
            }

            // Fallback/Secondary storage in localStorage/sessionStorage
            const storage = session ? sessionStorage : localStorage;
            const item = {
                value,
                expiresAt: ttlMs ? Date.now() + ttlMs : null,
                updatedAt: Date.now()
            };
            storage.setItem(this._getKey(key), JSON.stringify(item));
            return true;
        } catch (error) {
            console.error(`Storage set error for key "${key}":`, error);
            return false;
        }
    }

    /**
     * Get a value from storage
     * Tries IndexedDB first for DOCUMENTS
     */
    async get(key, session = false) {
        try {
            // Try IndexedDB for documents
            if (key === STORAGE_KEYS.DOCUMENTS || key === STORAGE_KEYS.LAST_STATE) {
                const doc = await dbService.getDocument(key);
                if (doc) return doc.value;
            }

            // Fallback to localStorage
            const storage = session ? sessionStorage : localStorage;
            const item = storage.getItem(this._getKey(key));
            if (!item) return null;

            const { value, expiresAt } = JSON.parse(item);

            if (expiresAt && Date.now() > expiresAt) {
                this.remove(key, session);
                return null;
            }

            return value;
        } catch (error) {
            console.warn(`Storage get error for key "${key}":`, error);
            return null;
        }
    }

    /**
     * Remove a value from storage
     */
    async remove(key, session = false) {
        try {
            if (key === STORAGE_KEYS.DOCUMENTS || key === STORAGE_KEYS.LAST_STATE) {
                await dbService.deleteDocument(key);
            }
            const storage = session ? sessionStorage : localStorage;
            storage.removeItem(this._getKey(key));
            return true;
        } catch (error) {
            console.warn(`Storage remove error for key "${key}":`, error);
            return false;
        }
    }

    // Legacy sync methods for small UI settings (backwards compatibility)
    getSync(key, session = false) {
        const storage = session ? sessionStorage : localStorage;
        const item = storage.getItem(this._getKey(key));
        if (!item) return null;
        const { value } = JSON.parse(item);
        return value;
    }

    setSync(key, value, session = false) {
        const storage = session ? sessionStorage : localStorage;
        const item = { value, updatedAt: Date.now() };
        storage.setItem(this._getKey(key), JSON.stringify(item));
    }

    has(key) { return this.getSync(key) !== null; }
    getBoolean(key, defaultValue = false) { const v = this.getSync(key); return v !== null ? Boolean(v) : defaultValue; }
    getString(key, defaultValue = '') { const v = this.getSync(key); return v !== null ? String(v) : defaultValue; }
    getNumber(key, defaultValue = 0) { const v = this.getSync(key); return v !== null ? Number(v) : defaultValue; }
    getObject(key, defaultValue = null) { const v = this.getSync(key); return v !== null && typeof v === 'object' ? v : defaultValue; }
    getArray(key, defaultValue = []) { const v = this.getSync(key); return Array.isArray(v) ? v : defaultValue; }

    clearAll() {
        const prefix = this._getKey('');
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) keysToRemove.push(key);
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }
}

export const storage = new StorageService();
export { STORAGE_KEYS, NAMESPACE };
export default storage;
