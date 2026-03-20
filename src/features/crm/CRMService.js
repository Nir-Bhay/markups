import { dbService } from '../../core/storage/database.js';

/**
 * CRMService - Manages contacts, leads, and outreach for the 'Markups' project.
 * Designed to track interactions from StackEdit and other markdown ecosystems.
 * @module features/crm/service
 */

const CRM_STORE = 'crm_contacts';

class CRMService {
    /**
     * Initialize CRM store in IndexedDB
     */
    async init() {
        const db = await dbService.init();
        if (!db.objectStoreNames.contains(CRM_STORE)) {
            // Need a version upgrade or handle it manually if not exists
            console.warn('CRM store needs manual upgrade in IndexedDB init');
        }
    }

    /**
     * Add a new contact (e.g., from StackEdit issue reply)
     * @param {Object} contact { id, name, source, status, notes }
     */
    async addContact(contact) {
        const db = await dbService.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([CRM_STORE], 'readwrite');
            const store = transaction.objectStore(CRM_STORE);
            store.put({
                ...contact,
                createdAt: Date.now(),
                lastInteraction: Date.now()
            });
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
        });
    }

    /**
     * Get all contacts for outreach
     */
    async getAllContacts() {
        const db = await dbService.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([CRM_STORE], 'readonly');
            const store = transaction.objectStore(CRM_STORE);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Update status (e.g., 'Contacted', 'Interested', 'Responded')
     */
    async updateStatus(id, status) {
        const db = await dbService.init();
        const transaction = db.transaction([CRM_STORE], 'readwrite');
        const store = transaction.objectStore(CRM_STORE);
        const contact = await new Promise(resolve => {
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result);
        });

        if (contact) {
            contact.status = status;
            contact.lastInteraction = Date.now();
            store.put(contact);
        }
    }
}

export const crmService = new CRMService();
export default crmService;
