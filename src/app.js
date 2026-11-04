/**
 * Application Orchestrator
 * Main application controller that initializes and coordinates all modules
 * @module app
 */

import { eventBus, EVENTS } from './utils/eventBus.js';
import { removeAllTrackedListeners } from './utils/listener-registry.js';
import { storageService } from './core/storage/index.js';
import { STORAGE_KEYS } from './core/storage/keys.js';
import { editorService } from './core/editor/index.js';
import { markdownService, deriveDocumentTitle } from './core/markdown/index.js';
import { APP_CONFIG, FEATURE_FLAGS } from './config/app.config.js';
import { DEFAULT_CONTENT } from './config/default-content.js';

// Phase 1 Foundation modules
import { runMigration } from './core/storage/migration.js';
import { autosaveManager } from './services/autosave/index.js';
import { errorHandler } from './utils/errorHandler.js';
import { showLoading as _showLoading, hideLoading as _hideLoading } from './ui/loading/index.js';

// UI Components
import { toast } from './ui/toast/index.js';
import { modal } from './ui/modal/index.js';
import { themeManager } from './ui/theme/index.js';
import { autosaveIndicator } from './ui/autosave/index.js';

// Features
import { tabsManager } from './features/tabs/index.js';
import { tabPersistenceManager } from './features/tabs/persistence.js';
import { createExplorerManager } from './features/explorer/index.js';
import { BacklinksManager } from './features/backlinks/index.js';
import { BacklinksPanel } from './features/backlinks/panel.js';
import { goalsManager } from './features/goals/index.js';
import { statsManager } from './features/stats/index.js';
import { linterManager } from './features/linter/index.js';
import { tocManager } from './features/toc/index.js';
import { searchManager } from './features/search/index.js';
import { templatesManager } from './features/templates/index.js';
import { snippetsManager } from './features/snippets/index.js';
import { initToolbarDensity, toolbarManager } from './features/toolbar/index.js';
import { modesManager, VIEW_MODES } from './features/modes/index.js';
import { focusManager } from './features/focus/index.js';
import { typewriterManager } from './features/typewriter/index.js';
import { fullscreenManager } from './features/fullscreen/index.js';
import { imageUploadManager } from './features/image-upload/index.js';
import { dividerManager } from './features/divider/index.js';
import { mobileUIManager } from './features/mobile/index.js';
import { importManager } from './features/import/index.js';
import { shareManager, handleIncomingShare } from './services/share/ui.js';
import { initializeCloudAccount } from './features/cloud/index.js';
import { initLivePreviewEdit } from './features/live-preview-edit/index.js';
import { annotateSourceLines } from './features/live-preview-edit/source-lines.js';
import { initVideoControls } from './features/video-controls/index.js';
import { appContextMenuManager } from './features/app-context-menu/index.js';
import { setupSpellcheck } from './features/spellcheck/index.js';
import { enhancePreviewCode } from './features/preview-code/index.js';
import { initializeExportDialog } from './features/export-dialog/index.js';
import { localMediaStore } from './core/storage/mediaStore.js';
import { blobToImageData } from './core/storage/mediaStore.js';
import { db } from './core/storage/database.js';

// AI Writer — lazy-loaded on first use (P3-T1)
let _aiWriterManager = null;
async function getAiWriterManager() {
    if (!_aiWriterManager) {
        const mod = await import('./features/ai-writer/index.js');
        _aiWriterManager = mod.aiWriterManager;
    }
    const button = document.querySelector('#ai-writer-button');
    if (button && !button.dataset.aiManagerBound) {
        button.dataset.aiManagerBound = 'true';
        button.addEventListener('click', () => _aiWriterManager.toggle());
    }
    return _aiWriterManager;
}

// Services
import { shortcutsManager } from './services/shortcuts/index.js';
import { exportManager } from './services/export/index.js';
import { pwaService } from './services/pwa/index.js';
import { paletteManager } from './features/command-palette/index.js';
import { noteStorage } from './core/storage/noteStorage.js';
import { fileTreeStorage, ROOT_FOLDER_ID } from './core/storage/fileTreeStorage.js';
import { applyVimPreference, toggleVim } from './features/vim/index.js';

import { debounce } from './utils/debounce.js';

/**
 * App class
 * Main application orchestrator
 */
class App {
    static instance = null;

    constructor() {
        if (App.instance) {
            return App.instance;
        }

        this.initialized = false;
        this.containers = {};
        this.isApplyingPreviewEdit = false;
        this._previewUpdateToken = 0;
        this.livePreviewEditController = null;
        this.videoControlsController = null;
        this.imageResizeManager = null;
        this.localImageUrls = new Map();
        this.explorerManager = null;
        this.backlinksManager = null;
        this.backlinksPanel = null;
        this._backlinksUnsubscribers = [];

        App.instance = this;
    }

    /**
     * Initialize the application
     * @param {Object} options - Initialization options
     */
    async initialize(options = {}) {
        if (this.initialized) {
            console.warn('App already initialized');
            return;
        }

        console.log('🚀 Initializing Markdown Live Preview...');

        try {
            // Get container references
            this._resolveContainers(options.containers || {});

            // Initialize core services
            await this._initCore();

            // Initialize UI
            this._initUI();

            // Initialize features
            await this._initFeatures();

            // Initialize services
            this._initServices();

            // Setup event listeners
            this._setupEventListeners();

            // Load initial content
            this._loadInitialContent();

            this.initialized = true;

            eventBus.emit(EVENTS.APP_READY);
            console.log('✅ App initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            throw error;
        }
    }

    /**
     * Resolve container elements
     * @param {Object} containers - Container selectors or elements
     * @private
     */
    _resolveContainers(containers) {
        const defaults = {
            editor: '#editor',
            preview: '#output',
            main: '.main-container',
            toolbar: '#toolbar',           // Updated to match index.html ID
            tabs: '#tabs-list',            // Updated to match index.html ID
            stats: '#stats-button',        // Updated - stats is triggered by button
            toc: '#toc-sidebar',             // Phase 1.3: real aside in index.html
            search: '#search-overlay',          // Phase 1.3: real overlay in index.html
            linter: '#lint-button',        // Updated - linter is triggered by button
            templates: '#templates-button', // Updated - templates triggered by button
            snippets: '#snippets-button',   // Updated - snippets triggered by button
            goals: '#goals-button'          // Updated - goals triggered by button
        };

        const resolved = { ...defaults, ...containers };

        for (const [key, selector] of Object.entries(resolved)) {
            this.containers[key] = typeof selector === 'string'
                ? document.querySelector(selector)
                : selector;
        }
    }

    /**
     * Initialize core services
     * @private
     */
    async _initCore() {
        // Initialize global error handler first
        errorHandler.initialize();

        // Initialize storage
        storageService.initialize();

        // Run data migration (localStorage → IndexedDB) — only runs once
        try {
            const migrationResult = await runMigration();
            if (migrationResult.success && !migrationResult.skipped && migrationResult.notesCount > 0) {
                console.log(`✅ Migrated ${migrationResult.notesCount} notes to IndexedDB`);
            }
        } catch (error) {
            console.error('Migration failed (falling back to localStorage):', error);
            errorHandler.report(error, 'migration');
        }

        // Initialize editor
        if (this.containers.editor) {
            const savedFontSize = storageService.get(STORAGE_KEYS.FONT_SIZE) || APP_CONFIG.DEFAULT_FONT_SIZE;
            const savedTheme = storageService.get(STORAGE_KEYS.EDITOR_THEME) || 'vs';

            editorService.initialize(this.containers.editor, {
                fontSize: savedFontSize,
                theme: savedTheme
            });
            setupSpellcheck(editorService.getEditor());
        }

        // Initialize markdown service
        markdownService.initialize();
    }

    /**
     * Initialize UI components
     * @private
     */
    _initUI() {
        // Initialize theme manager
        themeManager.initialize();

        // Initialize autosave indicator
        autosaveIndicator.initialize('#save-status');

        // Initialize autosave manager (debounced IndexedDB saves)
        autosaveManager.initialize({
            interval: APP_CONFIG.AUTOSAVE_INTERVAL_MS
        });

        // Toast and modal auto-initialize on first use
    }

    /**
     * Initialize feature modules
     * @private
     */
    async _initFeatures() {
        // App context menu
        appContextMenuManager.initialize();

        // The production page owns the static toolbar markup and its action
        // bindings. Use the hidden host for shared advanced popover helpers so
        // the modular bootstrap does not replace the visible production toolbar
        // with ToolbarManager's separate generated layout.
        const enhancedToolbarHost = document.querySelector('#enhanced-toolbar');
        if (enhancedToolbarHost && FEATURE_FLAGS.ENABLE_TOOLBAR) {
            toolbarManager.initialize(enhancedToolbarHost, { render: false });
        }
        // The density controller owns the responsive expand/collapse button
        // around the static production toolbar and is separate from toolbar
        // action binding.
        initToolbarDensity();

        // Tabs
        if (this.containers.tabs && FEATURE_FLAGS.ENABLE_TABS) {
            tabPersistenceManager.initialize({ tabsManager, noteStorage, autosaveManager, fileTreeStorage, rootFolderId: ROOT_FOLDER_ID });
            const fallbackTabs = storageService.get(STORAGE_KEYS.TABS)
                ? null : (await db.settings.get('modular-open-tabs'))?.value;
            tabsManager.initialize(this.containers.tabs, { fallbackTabs });
            await tabPersistenceManager.hydrateOpenTabs();
            await this._initExplorer();
            this._initBacklinks();
        }

        // Stats
        if (this.containers.stats && FEATURE_FLAGS.ENABLE_STATS) {
            // The configured element is a toolbar button, not a render target.
            // Keep its icon intact and use the static statistics dialog.
            statsManager.initialize();
            this._initStatsControls();
        }

        // TOC
        if (this.containers.toc && FEATURE_FLAGS.ENABLE_TOC) {
            tocManager.initialize(this.containers.toc);
            this._tocController?.abort();
            this._tocController = new AbortController();
            const { signal } = this._tocController;
            document.getElementById('toc-button')?.addEventListener('click', () => tocManager.toggle(), { signal });
            document.getElementById('toc-close-btn')?.addEventListener('click', () => tocManager.hide(), { signal });
        }

        // Linter
        if (this.containers.linter && FEATURE_FLAGS.ENABLE_LINTER) {
            linterManager.initialize(this.containers.linter);
        }

        // Search
        if (this.containers.search && FEATURE_FLAGS.ENABLE_SEARCH) {
            searchManager.initialize(this.containers.search);
        }

        // Templates
        if (this.containers.templates && FEATURE_FLAGS.ENABLE_TEMPLATES) {
            templatesManager.initialize(this.containers.templates);
        }

        // Snippets
        if (this.containers.snippets && FEATURE_FLAGS.ENABLE_SNIPPETS) {
            snippetsManager.initialize(this.containers.snippets);
        }

        // Goals
        if (this.containers.goals && FEATURE_FLAGS.ENABLE_GOALS) {
            goalsManager.initialize(this.containers.goals);
        }

        // View modes
        modesManager.initialize({
            main: this.containers.main,
            // Split ratios belong to the outer panes. Applying them to the
            // editor/preview wrappers leaves a half-width child inside each
            // pane, producing a large empty gap in split view.
            editor: this.containers.editor?.closest?.('.editor-pane') || this.containers.editor?.parentElement,
            preview: this.containers.preview?.closest?.('.preview-pane') || this.containers.preview?.parentElement
        });
        this._initViewModeControls();

        // Focus mode
        focusManager.initialize('#focus-button');

        // Typewriter mode
        typewriterManager.initialize('#typewriter-button');

        // Fullscreen mode
        fullscreenManager.initialize('#fullscreen-button');

        // Image upload
        imageUploadManager.initialize();

        // Match the production entry: load image resize after the editor is ready,
        // but before initial Markdown is rendered so the observer sees its images.
        await this._initImageResize();

        // Split divider
        dividerManager.initialize({
            divider: '#split-divider',
            leftPane: '#edit',
            rightPane: '#preview',
            container: '#container'
        });

        // Preview media/layout controls and live editing POC
        this._initVideoControls();
        this._initLivePreviewEdit();

        // Mobile UI
        mobileUIManager.initialize();

        // File import
        importManager.initialize();

        // No-server share (URL link + file share + opt-in paste fallback)
        try {
            shareManager.initialize({
                getMarkdown: () => editorService.getValue(),
                getPortableMarkdown: markdown => localMediaStore.portableMarkdown(markdown),
                getTitle: () => {
                    try {
                        return deriveDocumentTitle(editorService.getValue()) || 'document';
                    } catch {
                        return 'document';
                    }
                },
                onIncomingDoc: async ({ markdown, title }) => {
                    if (typeof markdown !== 'string') return;
                    const name = String(title || deriveDocumentTitle(markdown) || 'Shared').slice(0, 80);
                    const created = tabsManager.createTab(name, markdown);
                    if (!created) return null;
                    const note = await tabPersistenceManager.ensureTabNote(created);
                    if (!note) return null;
                    editorService.focus();
                    return { noteId: note.id };
                }
            });
            initializeCloudAccount({
                getCurrentDocument: () => {
                    const current = tabsManager.getActiveTab();
                    return current ? { noteId: current.noteId ?? null, title: current.name, content: editorService.getValue() } : null;
                },
                openCloudDocument: async ({ title, content }) => {
                    const created = tabsManager.createTab(String(title || 'Cloud document').slice(0, 80), content);
                    if (!created) return null;
                    const note = await tabPersistenceManager.ensureTabNote(created);
                    if (!note) return null;
                    editorService.focus();
                    return { noteId: note.id };
                }
            });
            handleIncomingShare();
        } catch (error) {
            console.warn('Share init skipped:', error);
        }

        // Command palette (Ctrl/Cmd+P): files from IndexedDB + app commands.
        try {
            paletteManager.initialize({
                commands: [
                    { id: 'new-tab', label: 'New tab', keywords: ['new', 'tab', 'document'], run: () => this.createFile() },
                    { id: 'toggle-toc', label: 'Toggle table of contents', keywords: ['toc', 'outline'], run: () => tocManager.toggle() },
                    { id: 'toggle-linter', label: 'Toggle linter', keywords: ['lint'], run: () => linterManager.toggle() },
                    { id: 'toggle-snippets', label: 'Toggle snippets', keywords: ['snippet'], run: () => snippetsManager.toggle() },
                    { id: 'toggle-focus', label: 'Toggle focus mode', keywords: ['focus'], run: () => focusManager.toggle() },
                    { id: 'toggle-fullscreen', label: 'Toggle fullscreen', keywords: ['fullscreen'], run: () => fullscreenManager.toggle() },
                    { id: 'toggle-vim', label: 'Toggle Vim keybindings', keywords: ['vim', 'keybindings'], run: () => toggleVim() },
                    { id: 'export-pdf', label: 'Export PDF', keywords: ['export', 'pdf'], run: () => this.exportPDF() },
                    { id: 'export-html', label: 'Export HTML', keywords: ['export', 'html'], run: () => this.exportHTML() },
                    { id: 'export-markdown', label: 'Export Markdown', keywords: ['export', 'markdown'], run: () => this.exportMarkdown() }
                ],
                getFiles: async () => {
                    try {
                        const notes = await noteStorage.getAllNotes();
                        return notes.map(n => ({ id: n.id, title: n.title }));
                    } catch {
                        return [];
                    }
                },
                onExecute: async (item) => {
                    if (item.kind === 'file') {
                        const note = await noteStorage.getNote(Number(item.noteId));
                        if (note) {
                            // Sync YAML frontmatter into unset note fields (tags/category/title).
                            try {
                                const { frontmatterSyncForNote } = await import('./utils/frontmatter.js');
                                const sync = frontmatterSyncForNote(note, note.content || '');
                                if (Object.keys(sync).length > 0) {
                                    await noteStorage.updateNote(note.id, sync);
                                }
                            } catch (_e) { /* frontmatter is best-effort */ }
                            editorService.setValue(note.content || '');
                            editorService.focus();
                            toast.show(`Opened "${note.title}"`, { duration: 1600 });
                        }
                    } else if (item.insert) {
                        const editor = editorService.getEditor();
                        const selection = editor?.getSelection();
                        if (editor && selection) {
                            editor.executeEdits('palette', [{ range: selection, text: item.insert }]);
                            editor.focus();
                        }
                    }
                }
            });
        } catch (error) {
            console.warn('Palette init skipped:', error);
        }

        // Vim keybindings preference (ported from legacy main.js; no-op without opt-in)
        try {
            void applyVimPreference(null, document.querySelector('#vim-status'));
        } catch (error) {
            console.warn('Vim init skipped:', error);
        }

        // AI Writer — dynamic import keeps it off the critical boot path
        if (FEATURE_FLAGS.ENABLE_AI_WRITER) {
            getAiWriterManager()
                .then((ai) => {
                    ai.initialize();
                    document.querySelector('#ai-writer-button')?.setAttribute('data-ai-setup', 'true');
                })
                .catch((err) => console.warn('AI Writer load error:', err));
        }
    }

    async _initExplorer() {
        if (!document.getElementById('explorer-tree')) return;
        this.explorerManager = createExplorerManager({
            onOpenFile: (nodeId) => { void this._openExplorerFile(nodeId); },
            onCreateFile: (folderId) => { void this.createFile(folderId); },
            onCreateFolder: (folderId) => { void this._createExplorerFolder(folderId); },
            onRenameNode: (node, name) => this._renameExplorerNode(node, name),
            onDeleteNode: (node) => { void this._deleteExplorerNode(node); },
            onOpenTrash: () => { void this.openTrash(); },
            onMoveNode: (payload) => this._moveExplorerNode(payload),
            onLayoutChange: () => editorService.layout()
        });
        this.explorerManager.initialize();
        this._explorerUnsubscribers = [
            eventBus.on(EVENTS.TAB_CREATED, ({ tab }) => {
                void tabPersistenceManager.ensureTabNote(tab).then(() => this._refreshExplorer(tab?.id));
            }),
            eventBus.on(EVENTS.TAB_RENAMED, () => { void this._refreshExplorer(); })
        ];
        await fileTreeStorage.ensureRoot();
        await this._refreshExplorer();
    }

    _initStatsControls() {
        const trigger = this.containers.stats;
        const dialog = document.getElementById('stats-modal');
        const overlay = document.getElementById('stats-modal-overlay');
        if (!trigger || !dialog || !overlay) return;

        this._statsController?.abort();
        this._statsController = new AbortController();
        const { signal } = this._statsController;
        const closeButton = dialog.querySelector('#stats-close');
        const closeFooterButton = dialog.querySelector('#stats-close-btn');

        const close = () => {
            dialog.style.display = 'none';
            overlay.style.display = 'none';
            dialog.setAttribute('aria-hidden', 'true');
            trigger.setAttribute('aria-expanded', 'false');
            trigger.focus({ preventScroll: true });
        };
        const open = () => {
            const content = editorService.getValue();
            const stats = markdownService.extractStats(content);
            statsManager.update(content);
            const values = {
                'stat-words': stats.words,
                'stat-chars': stats.characters,
                'stat-paragraphs': stats.paragraphs,
                'stat-sentences': content.trim()
                    ? (content.match(/[.!?]+(?=\s|$)/g) || []).length || 1
                    : 0,
                'stat-headings': (content.match(/^#{1,6}\s+.+$/gm) || []).length,
                'stat-reading-time': `${stats.readingTime}m`
            };
            for (const [id, value] of Object.entries(values)) {
                const target = document.getElementById(id);
                if (target) target.textContent = String(value);
            }
            dialog.style.display = 'block';
            overlay.style.display = 'block';
            dialog.setAttribute('aria-hidden', 'false');
            trigger.setAttribute('aria-expanded', 'true');
            closeButton?.focus({ preventScroll: true });
        };

        trigger.setAttribute('aria-haspopup', 'dialog');
        trigger.setAttribute('aria-controls', dialog.id);
        trigger.setAttribute('aria-expanded', 'false');
        dialog.setAttribute('aria-hidden', 'true');
        trigger.addEventListener('click', open, { signal });
        closeButton?.addEventListener('click', close, { signal });
        closeFooterButton?.addEventListener('click', close, { signal });
        overlay.addEventListener('click', close, { signal });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && dialog.style.display === 'block') close();
        }, { signal });
    }

    async _refreshExplorer(selectedNodeId = null) {
        if (!this.explorerManager) return;
        const nodes = await fileTreeStorage.getTree();
        this.explorerManager.setNodes(nodes);

        let selected = selectedNodeId;
        if (!selected) {
            const active = tabsManager.getActiveTab();
            if (active?.noteId) {
                const node = await fileTreeStorage.getFileNodeByNoteId(active.noteId);
                if (node?.deletedAt == null) selected = node.id;
            }
        }
        if (selected) this.explorerManager.setSelection(selected);
    }

    async _openExplorerFile(nodeId) {
        const nodes = await fileTreeStorage.getTree();
        const node = nodes.find((item) => item.id === nodeId && item.type === 'file');
        if (!node?.noteId) return null;
        const note = await noteStorage.getNote(node.noteId);
        if (!note) {
            toast.show('This file is no longer available. Check Trash if it was deleted.', { type: 'warning' });
            await this._refreshExplorer();
            return null;
        }

        let tab = tabsManager.getAllTabs().find((item) =>
            item.noteId === note.id || item.stableId === note.stableId
        );
        if (tab) {
            tabsManager.syncTabNote(tab.id, note, { restoreContent: Number(note.updatedAt) > Number(tab.updatedAt) });
            tabsManager.activateTab(tab.id);
        } else {
            tab = tabsManager.createTab(note.title || node.name || 'Untitled', note.content || '', {
                id: node.id,
                noteId: note.id,
                stableId: note.stableId,
                exactName: true
            });
            if (!tab) {
                toast.show('The tab limit has been reached. Close a tab before opening this file.', { type: 'warning' });
                return null;
            }
            await tabPersistenceManager.ensureTabNote(tab);
        }

        this.explorerManager?.setSelection(node.id);
        await this._refreshBacklinks();
        return tab;
    }

    async _openNoteById(noteId) {
        const note = await noteStorage.getNote(Number(noteId));
        if (!note) return null;
        let node = await fileTreeStorage.getFileNodeByNoteId(note.id);
        if (!node || node.deletedAt != null) {
            node = await fileTreeStorage.createNode({
                type: 'file',
                name: note.title || 'Untitled',
                parentId: ROOT_FOLDER_ID,
                noteId: note.id
            });
        }
        if (!node) return null;
        await this._refreshExplorer(node.id);
        return this._openExplorerFile(node.id);
    }

    async createFile(parentFolderId = ROOT_FOLDER_ID) {
        const tab = await this.createTab('Untitled', '');
        if (!tab?.noteId) return null;
        let node = await fileTreeStorage.getFileNodeByNoteId(tab.noteId);
        if (!node) {
            node = await fileTreeStorage.createNode({
                id: tab.id,
                type: 'file',
                name: tab.name,
                parentId: parentFolderId || ROOT_FOLDER_ID,
                noteId: tab.noteId
            });
        } else if ((parentFolderId || ROOT_FOLDER_ID) !== node.parentId) {
            node = await fileTreeStorage.moveNode(node.id, parentFolderId || ROOT_FOLDER_ID);
        }
        if (!node) {
            toast.show('The document is open, but its Explorer entry could not be saved.', { type: 'error' });
            return tab;
        }
        await this._refreshExplorer(node.id);
        await this._refreshBacklinks();
        return tab;
    }

    async _createExplorerFolder(parentFolderId = ROOT_FOLDER_ID) {
        const node = await fileTreeStorage.createNode({
            type: 'folder', name: 'New Folder', parentId: parentFolderId || ROOT_FOLDER_ID
        });
        if (!node) {
            toast.show('Could not create the folder.', { type: 'error' });
            return null;
        }
        await this._refreshExplorer(node.id);
        return node;
    }

    async _renameExplorerNode(node, requestedName) {
        if (!node || node.id === ROOT_FOLDER_ID) return null;
        const oldName = node.name;
        const renamed = await fileTreeStorage.renameNode(node.id, requestedName);
        if (!renamed) return null;

        if (renamed.type === 'file' && renamed.noteId) {
            const note = await noteStorage.updateNote(renamed.noteId, { title: renamed.name });
            if (note) {
                const tab = tabsManager.getAllTabs().find((item) => item.noteId === note.id);
                if (tab && tab.name !== renamed.name) tabsManager.renameTab(tab.id, renamed.name);
                await this.backlinksManager?.applyRename(oldName, renamed.name);
            }
        }
        await this._refreshExplorer(renamed.id);
        await this._refreshBacklinks();
        return renamed;
    }

    async _moveExplorerNode({ draggedNode, targetNode, position, sortMode } = {}) {
        if (!draggedNode || !targetNode || draggedNode.id === ROOT_FOLDER_ID) return false;
        const movingIntoFolder = targetNode.type === 'folder';
        const newParentId = movingIntoFolder ? targetNode.id : (targetNode.parentId || ROOT_FOLDER_ID);
        if (draggedNode.type === 'folder' && newParentId === draggedNode.id) return false;
        if (draggedNode.parentId !== newParentId && !await fileTreeStorage.moveNode(draggedNode.id, newParentId)) {
            toast.show('Could not move this item.', { type: 'error' });
            return false;
        }

        if (sortMode === 'manual' && !movingIntoFolder) {
            const siblings = (await fileTreeStorage.getTree())
                .filter((item) => item.parentId === newParentId)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            const targetIndex = siblings.findIndex((item) => item.id === targetNode.id);
            if (targetIndex !== -1) {
                const toIndex = position === 'before' ? targetIndex : targetIndex + 1;
                if (!await fileTreeStorage.reorderNode(draggedNode.id, toIndex)) {
                    toast.show('Could not save the new file order. Please try again.', { type: 'error' });
                }
            }
        }
        await this._refreshExplorer(draggedNode.id);
        return true;
    }

    async _deleteExplorerNode(node) {
        if (!node || node.id === ROOT_FOLDER_ID) return;
        const nodes = await fileTreeStorage.getTree();
        const subtreeIds = new Set([node.id]);
        let changed = true;
        while (changed) {
            changed = false;
            for (const item of nodes) {
                if (!subtreeIds.has(item.id) && subtreeIds.has(item.parentId)) {
                    subtreeIds.add(item.id);
                    changed = true;
                }
            }
        }
        const subtree = nodes.filter((item) => subtreeIds.has(item.id));
        const noteIds = new Set(subtree.filter((item) => item.type === 'file' && item.noteId).map((item) => item.noteId));
        const docs = tabsManager.getAllTabs().filter((tab) => noteIds.has(tab.noteId));
        const label = node.type === 'file' ? `${node.name}.md` : node.name;
        if (!confirm(`Move ${node.type} "${label}" to Trash? Its history and linked data will stay recoverable.`)) return;

        // Flush the active editor and every open document in the subtree before
        // soft deletion. This keeps tabs with pending edits restorable too.
        await autosaveManager.save();
        for (const tab of docs) {
            const content = tabsManager.getActiveTab()?.id === tab.id
                ? editorService.getValue()
                : tab.content;
            const saved = await noteStorage.updateNote(tab.noteId, {
                title: tab.name || 'Untitled',
                content: typeof content === 'string' ? content : ''
            });
            if (!saved) {
                toast.show('Could not save every open document. It remains available; retry before moving it to Trash.', { type: 'error' });
                return;
            }
        }

        let result;
        try {
            result = await fileTreeStorage.deleteNodeRecursive(node.id);
        } catch (error) {
            console.error('Could not move Explorer item to Trash:', error);
            toast.show('Could not move this item to Trash. Its saved data is still available.', { type: 'error' });
            return;
        }
        if (!result?.deletedNodeIds?.length) return;

        const removedNoteIds = new Set(result.deletedNoteIds || []);
        const removedNodeIds = new Set(result.deletedNodeIds);
        const openTabs = tabsManager.getAllTabs().filter((tab) => removedNodeIds.has(tab.id) || removedNoteIds.has(tab.noteId));
        for (const tab of openTabs) tabsManager.closeTab(tab.id, true);
        await this._refreshExplorer();
        await this._refreshBacklinks();
        toast.show('Moved to Trash. Versions and linked data remain recoverable.', { type: 'success' });
    }

    async openTrash() {
        const list = document.createElement('div');
        list.className = 'trash-list';
        const modalId = modal.open({ title: 'Trash', content: list, size: 'md' });

        const renderTrash = async () => {
            const [roots, linkedNoteIds, deletedNotes] = await Promise.all([
                fileTreeStorage.getTrashRoots(),
                fileTreeStorage.getTrashNoteIds(),
                noteStorage.getDeletedNotes()
            ]);
            list.replaceChildren();
            const linked = new Set(linkedNoteIds);
            const entries = [
                ...roots.map((item) => ({ kind: 'node', id: item.id, label: item.type === 'file' ? `${item.name}.md` : item.name, deletedAt: item.deletedAt })),
                ...deletedNotes.filter((note) => !linked.has(note.id)).map((note) => ({ kind: 'note', id: note.id, label: `${note.title || 'Untitled'}.md`, deletedAt: note.deletedAt }))
            ];
            if (!entries.length) {
                const empty = document.createElement('p');
                empty.className = 'trash-empty';
                empty.textContent = 'Trash is empty.';
                list.appendChild(empty);
                return;
            }

            for (const entry of entries) {
                const row = document.createElement('div');
                row.className = 'trash-item';
                const label = document.createElement('div');
                label.className = 'trash-item-label';
                label.append(document.createTextNode(entry.label));
                const date = document.createElement('span');
                date.className = 'trash-item-date';
                date.textContent = entry.deletedAt ? `Moved ${new Date(entry.deletedAt).toLocaleString()}` : 'Moved to Trash';
                label.appendChild(date);
                const restore = document.createElement('button');
                restore.type = 'button';
                restore.className = 'trash-item-restore';
                restore.textContent = 'Restore';
                restore.setAttribute('aria-label', `Restore ${entry.label}`);
                restore.addEventListener('click', async () => {
                    restore.disabled = true;
                    try {
                        let restoredNode = null;
                        if (entry.kind === 'node') {
                            const restored = await fileTreeStorage.restoreNodeRecursive(entry.id);
                            if (!restored) throw new Error('Trash item is no longer available');
                            restoredNode = restored.rootNode;
                        } else {
                            const restored = await fileTreeStorage.restoreStandaloneNote(entry.id);
                            if (!restored) throw new Error('Note is no longer available');
                            restoredNode = restored.node;
                        }
                        await this._refreshExplorer(restoredNode?.id || null);
                        if (restoredNode?.type === 'file') await this._openExplorerFile(restoredNode.id);
                        await this._refreshBacklinks();
                        toast.show('Restored from Trash.', { type: 'success' });
                        await renderTrash();
                    } catch (error) {
                        console.error('Could not restore Trash item:', error);
                        toast.show('Could not restore this item. Its saved data is still kept in Trash.', { type: 'error' });
                        restore.disabled = false;
                    }
                });
                row.append(label, restore);
                list.appendChild(row);
            }
        };

        await renderTrash();
        return modalId;
    }

    _initBacklinks() {
        if (!document.getElementById('toc-button')) return;
        this.backlinksManager = new BacklinksManager({
            noteStorage,
            documents: [],
            activeDocId: null,
            onSwitchTab: (noteId) => { void this._openNoteById(noteId); },
            onRefresh: (docId) => this.backlinksPanel?.render(docId),
            editor: editorService.getEditor()
        });
        this.backlinksPanel = new BacklinksPanel(this.backlinksManager);
        this.backlinksPanel.initialize();
        this.backlinksManager.initialize();

        const refresh = () => { void this._refreshBacklinks(); };
        this._backlinksUnsubscribers = [
            eventBus.on(EVENTS.TAB_ACTIVATED, refresh),
            eventBus.on(EVENTS.TAB_CREATED, ({ tab }) => {
                void tabPersistenceManager.ensureTabNote(tab).then(refresh);
            }),
            eventBus.on(EVENTS.TAB_RENAMED, ({ tab }) => {
                void tabPersistenceManager.ensureTabNote(tab).then(async (note) => {
                    if (note && note.title !== tab.name) await noteStorage.updateNote(note.id, { title: tab.name });
                    await this._refreshBacklinks();
                });
            }),
            eventBus.on(EVENTS.DOCUMENT_SAVED, refresh)
        ];
        void this._refreshBacklinks();
    }

    async _refreshBacklinks() {
        if (!this.backlinksManager) return;
        const notes = await noteStorage.getAllNotes();
        this.backlinksManager.config.documents = notes.map((note) => ({
            id: String(note.id), title: note.title || 'Untitled', noteId: note.id
        }));
        const active = tabsManager.getActiveTab();
        const activeDocId = active?.noteId ? String(active.noteId) : null;
        this.backlinksManager.config.activeDocId = activeDocId;
        await this.backlinksManager.scanAll();
        this.backlinksPanel?.render(activeDocId);
    }

    /**
     * Connect the static view controls to the modular mode manager.
     * @private
     */
    _initViewModeControls() {
        const previewButton = document.getElementById('toolbar-preview-toggle');
        this._viewModeController?.abort();
        this._viewModeController = new AbortController();
        const { signal } = this._viewModeController;
        const viewButtons = [
            ['view-code', VIEW_MODES.EDITOR],
            ['view-split', VIEW_MODES.SPLIT],
            ['view-preview', VIEW_MODES.PREVIEW]
        ].map(([id, mode]) => [document.getElementById(id), mode]).filter(([button]) => button);

        const syncControls = ({ mode = modesManager.getMode() } = {}) => {
            document.body.classList.remove('view-editor', 'view-split', 'view-preview');
            document.body.classList.add(`view-${mode}`);

            for (const [button, buttonMode] of viewButtons) {
                const active = buttonMode === mode;
                button.classList.toggle('active', active);
                button.setAttribute('aria-pressed', String(active));
            }

            if (previewButton) {
                const previewOnly = mode === VIEW_MODES.PREVIEW;
                previewButton.classList.toggle('active', previewOnly);
                previewButton.setAttribute('aria-pressed', String(previewOnly));
                previewButton.setAttribute('aria-label', previewOnly ? 'Return to Split View' : 'Show Preview');
                previewButton.title = previewOnly ? 'Return to Split View' : 'Show Preview';
            }
        };

        for (const [button, mode] of viewButtons) {
            button.addEventListener('click', () => modesManager.setMode(mode), { signal });
        }
        previewButton?.addEventListener('click', () => {
            modesManager.setMode(modesManager.isPreviewMode() ? VIEW_MODES.SPLIT : VIEW_MODES.PREVIEW);
        }, { signal });

        this._viewModeUnsubscribe?.();
        this._viewModeUnsubscribe = eventBus.on(EVENTS.VIEW_MODE_CHANGED, syncControls);
        syncControls();
    }

    /**
     * Initialize video preview controls
     * @private
     */
    _initVideoControls() {
        this.videoControlsController = initVideoControls({
            output: this.containers.preview || '#output',
            getMarkdown: () => editorService.getValue(),
            onMarkdownChange: (markdown) => this._applyMarkdownFromPreviewEdit(markdown, 'video-controls'),
            showToast: (message, type = 'info', duration = 1600) => {
                toast.show(message, { type, duration });
            }
        });
    }

    /**
     * Initialize the image resize manager without putting its code on the entry
     * bundle's critical path. Its callback updates the editor model while
     * suppressing the normal preview render, because the feature already changed
     * the corresponding preview element in place.
     * @private
     */
    async _initImageResize() {
        try {
            const { initImageResize, getImageResizeManager } = await import('./features/image-resize/index.js');
            initImageResize({
                editor: editorService.getEditor(),
                onMarkdownChange: (markdown) => this._applyMarkdownFromPreviewEdit(markdown, 'image-resize')
            });
            this.imageResizeManager = getImageResizeManager();
        } catch (error) {
            // A failed optional media module must not prevent local editing.
            console.warn('Image resize module load error:', error);
        }
    }

    /**
     * Persist Markdown generated by an in-place preview edit without replacing
     * the preview DOM. Full-model edits remain a single undoable editor change.
     * @private
     * @param {string} markdown
     * @param {string} source
     */
    _applyMarkdownFromPreviewEdit(markdown, source = 'preview-edit') {
        const editor = editorService.getEditor();
        if (!editor || typeof markdown !== 'string' || editorService.getValue() === markdown) return;

        const model = editor.getModel?.();
        this.isApplyingPreviewEdit = true;
        try {
            if (model && typeof model.getFullModelRange === 'function' && typeof editor.executeEdits === 'function') {
                editor.pushUndoStop?.();
                editor.executeEdits(source, [{
                    range: model.getFullModelRange(),
                    text: markdown,
                    forceMoveMarkers: true
                }]);
                editor.pushUndoStop?.();
            } else {
                editorService.setValue(markdown);
            }
        } finally {
            this.isApplyingPreviewEdit = false;
        }

        // The preview controller already updated its DOM in place. Keep the
        // compatibility snapshot in sync without triggering a full conversion.
        storageService.set(STORAGE_KEYS.CONTENT, markdown);
    }

    /**
     * Initialize live preview edit POC
     * @private
     */
    _initLivePreviewEdit() {
        this.livePreviewEditController = initLivePreviewEdit({
            output: this.containers.preview || '#output',
            toggle: '#live-preview-edit-toggle',
            markdownToggle: '#markdown-mode-toggle',
            getSourceMarkdown: () => editorService.getValue(),
            onMarkdownChange: (markdown) => this._applyMarkdownFromPreviewEdit(markdown, 'live-preview-edit'),
            showToast: (message, type = 'info', duration = 2200) => {
                toast.show(message, { type, duration });
            }
        });
    }

    /**
     * Initialize services
     * @private
     */
    _initServices() {
        this.exportDialog = initializeExportDialog({
            getMarkdown: () => editorService.getValue(),
            getPortableMarkdown: markdown => localMediaStore.portableMarkdown(markdown),
            getFilename: extension => this._getFilename(extension),
            getPreview: () => this.containers.preview,
            onReset: () => {
                if (window.confirm('Replace this document with the welcome example? Export important work first.')) {
                    editorService.setValue(DEFAULT_CONTENT);
                }
            }
        });
        // Initialize shortcuts
        shortcutsManager.initialize();

        // Register shortcut handlers
        this._registerShortcutHandlers();

        // Initialize PWA
        pwaService.initialize();
    }

    /**
     * Register keyboard shortcut handlers
     * @private
     */
    _registerShortcutHandlers() {
        shortcutsManager.registerAll({
            'save': () => this.save(),
            'new': () => this.createFile(),
            'find': () => searchManager.show(),
            'replace': () => searchManager.show(true),
            'togglePreview': () => modesManager.cycleMode(),
            'toggleTOC': () => tocManager.toggle(),
            'toggleLinter': () => linterManager.toggle(),
            'toggleSnippets': () => snippetsManager.toggle(),
            'toggleFocus': () => focusManager.toggle(),
            'toggleFullscreen': () => fullscreenManager.toggle(),
            'cycleTheme': () => themeManager.cycleTheme(),
            'reset': () => tabsManager.resetActiveTab(),
            'exportPDF': () => this.exportPDF(),
            'exportHTML': () => this.exportHTML(),
            'help': () => this.showHelp(),
            'toggleAI': () => {
                getAiWriterManager()
                    .then((ai) => {
                        if (!ai.initialized && FEATURE_FLAGS.ENABLE_AI_WRITER) {
                            ai.initialize();
                        }
                        ai.toggle();
                    })
                    .catch((err) => console.warn('AI Writer load error:', err));
            }
        });
    }

    /**
     * Setup event listeners
     * @private
     */
    _setupEventListeners() {
        // Content change -> update preview
        const debouncedPreviewUpdate = debounce((content) => {
            this._updatePreview(content);
        }, APP_CONFIG.PREVIEW_DEBOUNCE_MS);

        eventBus.on(EVENTS.CONTENT_CHANGED, ({ content }) => {
            if (this.isApplyingPreviewEdit) return;
            debouncedPreviewUpdate(content);
        });

        // Theme changes
        eventBus.on(EVENTS.THEME_CHANGED, ({ resolved }) => {
            // Update mermaid theme
            markdownService.setMermaidTheme(resolved === 'dark' ? 'dark' : 'default');
        });

        // Toast events
        eventBus.on(EVENTS.TOAST_SHOW, ({ message, type, duration }) => {
            toast.show(message, { type, duration });
        });

        // Prompt events
        eventBus.on(EVENTS.SHOW_PROMPT, async ({ title, message, placeholder, onConfirm }) => {
            const result = await modal.prompt({ title, message, placeholder });
            if (result !== null && onConfirm) {
                onConfirm(result);
            }
        });

        // Confirm events
        eventBus.on(EVENTS.CONFIRM_REQUIRED, async ({ title, message, onConfirm, onCancel }) => {
            const confirmed = await modal.confirm({ title, message });
            if (confirmed && onConfirm) {
                onConfirm();
            } else if (!confirmed && onCancel) {
                onCancel();
            }
        });

        // Window beforeunload
        window.addEventListener('beforeunload', (_e) => {
            // Save current state
            this.save();
        });

        // Window resize
        window.addEventListener('resize', debounce(() => {
            editorService.layout();
        }, 100));

    }

    /**
     * Load initial content
     * @private
     */
    _loadInitialContent() {
        // Persisted tabs are the modular editor's active-document source of
        // truth. Use the legacy single-document key only when this is the
        // first tab set, so it cannot overwrite a restored note on boot.
        const savedContent = storageService.get(STORAGE_KEYS.CONTENT);
        const activeTab = tabsManager.getActiveTab();
        const hasStoredTabs = tabsManager.hadStoredTabs;
        const initialContent = hasStoredTabs
            ? (activeTab?.content ?? DEFAULT_CONTENT)
            : (savedContent || activeTab?.content || DEFAULT_CONTENT);

        editorService.setValue(initialContent);

        // Trigger initial preview update
        this._updatePreview(editorService.getValue());
    }

    /**
     * Update preview
     * @param {string} content - Markdown content
     * @private
     */
    async _updatePreview(content) {
        if (!this.containers.preview) return;

        const updateToken = ++this._previewUpdateToken;
        // Resolve only local image references stored in IndexedDB. Keep the
        // editor source portable through the explicit export/share boundary.
        for (const [, id] of content.matchAll(/markups-img:(img_\w+)/g)) {
            if (this.localImageUrls.has(id)) continue;
            const row = await db.media.get(id);
            if (updateToken !== this._previewUpdateToken) return;
            if (row?.blob) this.localImageUrls.set(id, typeof URL.createObjectURL === 'function'
                ? URL.createObjectURL(row.blob) : await blobToImageData(row.blob));
        }
        const previewSource = content.replace(/markups-img:(img_\w+)/g, (ref, id) => this.localImageUrls.get(id) || ref);
        await markdownService.render(previewSource, this.containers.preview, {
            sanitizeOptions: { LOCAL_BLOB_IMAGE_URLS: [...this.localImageUrls.values()] }
        });
        // Mermaid rendering is asynchronous. Ignore stale completions so they
        // cannot attach old source mappings to a newer preview DOM.
        if (updateToken !== this._previewUpdateToken) return;
        enhancePreviewCode(this.containers.preview);
        annotateSourceLines(this.containers.preview, content);
        this.videoControlsController?.refresh(this.containers.preview);
        this.livePreviewEditController?.refresh(this.containers.preview);
    }

    /**
     * Save current state
     */
    async save() {
        const content = editorService.getValue();
        const tab = tabsManager.getActiveTab();
        storageService.set(STORAGE_KEYS.CONTENT, content);
        try {
            const note = tab && await tabPersistenceManager.ensureTabNote(tab);
            if (!note) throw new Error('Local note storage did not confirm the document.');
            await autosaveManager.save();
            const persisted = await noteStorage.getNote(note.id);
            if (!persisted || persisted.content !== content) throw new Error('Local note storage did not confirm the current text.');
            // A tab switch or a newer edit must not receive this snapshot's
            // success indicator while its own work may still be pending.
            if (tabsManager.getActiveTab()?.id === tab.id && editorService.getValue() === content) {
                eventBus.emit(EVENTS.AUTOSAVE_STATUS_CHANGED, { status: 'saved' });
                eventBus.emit(EVENTS.DOCUMENT_SAVED, { noteId: note.id, stableId: note.stableId });
                toast.success('Document saved', { duration: 2000 });
            }
            return true;
        } catch {
            if (tabsManager.getActiveTab()?.id === tab?.id) {
                eventBus.emit(EVENTS.AUTOSAVE_STATUS_CHANGED, { status: 'error' });
                toast.error('Could not save this document. Keep the tab open and export your work.');
            }
            return false;
        }
    }

    /**
     * Export to PDF
     */
    async exportPDF() {
        const content = editorService.getValue();
        const filename = this._getFilename('pdf');

        toast.info('Generating PDF...', { duration: 2000 });

        try {
            await exportManager.toPDF(content, filename);
            toast.success('PDF exported successfully');
        } catch (error) {
            console.error('PDF export failed:', error);
            toast.error('Failed to export PDF');
        }
    }

    /**
     * Export to HTML
     */
    async exportHTML() {
        const content = editorService.getValue();
        const filename = this._getFilename('html');

        try {
            await exportManager.toHTML(content, filename);
            toast.success('HTML exported successfully');
        } catch (error) {
            console.error('HTML export failed:', error);
            toast.error('Failed to export HTML');
        }
    }

    /**
     * Export to Markdown
     */
    async exportMarkdown() {
        const content = editorService.getValue();
        const filename = this._getFilename('md');

        try {
            await exportManager.toMarkdown(content, filename);
            toast.success('Markdown exported successfully');
        } catch (error) {
            console.error('Markdown export failed:', error);
            toast.error('Failed to export Markdown');
        }
    }

    /**
     * Get filename for export
     * @param {string} extension - File extension
     * @returns {string} Filename
     * @private
     */
    _getFilename(extension) {
        const activeTab = tabsManager?.getActiveTab();
        const baseName = activeTab?.name || 'document';
        return `${baseName}.${extension}`;
    }

    /**
     * Show help dialog
     */
    showHelp() {
        modal.open({
            title: 'Keyboard Shortcuts',
            content: shortcutsManager.renderHelp(),
            size: 'lg'
        });
    }

    /**
     * Get Monaco editor instance for diagnostics and E2E smoke tests.
     * @returns {Object|null} Monaco editor instance
     */
    getEditor() {
        return editorService.getEditor();
    }

    /**
     * Get current content
     * @returns {string} Editor content
     */
    getContent() {
        return editorService.getValue();
    }

    /**
     * Set content
     * @param {string} content - Content to set
     */
    setContent(content) {
        editorService.setValue(content);
    }

    /** Create a tab and wait until its durable IndexedDB note identity exists. */
    async createTab(name = 'Untitled', content = '') {
        const tab = tabsManager.createTab(name, content);
        if (!tab) return null;
        const note = await tabPersistenceManager.ensureTabNote(tab);
        if (note) {
            await this._refreshExplorer(tab.id);
            await this._refreshBacklinks();
        }
        return note ? tab : null;
    }

    /**
     * Dispose application
     */
    dispose() {
        // Save state before disposing
        this.save();

        this._viewModeController?.abort();
        this.exportDialog?.dispose();
        for (const url of this.localImageUrls.values()) {
            if (url.startsWith('blob:')) URL.revokeObjectURL(url);
        }
        this.localImageUrls.clear();
        this._viewModeController = null;
        this._tocController?.abort();
        this._tocController = null;
        this._statsController?.abort();
        this._statsController = null;
        this._viewModeUnsubscribe?.();
        this._viewModeUnsubscribe = null;

        for (const unsubscribe of this._explorerUnsubscribers || []) unsubscribe();
        this._explorerUnsubscribers = [];
        for (const unsubscribe of this._backlinksUnsubscribers || []) unsubscribe();
        this._backlinksUnsubscribers = [];
        this.explorerManager?.dispose();
        this.explorerManager = null;
        this.backlinksPanel?.dispose();
        this.backlinksPanel = null;
        this.backlinksManager?.dispose();
        this.backlinksManager = null;

        // Dispose all modules
        editorService.dispose();
        tabPersistenceManager.dispose();
        tabsManager.dispose();
        goalsManager.dispose();
        statsManager.dispose();
        linterManager.dispose();
        tocManager.dispose();
        searchManager.dispose();
        templatesManager.dispose();
        snippetsManager.dispose();
        toolbarManager.dispose();
        modesManager.dispose();
        shortcutsManager.dispose();
        paletteManager.dispose();
        appContextMenuManager.dispose();
        if (_aiWriterManager) {
            _aiWriterManager.dispose();
            _aiWriterManager = null;
        }

        removeAllTrackedListeners();

        this.initialized = false;
        App.instance = null;
    }
}

// Export singleton instance
export const app = new App();

export { App };

export default app;
