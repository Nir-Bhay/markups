/**
 * Import Manager
 * Handles file imports
 * @module features/import
 */

import { eventBus, EVENTS } from '../../utils/eventBus.js';
import { editorService } from '../../core/editor/index.js';
import { initializeImportDialog, openImportDialog } from './dialog.js';
import { tabsManager } from '../tabs/index.js';

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

/**
 * ImportManager class
 * Manages file imports
 */
class ImportManager {
    static instance = null;

    constructor() {
        if (ImportManager.instance) {
            return ImportManager.instance;
        }

        this.fileInput = null;
        this.acceptedTypes = ['.md', '.markdown', '.txt', '.text'];

        ImportManager.instance = this;
    }

    /**
     * Initialize import manager
     * @param {Object} options - Initialization options
     */
    initialize(options = {}) {
        const {
            fileInput = '#file-input',
            button = '#import-button'
        } = options;

        this.fileInput = typeof fileInput === 'string'
            ? document.querySelector(fileInput)
            : fileInput;

        const buttonEl = typeof button === 'string'
            ? document.querySelector(button)
            : button;

        initializeImportDialog({
            onFilePick: () => this.openFilePicker(),
            onSharedLink: ({ markdown, title }) => {
                const name = String(title || 'Shared').slice(0, 80);
                if (tabsManager?.createTab) {
                    tabsManager.createTab(name, markdown);
                    editorService.focus();
                    eventBus.emit(EVENTS.FILE_IMPORTED, { title: name });
                    eventBus.emit(EVENTS.TOAST_SHOW, {
                        message: `Shared document "${name}" opened in a new tab`,
                        type: 'success'
                    });
                    return;
                }
                editorService.setValue(markdown);
                editorService.focus();
                eventBus.emit(EVENTS.FILE_IMPORTED, { title });
                eventBus.emit(EVENTS.TOAST_SHOW, {
                    message: `Shared document "${title}" opened!`,
                    type: 'success'
                });
            },
            onUrlText: ({ url, text }) => {
                if (tabsManager?.createTab) {
                    tabsManager.createTab('Imported', text);
                    editorService.focus();
                    eventBus.emit(EVENTS.FILE_IMPORTED, { url });
                    eventBus.emit(EVENTS.TOAST_SHOW, {
                        message: 'Content imported in a new tab',
                        type: 'success'
                    });
                    return;
                }
                editorService.setValue(text);
                editorService.focus();
                eventBus.emit(EVENTS.FILE_IMPORTED, { url });
                eventBus.emit(EVENTS.TOAST_SHOW, {
                    message: 'Content imported successfully!',
                    type: 'success'
                });
            }
        });

        if (buttonEl) {
            buttonEl.addEventListener('click', (e) => {
                e.preventDefault();
                openImportDialog(e.currentTarget);
            });
        }

        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => this._handleFileSelect(e));
        }
    }

    /**
     * Open file picker
     */
    openFilePicker() {
        if (this.fileInput) {
            this.fileInput.click();
        }
    }

    /**
     * Handle file selection
     * @param {Event} event
     * @private
     */
    _handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.importFile(file);

        // Reset input
        event.target.value = '';
    }

    /**
     * Import a file
     * @param {File} file
     */
    importFile(file) {
        // Phase 4.3: enforce the declared allowlist (was advisory only).
        const lowerName = String(file?.name || '').toLowerCase();
        const allowedType = this.acceptedTypes.some((ext) => lowerName.endsWith(ext));
        if (!allowedType) {
            eventBus.emit(EVENTS.TOAST_SHOW, {
                message: `File "${file?.name || 'unknown'}" is not a supported type. Use .md, .markdown, .txt or .text.`,
                type: 'error'
            });
            return;
        }
        if (file.size > MAX_IMPORT_BYTES) {
            eventBus.emit(EVENTS.TOAST_SHOW, {
                message: `File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 5 MB.`,
                type: 'error'
            });
            return;
        }
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target.result;
            editorService.setValue(content);
            editorService.focus();

            eventBus.emit(EVENTS.FILE_IMPORTED, { filename: file.name });
            eventBus.emit(EVENTS.TOAST_SHOW, {
                message: `File "${file.name}" imported successfully!`,
                type: 'success'
            });
        };

        reader.onerror = () => {
            eventBus.emit(EVENTS.TOAST_SHOW, {
                message: 'Failed to import file',
                type: 'error'
            });
        };

        reader.readAsText(file);
    }

    /**
     * Import from URL
     * @param {string} url
     */
    async importFromURL(url) {
        // Phase 4.3: http(s) only — never fetch javascript:/data:/file: URLs.
        let parsedUrl = null;
        try {
            parsedUrl = new URL(String(url || ''));
        } catch {
            parsedUrl = null;
        }
        if (!parsedUrl || (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:')) {
            eventBus.emit(EVENTS.TOAST_SHOW, {
                message: 'Only http(s) URLs can be imported.',
                type: 'error'
            });
            return;
        }
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch');

            const contentLength = Number(response.headers.get('content-length'));
            if (Number.isFinite(contentLength) && contentLength > MAX_IMPORT_BYTES) {
                throw new Error('Imported content exceeds the 5 MB limit');
            }

            const content = await response.text();
            // Phase 4.3: same 5 MB cap as file imports.
            if (content.length > MAX_IMPORT_BYTES) {
                eventBus.emit(EVENTS.TOAST_SHOW, {
                    message: `Remote content is too large (${(content.length / 1024 / 1024).toFixed(1)} MB). Max 5 MB.`,
                    type: 'error'
                });
                return;
            }
            if (new Blob([content]).size > MAX_IMPORT_BYTES) {
                throw new Error('Imported content exceeds the 5 MB limit');
            }
            editorService.setValue(content);
            editorService.focus();

            eventBus.emit(EVENTS.FILE_IMPORTED, { url });
            eventBus.emit(EVENTS.TOAST_SHOW, {
                message: 'Content imported successfully!',
                type: 'success'
            });
        } catch (_error) {
            eventBus.emit(EVENTS.TOAST_SHOW, {
                message: 'Failed to import from URL',
                type: 'error'
            });
        }
    }

    /**
     * Dispose manager
     */
    dispose() {
        ImportManager.instance = null;
    }
}

export const importManager = new ImportManager();
export { ImportManager };
export default importManager;
