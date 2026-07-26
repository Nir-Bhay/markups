/**
 * Version History Feature Module
 * Auto-saves version snapshots and allows restoring previous versions
 * @module features/version-history
 */

import { showToast } from '../../ui/toast/index.js';
import { createFocusTrap } from '../../utils/dom.js';

const STORAGE_KEY = 'version_history';
const MAX_VERSIONS = 20;
const VERSION_SAVE_INTERVAL = 60000; // Save a version snapshot every 60 seconds

let lastVersionSaveTime = 0;
let editor = null;
let defaultInput = '';
let hasEdited = false;
let versionHistoryFocusTrap = null;

/**
 * Load version history from storage
 * @returns {Array} Array of version objects
 */
function loadVersionHistory() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

/**
 * Save version history to storage
 * @param {Array} versions - Array of version objects
 */
function saveVersionHistory(versions) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
    } catch (error) {
        console.error('Failed to save version history:', error);
    }
}

/**
 * Add a version snapshot
 */
function addVersionSnapshot() {
    const now = Date.now();
    if (now - lastVersionSaveTime < VERSION_SAVE_INTERVAL) return;

    if (!editor) return;
    const content = editor.getValue();
    if (!content || content === defaultInput) return;

    const versions = loadVersionHistory();
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

    // Don't save if content matches the latest version
    if (versions.length > 0 && versions[0].content === content) return;

    versions.unshift({
        timestamp: now,
        content: content,
        wordCount: wordCount
    });

    // Limit to MAX_VERSIONS
    if (versions.length > MAX_VERSIONS) {
        versions.length = MAX_VERSIONS;
    }

    saveVersionHistory(versions);
    lastVersionSaveTime = now;
}

/**
 * Render version list in modal
 */
function renderVersionList() {
    const listEl = document.getElementById('version-list');
    if (!listEl) return;

    const versions = loadVersionHistory();

    if (versions.length === 0) {
        listEl.innerHTML = '<p class="empty-state">No saved versions yet. Versions are saved automatically as you edit.</p>';
        return;
    }

    listEl.innerHTML = versions.map((v, i) => {
        const date = new Date(v.timestamp);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const label = i === 0 ? ' (Latest)' : '';

        return `
            <div class="version-item" data-index="${i}">
                <div class="version-info">
                    <span class="version-date">${dateStr} at ${timeStr}${label}</span>
                    <span class="version-meta">${v.wordCount} words</span>
                </div>
                <button class="version-restore-btn" data-index="${i}">Restore</button>
            </div>
        `;
    }).join('');

    // Attach restore handlers
    listEl.querySelectorAll('.version-restore-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            const version = versions[index];
            if (version && confirm('Restore this version? Current content will be replaced.')) {
                if (editor) {
                    editor.setValue(version.content);
                    showToast('Version restored', 'success');
                    // Close modal
                    const modal = document.getElementById('version-history-modal');
                    const overlay = document.getElementById('version-history-overlay');
                    if (modal) modal.style.display = 'none';
                    if (overlay) overlay.style.display = 'none';
                }
            }
        });
    });
}

/**
 * Initialize version history feature
 * @param {Object} options - Initialization options
 * @param {Object} options.editorInstance - Monaco editor instance
 * @param {string} options.defaultContent - Default content
 */
export function initVersionHistory(options = {}) {
    editor = options.editorInstance;
    defaultInput = options.defaultContent || '';
    hasEdited = options.hasEdited || false;

    const modal = document.getElementById('version-history-modal');
    const overlay = document.getElementById('version-history-overlay');
    if (!modal || !overlay) return;

    const closeBtns = modal.querySelectorAll('.close-modal');

    const openModal = () => {
        modal.style.display = 'block';
        overlay.style.display = 'block';
        renderVersionList();
        versionHistoryFocusTrap?.deactivate();
        versionHistoryFocusTrap = createFocusTrap(modal, { onEscape: () => closeModal() });
        versionHistoryFocusTrap.activate();
    };

    const closeModal = () => {
        versionHistoryFocusTrap?.deactivate();
        versionHistoryFocusTrap = null;
        modal.style.display = 'none';
        overlay.style.display = 'none';
    };

    closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
    overlay.addEventListener('click', closeModal);

    // Toolbar button
    const historyBtn = document.getElementById('version-history-btn');
    if (historyBtn) {
        historyBtn.addEventListener('click', openModal);
    }

    // Keyboard shortcut Ctrl+Shift+V
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
            e.preventDefault();
            openModal();
        }
    });

    // Auto-save version snapshots periodically
    setInterval(() => {
        if (hasEdited) {
            addVersionSnapshot();
        }
    }, VERSION_SAVE_INTERVAL);

    console.log('✅ Version History feature initialized');
}

/**
 * Set hasEdited flag (called from main app)
 * @param {boolean} value - Whether user has edited
 */
export function setHasEdited(value) {
    hasEdited = value;
}

/**
 * Add version snapshot manually
 */
export function saveVersion() {
    addVersionSnapshot();
}

export default {
    initVersionHistory,
    setHasEdited,
    saveVersion
};
