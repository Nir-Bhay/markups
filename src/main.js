import Storehouse from './utils/storehouse-compat.js';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution';
import { marked } from 'marked';
import 'github-markdown-css/github-markdown-light.css';
import exportCss from './styles/export.css?raw';
import { sanitizePreviewHtml, ensurePreviewLinksOpenInNewTab, escapeHtml, sanitizeMarkdownAlt } from './utils/sanitize.js';
import { safeBase64FromArrayBuffer } from './utils/file.js';
import { modesManager } from './features/modes/index.js';

// html2pdf / html2canvas — lazy-loaded on first export (P3-T1)
let _html2pdf = null;
let _html2canvas = null;
async function getHtml2Pdf() {
    if (!_html2pdf) {
        const mod = await import('html2pdf.js');
        _html2pdf = mod.default;
    }
    return _html2pdf;
}
async function getHtml2Canvas() {
    if (!_html2canvas) {
        const mod = await import('html2canvas');
        _html2canvas = mod.default;
    }
    return _html2canvas;
}

// Monaco Editor Worker Setup
// The app only creates a Markdown editor, so route every Monaco worker request
// to the lightweight editor worker instead of bundling JSON/CSS/HTML/TS workers.
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

self.MonacoEnvironment = {
    getWorker() {
        return new editorWorker();
    }
};

// Syntax highlighting
import { markedHighlight } from 'marked-highlight';
import Prism from 'prismjs';

// Import common language support
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-markup'; // HTML, XML, SVG, MathML (Issue #42)
// prism-markup-templating defines tokenizePlaceholders / buildPlaceholders,
// which prism-php and other template grammars require. Loading php without it
// made markup/xml tokenize throw, so ALL code highlighting fell back to plain
// text in the preview ("everything black"). (Issue #42)
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-ini'; // INI / .gitconfig section highlighting (Issue #44)
import 'prismjs/themes/prism-tomorrow.css';

// Issue #42: prism-markup already covers XML; keep explicit aliases for fences.
Prism.languages.xml = Prism.languages.markup;
Prism.languages.XML = Prism.languages.markup;
Prism.languages.svg = Prism.languages.svg || Prism.languages.markup;
Prism.languages.html = Prism.languages.html || Prism.languages.markup;

// Mermaid for diagrams
import mermaid from 'mermaid';
mermaid.initialize({ startOnLoad: false, theme: 'default', suppressErrors: true });

// KaTeX for math
import 'katex/dist/katex.min.css';
import markedKatex from 'marked-katex-extension';

// Image resize — dynamically imported after editor init (P3-T1)
import { CALLOUT_TYPES, toolbarManager, wrapSelection, wrapSelectionHtml, prefixLine, insertText, insertLink, insertImage, insertTable, getSelection } from './features/toolbar/index.js';
import { noteStorage } from './core/storage/noteStorage.js';
import { fileTreeStorage, ROOT_FOLDER_ID } from './core/storage/fileTreeStorage.js';
import { runMigration, ensureFileTreeFromNotes } from './core/storage/migration.js';
import { createExplorerManager } from './features/explorer/index.js';

// Import debounce utility for performance optimization
import { debounce } from './utils/debounce.js';

// Import UI components from modular architecture
import { showToast } from './ui/toast/index.js';
import { copyToClipboard } from './utils/clipboard.js';
import { scrollSync } from './utils/scroll-sync.js';
import { processPreviewVideos, stripVideoAttributeBlocks, isEmbeddableVideoUrl } from './utils/video-embed.js';
import { initLivePreviewEdit } from './features/live-preview-edit/index.js';
import { initVideoControls, parseVideoAttributesFromMarkdown } from './features/video-controls/index.js';
import { initImageControls } from './features/image-controls/index.js';
import {
    enhanceLabeledVideoLinks,
    normalizeInsertVideoUrl
} from './features/video-discoverability/index.js';
import { appContextMenuManager } from './features/app-context-menu/index.js';
import { createFocusTrap } from './utils/dom.js';
import { validateImageSignature, sanitizeSvgToDataUrl } from './utils/file.js';
import { initVersionHistory, setHasEdited } from './features/version-history/index.js';
import { trackedAddEventListener } from './utils/listener-registry.js';

// GFM Extensions
import markedAlert from 'marked-alert';
import markedFootnote from 'marked-footnote';
// Emoji shortcode syntax (:smile:) for the preview (Issue #45)
import { markedEmoji } from 'marked-emoji';
import { emojiMarkedOptions } from './utils/emoji-shortcodes.js';
// Note: markdownlint is Node.js only, using custom browser-based linting instead

// Global configuration constants
const APP_CONFIG = {
    MAX_IMAGE_SIZE_MB: 5,
    READING_SPEED_WPM: 200,
    SERVICE_WORKER_UPDATE_INTERVAL_MS: 30 * 60 * 1000, // 30 minutes
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
};

// Global state and constants
let editor;
// Actions queued before the editor is ready (e.g. file import) — flushed on EDITOR_READY
let pendingEditorActions = [];
let hasEdited = false;
let isApplyingPreviewEdit = false;
let livePreviewEditController = null;
let videoControlsController = null;
let imageControlsController = null;
let scrollBarSync = true;
let cursorSync = false;
let darkMode = false;
let currentTheme = 'vs';
const TABLE_POPUP_MAX_SIZE = 20;

let goalsData = {
    dailyTarget: 500,
    streak: 0,
    lastGoalDate: null,
    history: {}
};

const localStorageNamespace = 'com.markdownlivepreview';
const localStorageKey = 'last_state';
const localStorageScrollBarKey = 'scroll_bar_settings';
const localStorageCursorSyncKey = 'cursor_sync_settings';
const localStorageDarkModeKey = 'dark_mode_settings';
const localStorageThemeKey = 'theme_settings';
const localStorageDocsKey = 'docs';
const localStorageTocVisibilityKey = 'toc_sidebar_visible';
const localStorageGoalsKey = 'writing_goals';
const localStorageImagesKey = 'image_store';
/** Soft max for imageStore. Unreferenced entries are evicted first; open-tab refs are kept. */
const IMAGE_STORE_MAX_SIZE = 15;
const imageStore = new Map(); // key: imgId, value: base64 data URL or blob: URL
const confirmationMessage = 'Are you sure you want to reset? Your changes will be lost.';

/** Revoke blob: object URLs; data: URLs need no revoke. */
const revokeImageStoreValue = (value) => {
    if (typeof value === 'string' && value.startsWith('blob:')) {
        try {
            URL.revokeObjectURL(value);
        } catch (_) {
            /* ignore */
        }
    }
};

const collectReferencedImageIds = (texts) => {
    const ids = new Set();
    const re = /markups-img:(img_\w+)/g;
    for (const text of texts) {
        if (!text || typeof text !== 'string') continue;
        let match;
        re.lastIndex = 0;
        while ((match = re.exec(text)) !== null) {
            ids.add(match[1]);
        }
    }
    return ids;
};

let _lastEditorValueForImageRefs = null;

const getOpenDocumentImageRefs = () => {
    const current = editor ? editor.getValue() : null;
    if (current !== _lastEditorValueForImageRefs) {
        _lastEditorValueForImageRefs = current;
    }
    return collectReferencedImageIds([
        ...(Array.isArray(documents) ? documents.map((d) => d.content) : []),
        ...(_lastEditorValueForImageRefs !== null ? [_lastEditorValueForImageRefs] : [])
    ]);
};

/**
 * Evict unreferenced images until at/under max.
 * Never evicts images still used by open tabs (avoids broken previews).
 */
const evictImageStoreIfNeeded = (protectKey = null) => {
    while (imageStore.size > IMAGE_STORE_MAX_SIZE) {
        const referenced = getOpenDocumentImageRefs();
        let evicted = false;
        for (const key of imageStore.keys()) {
            if (key === protectKey) continue;
            if (!referenced.has(key)) {
                revokeImageStoreValue(imageStore.get(key));
                imageStore.delete(key);
                evicted = true;
                break;
            }
        }
        if (!evicted) break;
    }
};

/** Set with soft-cap eviction of unreferenced entries. */
const imageStoreSet = (imgId, value) => {
    if (imageStore.has(imgId)) {
        const prev = imageStore.get(imgId);
        if (prev !== value) {
            revokeImageStoreValue(prev);
        }
        imageStore.delete(imgId);
    }
    imageStore.set(imgId, value);
    evictImageStoreIfNeeded(imgId);
};

const imageStoreGet = (imgId) => imageStore.get(imgId);

/** Drop store entries not referenced by any remaining document/editor content. */
const pruneUnreferencedImages = (extraTexts = []) => {
    const texts = [
        ...(Array.isArray(documents) ? documents.map((d) => d.content) : []),
        ...(editor ? [editor?.getValue()] : []),
        ...extraTexts
    ];
    const referenced = collectReferencedImageIds(texts);
    let changed = false;
    for (const key of [...imageStore.keys()]) {
        if (!referenced.has(key)) {
            revokeImageStoreValue(imageStore.get(key));
            imageStore.delete(key);
            changed = true;
        }
    }
    if (changed) {
        saveImageStore();
    }
    return changed;
};

/** After closing a tab, free images only used by that tab's content. */
const cleanupImagesAfterTabClose = (closedContent) => {
    const remainingTexts = [
        ...(Array.isArray(documents) ? documents.map((d) => d.content) : []),
        ...(editor ? [editor?.getValue()] : [])
    ];
    const stillUsed = collectReferencedImageIds(remainingTexts);
    const closedIds = collectReferencedImageIds([closedContent]);
    let changed = false;
    for (const id of closedIds) {
        if (!stillUsed.has(id) && imageStore.has(id)) {
            revokeImageStoreValue(imageStore.get(id));
            imageStore.delete(id);
            changed = true;
        }
    }
    if (changed) {
        saveImageStore();
    }
};

/** Clear entire image store (revokes blob URLs). */
// eslint-disable-next-line no-unused-vars -- reserved for full-reset / future tooling
const clearImageStore = () => {
    for (const value of imageStore.values()) {
        revokeImageStoreValue(value);
    }
    imageStore.clear();
    saveImageStore();
};
// default welcome content — shown to first-time users, auto-cleared on first real keystroke
const defaultInput = `# Welcome to Markups ✨

> **Your free, powerful Markdown editor** — write, preview, and export beautiful documents right in your browser.

Start typing here to begin — this welcome content will disappear automatically.

---

## What You Can Do

| Feature | How |
|---------|-----|
| **Bold**, *Italic*, ~~Strikethrough~~ | Toolbar buttons or Markdown syntax |
| Headings (H1–H6) | \`# Heading\` or toolbar |
| Bullet & numbered lists | \`- item\` or \`1. item\` |
| Code blocks with syntax highlighting | Triple backticks ${"\`"}${"\`"}${"\`"} |
| Tables | Pipe \`|\` syntax |
| Images & links | Drag-drop or \`![alt](url)\` |
| Math equations (LaTeX) | \`$E=mc^2$\` |
| Diagrams (Mermaid) | Fenced \`mermaid\` blocks |
| Export to PDF, HTML, DOCX, PNG | Click **Export** ↗ |
| Multiple tabs | Click **+** in the tab bar |

## Quick Examples

### Code Block

${"\`"}${"\`"}${"\`"}javascript
function greet(name) {
  return \`Hello, \${name}! 👋\`;
}
${"\`"}${"\`"}${"\`"}

### Math

Inline: $E = mc^2$ · Block:

$$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$

### Diagram

${"\`"}${"\`"}${"\`"}mermaid
graph LR
    A[Write Markdown] --> B[Live Preview]
    B --> C{Export}
    C --> D[PDF]
    C --> E[HTML]
    C --> F[Image]
${"\`"}${"\`"}${"\`"}

### Blockquote

> "The best way to predict the future is to create it." — Abraham Lincoln

---

**Keyboard shortcuts:** \`Ctrl+B\` Bold · \`Ctrl+I\` Italic · \`Ctrl+S\` Save · \`Ctrl+Shift+E\` Export

Happy writing! 🚀
`;

// Flag: true when showing the default welcome content (auto-clear on first real keystroke)
let isShowingWelcome = false;

// ----- Tabs System -----
let documents = [];
let activeDocId = null;
let explorerManager = null;

const mapNoteToDocument = (note, node) => ({
    id: node.id,
    title: (node.name || note.title || 'Untitled').replace(/\.md$/i, ''),
    content: note.content || '',
    lastModified: note.updatedAt || Date.now(),
    noteId: note.id,
    parentId: node.parentId || ROOT_FOLDER_ID
});

const ensureAtLeastOneDocument = async () => {
    if (documents.length > 0) return;

    const oldContent = loadLastContent() || defaultInput;
    const created = await noteStorage.createNote({
        title: 'Untitled',
        content: oldContent
    });
    if (!created) return;

    const fileNode = await fileTreeStorage.createNode({
        type: 'file',
        name: created.title || 'Untitled',
        parentId: ROOT_FOLDER_ID,
        noteId: created.id
    });

    documents = [mapNoteToDocument(created, fileNode)];
    activeDocId = fileNode.id;
    if (oldContent === defaultInput) {
        isShowingWelcome = true;
    }
};

const syncTreeFromDocuments = async () => {
    const nodes = await fileTreeStorage.getTree();
    explorerManager?.setNodes(nodes);
    explorerManager?.setSelection(activeDocId);
};

const createFileInSelectedFolder = async () => {
    await addNewTab(explorerManager?.getSelectedFolderId());
};

const initTabs = async () => {
    await runMigration();
    await ensureFileTreeFromNotes();

    const notes = await noteStorage.getAllNotes();
    await fileTreeStorage.initTree(notes);
    const nodes = await fileTreeStorage.getTree();
    const fileNodes = nodes
        .filter((node) => node.type === 'file' && node.noteId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const loadedDocs = [];
    for (const node of fileNodes) {
        const note = await noteStorage.getNote(node.noteId);
        if (note) {
            loadedDocs.push(mapNoteToDocument(note, node));
        }
    }
    documents = loadedDocs;
    await ensureAtLeastOneDocument();
    activeDocId = documents[0]?.id || null;

    explorerManager = createExplorerManager({
        onOpenFile: (nodeId) => switchTab(nodeId),
        onCreateFile: (folderId) => addNewTab(folderId),
        onCreateFolder: (folderId) => createFolder(folderId),
        onRenameNode: (node, newName) => renameNode(node, newName),
        onDeleteNode: (node) => deleteNode(node),
        onMoveNode: (payload) => moveNodeInTree(payload),
        onLayoutChange: () => {
            if (editor) editor?.layout();
        }
    });
    explorerManager.initialize();

    renderTabs();
    await syncTreeFromDocuments();
    loadActiveDocument();

    window.__markups_createFile = createFileInSelectedFolder;
};

// Mouse wheel horizontal scroll for tabs
const _setupTabsWheelScroll = () => {
    const tabsList = document.getElementById('tabs-list');
    if (!tabsList) return;

    tabsList.addEventListener('wheel', (e) => {
        // Prevent vertical scroll, enable horizontal scroll with mouse wheel
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            tabsList.scrollLeft += e.deltaY * 0.8; // Smooth multiplier
        }
    }, { passive: false });
};

// Rename tab functionality
const startRenameTab = (docId, tabNameElement) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    const currentName = doc.title;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'tab-rename-input';

    // Replace tab name with input
    tabNameElement.style.display = 'none';
    tabNameElement.parentNode.insertBefore(input, tabNameElement.nextSibling);
    input.focus();
    input.select();

    const finishRename = () => {
        const newName = input.value.trim() || 'Untitled';
        doc.title = newName.replace(/\.md$/i, '').substring(0, 30); // Remove .md if user typed it, limit length
        saveDocsToStorage();
        renderTabs();
    };

    input.addEventListener('blur', finishRename);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            input.blur();
        } else if (e.key === 'Escape') {
            input.value = currentName; // Restore original name
            input.blur();
        }
    });

    // Prevent click from bubbling to tab
    input.addEventListener('click', (e) => e.stopPropagation());
};

let renderTabs = () => {
    const tabsList = document.getElementById('tabs-list');
    if (!tabsList) return;
    tabsList.innerHTML = '';

    documents.forEach(doc => {
        const tab = document.createElement('button');
        tab.className = `header-tab ${doc.id === activeDocId ? 'active' : ''}`;
        tab.dataset.docId = doc.id;
        tab.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M14 4.5V14a2 2 0 01-2 2H4a2 2 0 01-2-2V2a2 2 0 012-2h5.5L14 4.5zm-3 0A1.5 1.5 0 019.5 3V1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V4.5h-2z" />
                </svg>
                <span class="tab-name">${doc.title}.md</span>
                <span class="tab-close" aria-label="Close tab" title="Close tab">×</span>
            `;

        // Single click to switch tab
        tab.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close') && !e.target.classList.contains('tab-rename-input')) {
                switchTab(doc.id);
            }
        });

        // Double-click to rename
        const tabName = tab.querySelector('.tab-name');
        if (tabName) {
            tabName.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                startRenameTab(doc.id, tabName);
            });
        }

        // Close button
        const tabClose = tab.querySelector('.tab-close');
        if (tabClose) {
            tabClose.addEventListener('click', (e) => {
                e.stopPropagation();
                closeTab(doc.id);
            });
        }

        tabsList.appendChild(tab);
    });

};

const addNewTab = async (parentFolderId) => {
    const note = await noteStorage.createNote({
        title: 'Untitled',
        content: ''
    });
    if (!note) return;
    const node = await fileTreeStorage.createNode({
        type: 'file',
        name: note.title,
        parentId: parentFolderId || ROOT_FOLDER_ID,
        noteId: note.id
    });
    const newDoc = mapNoteToDocument(note, node);
    documents.push(newDoc);
    window.__markups_documents = documents;
    await syncTreeFromDocuments();
    switchTab(newDoc.id);
};

const switchTab = (id) => {
    if (id === activeDocId) return;

    // Sync preview edits back to Markdown before switching tabs,
    // otherwise Document Mode changes can be lost and image URLs can break.
    try {
        livePreviewEditController?.syncFromPreview();
        saveCurrentDoc();
    } catch {
        // ignore sync/save failures during tab switch
    }

    activeDocId = id;
    window.__markups_activeDocId = activeDocId;
    renderTabs();
    loadActiveDocument();
};

const closeTab = (id) => {
    if (documents.length <= 1) {
        showToast('Cannot close the last tab', 'warning');
        return;
    }

    if (confirm('Are you sure you want to close this tab?')) {
        const index = documents.findIndex(d => d.id === id);
        const closingDoc = documents[index];

        // Sync Document Mode edits before capturing content / switching tabs,
        // otherwise image refs can still be stale when we prune the store.
        if (id === activeDocId) {
            try {
                livePreviewEditController?.syncFromPreview();
                saveCurrentDoc();
            } catch {
                // ignore sync/save failures during tab close
            }
        }

        // Capture content before removal (use live editor value if closing active tab)
        let closedContent = closingDoc?.content || '';
        if (id === activeDocId && editor) {
            closedContent = editor?.getValue();
        }

        // If closing active tab, switch to another
        if (id === activeDocId) {
            const newIndex = index === 0 ? 1 : index - 1;
            activeDocId = documents[newIndex].id; // Set new active
            window.__markups_activeDocId = activeDocId;
            // loadActiveDocument happens after render
        }

        documents = documents.filter(d => d.id !== id);
        window.__markups_documents = documents;
        saveDocsToStorage();

        // Free imageStore entries only referenced by the closed tab
        cleanupImagesAfterTabClose(closedContent);

        renderTabs();
        loadActiveDocument();
    }
};

const createFolder = async (parentFolderId) => {
    await fileTreeStorage.createNode({
        type: 'folder',
        name: 'New Folder',
        parentId: parentFolderId || ROOT_FOLDER_ID
    });
    await syncTreeFromDocuments();
};

const renameNode = async (node, explicitName = '') => {
    const currentLabel = node.type === 'file' ? `${node.name}.md` : node.name;
    const nextName = explicitName || prompt(`Rename ${node.type}:`, currentLabel);
    if (!nextName || !nextName.trim()) return;

    const renamedNode = await fileTreeStorage.renameNode(node.id, nextName.replace(/\.md$/i, ''));
    if (!renamedNode) return;

    if (renamedNode.type === 'file') {
        const docIndex = documents.findIndex((doc) => doc.id === renamedNode.id);
        if (docIndex !== -1) {
            documents[docIndex].title = renamedNode.name;
            const noteId = documents[docIndex].noteId;
            if (noteId) {
                await noteStorage.updateNote(noteId, { title: renamedNode.name });
            }
            saveDocsToStorage();
            renderTabs();
        }
    }
    await syncTreeFromDocuments();
};

const moveNodeInTree = async ({ draggedNode, targetNode, position, sortMode }) => {
    if (!draggedNode || !targetNode || draggedNode.id === 'root') return;

    const movingIntoFolder = targetNode.type === 'folder';
    const newParentId = movingIntoFolder ? targetNode.id : (targetNode.parentId || ROOT_FOLDER_ID);

    if (draggedNode.type === 'folder' && newParentId === draggedNode.id) return;

    if (draggedNode.parentId !== newParentId) {
        await fileTreeStorage.moveNode(draggedNode.id, newParentId);
    }

    if (sortMode === 'manual' && !movingIntoFolder) {
        const allNodes = await fileTreeStorage.getTree();
        const siblings = allNodes
            .filter((node) => node.parentId === newParentId)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const targetIndex = siblings.findIndex((node) => node.id === targetNode.id);
        if (targetIndex !== -1) {
            const toIndex = position === 'before' ? targetIndex : targetIndex + 1;
            await fileTreeStorage.reorderNode(draggedNode.id, toIndex);
        }
    }

    await syncTreeFromDocuments();
};

const deleteNode = async (node) => {
    const isFolder = node.type === 'folder';
    const message = isFolder
        ? `Delete folder "${node.name}"?`
        : `Delete file "${node.name}.md"?`;
    if (!confirm(`${message}\n\nThis action cannot be undone.`)) return;

    if (isFolder) {
        const allNodes = await fileTreeStorage.getTree();
        const countDescendants = (folderId) => {
            let count = 0;
            const stack = [folderId];
            while (stack.length > 0) {
                const currentId = stack.pop();
                const children = allNodes.filter((item) => item.parentId === currentId);
                children.forEach((child) => {
                    count += 1;
                    if (child.type === 'folder') {
                        stack.push(child.id);
                    }
                });
            }
            return count;
        };

        const totalItems = countDescendants(node.id);
        if (totalItems > 0) {
            const secondConfirm = confirm(
                `Folder "${node.name}" contains ${totalItems} item${totalItems === 1 ? '' : 's'}.\n\nDelete everything inside it?`
            );
            if (!secondConfirm) return;
        }
    }

    const result = await fileTreeStorage.deleteNodeRecursive(node.id);
    if (result.deletedNoteIds.length > 0) {
        try {
            // Use allSettled so one failed IDB delete doesn't abort the whole teardown
            // (previously an unhandled rejection from a single failed write could crash
            // the tab-close flow). Remaining deletions continue even if some reject.
            const outcomes = await Promise.allSettled(
                result.deletedNoteIds.map((noteId) => noteStorage.deleteNote(noteId))
            );
            const failures = outcomes.filter((o) => o.status === 'rejected');
            if (failures.length > 0) {
                console.error(
                    `deleteNode: failed to delete ${failures.length}/${result.deletedNoteIds.length} note(s):`,
                    failures.map((f) => f.reason)
                );
                showToast(`Could not delete ${failures.length} note(s)`, 'error');
            }
        } catch (err) {
            // Degrade gracefully: the file-tree node is already gone; a failure here
            // must not throw out of the delete handler.
            console.error('deleteNode: note cleanup threw unexpectedly:', err);
            showToast('Some notes could not be cleaned up', 'error');
        }
    }

    documents = documents.filter((doc) => !result.deletedNodeIds.includes(doc.id));
    if (!documents.some((doc) => doc.id === activeDocId)) {
        activeDocId = documents[0]?.id || null;
    }
    if (!activeDocId) {
        await ensureAtLeastOneDocument();
        activeDocId = documents[0]?.id || null;
    }
    window.__markups_documents = documents;
    window.__markups_activeDocId = activeDocId;
    saveDocsToStorage();
    pruneUnreferencedImages();
    renderTabs();
    await syncTreeFromDocuments();
    loadActiveDocument();
};

const saveCurrentDoc = async () => {
    const content = editor?.getValue() ?? '';
    const docIndex = documents.findIndex(d => d.id === activeDocId);

    if (docIndex !== -1) {
        documents[docIndex].content = content;
        documents[docIndex].lastModified = Date.now();

        // Auto update title from first H1
        const firstLine = content.split('\n')[0];
        if (firstLine && firstLine.startsWith('# ')) {
            documents[docIndex].title = firstLine.substring(2).trim().substring(0, 20);
        } else {
            documents[docIndex].title = 'Untitled';
        }

        const noteId = documents[docIndex].noteId;
        if (noteId) {
            await noteStorage.updateNote(noteId, {
                title: documents[docIndex].title,
                content: documents[docIndex].content
            });
            await fileTreeStorage.renameNode(documents[docIndex].id, documents[docIndex].title);
        }

        saveDocsToStorage();
        renderTabs(); // Refresh titles
        syncTreeFromDocuments();
        showAutosaveIndicator();
    }
};

const loadActiveDocument = () => {
    const doc = documents.find(d => d.id === activeDocId);
    if (doc) {
        // Prevent triggering save loop if possible, or accept it
        // editor.setValue triggers onDidChangeModelContent
        // We can set a temporary flag to ignore save? 
        // For simplicity, let it save (no change to content)
        const current = editor?.getValue();
        if (current !== doc.content) {
            editor?.setValue(doc.content);
            editor?.setScrollTop(0);
        }
    }
};

const saveDocsToStorage = () => {
    const expiredAt = new Date(2099, 1, 1);
    try {
        Storehouse.setItem(localStorageNamespace, localStorageDocsKey, documents, expiredAt);
    } catch (error) {
        if (error?.name === 'QuotaExceededError' || String(error).includes('QuotaExceededError')) {
            const before = documents.length;
            const reduced = documents.slice(-5);
            documents = reduced;
            const reducedIds = new Set(reduced.map((d) => d.id));
            if (!reducedIds.has(activeDocId)) {
                activeDocId = reduced.length > 0 ? reduced[0].id : null;
                window.__markups_activeDocId = activeDocId;
                if (activeDocId === null) {
                    editor?.setValue('');
                }
            }
            if (before !== reduced.length) {
                renderTabs();
                syncTreeFromDocuments();
                loadActiveDocument();
            }
            try {
                Storehouse.setItem(localStorageNamespace, localStorageDocsKey, documents, expiredAt);
                showToast('Storage quota exceeded. Kept the most recent documents only.', 'warning');
            } catch {
                showToast('Could not save documents. Browser storage is full.', 'error');
            }
            return;
        }
        showToast('Document save failed. Please try again.', 'error');
    }
};

const setupEditor = () => {
    editor = monaco.editor.create(document.querySelector('#editor'), {
        fontSize: 16,
        language: 'markdown',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        scrollbar: {
            vertical: 'visible',
            horizontal: 'visible'
        },
        wordWrap: 'on',
        hover: { enabled: false },
        quickSuggestions: false,
        suggestOnTriggerCharacters: false,
        folding: false
    });

    let isProgrammaticChange = false;

    // Wrap editor.setValue to distinguish programmatic changes from user edits
    const originalSetValue = editor.setValue.bind(editor);
    editor.setValue = (val) => {
        isProgrammaticChange = true;
        originalSetValue(val);
        isProgrammaticChange = false;
    };

    editor?.onDidChangeModelContent((e) => {
        // Auto-clear welcome content on first real user keystroke
        if (!isApplyingPreviewEdit && isShowingWelcome && !isProgrammaticChange && e.changes && e.changes.length > 0) {
            const change = e.changes[0];
            // User typed or pasted something — clear welcome content, keep only what they entered
            if (change.text.length > 0) {
                isShowingWelcome = false;
                const typed = change.text;
                editor?.setValue(typed);
                // Place cursor at end of typed text
                const model = editor?.getModel();
                if (model) {
                    const lastLine = model.getLineCount();
                    const lastCol = model.getLineMaxColumn(lastLine);
                    editor?.setPosition({ lineNumber: lastLine, column: lastCol });
                }
                return; // setValue triggers this handler again, but isProgrammaticChange guards it
            }
            // User deleted something — just disable welcome mode
            isShowingWelcome = false;
        }

        const changed = editor?.getValue() !== defaultInput;
        if (changed) {
            hasEdited = true;
            setHasEdited(true);
        }
        const value = editor?.getValue();
        if (!isApplyingPreviewEdit) {
            debouncedConvert(value);  // Use debounced version for performance
        }
        saveCurrentDoc();
        updateStats(value);
    });

    // Scroll sync (Issue #39): line-anchor map instead of pure ratio
    // Prevents drift on long docs and when <details> sections are collapsed
    const previewElement = document.querySelector('.preview-wrapper');
    scrollSync.initialize(editor, previewElement, {
        contentRoot: document.querySelector('#output'),
        onPreviewScroll: () => {
            updateOutlineScrollProgress();
            updateActiveOutlineItem();
        }
    });
    scrollSync.setEnabled(scrollBarSync);

    // Typewriter Mode: Center cursor + Update cursor position in status bar
    let isCursorSyncing = false;
    editor?.onDidChangeCursorPosition((e) => {
        // Update status bar cursor position
        const cursorPosEl = document.getElementById('cursor-position');
        if (cursorPosEl) {
            const pos = e.position;
            cursorPosEl.querySelector('span').textContent = `Ln ${pos.lineNumber}, Col ${pos.column}`;
        }

        if (isTypewriterMode) {
            editor?.revealLineInCenter(e.position.lineNumber);
        }

        if (cursorSync && !isCursorSyncing) {
            isCursorSyncing = true;
            const previewElement = document.querySelector('.preview-wrapper');
            if (previewElement) {
                const lineTop = editor?.getTopForLineNumber(e.position.lineNumber);
                const editorHeight = editor?.getScrollHeight();

                if (editorHeight > 0) {
                    const ratio = lineTop / editorHeight;
                    const previewScrollTop = previewElement.scrollHeight * ratio;

                    // Center the line in the preview viewport
                    const targetY = previewScrollTop - (previewElement.clientHeight / 2);
                    previewElement.scrollTop = Math.max(0, targetY);
                }
            }
            setTimeout(() => { isCursorSyncing = false; }, 50);
        }
    });

    return editor;
};

// Configure marked with syntax highlighting
// Issue #42: normalize language ids (GitHub is case-insensitive; Prism keys are lowercase)
const PRISM_LANG_ALIASES = {
    htm: 'markup',
    xhtml: 'markup',
    xml: 'xml',
    svg: 'svg',
    html: 'markup',
    mathml: 'mathml',
    ssml: 'xml',
    atom: 'xml',
    rss: 'xml',
    sh: 'bash',
    shell: 'bash',
    zsh: 'bash',
    console: 'bash',
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    yml: 'yaml',
    md: 'markdown',
    'c#': 'csharp',
    'c++': 'cpp',
    dockerfile: 'docker',
    text: 'plaintext',
    txt: 'plaintext'
};

function resolvePrismLanguage(lang) {
    if (!lang) return null;
    const normalized = String(lang).trim().toLowerCase();
    const aliased = PRISM_LANG_ALIASES[normalized] || normalized;
    if (Prism.languages[aliased]) return aliased;
    if (Prism.languages[normalized]) return normalized;
    return null;
}

marked.use(markedHighlight({
    langPrefix: 'language-',
    highlight(code, lang) {
        const language = resolvePrismLanguage(lang);
        if (!language) return code;
        try {
            const grammar = Prism.languages[language];
            if (typeof grammar !== 'object') return code;
            return Prism.highlight(code, grammar, language);
        } catch (_e) {
            // Silently fall back for languages with missing dependencies
            return code;
        }
    }
}));

// Configure marked with KaTeX
marked.use(markedKatex({
    throwOnError: false,
    output: 'html' // or 'mathml'
}));

// Configure GFM Extensions
marked.use(markedAlert());
marked.use(markedFootnote());
// Emoji shortcode syntax (:smile:) for the preview (Issue #45)
marked.use(markedEmoji(emojiMarkedOptions));

// Slugify function for heading IDs
const slugify = (text) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

// Track headings for TOC
let tocItems = [];

// Custom renderer for headings with anchor links
const renderer = new marked.Renderer();
renderer.heading = function (token) {
    const headingLevel = token.depth;
    // Strip markdown link syntax [text](url) → text for slug and aria-label
    const plainText = token.text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    const slug = slugify(plainText);
    // Render inline tokens so links/bold/etc. become HTML
    const renderedContent = this.parser.parseInline(token.tokens);

    // Store rendered HTML for TOC so it also shows clickable links
    tocItems.push({ text: renderedContent, level: headingLevel, slug });

    return `
            <h${headingLevel} id="${slug}" class="heading-anchor">
                ${renderedContent}
                <a href="#${slug}" class="anchor-link" aria-label="Link to ${escapeHtml(plainText)}">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"/>
                    </svg>
                </a>
            </h${headingLevel}>
        `;
};

// Custom image renderer to support {width=X height=Y align=Z} attributes
renderer.image = function (token) {
    const src = token.href || '';
    const alt = token.text || '';
    const title = token.title || '';

    // The preview pass restores any persisted image state after rendering.
    let attrs = `src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"`;
    if (title) {
        attrs += ` title="${escapeHtml(title)}"`;
    }

    return `<img ${attrs}>`;
};

marked.use({ renderer });

// Generate TOC HTML
const generateTOC = () => {
    if (tocItems.length === 0) return '';

    let tocHtml = '<nav class="toc-nav"><h4 class="toc-title">📑 Table of Contents</h4><ul class="toc-list">';
    tocItems.forEach((item) => {
        const indent = (item.level - 1) * 16;
        tocHtml += `<li class="toc-item toc-level-${item.level}" style="padding-left: ${indent}px;">
                <a href="#${item.slug}" class="toc-link">${sanitizePreviewHtml(item.text)}</a>
            </li>`;
    });
    tocHtml += '</ul></nav>';
    return tocHtml;
};

// Update TOC panel
const updateTOC = () => {
    const tocListPanel = document.getElementById('toc-list-panel');
    if (tocListPanel) {
        tocListPanel.innerHTML = generateTOC();
    }

    // Also update the left sidebar outline
    updateOutline();

    // Also update the right TOC sidebar
    updateRightTOC();
};

// Update Right TOC Sidebar (preview mode)
const updateRightTOC = () => {
    const tocList = document.getElementById('toc-list');
    const outputElement = document.querySelector('#output');

    if (!tocList || !outputElement) return;

    // Find all headings in the preview
    const headings = outputElement.querySelectorAll('h1, h2, h3, h4, h5, h6');

    // Clear existing items
    tocList.innerHTML = '';

    if (headings.length === 0) {
        tocList.innerHTML = '<li class="toc-empty">No headings found</li>';
        return;
    }

    headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        const text = heading.textContent.trim();
        const id = heading.id || `heading-${index}`;

        // Ensure heading has an ID for navigation
        if (!heading.id) heading.id = id;

        const li = document.createElement('li');
        li.className = `toc-item level-${level}`;

        const link = document.createElement('a');
        link.className = 'toc-link';
        link.textContent = text;
        link.href = `#${id}`;
        link.setAttribute('data-heading-id', id);

        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove active from all items
            tocList.querySelectorAll('.toc-link').forEach(el => el.classList.remove('active'));
            link.classList.add('active');

            // Scroll to heading in preview
            heading.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Close TOC sidebar on mobile after clicking
            if (window.innerWidth <= 768) {
                const tocSidebar = document.querySelector('.toc-sidebar');
                const mobileOverlay = document.querySelector('#mobile-toc-overlay');
                if (tocSidebar) {
                    tocSidebar.classList.remove('visible');
                    tocSidebar.classList.add('hidden');
                }
                if (mobileOverlay) {
                    mobileOverlay.classList.remove('active');
                }
            }
        });

        li.appendChild(link);
        tocList.appendChild(li);
    });
};

// Update Document Outline (left sidebar)
const updateOutline = () => {
    const outlineList = document.getElementById('outline-list');
    const outlineEmpty = document.getElementById('outline-empty');
    const outputElement = document.querySelector('#output');

    if (!outlineList || !outputElement) return;

    // Find all headings in the preview
    const headings = outputElement.querySelectorAll('h1, h2, h3, h4, h5, h6');

    // Clear existing items
    outlineList.innerHTML = '';

    if (headings.length === 0) {
        // Show empty state
        if (outlineEmpty) outlineEmpty.style.display = 'flex';
        outlineList.style.display = 'none';
        return;
    }

    // Hide empty state, show list
    if (outlineEmpty) outlineEmpty.style.display = 'none';
    outlineList.style.display = 'block';

    headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        const text = heading.textContent.trim();
        const id = heading.id || `heading-${index}`;

        // Ensure heading has an ID for navigation
        if (!heading.id) heading.id = id;

        const li = document.createElement('li');
        const item = document.createElement('a');
        item.className = `outline-item level-${level}`;
        item.textContent = text;
        item.href = `#${id}`;
        item.setAttribute('data-heading-id', id);

        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove active from all items
            outlineList.querySelectorAll('.outline-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');

            // Scroll to heading in preview
            heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        li.appendChild(item);
        outlineList.appendChild(li);
    });

    // Update scroll indicator
    updateOutlineScrollProgress();
};

// Update scroll progress in outline
const updateOutlineScrollProgress = () => {
    const previewWrapper = document.querySelector('#preview-wrapper');
    const progressBar = document.querySelector('.outline-scroll-indicator .scroll-progress');

    if (!previewWrapper || !progressBar) return;

    const scrollTop = previewWrapper.scrollTop;
    const scrollHeight = previewWrapper.scrollHeight - previewWrapper.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

    progressBar.style.width = `${Math.min(100, progress)}%`;
};

// Update active item in outline based on scroll position
const updateActiveOutlineItem = () => {
    const previewElement = document.querySelector('#preview');
    const outlineList = document.getElementById('outline-list');
    const outputElement = document.querySelector('#output');

    if (!previewElement || !outlineList || !outputElement) return;

    const headings = outputElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) return;

    const _scrollTop = previewElement.scrollTop;
    const threshold = 100; // Offset from top

    let activeHeading = null;

    // Find the heading that's currently visible at the top
    headings.forEach(heading => {
        const rect = heading.getBoundingClientRect();
        const containerRect = previewElement.getBoundingClientRect();
        const relativeTop = rect.top - containerRect.top;

        if (relativeTop <= threshold) {
            activeHeading = heading;
        }
    });

    // Update active class in outline
    if (activeHeading) {
        outlineList.querySelectorAll('.outline-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-heading-id') === activeHeading.id) {
                item.classList.add('active');
            }
        });
    }
};

const setupGoals = () => {
    const saved = Storehouse.getItem(localStorageNamespace, localStorageGoalsKey);
    if (saved) goalsData = saved;

    const btn = document.getElementById('goals-button');
    const modal = document.getElementById('goals-modal');
    const overlay = document.getElementById('goals-modal-overlay');
    const closeBtns = document.querySelectorAll('.close-goals');
    const saveBtn = document.getElementById('save-goals-btn');
    const input = document.getElementById('daily-goal-input');

    let goalsModalFocusTrap = null;

    const openModal = () => {
        modal.style.display = 'block';
        if (overlay) overlay.style.display = 'block';
        updateGoalProgress(editor?.getValue());
        goalsModalFocusTrap?.deactivate();
        goalsModalFocusTrap = createFocusTrap(modal, { onEscape: () => closeModal() });
        goalsModalFocusTrap.activate();
    };

    const closeModal = () => {
        goalsModalFocusTrap?.deactivate();
        goalsModalFocusTrap = null;
        modal.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
    };

    if (input) {
        input.value = goalsData.dailyTarget;
        input.addEventListener('change', (e) => {
            goalsData.dailyTarget = parseInt(e.target.value) || 500;
            saveGoals();
            updateGoalProgress(editor?.getValue());
        });
    }

    if (btn) {
        btn.addEventListener('click', openModal);
    }

    // All close buttons
    closeBtns.forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModal);
    });

    // Save button
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            goalsData.dailyTarget = parseInt(input?.value) || 500;
            saveGoals();
            closeModal();
            showToast('Goals saved!', 'success');
        });
    }

    // Click overlay to close
    if (overlay) {
        overlay.addEventListener('click', closeModal);
    }

    // Listen for content changes
    editor?.onDidChangeModelContent(() => {
        updateGoalProgress(editor?.getValue());
    });
};

const updateGoalProgress = (content) => {
    // Simple word count approximation
    const text = content.replace(/[#*`_~\[\]()]/g, '').trim();
    const wordCount = text ? text.split(/\s+/).length : 0;

    const progressBar = document.getElementById('goal-progress-bar');
    const goalText = document.getElementById('goal-text');
    const streakDisplay = document.getElementById('streak-count');

    if (progressBar && goalText) {
        const percentage = Math.min((wordCount / goalsData.dailyTarget) * 100, 100);
        progressBar.style.width = percentage + '%';
        goalText.textContent = `${wordCount} / ${goalsData.dailyTarget} words`;

        if (percentage >= 100) {
            progressBar.style.backgroundColor = 'gold';
            // Trigger check
            const today = new Date().toDateString();
            if (goalsData.lastGoalDate !== today) {
                checkDailyGoal(wordCount);
            }
        } else {
            progressBar.style.backgroundColor = 'var(--success-color)';
        }
    }

    if (streakDisplay) {
        streakDisplay.textContent = goalsData.streak;
    }
};

const checkDailyGoal = (count) => {
    const today = new Date().toDateString();

    if (goalsData.lastGoalDate !== today && count >= goalsData.dailyTarget) {
        goalsData.streak++;
        goalsData.lastGoalDate = today;
        goalsData.history[today] = count;
        saveGoals();
        showToast('🎉 Daily Goal Reached!', 'success');
    }
};

const saveGoals = () => {
    const expiredAt = new Date(2099, 1, 1);
    Storehouse.setItem(localStorageNamespace, localStorageGoalsKey, goalsData, expiredAt);
};

// ----- Linter System -----
let linterDebounceTimer;

const setupLinter = () => {
    const lintBtn = document.getElementById('lint-button');
    const lintPanel = document.getElementById('lint-panel');
    const closeBtn = document.querySelector('.close-lint');

    const openPanel = () => {
        lintPanel.classList.remove('hidden');
        lintBtn?.classList.add('active');
        runLinter();
    };

    const closePanel = () => {
        lintPanel.classList.add('hidden');
        lintBtn?.classList.remove('active');
    };

    if (lintBtn && lintPanel) {
        lintBtn.addEventListener('click', () => {
            const isHidden = lintPanel.classList.contains('hidden');
            if (isHidden) {
                openPanel();
            } else {
                closePanel();
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closePanel);
    }

    // Run linter on change (debounced)
    editor?.onDidChangeModelContent(() => {
        clearTimeout(linterDebounceTimer);
        linterDebounceTimer = setTimeout(() => {
            // Only run if panel is visible
            if (lintPanel && !lintPanel.classList.contains('hidden')) {
                runLinter();
            }
        }, 1000);
    });
};

// Simple browser-based markdown linter
const runLinter = () => {
    const content = editor?.getValue() ?? '';
    const lines = content.split('\n');
    const issues = [];

    lines.forEach((line, index) => {
        const lineNumber = index + 1;

        // Check for trailing spaces (MD009)
        if (line.match(/\s+$/) && !line.match(/\s{2}$/)) {
            issues.push({
                lineNumber,
                ruleNames: ['MD009', 'no-trailing-spaces'],
                errorDescription: 'Trailing spaces'
            });
        }

        // Check for multiple blank lines (MD012)
        if (index > 0 && line === '' && lines[index - 1] === '') {
            issues.push({
                lineNumber,
                ruleNames: ['MD012', 'no-multiple-blanks'],
                errorDescription: 'Multiple consecutive blank lines'
            });
        }

        // Check for hard tabs (MD010)
        if (line.includes('\t')) {
            issues.push({
                lineNumber,
                ruleNames: ['MD010', 'no-hard-tabs'],
                errorDescription: 'Hard tabs found'
            });
        }

        // Check for missing space after header (MD018)
        if (line.match(/^#+[^#\s]/)) {
            issues.push({
                lineNumber,
                ruleNames: ['MD018', 'no-missing-space-atx'],
                errorDescription: 'No space after hash in header'
            });
        }

        // Check for multiple spaces after header hash (MD019)
        if (line.match(/^#+\s{2,}/)) {
            issues.push({
                lineNumber,
                ruleNames: ['MD019', 'no-multiple-space-atx'],
                errorDescription: 'Multiple spaces after hash in header'
            });
        }

        // Check for missing blank line before header (MD022)
        if (line.match(/^#{1,6}\s/) && index > 0 && lines[index - 1].trim() !== '') {
            issues.push({
                lineNumber,
                ruleNames: ['MD022', 'blanks-around-headings'],
                errorDescription: 'Headers should be surrounded by blank lines'
            });
        }
    });

    updateLintUI(issues);
    updateEditorMarkers(issues);
};

const updateLintUI = (issues) => {
    const list = document.getElementById('lint-list');
    const btn = document.getElementById('lint-button');
    if (!list) return;
    list.innerHTML = '';

    // Remove existing badge
    if (btn) {
        const existingBadge = btn.querySelector('.badge');
        if (existingBadge) existingBadge.remove();
    }

    if (issues.length === 0) {
        list.innerHTML = '<div style="padding:16px; color:var(--accent-success); text-align:center;"><svg width="20" height="20" style="margin-bottom:8px; display:block; margin:0 auto 8px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>No issues found!</div>';
    } else {
        // Add badge to button
        if (btn) {
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = issues.length > 99 ? '99+' : issues.length;
            btn.appendChild(badge);
        }

        issues.forEach(issue => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'lint-item';
            item.innerHTML = `
                    <span class="lint-line">L${issue.lineNumber}</span>
                    <span class="lint-msg">${issue.ruleNames[1] || issue.ruleNames[0]}: ${issue.errorDescription}</span>
                `;
            item.addEventListener('click', () => {
                editor?.revealLineInCenter(issue.lineNumber);
                editor?.setPosition({ lineNumber: issue.lineNumber, column: 1 });
                editor?.focus();
            });
            list.appendChild(item);
        });
    }
};

const updateEditorMarkers = (issues) => {
    const markers = issues.map(issue => ({
        severity: monaco.MarkerSeverity.Warning,
        message: issue.errorDescription,
        startLineNumber: issue.lineNumber,
        startColumn: 1,
        endLineNumber: issue.lineNumber,
        endColumn: 1000
    }));
    monaco.editor?.setModelMarkers(editor?.getModel(), "markdownlint", markers);
};

// ----- Search System -----
let currentSearchQuery = '';
let editorSearchDecorations = []; // Track Monaco editor search decorations
let currentMatchIndex = -1; // Track which match is currently selected
let allMatches = []; // Array of all match elements

const setupSearch = () => {
    const searchBtn = document.getElementById('search-btn');
    const searchOverlay = document.getElementById('search-overlay');
    const searchInput = document.getElementById('search-input');
    const searchClose = document.getElementById('search-close');
    const searchPrev = document.getElementById('search-prev');
    const searchNext = document.getElementById('search-next');
    const matchCountEl = document.getElementById('search-match-count');

    if (!searchBtn || !searchOverlay || !searchInput) {
        console.warn('Search elements not found');
        return;
    }

    // Toggle search overlay on button click - always use custom overlay for both panes
    searchBtn.addEventListener('click', () => {
        searchOverlay.classList.toggle('hidden');
        if (!searchOverlay.classList.contains('hidden')) {
            searchInput.focus();
            searchInput.select();
        } else {
            clearSearch();
        }
    });

    // Close search overlay
    if (searchClose) {
        searchClose.addEventListener('click', () => {
            clearSearch();
        });
    }

    const clearSearch = () => {
        searchOverlay.classList.add('hidden');
        currentSearchQuery = '';
        searchInput.value = '';
        currentMatchIndex = -1;
        allMatches = [];
        if (matchCountEl) matchCountEl.textContent = '';
        // Clear editor decorations
        editorSearchDecorations = editor?.deltaDecorations(editorSearchDecorations, []);
        debouncedConvert(editor?.getValue()); // Re-render without highlights (debounced for performance)
    };

    // Handle search input
    searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value;
        currentMatchIndex = -1; // Reset to first match when search term changes
        debouncedConvert(editor?.getValue());
        highlightEditorMatches();
        updateMatchCount();
    });

    // Handle Enter key to find next
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            clearSearch();
        }
        if (e.key === 'Enter') {
            goToNextMatch();
        }
    });

    // Navigation button handlers
    if (searchPrev) {
        searchPrev.addEventListener('click', () => {
            goToPreviousMatch();
        });
    }

    if (searchNext) {
        searchNext.addEventListener('click', () => {
            goToNextMatch();
        });
    }

    // Keyboard navigation for up/down arrows (when search overlay is visible)
    trackedAddEventListener(document, 'keydown', (e) => {
        // Only navigate if search overlay is visible
        if (searchOverlay.classList.contains('hidden')) return;
        
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            goToPreviousMatch();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            goToNextMatch();
        }
    });

    // Keyboard shortcut Ctrl+F - open custom search overlay
    trackedAddEventListener(document, 'keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            searchOverlay.classList.remove('hidden');
            searchInput.focus();
            searchInput.select();
        }
    });
};

// Highlight matches in Monaco editor using decorations
const highlightEditorMatches = () => {
    if (!editor) return;
    if (!currentSearchQuery) {
        editorSearchDecorations = editor?.deltaDecorations(editorSearchDecorations, []);
        return;
    }

    const model = editor?.getModel();
    if (!model) return;

    const matches = model.findMatches(currentSearchQuery, false, false, false, null, true);
    const decorations = matches.map(match => ({
        range: match.range,
        options: {
            className: 'editor-search-highlight',
            overviewRuler: { color: '#fbbf24', position: 1 }
        }
    }));

    editorSearchDecorations = editor?.deltaDecorations(editorSearchDecorations, decorations);
};

// Get all current match elements
const getMatchElements = () => {
    return Array.from(document.querySelectorAll('#output .search-highlight'));
};

// Navigate to a specific match index
const navigateToMatch = (index) => {
    allMatches = getMatchElements();
    if (allMatches.length === 0) return;
    
    // Ensure index is within bounds
    index = Math.max(0, Math.min(index, allMatches.length - 1));
    
    // Remove current highlight from old match
    allMatches.forEach((match, i) => {
        if (i === currentMatchIndex) {
            match.classList.remove('current');
        }
    });
    
    // Add current highlight to new match
    currentMatchIndex = index;
    if (allMatches[currentMatchIndex]) {
        allMatches[currentMatchIndex].classList.add('current');
        // Auto-scroll to current match
        allMatches[currentMatchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    updateMatchCount();
    updateNavigationUI();
};

// Navigate to next match
const goToNextMatch = () => {
    allMatches = getMatchElements();
    if (allMatches.length === 0) return;
    
    let nextIndex = currentMatchIndex + 1;
    // Wrap around to first match
    if (nextIndex >= allMatches.length) {
        nextIndex = 0;
    }
    
    navigateToMatch(nextIndex);
};

// Navigate to previous match
const goToPreviousMatch = () => {
    allMatches = getMatchElements();
    if (allMatches.length === 0) return;
    
    let prevIndex = currentMatchIndex - 1;
    // Wrap around to last match
    if (prevIndex < 0) {
        prevIndex = allMatches.length - 1;
    }
    
    navigateToMatch(prevIndex);
};

// Update navigation button states and counter display
const updateNavigationUI = () => {
    const searchPrev = document.getElementById('search-prev');
    const searchNext = document.getElementById('search-next');
    const matchCountEl = document.getElementById('search-match-count');
    
    allMatches = getMatchElements();
    const totalMatches = allMatches.length;
    const hasMatches = totalMatches > 0;
    
    // Update button disabled states
    if (searchPrev) searchPrev.disabled = !hasMatches;
    if (searchNext) searchNext.disabled = !hasMatches;
    
    // Update counter display with "X of Y" format
    if (matchCountEl) {
        if (hasMatches) {
            const displayIndex = currentMatchIndex >= 0 ? currentMatchIndex + 1 : 1;
            matchCountEl.textContent = `${displayIndex} of ${totalMatches}`;
        } else {
            matchCountEl.textContent = 'No matches';
        }
    }
};

// Update match count display
const updateMatchCount = () => {
    const matchCountEl = document.getElementById('search-match-count');
    if (!matchCountEl) return;

    if (!currentSearchQuery) {
        matchCountEl.textContent = '';
        return;
    }

    // Count preview matches
    const previewMatches = document.querySelectorAll('.search-highlight').length;
    // Count editor matches
    const model = editor?.getModel();
    const editorMatches = model ? model.findMatches(currentSearchQuery, false, false, false, null, true).length : 0;
    const totalMatches = Math.max(previewMatches, editorMatches);

    // Initialize with first match if matches exist and no match selected
    if (totalMatches > 0 && currentMatchIndex < 0) {
        navigateToMatch(0);
    } else if (totalMatches === 0) {
        currentMatchIndex = -1;
        updateNavigationUI();
    }
};

const highlightText = () => {
    if (!currentSearchQuery) return;
    // Skip highlight when preview pane is hidden (code-only mode)
    if (getCurrentViewMode() === 'code') return;
    const root = document.querySelector('#output');
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(node => {
        const text = node.nodeValue;
        if (text.toLowerCase().includes(currentSearchQuery.toLowerCase())) {
            const fragment = document.createDocumentFragment();
            let lastIdx = 0;
            const regex = new RegExp(currentSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

            text.replace(regex, (match, idx) => {
                fragment.appendChild(document.createTextNode(text.substring(lastIdx, idx)));
                const mark = document.createElement('mark');
                mark.className = 'search-highlight';
                mark.textContent = match;
                fragment.appendChild(mark);
                lastIdx = idx + match.length;
                return match;
            });
            fragment.appendChild(document.createTextNode(text.substring(lastIdx)));
            node.parentNode.replaceChild(fragment, node);
        }
    });
};

// Convert generation token — drops stale RAF/deferred work when typing continues
let _convertToken = 0;

/**
 * Walk markdown and return start line (1-based) + type for each top-level block.
 * Used to assign accurate data-source-line values (not just heading interpolation).
 * @param {string} markdown
 * @returns {{ line: number, type: string }[]}
 */
function extractMarkdownBlockStarts(markdown) {
    const lines = String(markdown || '').split('\n');
    const blocks = [];
    let i = 0;

    const isBlank = (line) => !String(line || '').trim();
    const isHeading = (line) => /^#{1,6}\s+/.test(line);
    const isFence = (line) => /^```/.test(line);
    const isTable = (line) => /^\s*\|/.test(line);
    const isHr = (line) => /^(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line);
    const isList = (line) => /^\s*(?:[-*+]|\d+\.)\s+/.test(line);
    const isQuote = (line) => /^>\s?/.test(line);
    const isDetailsOpen = (line) => /^<details\b/i.test(line.trim());

    while (i < lines.length) {
        const line = lines[i];
        if (isBlank(line)) {
            i++;
            continue;
        }

        if (isHeading(line)) {
            blocks.push({ line: i + 1, type: 'heading' });
            i++;
            continue;
        }

        if (isFence(line)) {
            blocks.push({ line: i + 1, type: 'code' });
            i++;
            while (i < lines.length && !isFence(lines[i])) i++;
            if (i < lines.length) i++;
            continue;
        }

        if (isHr(line)) {
            blocks.push({ line: i + 1, type: 'hr' });
            i++;
            continue;
        }

        if (isTable(line)) {
            blocks.push({ line: i + 1, type: 'table' });
            while (i < lines.length && (isTable(lines[i]) || isBlank(lines[i]))) {
                if (isBlank(lines[i])) {
                    let j = i + 1;
                    while (j < lines.length && isBlank(lines[j])) j++;
                    if (j >= lines.length || !isTable(lines[j])) break;
                }
                i++;
            }
            continue;
        }

        if (isList(line)) {
            blocks.push({ line: i + 1, type: 'list' });
            while (i < lines.length) {
                if (isBlank(lines[i])) {
                    let j = i + 1;
                    while (j < lines.length && isBlank(lines[j])) j++;
                    if (j >= lines.length || (!isList(lines[j]) && !/^\s{2,}\S/.test(lines[j]))) break;
                    i = j;
                    continue;
                }
                if (isList(lines[i]) || /^\s{2,}\S/.test(lines[i])) {
                    i++;
                    continue;
                }
                break;
            }
            continue;
        }

        if (isQuote(line)) {
            blocks.push({ line: i + 1, type: 'quote' });
            while (i < lines.length && (isQuote(lines[i]) || isBlank(lines[i]))) {
                if (isBlank(lines[i])) {
                    let j = i + 1;
                    while (j < lines.length && isBlank(lines[j])) j++;
                    if (j >= lines.length || !isQuote(lines[j])) break;
                }
                i++;
            }
            continue;
        }

        if (isDetailsOpen(line)) {
            blocks.push({ line: i + 1, type: 'details' });
            while (i < lines.length && !/<\/details>/i.test(lines[i])) i++;
            if (i < lines.length) i++;
            continue;
        }

        blocks.push({ line: i + 1, type: 'paragraph' });
        i++;
        while (i < lines.length && !isBlank(lines[i])) {
            if (
                isHeading(lines[i]) ||
                isFence(lines[i]) ||
                isHr(lines[i]) ||
                isTable(lines[i]) ||
                isList(lines[i]) ||
                isQuote(lines[i]) ||
                isDetailsOpen(lines[i])
            ) {
                break;
            }
            i++;
        }
    }

    return blocks;
}

function blockTypeFromElement(el) {
    const tag = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) return 'heading';
    if (tag === 'pre' || el.classList?.contains('mermaid')) return 'code';
    if (tag === 'table') return 'table';
    if (tag === 'ul' || tag === 'ol') return 'list';
    if (tag === 'blockquote') return 'quote';
    if (tag === 'hr') return 'hr';
    if (tag === 'details') return 'details';
    return 'paragraph';
}

/**
 * Annotate preview block elements with data-source-line attributes.
 * Prefer exact heading IDs, then sequential markdown-block matching so
 * tables/paragraphs get real start lines (fixes section misalignment).
 * (Issue #39)
 */
function annotateSourceLines(outputElement, markdown) {
    if (!outputElement || !markdown) return;

    const lines = markdown.split('\n');
    const mdBlocks = extractMarkdownBlockStarts(markdown);

    const headingLineMap = new Map();
    for (let i = 0; i < lines.length; i++) {
        const match = /^(#{1,6})\s+(.+)$/.exec(lines[i]);
        if (!match) continue;
        const plainText = match[2]
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/[*_`~]/g, '')
            .trim();
        const slug = plainText.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        if (slug && !headingLineMap.has(slug)) {
            headingLineMap.set(slug, i + 1);
        }
    }

    const allBlocks = Array.from(outputElement.querySelectorAll(
        'h1, h2, h3, h4, h5, h6, pre, p, table, ul, ol, blockquote, hr, div.mermaid, details, .preview-video'
    )).filter((el) => {
        if ((el.tagName === 'UL' || el.tagName === 'OL') && el.parentElement?.closest('li')) {
            return false;
        }
        return true;
    });

    outputElement.querySelectorAll('[data-source-line]').forEach((el) => {
        el.removeAttribute('data-source-line');
    });

    allBlocks.forEach((el) => {
        const tag = el.tagName.toLowerCase();
        if (/^h[1-6]$/.test(tag) && el.id && headingLineMap.has(el.id)) {
            el.setAttribute('data-source-line', String(headingLineMap.get(el.id)));
        }
    });

    let mdIndex = 0;
    for (const el of allBlocks) {
        if (el.hasAttribute('data-source-line')) {
            const line = parseInt(el.getAttribute('data-source-line'), 10);
            while (mdIndex < mdBlocks.length && mdBlocks[mdIndex].line < line) mdIndex++;
            if (mdIndex < mdBlocks.length && mdBlocks[mdIndex].line === line) mdIndex++;
            continue;
        }

        const want = blockTypeFromElement(el);
        let found = -1;
        for (let j = mdIndex; j < mdBlocks.length; j++) {
            const t = mdBlocks[j].type;
            if (t === want) {
                found = j;
                break;
            }
            if (t === 'heading' && want !== 'heading') break;
        }

        if (found === -1 && mdIndex < mdBlocks.length) {
            const t = mdBlocks[mdIndex].type;
            if (want === 'paragraph' && t === 'paragraph') found = mdIndex;
        }

        if (found !== -1) {
            el.setAttribute('data-source-line', String(mdBlocks[found].line));
            mdIndex = found + 1;
        }
    }

    const known = [];
    allBlocks.forEach((el) => {
        if (el.hasAttribute('data-source-line')) {
            known.push({
                el,
                line: parseInt(el.getAttribute('data-source-line'), 10)
            });
        }
    });
    known.sort((a, b) => a.line - b.line);

    allBlocks.forEach((el) => {
        if (el.hasAttribute('data-source-line')) return;

        const elTop = el.getBoundingClientRect().top;
        let beforeAnchor = null;
        let afterAnchor = null;
        for (const anchor of known) {
            const anchorTop = anchor.el.getBoundingClientRect().top;
            if (anchorTop <= elTop + 1) beforeAnchor = anchor;
            else {
                afterAnchor = anchor;
                break;
            }
        }

        let estimatedLine = 1;
        if (beforeAnchor && afterAnchor) {
            const beforeTop = beforeAnchor.el.getBoundingClientRect().top;
            const afterTop = afterAnchor.el.getBoundingClientRect().top;
            const ratio = afterTop > beforeTop
                ? (elTop - beforeTop) / (afterTop - beforeTop)
                : 0.5;
            estimatedLine = Math.round(
                beforeAnchor.line + ratio * (afterAnchor.line - beforeAnchor.line)
            );
        } else if (beforeAnchor) {
            estimatedLine = beforeAnchor.line + 1;
        }

        el.setAttribute('data-source-line', String(Math.max(1, estimatedLine)));
    });
}

// Render markdown text as html
// Parse stays sync (already behind debouncedConvert); DOM write + secondary UI use rAF
const convert = (markdown) => {
    // Reset TOC items
    tocItems = [];

    // Resolve image store references to actual data URLs before rendering
    const resolvedMarkdown = resolveImageReferences(markdown, true);

    // Strip persisted image attributes before rendering to prevent raw metadata from showing in preview
    let renderableMarkdown = resolvedMarkdown.replace(/(!\[[^\]]*\]\([^)]+\))\s*\{[^}]*\}/g, '$1');
    renderableMarkdown = stripVideoAttributeBlocks(renderableMarkdown);

    // Document Mode needs the original markdown (with attrs) for serialization.
    // Preview Mode uses renderableMarkdown (attrs stripped) for clean rendering.
    const documentModeMarkdown = resolvedMarkdown;

    const html = marked.parse(renderableMarkdown);
    const sanitized = sanitizePreviewHtml(html);

    const token = ++_convertToken;

    // Paint preview on next frame so the editor stays responsive after debounce
    requestAnimationFrame(() => {
        if (token !== _convertToken) return;

        const outputElement = document.querySelector('#output');
        if (!outputElement) return;

        // Capture the CURRENT live <video> nodes so a re-render of the SAME player
        // (user typing elsewhere) reuses the already-loaded element instead of
        // building a fresh one. Re-inserting the live node means NO network
        // re-fetch and NO player flicker on every keystroke.
        //
        // Key strategy (works for both <video> direct-URL/GitHub-attachment AND
        // <iframe> YouTube/Vimeo): data-source-line is the primary key (stable
        // when typing doesn't add/remove lines before the player). data-video-url
        // (the *original* markdown URL the user wrote, NOT the provider's embed URL)
        // is the fallback so a line-shift doesn't kill reuse. The iframe's own src
        // is also stored (provider embed URL) as a last-resort key.
        const reuseVideoElements = new Map();
        const captureMedia = (media, getLine) => {
            const line = getLine(media);
            const wrap = media.closest?.('.preview-video');
            const originalUrl = wrap?.dataset?.videoUrl || media.dataset?.videoUrl || null;
            const embedSrc = media.getAttribute('src') || null;
            if (line && !reuseVideoElements.has(line)) reuseVideoElements.set(line, media);
            if (originalUrl && !reuseVideoElements.has(originalUrl)) reuseVideoElements.set(originalUrl, media);
            if (embedSrc && !reuseVideoElements.has(embedSrc)) reuseVideoElements.set(embedSrc, media);
        };
        outputElement.querySelectorAll('.preview-video video').forEach((v) => {
            captureMedia(v, (m) => m.parentElement?.dataset?.sourceLine || m.closest?.('.preview-video')?.dataset?.sourceLine);
        });
        // Also capture live <iframe> nodes (YouTube / Vimeo embeds). The wrapper
        // DIV.preview-video--embed carries both data-source-line AND data-video-url
        // (the *original* markdown URL), which is what tryReplaceWithVideo passes
        // back as `url`. Keying off data-video-url means the URL fallback key
        // matches the lookup key in tryReplaceWithVideo.
        outputElement.querySelectorAll('.preview-video iframe').forEach((f) => {
            const wrap = f.closest?.('.preview-video');
            captureMedia(f, () => wrap?.dataset?.sourceLine);
        });

        outputElement.innerHTML = sanitized;
        normalizeCodeLanguageClasses(outputElement);

        // Issue #39: Annotate preview elements with data-source-line
        // so scroll-sync can map editor lines to preview elements accurately
        annotateSourceLines(outputElement, renderableMarkdown);

        // Issue #24 Fix: Process images to prevent broken image layout shift
        processPreviewImages(outputElement);

        // Issue #40: Embed video URLs / GitHub video attachments / YouTube-Vimeo
        // Parse attrs from the original markdown (renderableMarkdown has blocks stripped).
        const videoMode = currentSettings?.preview?.videoMode || 'smart';
        processPreviewVideos(
            outputElement,
            videoMode,
            parseVideoAttributesFromMarkdown(documentModeMarkdown || markdown || ''),
            reuseVideoElements
        );

        // Issue #40 UX: labeled video links stay as links — offer one-click “Show as video”
        enhanceLabeledVideoLinks(outputElement, {
            videoMode,
            getMarkdown: () => editor?.getValue() || '',
            onMarkdownChange: applyMarkdownFromPreviewEdit,
            showToast
        });

        // Re-apply media/layout controls and contenteditable state after every preview render.
        videoControlsController?.refresh(outputElement);
        imageControlsController?.refresh(outputElement);
        livePreviewEditController?.refresh(outputElement);

        // External links / media URLs open in a new tab (keep #anchors in-page).
        ensurePreviewLinksOpenInNewTab(outputElement);

        // Defer Mermaid / TOC / highlights so first paint isn't blocked
        requestAnimationFrame(() => {
            if (token !== _convertToken) return;

            const mermaidBlocks = outputElement.querySelectorAll('pre code.language-mermaid');
            if (mermaidBlocks.length > 0) {
                mermaidBlocks.forEach(block => {
                    const pre = block.parentElement;
                    const code = block.textContent;
                    const div = document.createElement('div');
                    div.className = 'mermaid';
                    div.setAttribute('role', 'img');
                    div.setAttribute('aria-label', 'Diagram');
                    div.textContent = code;
                    pre.replaceWith(div);
                });

                mermaid.run({
                    nodes: outputElement.querySelectorAll('.mermaid')
                }).then(() => {
                    if (token === _convertToken) {
                        annotateSourceLines(outputElement, renderableMarkdown);
                        scrollSync.scheduleRebuildAnchors();
                    }
                }).catch(() => {
                    if (token === _convertToken) {
                        scrollSync.scheduleRebuildAnchors();
                    }
                });
            }

            addCodeCopyButtons();

            // Yield once more before TOC/search highlight traversal
            setTimeout(() => {
                if (token !== _convertToken) return;
                updateTOC();
                highlightText();
                updateNavigationUI();
                // Issue #39: rebuild editor↔preview line anchors after render
                scrollSync.scheduleRebuildAnchors();
            }, 0);
        });
    });
};

// Create debounced version of convert for performance (300ms delay)
// This prevents blocking the main thread on every keystroke
const debouncedConvert = debounce((markdown) => {
    convert(markdown);
}, 300);

const updatePreview = () => {
    if (!editor) return;
    convert(editor?.getValue());
};

const applyMarkdownFromPreviewEdit = (markdown) => {
    if (!editor || typeof markdown !== 'string' || markdown === editor?.getValue()) return;

    const model = editor.getModel?.();
    isApplyingPreviewEdit = true;

    try {
        if (model && typeof model.getFullModelRange === 'function') {
            editor.pushUndoStop?.();
            editor?.executeEdits('live-preview-edit', [{
                range: model.getFullModelRange(),
                text: markdown,
                forceMoveMarkers: true
            }]);
            editor.pushUndoStop?.();
        } else {
            editor?.setValue(markdown);
        }
    } finally {
        isApplyingPreviewEdit = false;
    }

    hasEdited = true;
    setHasEdited(true);
    saveCurrentDoc();
    updateStats(markdown);
};

const setupLivePreviewEdit = () => {
    livePreviewEditController = initLivePreviewEdit({
        output: '#output',
        toggle: '#live-preview-edit-toggle',
        markdownToggle: '#markdown-mode-toggle',
        getSourceMarkdown: () => editor?.getValue() || '',
        onMarkdownChange: applyMarkdownFromPreviewEdit,
        onExit: () => convert(editor?.getValue()),
        showToast
    });
};

const setupVideoControls = () => {
    videoControlsController = initVideoControls({
        output: '#output',
        getMarkdown: () => editor?.getValue() || '',
        onMarkdownChange: (markdown) => {
            applyMarkdownFromPreviewEdit(markdown);
        },
        showToast
    });
};

const setupImageControls = () => {
    imageControlsController = initImageControls({
        output: '#output',
        getMarkdown: () => editor?.getValue() || '',
        onMarkdownChange: (markdown) => {
            applyMarkdownFromPreviewEdit(markdown);
        },
        showToast
    });
};

// Add GitHub-style language badge + copy button to code blocks (Issue #42 polish)
// Lowercase language-* classes so ```XML matches Prism + CSS like ```xml
const normalizeCodeLanguageClasses = (root) => {
    if (!root?.querySelectorAll) return;
    root.querySelectorAll('code[class*="language-"]').forEach((codeEl) => {
        codeEl.className = codeEl.className.replace(
            /language-([\w#+-]+)/gi,
            (_, lang) => `language-${String(lang).toLowerCase()}`
        );
    });
};

const addCodeCopyButtons = () => {
    const codeBlocks = document.querySelectorAll('#output pre');
    codeBlocks.forEach((pre) => {
        if (pre.querySelector('.code-block-header') || pre.querySelector('.code-copy-btn')) return;

        const codeEl = pre.querySelector('code');
        const langMatch = codeEl?.className?.match(/language-([\w#+-]+)/i);
        const langLabel = langMatch ? langMatch[1].toLowerCase() : 'text';

        const header = document.createElement('div');
        header.className = 'code-block-header';

        const badge = document.createElement('span');
        badge.className = 'code-lang-badge';
        badge.textContent = langLabel;

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'code-copy-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.title = 'Copy code';
        copyBtn.setAttribute('aria-label', 'Copy code to clipboard');

        const copyStatus = document.createElement('span');
        copyStatus.className = 'copy-status';
        copyStatus.setAttribute('aria-live', 'polite');
        copyBtn.appendChild(copyStatus);

        copyBtn.addEventListener('click', async () => {
            const code = codeEl?.textContent || pre.textContent || '';
            try {
                const ok = await copyToClipboard(code);
                if (!ok) throw new Error('copy failed');
                copyBtn.textContent = '';
                copyStatus.textContent = 'Copied!';
                copyBtn.setAttribute('aria-label', 'Copied to clipboard');
                copyBtn.classList.add('copied');
                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                    copyStatus.textContent = '';
                    copyBtn.setAttribute('aria-label', 'Copy code to clipboard');
                    copyBtn.classList.remove('copied');
                }, 1800);
            } catch {
                copyBtn.textContent = '';
                copyStatus.textContent = 'Failed';
                copyBtn.setAttribute('aria-label', 'Copy failed');
                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                    copyStatus.textContent = '';
                    copyBtn.setAttribute('aria-label', 'Copy code to clipboard');
                }, 1500);
            }
        });

        header.appendChild(badge);
        header.appendChild(copyBtn);
        pre.style.position = 'relative';
        pre.insertBefore(header, pre.firstChild);
    });
};

// Reset input text
const reset = () => {
    const changed = editor?.getValue() !== defaultInput;
    if (hasEdited || changed) {
        const confirmed = window.confirm(confirmationMessage);
        if (!confirmed) {
            return;
        }
    }
    isShowingWelcome = true;
    presetValue(defaultInput);
    document.querySelectorAll('.column').forEach((element) => {
        element.scrollTo({ top: 0 });
    });
    showToast('Editor reset to default content', 'info');
};

const presetValue = (value) => {
    editor?.setValue(value);
    editor?.revealPosition({ lineNumber: 1, column: 1 });
    editor?.focus();
    hasEdited = false;
    setHasEdited(false);
};

// ----- sync scroll position -----

const initScrollBarSync = (settings) => {
    const checkbox = document.querySelector('#sync-scroll-checkbox');
    checkbox.checked = settings;
    scrollBarSync = settings;
    scrollSync.setEnabled(settings);

    // Sync toolbar button visual state with loaded settings
    const scrollSyncBtn = document.querySelector('#scroll-sync-button');
    if (scrollSyncBtn) {
        scrollSyncBtn.classList.toggle('active', scrollBarSync);
    }

    checkbox.addEventListener('change', (event) => {
        const checked = event.currentTarget.checked;
        scrollBarSync = checked;
        scrollSync.setEnabled(checked);
        saveScrollBarSettings(checked);

        // Keep toolbar button in sync when checkbox is toggled
        if (scrollSyncBtn) {
            scrollSyncBtn.classList.toggle('active', checked);
        }
    });
};

const initCursorSync = (settings) => {
    const checkbox = document.querySelector('#sync-preview-cursor-checkbox');
    if (!checkbox) return;
    checkbox.checked = settings;
    cursorSync = settings;

    checkbox.addEventListener('change', (event) => {
        const checked = event.currentTarget.checked;
        cursorSync = checked;
        saveCursorSyncSettings(checked);
    });
};

const _enableScrollBarSync = () => {
    scrollBarSync = true;
    scrollSync.setEnabled(true);
};

const _disableScrollBarSync = () => {
    scrollBarSync = false;
    scrollSync.setEnabled(false);
};

// ----- toast / clipboard -----
// showToast + copyToClipboard imported from modular APIs (ui/toast, utils/clipboard)

const copyMarkdownToClipboard = async () => {
    const mdContent = editor?.getValue();
    const ok = await copyToClipboard(mdContent);
    showToast(ok ? 'Markdown copied to clipboard!' : 'Failed to copy Markdown', ok ? 'success' : 'error');
};

const notifyCopied = () => {
    showToast('Markdown copied to clipboard!', 'success');
};

const copyHTMLToClipboard = async () => {
    const htmlContent = document.querySelector('#output')?.innerHTML || '';
    const ok = await copyToClipboard(htmlContent);
    showToast(ok ? 'HTML copied to clipboard!' : 'Failed to copy HTML', ok ? 'success' : 'error');
};

// ----- stats utils -----

const updateStats = (text) => {
    // Strip markdown syntax before counting words (matches stats modal / GitHub)
    const stripped = text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]*`/g, '')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[#*_~`]/g, '')
        .trim();

    // Count words
    const words = stripped.split(/\s+/).filter(word => word.length > 0);
    const wordCount = stripped === '' ? 0 : words.length;

    // Count total characters
    const charCount = text.length;

    // Calculate reading time (configurable words per minute)
    const readingTime = Math.ceil(wordCount / APP_CONFIG.READING_SPEED_WPM) || 0;

    // Count paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

    // Count sentences (approximate)
    const sentences = text.split(/[.(!?)]+/).filter(s => s.trim().length > 0).length;

    // Count headings
    const headings = (text.match(/^#{1,6}\s/gm) || []).length;

    // Update footer stats
    const wordCountEl = document.querySelector('#word-count');
    const charCountEl = document.querySelector('#char-count');
    const readingTimeEl = document.querySelector('#reading-time');

    if (wordCountEl) wordCountEl.textContent = `Words: ${wordCount}`;
    if (charCountEl) charCountEl.textContent = `Chars: ${charCount}`;
    if (readingTimeEl) readingTimeEl.textContent = `Reading: ${readingTime} min`;

    // Update header stats
    const wordCountHeader = document.querySelector('#word-count-header');
    const charCountHeader = document.querySelector('#char-count-header');
    const readingTimeHeader = document.querySelector('#reading-time-header');

    if (wordCountHeader) wordCountHeader.textContent = `Words: ${wordCount}`;
    if (charCountHeader) charCountHeader.textContent = `Chars: ${charCount}`;
    if (readingTimeHeader) readingTimeHeader.textContent = `Reading: ${readingTime} min`;

    // Update modal stats if open
    const modal = document.getElementById('stats-modal');
    if (modal && modal.style.display === 'block') {
        document.querySelector('#stat-words').textContent = wordCount.toLocaleString();
        document.querySelector('#stat-chars').textContent = charCount.toLocaleString();
        document.querySelector('#stat-paragraphs').textContent = paragraphs.toLocaleString();
        document.querySelector('#stat-sentences').textContent = sentences.toLocaleString();
        document.querySelector('#stat-headings').textContent = headings.toLocaleString();
        document.querySelector('#stat-reading-time').textContent = `${readingTime} min`;
    }
};

const setupStatsButton = () => {
    const statsBtn = document.querySelector("#stats-button");
    const modal = document.querySelector("#stats-modal");
    const overlay = document.querySelector("#stats-modal-overlay");
    const closeBtn = modal?.querySelector("#stats-close");
    const closeBtnFooter = modal?.querySelector("#stats-close-btn");

    let statsModalFocusTrap = null;

    const openModal = () => {
        if (modal) modal.style.display = "block";
        if (overlay) overlay.style.display = "block";
        // Force update stats when opening
        const text = editor?.getValue();
        updateStats(text);
        if (modal) {
            statsModalFocusTrap?.deactivate();
            statsModalFocusTrap = createFocusTrap(modal, { onEscape: () => closeModal() });
            statsModalFocusTrap.activate();
        }
    };

    const closeModal = () => {
        statsModalFocusTrap?.deactivate();
        statsModalFocusTrap = null;
        if (modal) modal.style.display = "none";
        if (overlay) overlay.style.display = "none";
    };

    if (statsBtn) {
        statsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (closeBtnFooter) {
        closeBtnFooter.addEventListener('click', closeModal);
    }

    // Click overlay to close
    if (overlay) {
        overlay.addEventListener('click', closeModal);
    }

    // Click outside modal to close
    trackedAddEventListener(window, 'click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
};

// ----- templates -----

const TEMPLATES = {
    readme: {
        title: 'Project README',
        icon: '📘',
        description: 'Standard README with installation, usage, and license sections.',
        content: `# Project Title

> A brief description of your project.

## Features
- Feature 1
- Feature 2
- Feature 3

## Installation
\`\`\`bash
npm install my-project
\`\`\`

## Usage
\`\`\`javascript
const myProject = require('my-project');
myProject.start();
\`\`\`

## License
MIT
`
    },
    cv: {
        title: 'CV / Resume',
        icon: '📄',
        description: 'Professional resume layout with experience and skills.',
        content: `# Your Name
*Software Engineer*
email@example.com | [LinkedIn](https://linkedin.com) | [GitHub](https://github.com)

## Summary
Experienced developer with a passion for building scalable web applications.

## Experience
**Senior Developer** | *Company Name*
*2020 - Present*
- Led a team of 5 developers
- Improved performance by 30%

## Skills
- JavaScript, React, Node.js
- Python, Django
- SQL, MongoDB

## Education
**BS Computer Science** | *University Name*
*2016 - 2020*
`
    },
    blog: {
        title: 'Blog Post',
        icon: '✍️',
        description: 'Article structure with headers, lists, and code blocks.',
        content: `# Blog Post Title
*By Author Name | Jan 1, 2024*

![Cover Image](https://via.placeholder.com/800x400)

## Introduction
Hook the reader with an interesting opening.

## Main Point
Explain your concept here.

### Key Takeaway
1. Point one
2. Point two
3. Point three

> "Quote to emphasize a point."

## Conclusion
Wrap up your thoughts.
`
    },
    meeting: {
        title: 'Meeting Notes',
        icon: '📅',
        description: 'Structure for agendas, attendees, and action items.',
        content: `# Meeting: [Topic]
**Date:** Jan 1, 2024
**Attendees:** Person A, Person B, Person C

## Agenda
1. Review last week's progress
2. Discuss new features
3. Plan next sprint

## Notes
- Key discussion point
- Decision made

## Action Items
- [ ] Person A: Task 1
- [ ] Person B: Task 2
`
    }
};

const setupTemplatesButton = () => {
    const templatesBtn = document.querySelector("#templates-button");
    const modal = document.querySelector("#templates-modal");
    const overlay = document.querySelector("#templates-modal-overlay");
    const closeBtns = document.querySelectorAll(".close-templates");
    const grid = document.querySelector("#templates-grid");

    let templatesModalFocusTrap = null;

    const openModal = () => {
        if (modal) modal.style.display = "block";
        if (overlay) overlay.style.display = "block";
        if (modal) {
            templatesModalFocusTrap?.deactivate();
            templatesModalFocusTrap = createFocusTrap(modal, { onEscape: () => closeModal() });
            templatesModalFocusTrap.activate();
        }
    };

    const closeModal = () => {
        templatesModalFocusTrap?.deactivate();
        templatesModalFocusTrap = null;
        if (modal) modal.style.display = "none";
        if (overlay) overlay.style.display = "none";
    };

    // Populate grid once
    if (grid && grid.children.length === 0) {
        Object.entries(TEMPLATES).forEach(([_key, template]) => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'template-card';
            card.innerHTML = `
                    <div class="template-icon">${template.icon}</div>
                    <div class="template-title">${template.title}</div>
                    <div class="template-desc">${template.description}</div>
                `;

            card.addEventListener('click', () => {
                if (confirm('This will overwrite your current editor content. Continue?')) {
                    editor?.setValue(template.content);
                    editor?.revealPosition({ lineNumber: 1, column: 1 });
                    closeModal();
                    showToast(`Template "${template.title}" loaded!`, 'success');
                }
            });

            grid.appendChild(card);
        });
    }

    if (templatesBtn) {
        templatesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }

    // All close buttons
    closeBtns.forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModal);
    });

    // Click overlay to close
    if (overlay) {
        overlay.addEventListener('click', closeModal);
    }

    // Click outside modal to close
    trackedAddEventListener(window, 'click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
};

// ----- snippets -----

const SNIPPETS = {
    table: {
        title: 'Table',
        icon: '📊',
        content: `
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
`
    },
    alertNote: {
        title: 'Alert: Note',
        icon: 'ℹ️',
        content: `> [!NOTE]
> This is a note alert.
`
    },
    alertWarning: {
        title: 'Alert: Warning',
        icon: '⚠️',
        content: `> [!WARNING]
> This is a warning alert.
`
    },
    mermaidGraph: {
        title: 'Mermaid: Flowchart',
        icon: '🔄',
        content: `\`\`\`mermaid
graph TD
    A[Start] --> B{Condition}
    B -->|Yes| C[OK]
    B -->|No| D[Error]
\`\`\`
`
    },
    mermaidSeq: {
        title: 'Mermaid: Sequence',
        icon: '⏱️',
        content: `\`\`\`mermaid
sequenceDiagram
    Alice->>Bob: Hello Bob, how are you?
    Bob-->>Alice: I am good thanks!
\`\`\`
`
    },
    math: {
        title: 'Math Block',
        icon: '∑',
        content: `$$
\\int_0^\\infty x^2 dx
$$
`
    },
    checklist: {
        title: 'Checklist',
        icon: '☑️',
        content: `- [ ] Task 1
- [x] Task 2
- [ ] Task 3
`
    }
};

const setupSnippetsButton = () => {
    const dropdown = document.querySelector("#snippets-dropdown");

    if (dropdown && dropdown.children.length === 0) {
        Object.entries(SNIPPETS).forEach(([_key, snippet]) => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.innerHTML = `
                    <span class="dropdown-icon">${snippet.icon}</span>
                    <span>${snippet.title}</span>
                `;

            item.addEventListener('click', () => {
                const selection = editor?.getSelection();
                const text = snippet.content;
                const op = { range: selection, text: text, forceMoveMarkers: true };
                editor?.executeEdits("my-source", [op]);
                editor?.focus();
                showToast(`Snippet "${snippet.title}" inserted!`, 'success');
            });

            dropdown.appendChild(item);
        });
    }
};

const positionToolbarDropdown = (sheet, trigger) => {
    const rect = trigger.getBoundingClientRect();
    sheet.style.top = `${Math.round(rect.bottom + 8)}px`;
    sheet.style.bottom = 'auto';

    if (window.innerWidth <= 480) {
        sheet.style.left = '4px';
        sheet.style.right = '4px';
    } else {
        sheet.style.left = 'auto';
        sheet.style.right = `${Math.max(8, Math.round(window.innerWidth - rect.right))}px`;
    }
};

const setupCalloutDropdown = () => {
    const trigger = document.getElementById('callout-dropdown-btn');
    const sheet = document.getElementById('callout-dropdown-sheet');

    if (!trigger || !sheet) return;

    const setOpen = (isOpen) => {
        sheet.classList.toggle('active', isOpen);
        trigger.setAttribute('aria-expanded', String(isOpen));
        sheet.setAttribute('aria-hidden', String(!isOpen));

        if (isOpen) {
            positionToolbarDropdown(sheet, trigger);
        }
    };

    const renderMenu = () => {
        if (sheet.dataset.ready === 'true') return;

        const grid = document.createElement('div');
        grid.className = 'toolbar-overflow-grid';

        const section = document.createElement('div');
        section.className = 'toolbar-overflow-section';
        section.textContent = 'Callouts';
        grid.appendChild(section);

        CALLOUT_TYPES.forEach(({ type, label, icon, color }) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'toolbar-overflow-item';
            item.dataset.action = `callout-${type}`;
            item.title = label;
            item.setAttribute('aria-label', label);
            item.style.setProperty('--callout-accent', color);
            item.innerHTML = `
                <span class="callout-dropdown-badge" aria-hidden="true">${icon}</span>
                <span class="callout-dropdown-label">${label}</span>
            `;

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                setOpen(false);
                const selection = getSelection() || 'Content here';
                insertText(`\n> [!${type.toUpperCase()}]\n> ${selection}\n`);
            });

            grid.appendChild(item);
        });

        sheet.innerHTML = '';
        sheet.appendChild(grid);
        sheet.dataset.ready = 'true';
    };

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        renderMenu();
        setOpen(!sheet.classList.contains('active'));
    });

    trackedAddEventListener(document, 'click', (e) => {
        if (!sheet.contains(e.target) && e.target !== trigger) {
            setOpen(false);
        }
    });

    trackedAddEventListener(window, 'resize', () => {
        if (sheet.classList.contains('active')) {
            positionToolbarDropdown(sheet, trigger);
        }
    });
};

// ----- download utils -----

const downloadMarkdown = () => {
    const content = resolveImageReferences(editor?.getValue() ?? '', false);
    const filename = getExportFilename('md');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded: ${filename}`, 'success');
};

const exportToPDF = async () => {
    showToast('Generating PDF...', 'info', 2000);
    try {
        const html2pdf = await getHtml2Pdf();
        const element = document.querySelector('#output');
        const filename = getExportFilename('pdf');
        const options = {
            margin: [0.75, 0.75, 0.75, 0.75],
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false,
                letterRendering: true
            },
            jsPDF: {
                unit: 'in',
                format: 'letter',
                orientation: 'portrait'
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        await html2pdf().set(options).from(element).save();
        showToast(`PDF exported: ${filename}`, 'success');
    } catch (_) {
        showToast('Failed to export PDF', 'error');
    }
};

const exportToHTML = () => {
    const title = getActiveDocTitle();
    const filename = getExportFilename('html');
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${exportCss}</style>
<style>
    body {
        background: #ffffff;
        color: #24292e;
    }
    .markdown-body {
        box-sizing: border-box;
        min-width: 200px;
        max-width: 980px;
        margin: 0 auto;
        padding: 45px;
    }
    @media (max-width: 767px) {
        .markdown-body {
            padding: 15px;
        }
    }
    @media print {
        .markdown-body {
            max-width: none;
            padding: 20px;
        }
    }
    pre {
        background: #2d2d2d;
        border-radius: 6px;
        padding: 16px;
        overflow-x: auto;
    }
    code {
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    }
    img {
        max-width: 100%;
        height: auto;
    }
    table {
        border-collapse: collapse;
        width: 100%;
    }
    th, td {
        border: 1px solid #dfe2e5;
        padding: 8px 12px;
    }
    blockquote {
        border-left: 4px solid #dfe2e5;
        padding-left: 16px;
        color: #6a737d;
        margin: 16px 0;
    }
</style>
</head>
<body class="markdown-body">
${document.getElementById('output').innerHTML}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`HTML exported: ${filename}`, 'success');
};

const exportToDOCX = () => {
    const title = getActiveDocTitle();
    const filename = getExportFilename('doc');
    const content = document.getElementById('output').innerHTML;
    const html = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${title}</title>
<style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.6; }
    h1 { font-size: 24pt; color: #333; }
    h2 { font-size: 18pt; color: #444; }
    h3 { font-size: 14pt; color: #555; }
    pre, code { font-family: Consolas, monospace; background: #f4f4f4; padding: 2px 4px; }
    pre { padding: 10px; border: 1px solid #ddd; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 8px; }
    blockquote { border-left: 3px solid #ccc; padding-left: 10px; color: #666; }
</style>
</head>
<body>
${content}
</body>
</html>`;

    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`DOCX exported: ${filename}`, 'success');
};

// Export as Plain Text
const exportToTXT = () => {
    const content = editor?.getValue() ?? '';
    // Strip markdown syntax for plain text
    const plainText = content
        .replace(/^#{1,6}\s+/gm, '')  // Remove headings
        .replace(/\*\*(.+?)\*\*/g, '$1')  // Remove bold
        .replace(/\*(.+?)\*/g, '$1')  // Remove italic
        .replace(/~~(.+?)~~/g, '$1')  // Remove strikethrough
        .replace(/`{3}[\s\S]*?`{3}/g, '')  // Remove code blocks
        .replace(/`(.+?)`/g, '$1')  // Remove inline code
        .replace(/\[(.+?)\]\(.+?\)/g, '$1')  // Remove links, keep text
        .replace(/!\[.*?\]\(.+?\)/g, '')  // Remove images
        .replace(/^[-*+]\s+/gm, '• ')  // Convert bullets
        .replace(/^\d+\.\s+/gm, '')  // Remove numbered list markers
        .replace(/^>\s+/gm, '')  // Remove blockquotes
        .replace(/^---+$/gm, '────────────────')  // Convert horizontal rules
        .trim();

    const filename = getExportFilename('txt');
    const blob = new Blob([plainText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Text exported: ${filename}`, 'success');
};

// Export as PNG Image
const exportToPNG = async () => {
    showToast('Generating image...', 'info', 2000);
    try {
        const html2canvas = await getHtml2Canvas();
        const element = document.querySelector('#output');

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        const link = document.createElement('a');
        link.download = getExportFilename('png');
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('Image exported successfully!', 'success');
    } catch (_) {
        showToast('Failed to export image', 'error');
    }
};

// Print document
const printDocument = () => {
    const content = document.getElementById('output').innerHTML;
    const title = getActiveDocTitle();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${escapeHtml(title)}</title>
            <style>${exportCss}</style>
            <style>
                body { padding: 20px; }
                .markdown-body { max-width: 800px; margin: 0 auto; }
                @media print {
                    body { padding: 0; }
                    .markdown-body { max-width: none; }
                }
            </style>
        </head>
        <body class="markdown-body">
            ${content}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
};

// Helper: Get active document title
const getActiveDocTitle = () => {
    const doc = documents.find(d => d.id === activeDocId);
    return doc ? doc.title : 'Untitled';
};

// Helper: Generate export filename with extension
const getExportFilename = (ext) => {
    const title = getActiveDocTitle();
    // Sanitize filename: remove invalid characters
    const sanitized = title.replace(/[<>:"/\\|?*]/g, '').trim() || 'document';
    return `${sanitized}.${ext}`;
};

const setupAdditionalExportButtons = () => {
    const btnHtml = document.getElementById('export-html-button');
    const btnDocx = document.getElementById('export-docx-button');
    const btnTxt = document.getElementById('export-txt-button');
    const btnPng = document.getElementById('export-png-button');
    const btnPrint = document.getElementById('print-button');

    if (btnHtml) btnHtml.addEventListener('click', (e) => { e.preventDefault(); exportToHTML(); });
    if (btnDocx) btnDocx.addEventListener('click', (e) => { e.preventDefault(); exportToDOCX(); });
    if (btnTxt) btnTxt.addEventListener('click', (e) => { e.preventDefault(); exportToTXT(); });
    if (btnPng) btnPng.addEventListener('click', (e) => { e.preventDefault(); exportToPNG(); });
    if (btnPrint) btnPrint.addEventListener('click', (e) => { e.preventDefault(); printDocument(); });
};

// ==================== EXPORT MODAL ====================
let currentExportFormat = 'pdf';
let exportModalZoom = 0.9;
let exportPreviewDebounceTimer = null;

const scheduleExportPreviewUpdate = (format, includeSize = true, delay = 150) => {
    if (exportPreviewDebounceTimer) {
        clearTimeout(exportPreviewDebounceTimer);
    }

    exportPreviewDebounceTimer = setTimeout(() => {
        updateExportPreview(format);
        if (includeSize) {
            estimateFileSize(format);
        }
    }, delay);
};

const setupExportModal = () => {
    const modal = document.getElementById('export-modal');
    const overlay = document.getElementById('export-modal-overlay');
    const closeBtn = document.getElementById('export-modal-close');
    const cancelBtn = document.getElementById('export-cancel-btn');
    const confirmBtn = document.getElementById('export-confirm-btn');
    const formatBtns = document.querySelectorAll('.export-format-btn');
    const headerExportBtn = document.getElementById('export-btn');

    if (!modal) return;

    // Header Export button opens the modal
    headerExportBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        openExportModal();
    });

    // Format button click handlers
    formatBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const format = btn.dataset.format;
            if (!format) return;

            // Handle immediate actions
            if (format === 'copy-md') {
                copyMarkdownToClipboard();
                return;
            }
            if (format === 'copy-html') {
                copyHTMLToClipboard();
                return;
            }
            if (format === 'reset') {
                closeExportModal();
                reset();
                return;
            }

            // Set active format
            formatBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentExportFormat = format;

            // Persist format choice
            try { localStorage.setItem('markups_export_format', format); } catch (_) { /* ignore */ }

            updateExportUI(format);
            updateExportPreview(format);
        });
    });

    // Close handlers
    const closeHandler = () => {
        closeExportModal();
    };

    closeBtn?.addEventListener('click', closeHandler);
    cancelBtn?.addEventListener('click', closeHandler);
    overlay?.addEventListener('click', closeHandler);

    // Escape key to close
    trackedAddEventListener(document, 'keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeExportModal();
        }
    });

    // Confirm button — keep modal open during export for progress visibility
    confirmBtn?.addEventListener('click', () => {
        if (confirmBtn.classList.contains('exporting')) return; // prevent double-click
        confirmBtn.classList.add('exporting');
        executeExport(currentExportFormat);
    });

    // Zoom controls for PNG
    document.getElementById('zoom-in-btn')?.addEventListener('click', () => {
        exportModalZoom = Math.min(exportModalZoom + 0.1, 1.5);
        updateZoom();
    });

    document.getElementById('zoom-out-btn')?.addEventListener('click', () => {
        exportModalZoom = Math.max(exportModalZoom - 0.1, 0.5);
        updateZoom();
    });

    document.getElementById('zoom-fit-btn')?.addEventListener('click', () => {
        exportModalZoom = 0.9;
        updateZoom();
    });

    // Auto-update preview when options change
    setupExportOptionListeners();
};

const updateZoom = () => {
    const pngContainer = document.getElementById('png-container');
    if (pngContainer) {
        pngContainer.style.transform = `scale(${exportModalZoom})`;
    }
};

// Setup listeners for all export options to auto-update preview
const setupExportOptionListeners = () => {
    // PDF options
    const pdfOptions = ['export-paper-size', 'export-orientation', 'export-page-numbers', 'export-header-footer'];
    pdfOptions.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                if (currentExportFormat === 'pdf') {
                    scheduleExportPreviewUpdate('pdf');
                }
            });
        }
    });

    // HTML options
    const htmlOptions = ['export-html-theme', 'export-include-css', 'export-minify-html'];
    htmlOptions.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                if (currentExportFormat === 'html') {
                    scheduleExportPreviewUpdate('html');
                }
            });
        }
    });

    // PNG options
    const pngOptions = ['export-image-width', 'export-resolution', 'export-transparent-bg', 'export-include-shadow'];
    pngOptions.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const eventType = el.type === 'text' ? 'input' : 'change';
            el.addEventListener(eventType, () => {
                if (currentExportFormat === 'png') {
                    scheduleExportPreviewUpdate('png');
                }
            });
        }
    });

    // TXT options
    const txtOptions = ['export-word-wrap', 'export-frontmatter'];
    txtOptions.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                if (currentExportFormat === 'txt') {
                    scheduleExportPreviewUpdate('txt');
                }
            });
        }
    });

    // Print options
    const printOptions = ['print-paper-size', 'print-orientation', 'print-margins', 'print-scale'];
    printOptions.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                if (currentExportFormat === 'print') {
                    scheduleExportPreviewUpdate('print', false);
                }
            });
        }
    });

    const printScaleEl = document.getElementById('print-scale');
    if (printScaleEl) {
        printScaleEl.addEventListener('change', () => {
            if (printScaleEl.value !== 'custom') return;

            const currentCustom = printScaleEl.dataset.customScale || '100';
            const input = window.prompt('Enter custom print scale (%) between 50 and 200', currentCustom);

            if (input === null) {
                // User canceled; revert to fit
                printScaleEl.value = 'fit';
                scheduleExportPreviewUpdate('print', false);
                return;
            }

            const parsed = parseInt(input, 10);
            if (Number.isNaN(parsed)) {
                printScaleEl.value = 'fit';
                showToast('Invalid scale. Using Fit to page.', 'warning', 1800);
                scheduleExportPreviewUpdate('print', false);
                return;
            }

            const clamped = Math.min(200, Math.max(50, parsed));
            printScaleEl.dataset.customScale = String(clamped);
            showToast(`Custom print scale set to ${clamped}%`, 'info', 1600);
            scheduleExportPreviewUpdate('print', false);
        });
    }

    // Refresh button
    document.getElementById('export-refresh-btn')?.addEventListener('click', () => {
        updateExportPreview(currentExportFormat);
        estimateFileSize(currentExportFormat);
        showToast('Preview refreshed!', 'info', 1500);
    });
};

const openExportModal = () => {
    const modal = document.getElementById('export-modal');
    const overlay = document.getElementById('export-modal-overlay');

    if (!modal || !overlay) return;

    // Reset loading state
    const loadingOverlay = document.getElementById('export-loading-overlay');
    if (loadingOverlay) loadingOverlay.classList.add('hidden');

    // Reset export button state
    const confirmBtn = document.getElementById('export-confirm-btn');
    if (confirmBtn) confirmBtn.classList.remove('exporting');

    // Restore last-used format or default to PDF
    let savedFormat = 'pdf';
    try { savedFormat = localStorage.getItem('markups_export_format') || 'pdf'; } catch (_) { /* ignore */ }
    const validFormats = ['pdf', 'html', 'markdown', 'docx', 'txt', 'png', 'print'];
    currentExportFormat = validFormats.includes(savedFormat) ? savedFormat : 'pdf';

    document.querySelectorAll('.export-format-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.format === currentExportFormat);
    });

    updateExportUI(currentExportFormat);
    updateExportPreview(currentExportFormat);

    // Show modal
    modal.classList.add('active');
    overlay.classList.add('active');

    exportModalFocusTrap?.deactivate();
    exportModalFocusTrap = createFocusTrap(modal, {
        onEscape: () => closeExportModal()
    });
    exportModalFocusTrap.activate();
};

const closeExportModal = () => {
    const modal = document.getElementById('export-modal');
    const overlay = document.getElementById('export-modal-overlay');
    const loadingOverlay = document.getElementById('export-loading-overlay');
    const confirmBtn = document.getElementById('export-confirm-btn');

    exportModalFocusTrap?.deactivate();
    exportModalFocusTrap = null;

    modal?.classList.remove('active');
    overlay?.classList.remove('active');
    loadingOverlay?.classList.add('hidden');
    if (confirmBtn) confirmBtn.classList.remove('exporting');

    // Reset success icon for next use
    const successIcon = loadingOverlay?.querySelector('.export-loading-success-icon');
    const spinner = loadingOverlay?.querySelector('.export-loading-spinner');
    if (successIcon) successIcon.style.display = 'none';
    if (spinner) spinner.style.display = '';
};

const updateExportUI = (format) => {
    // Hide all option panels
    document.querySelectorAll('.export-options').forEach(el => el.classList.add('hidden'));

    // Hide all previews
    document.querySelectorAll('.export-preview').forEach(el => el.classList.add('hidden'));

    // Show relevant options
    const optionsId = `${format}-options`;
    document.getElementById(optionsId)?.classList.remove('hidden');

    // Update button text and icon
    const btnText = document.getElementById('export-btn-text');
    const btnIcon = document.getElementById('export-btn-icon');
    const previewLabel = document.getElementById('preview-label');

    const formatConfig = {
        pdf: { text: 'Export PDF', icon: 'picture_as_pdf', label: '' },
        html: { text: 'Export HTML', icon: 'html', label: 'HTML Preview' },
        markdown: { text: 'Download Markdown', icon: 'download', label: 'Markdown file' },
        docx: { text: 'Export DOCX', icon: 'description', label: 'Word Document' },
        txt: { text: 'Export Text', icon: 'text_snippet', label: 'Plain Text Preview' },
        png: { text: 'Export Image', icon: 'image', label: 'Image Preview' },
        print: { text: 'Print Document', icon: 'print', label: 'Print Preview' }
    };

    const config = formatConfig[format] || formatConfig.pdf;
    if (btnText) btnText.textContent = config.text;
    if (btnIcon) btnIcon.textContent = config.icon;

    // Calculate approximate page count for PDF/print
    if (format === 'pdf' || format === 'print') {
        const outputEl = document.getElementById('output');
        if (outputEl) {
            const contentHeight = outputEl.scrollHeight;
            // A4 at ~96 DPI ≈ 842px printable height with margins ≈ 700px
            const pageHeight = 700;
            const approxPages = Math.max(1, Math.ceil(contentHeight / pageHeight));
            if (previewLabel) previewLabel.textContent = `Previewing 1 of ~${approxPages} page${approxPages > 1 ? 's' : ''}`;
        }
    } else {
        if (previewLabel) previewLabel.textContent = config.label;
    }

    // Estimate file size
    estimateFileSize(format);
};

const updateExportPreview = (format) => {
    const content = document.getElementById('output').innerHTML;
    const title = getActiveDocTitle();
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    // Update filename and date
    const filenameEl = document.getElementById('page-filename');
    const dateEl = document.getElementById('page-date');
    const urlEl = document.getElementById('browser-url-text');

    if (filenameEl) filenameEl.textContent = `${title}.md`;
    if (dateEl) dateEl.textContent = today;
    if (urlEl) urlEl.textContent = `file:///Documents/${title}.html`;

    // Get PDF/Print options
    const showPageNumbers = document.getElementById('export-page-numbers')?.checked ?? true;
    const showHeaderFooter = document.getElementById('export-header-footer')?.checked ?? false;

    // Show appropriate preview
    if (format === 'pdf' || format === 'print') {
        document.getElementById('pdf-preview')?.classList.remove('hidden');
        const pageContent = document.getElementById('export-page-content');
        const pageFooter = document.querySelector('.page-footer');
        const pageHeader = document.querySelector('.page-header');

        if (pageContent) {
            pageContent.innerHTML = `<div class="markdown-body">${content}</div>`;
        }

        // Toggle page number visibility
        if (pageFooter) {
            pageFooter.style.display = showPageNumbers ? 'flex' : 'none';
        }

        // Toggle header visibility
        if (pageHeader) {
            pageHeader.style.display = showHeaderFooter ? 'flex' : 'none';
        }
    } else if (format === 'html') {
        document.getElementById('html-preview')?.classList.remove('hidden');
        const htmlContent = document.getElementById('html-preview-content');
        const theme = document.getElementById('export-html-theme')?.value || 'light';

        if (htmlContent) {
            // Apply theme to preview
            htmlContent.className = 'browser-content';
            if (theme === 'dark') {
                htmlContent.style.backgroundColor = '#1e1e1e';
                htmlContent.style.color = '#d4d4d4';
            } else {
                htmlContent.style.backgroundColor = '#ffffff';
                htmlContent.style.color = '#24292f';
            }
            htmlContent.innerHTML = `<div class="markdown-body">${content}</div>`;
        }
    } else if (format === 'txt') {
        document.getElementById('txt-preview')?.classList.remove('hidden');
        const txtContent = document.getElementById('txt-preview-content');
        const wordWrap = document.getElementById('export-word-wrap')?.checked ?? true;
        const includeFrontmatter = document.getElementById('export-frontmatter')?.checked ?? false;

        if (txtContent) {
            // Convert to plain text — null-safe + bounded for large docs
            const raw = editor?.getValue() || '';
            if (raw.length > 2_000_000) {
                showToast('Document is very large; TXT preview may be slow', 'warning');
            }
            let plainText = raw
                .replace(/^#{1,6}\s+/gm, '')
                .replace(/\*\*(.+?)\*\*/g, '$1')
                .replace(/\*(.+?)\*/g, '$1')
                .replace(/~~(.+?)~~/g, '$1')
                .replace(/`{3}[\s\S]*?`{3}/g, '')
                .replace(/`(.+?)`/g, '$1')
                .replace(/\[(.+?)\]\(.+?\)/g, '$1')
                .replace(/!\[.*?\]\(.+?\)/g, '')
                .replace(/^[-*+]\s+/gm, '• ')
                .replace(/^\d+\.\s+/gm, '')
                .replace(/^>\s+/gm, '')
                .trim();

            // Add frontmatter if enabled
            if (includeFrontmatter) {
                const frontmatter = `---\ntitle: ${title}\ndate: ${today}\n---\n\n`;
                plainText = frontmatter + plainText;
            }

            txtContent.textContent = plainText;
            txtContent.style.whiteSpace = wordWrap ? 'pre-wrap' : 'pre';
        }
    } else if (format === 'png') {
        document.getElementById('png-preview')?.classList.remove('hidden');
        const pngContent = document.getElementById('png-preview-content');
        const pngContainer = document.getElementById('png-container');
        const transparentBg = document.getElementById('export-transparent-bg')?.checked ?? false;
        const includeShadow = document.getElementById('export-include-shadow')?.checked ?? true;

        if (pngContent) {
            pngContent.innerHTML = `<div class="markdown-body">${content}</div>`;
        }

        // Apply styling to preview based on options
        if (pngContainer) {
            if (transparentBg) {
                pngContainer.style.background = 'repeating-conic-gradient(#e0e0e0 0% 25%, #ffffff 0% 50%) 50% / 20px 20px';
            } else {
                pngContainer.style.background = '#ffffff';
            }

            if (includeShadow) {
                pngContainer.style.boxShadow = '0 10px 40px rgba(0,0,0,0.15)';
            } else {
                pngContainer.style.boxShadow = 'none';
            }
        }
    } else if (format === 'markdown' || format === 'docx') {
        // Show PDF preview as placeholder
        document.getElementById('pdf-preview')?.classList.remove('hidden');
        const pageContent = document.getElementById('export-page-content');
        const pageFooter = document.querySelector('.page-footer');
        const pageHeader = document.querySelector('.page-header');

        if (pageContent) {
            pageContent.innerHTML = `<div class="markdown-body">${content}</div>`;
        }

        // Hide header/footer for markdown/docx preview
        if (pageFooter) pageFooter.style.display = 'none';
        if (pageHeader) pageHeader.style.display = 'none';
    }
};

const estimateFileSize = (format) => {
    const content = editor?.getValue() || '';
    const htmlContent = document.getElementById('output').innerHTML;
    let estimatedSize = 0;

    switch (format) {
        case 'markdown':
            estimatedSize = new Blob([content]).size;
            break;
        case 'txt':
            estimatedSize = new Blob([content]).size * 0.7;
            break;
        case 'html':
            estimatedSize = new Blob([htmlContent]).size + 5000; // CSS overhead
            break;
        case 'pdf':
            estimatedSize = new Blob([htmlContent]).size * 3; // PDF is larger
            break;
        case 'docx':
            estimatedSize = new Blob([htmlContent]).size * 1.5;
            break;
        case 'png':
            estimatedSize = new Blob([htmlContent]).size * 10; // Images are larger
            break;
        case 'print':
            estimatedSize = 0; // N/A for print
            break;
    }

    const sizeEl = document.getElementById('export-file-size');
    if (sizeEl) {
        if (format === 'print') {
            sizeEl.textContent = 'N/A';
        } else if (estimatedSize < 1024) {
            sizeEl.textContent = `${estimatedSize} B`;
        } else if (estimatedSize < 1024 * 1024) {
            sizeEl.textContent = `${(estimatedSize / 1024).toFixed(1)} KB`;
        } else {
            sizeEl.textContent = `${(estimatedSize / (1024 * 1024)).toFixed(1)} MB`;
        }
    }
};

const showExportLoading = (text = 'Generating your file...', progress = 30) => {
    const overlay = document.getElementById('export-loading-overlay');
    const textEl = document.getElementById('export-loading-text');
    const progressEl = document.getElementById('export-loading-progress-bar');
    const spinner = overlay?.querySelector('.export-loading-spinner');
    const successIcon = overlay?.querySelector('.export-loading-success-icon');

    if (overlay) overlay.classList.remove('hidden');
    if (textEl) textEl.textContent = text;
    if (progressEl) progressEl.style.width = `${progress}%`;
    if (spinner) spinner.style.display = '';
    if (successIcon) successIcon.style.display = 'none';
};

const updateExportProgress = (progress, text) => {
    const progressEl = document.getElementById('export-loading-progress-bar');
    const textEl = document.getElementById('export-loading-text');

    if (progressEl) progressEl.style.width = `${progress}%`;
    if (textEl && text) textEl.textContent = text;
};

const hideExportLoading = ({ success = true, text = 'Complete!', closeModal = true, delay = 900 } = {}) => {
    const overlay = document.getElementById('export-loading-overlay');
    const spinner = overlay?.querySelector('.export-loading-spinner');
    const successIcon = overlay?.querySelector('.export-loading-success-icon');
    const confirmBtn = document.getElementById('export-confirm-btn');

    if (!overlay) return;

    if (!success) {
        if (spinner) spinner.style.display = '';
        if (successIcon) successIcon.style.display = 'none';
        updateExportProgress(0, text || 'Ready');
        overlay.classList.add('hidden');
        if (confirmBtn) confirmBtn.classList.remove('exporting');
        return;
    }

    updateExportProgress(100, text);

    // Show success icon instead of spinner
    if (spinner) spinner.style.display = 'none';
    if (!successIcon) {
        const icon = document.createElement('div');
        icon.className = 'export-loading-success-icon';
        icon.innerHTML = '<span class="material-symbols-outlined">check</span>';
        const content = overlay.querySelector('.export-loading-content');
        if (content) content.insertBefore(icon, content.firstChild);
    } else {
        successIcon.style.display = 'flex';
    }

    setTimeout(() => {
        overlay.classList.add('hidden');
        if (spinner) spinner.style.display = '';
        const si = overlay.querySelector('.export-loading-success-icon');
        if (si) si.style.display = 'none';
        if (confirmBtn) confirmBtn.classList.remove('exporting');
        if (closeModal) closeExportModal();
    }, delay);
};

const failExportLoading = (text = 'Export failed') => {
    hideExportLoading({ success: false, text, closeModal: false });
};

const executeExport = (format) => {
    switch (format) {
        case 'pdf':
            exportToPDFWithOptions();
            break;
        case 'html':
            exportToHTMLWithOptions();
            break;
        case 'markdown':
            downloadMarkdownWithOptions();
            break;
        case 'docx':
            exportToDOCXWithOptions();
            break;
        case 'txt':
            exportToTXTWithOptions();
            break;
        case 'png':
            exportToPNGWithOptions();
            break;
        case 'print':
            printDocumentWithOptions();
            break;
    }
};

// Helper: Convert inline SVGs to canvas-based images for better html2canvas compatibility
// Uses synchronous canvas drawing (no Image loading) to avoid blob URL / onload hangs
const convertSVGsToImages = (container) => {
    // Only target top-level SVGs inside mermaid diagrams — skip KaTeX & nested SVGs
    const mermaidSvgs = container.querySelectorAll('.mermaid-diagram > svg');
    // Also grab standalone top-level SVGs (direct children of output), but not nested ones
    const topLevelSvgs = container.querySelectorAll(':scope > svg');
    // Deduplicate using a Set
    const svgSet = new Set([...mermaidSvgs, ...topLevelSvgs]);

    const stats = { total: svgSet.size, converted: 0, skipped: 0, errors: 0 };
    if (!svgSet.size) return stats;

    for (const svg of svgSet) {
        try {
            if (!svg.parentNode) { stats.skipped++; continue; }

            // Get dimensions from attributes or viewBox (getBoundingClientRect unreliable on clones)
            const vb = svg.getAttribute('viewBox');
            const attrW = parseFloat(svg.getAttribute('width') || '0');
            const attrH = parseFloat(svg.getAttribute('height') || '0');
            let width = attrW, height = attrH;
            if ((!width || !height) && vb) {
                const parts = vb.split(/[\s,]+/).map(Number);
                if (parts.length === 4) { width = width || parts[2]; height = height || parts[3]; }
            }
            width = Math.max(1, Math.round(width || 400));
            height = Math.max(1, Math.round(height || 300));

            // Serialize SVG with explicit dimensions to ensure canvas draws correctly
            const svgClone = svg.cloneNode(true);
            svgClone.setAttribute('width', String(width));
            svgClone.setAttribute('height', String(height));
            const svgData = new XMLSerializer().serializeToString(svgClone);
            const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);

            // Draw synchronously on canvas via a data-URL image (no blob/onload needed)
            const canvas = document.createElement('canvas');
            canvas.width = width * 2;
            canvas.height = height * 2;
            const ctx = canvas.getContext('2d');
            if (!ctx) { stats.skipped++; continue; }

            // Use a temporary Image drawn synchronously by setting src to data URI
            // Note: data URI images are loaded synchronously in most browsers when dimensions are known
            const tmpImg = new Image(width, height);
            tmpImg.src = svgDataUrl;
            // If the image isn't immediately available, skip it rather than hanging
            if (!tmpImg.complete || !tmpImg.naturalWidth) {
                stats.skipped++;
                continue;
            }

            ctx.scale(2, 2);
            ctx.drawImage(tmpImg, 0, 0, width, height);

            const imgEl = document.createElement('img');
            imgEl.src = canvas.toDataURL('image/png');
            imgEl.style.maxWidth = '100%';
            imgEl.style.height = 'auto';
            svg.parentNode.replaceChild(imgEl, svg);
            stats.converted++;
        } catch (e) {
            console.warn('SVG conversion skipped:', e);
            stats.errors++;
            stats.skipped++;
        }
    }
    return stats;
};

// Enhanced export functions with options
const exportToPDFWithOptions = async () => {
    let tempContainer = null;

    try {
        const paperSize = document.getElementById('export-paper-size')?.value || 'letter';
        const orientation = document.getElementById('export-orientation')?.value || 'portrait';
        const pageNumbers = document.getElementById('export-page-numbers')?.checked ?? true;
        const headerFooter = document.getElementById('export-header-footer')?.checked ?? false;

        showExportLoading('Preparing PDF document...', 10);
        const element = document.querySelector('#output');
        if (!element) throw new Error('Output element not found');

        const filename = getExportFilename('pdf');
        const title = getActiveDocTitle();
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

        const formatMap = {
            'a4': 'a4',
            'letter': 'letter',
            'legal': 'legal',
            'tabloid': [11, 17]
        };

        updateExportProgress(30, 'Preparing content...');

        const html2pdf = await getHtml2Pdf();

        // Determine what element to pass to html2pdf
        let sourceElement = element;

        if (headerFooter) {
            // Only create a container when header/footer is needed
            tempContainer = document.createElement('div');
            tempContainer.className = 'markdown-body';
            tempContainer.style.cssText = 'background:#fff; color:#24292e; padding:0; width:' +
                (orientation === 'landscape' ? '10in' : '7.5in') + ';';
            tempContainer.innerHTML = `
                <div style="font-size:10pt;color:#666;border-bottom:1px solid #ddd;padding-bottom:8px;margin-bottom:16px;">${title} &mdash; ${today}</div>
            `;
            // Clone the output content into the temp container
            const contentClone = element.cloneNode(true);
            // Move all children from clone into our container
            while (contentClone.firstChild) {
                tempContainer.appendChild(contentClone.firstChild);
            }
            // Place it on-screen but behind the export overlay (z-index: -1)
            tempContainer.style.position = 'fixed';
            tempContainer.style.top = '0';
            tempContainer.style.left = '0';
            tempContainer.style.zIndex = '-1';
            tempContainer.style.pointerEvents = 'none';
            document.body.appendChild(tempContainer);
            sourceElement = tempContainer;
        }

        const options = {
            margin: headerFooter ? [0.75, 0.5, 0.75, 0.5] : [0.5, 0.5, 0.5, 0.5],
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false,
                letterRendering: true,
                backgroundColor: '#ffffff',
                scrollX: 0,
                scrollY: -window.scrollY
            },
            jsPDF: {
                unit: 'in',
                format: formatMap[paperSize] || 'letter',
                orientation: orientation
            },
            pagebreak: { mode: ['css', 'legacy'] }
        };

        // Generate PDF
        if (pageNumbers) {
            updateExportProgress(50, 'Rendering pages...');
            await html2pdf().set(options).from(sourceElement).toPdf().get('pdf').then((pdf) => {
                updateExportProgress(80, 'Adding page numbers...');
                const totalPages = pdf.internal.getNumberOfPages();
                for (let i = 1; i <= totalPages; i++) {
                    pdf.setPage(i);
                    pdf.setFontSize(9);
                    pdf.setTextColor(128);
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 0.3, { align: 'center' });
                }
            }).save();
        } else {
            updateExportProgress(60, 'Generating PDF file...');
            await html2pdf().set(options).from(sourceElement).save();
        }

        // Clean up temp container if used
        if (tempContainer?.parentNode) document.body.removeChild(tempContainer);
        tempContainer = null;
        showToast(`PDF exported: ${filename}`, 'success');
        hideExportLoading();
    } catch (err) {
        console.error('PDF export error:', err);
        if (tempContainer?.parentNode) try { document.body.removeChild(tempContainer); } catch (_) { }
        failExportLoading('Failed to export PDF');
        showToast('Failed to export PDF', 'error');
    }
};

const exportToHTMLWithOptions = () => {
    const theme = document.getElementById('export-html-theme')?.value || 'light';
    const includeCSS = document.getElementById('export-include-css')?.checked ?? true;
    const minify = document.getElementById('export-minify-html')?.checked ?? false;

    showExportLoading('Generating HTML file...', 40);
    const title = getActiveDocTitle();
    const filename = getExportFilename('html');
    const content = document.getElementById('output').innerHTML;

    let themeStyles = '';
    if (theme === 'dark') {
        themeStyles = `
            body { background: #0d1117; color: #c9d1d9; }
            .markdown-body { color: #c9d1d9; }
            .markdown-body h1, .markdown-body h2, .markdown-body h3 { color: #c9d1d9; border-color: #30363d; }
            .markdown-body code { background: #161b22; }
            .markdown-body pre { background: #161b22; }
        `;
    } else if (theme === 'system') {
        themeStyles = `
            @media (prefers-color-scheme: dark) {
                body { background: #0d1117; color: #c9d1d9; }
                .markdown-body { color: #c9d1d9; }
                .markdown-body h1, .markdown-body h2, .markdown-body h3 { color: #c9d1d9; border-color: #30363d; }
            }
        `;
    }

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${includeCSS ? `<style>${exportCss}</style>` : ''}
<style>
body { background: #ffffff; color: #24292e; }
.markdown-body { box-sizing: border-box; min-width: 200px; max-width: 980px; margin: 0 auto; padding: 45px; }
@media (max-width: 767px) { .markdown-body { padding: 15px; } }
${themeStyles}
</style>
</head>
<body class="markdown-body">
${content}
</body>
</html>`;

    if (minify) {
        html = html.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
    }

    try {
        updateExportProgress(80, 'Preparing download...');
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`HTML exported: ${filename}`, 'success');
        hideExportLoading();
    } catch (err) {
        console.error('HTML export error:', err);
        failExportLoading('Failed to export HTML');
        showToast('Failed to export HTML', 'error');
    }
};

const exportToPNGWithOptions = async () => {
    const widthInput = document.getElementById('export-image-width')?.value || '1200 px';
    const resolution = parseInt(document.getElementById('export-resolution')?.value || '2');
    const transparentBg = document.getElementById('export-transparent-bg')?.checked ?? false;
    const includeShadow = document.getElementById('export-include-shadow')?.checked ?? true;

    // Parse width value
    const width = parseInt(widthInput.replace(/[^0-9]/g, '')) || 1200;

    showExportLoading('Capturing document as image...', 20);
    const element = document.querySelector('#output');
    const filename = getExportFilename('png');

    // Create a wrapper for shadow effect if needed
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
        display: inline-block;
        background: ${transparentBg ? 'transparent' : '#ffffff'};
        ${includeShadow ? 'padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);' : ''}
        border-radius: ${includeShadow ? '8px' : '0'};
        width: ${width}px;
        overflow: hidden;
    `;

    // Clone content
    const clone = element.cloneNode(true);
    clone.style.width = '100%';
    clone.style.maxWidth = 'none';
    wrapper.appendChild(clone);

    // Append to body temporarily
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px';
    document.body.appendChild(wrapper);

    // Convert SVGs to images for reliable rendering (synchronous — never hangs)
    updateExportProgress(40, 'Processing SVG elements...');
    const pngSvgStats = convertSVGsToImages(wrapper);
    if (pngSvgStats.skipped > 0) {
        showToast(`Skipped ${pngSvgStats.skipped} SVG(s) during image prep`, 'info', 2400);
    }

    updateExportProgress(60, 'Rendering image canvas...');
    try {
        const html2canvas = await getHtml2Canvas();
        const canvas = await html2canvas(wrapper, {
            scale: resolution,
            useCORS: true,
            logging: false,
            backgroundColor: transparentBg ? null : (includeShadow ? '#f5f5f5' : '#ffffff'),
            width: includeShadow ? width + 80 : width,
            windowWidth: width + (includeShadow ? 80 : 0)
        });
        updateExportProgress(90, 'Finalizing image...');
        // Remove wrapper
        document.body.removeChild(wrapper);

        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast(`Image exported: ${filename}`, 'success');
        hideExportLoading();
    } catch (err) {
        if (wrapper.parentNode) document.body.removeChild(wrapper);
        console.error('PNG export error:', err);
        failExportLoading('Failed to export image');
        showToast('Failed to export image', 'error');
    }
};

const printDocumentWithOptions = () => {
    const paperSize = document.getElementById('print-paper-size')?.value || 'a4';
    const orientation = document.getElementById('print-orientation')?.value || 'portrait';
    const margins = document.getElementById('print-margins')?.value || 'default';
    const printScaleEl = document.getElementById('print-scale');
    const scaleValue = printScaleEl?.value || 'fit';
    const customScale = parseInt(printScaleEl?.dataset.customScale || '100', 10);
    const scaleMap = {
        fit: 100,
        actual: 100,
        custom: Number.isNaN(customScale) ? 100 : customScale
    };
    const scale = scaleMap[scaleValue] || parseInt(scaleValue, 10) || 100;

    showExportLoading('Preparing print dialog...', 50);
    const content = document.getElementById('output').innerHTML;
    const title = getActiveDocTitle();

    const marginMap = {
        'default': '20mm',
        'none': '0',
        'narrow': '10mm',
        'moderate': '15mm'
    };

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        failExportLoading('Popup blocked');
        showToast('Popup blocked. Please allow popups and try again.', 'error');
        return;
    }
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${escapeHtml(title)}</title>
            <style>${exportCss}</style>
            <style>
                @page {
                    size: ${paperSize} ${orientation};
                    margin: ${marginMap[margins]};
                }
                body { 
                    padding: 20px; 
                    transform: scale(${scale / 100});
                    transform-origin: top left;
                }
                .markdown-body { max-width: 800px; margin: 0 auto; }
                @media print {
                    body { padding: 0; transform: none; }
                    .markdown-body { max-width: none; }
                }
                pre, code { background: #f6f8fa; }
                pre { padding: 16px; border-radius: 6px; overflow-x: auto; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #d0d7de; padding: 8px 12px; }
                th { background: #f6f8fa; }
                blockquote { border-left: 4px solid #d0d7de; padding-left: 16px; margin-left: 0; color: #656d76; }
                img { max-width: 100%; height: auto; }
            </style>
        </head>
        <body class="markdown-body">
            ${content}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
    showToast('Print dialog opened', 'info');
    hideExportLoading();
};

// Download Markdown with options
const downloadMarkdownWithOptions = () => {
    showExportLoading('Preparing Markdown file...', 50);
    const content = resolveImageReferences(editor?.getValue() ?? '', false);
    const filename = getExportFilename('md');
    try {
        updateExportProgress(80, 'Downloading...');
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Markdown downloaded: ${filename}`, 'success');
        hideExportLoading();
    } catch (err) {
        console.error('Markdown export error:', err);
        failExportLoading('Failed to export Markdown');
        showToast('Failed to export Markdown', 'error');
    }
};

// Export DOCX with options
const exportToDOCXWithOptions = () => {
    const title = getActiveDocTitle();
    const filename = getExportFilename('doc');
    const content = document.getElementById('output').innerHTML;

    showExportLoading('Generating Word document...', 40);

    const html = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${title}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
    @page { 
        size: letter;
        margin: 1in;
    }
    body { 
        font-family: 'Calibri', 'Arial', sans-serif; 
        font-size: 11pt; 
        line-height: 1.6; 
        color: #333;
    }
    h1 { font-size: 26pt; color: #1a1a1a; margin-top: 24pt; margin-bottom: 12pt; font-weight: 600; }
    h2 { font-size: 20pt; color: #333; margin-top: 20pt; margin-bottom: 10pt; font-weight: 600; }
    h3 { font-size: 14pt; color: #444; margin-top: 16pt; margin-bottom: 8pt; font-weight: 600; }
    h4, h5, h6 { font-size: 12pt; color: #555; margin-top: 12pt; margin-bottom: 6pt; font-weight: 600; }
    p { margin: 0 0 12pt 0; }
    pre, code { 
        font-family: 'Consolas', 'Courier New', monospace; 
        background: #f5f5f5; 
        padding: 2pt 4pt;
        font-size: 10pt;
    }
    pre { 
        padding: 10pt; 
        border: 1pt solid #ddd; 
        border-radius: 4pt;
        white-space: pre-wrap;
        margin: 12pt 0;
    }
    table { 
        border-collapse: collapse; 
        width: 100%; 
        margin: 12pt 0;
    }
    th, td { 
        border: 1pt solid #bbb; 
        padding: 8pt 10pt; 
        text-align: left;
    }
    th { background: #f0f0f0; font-weight: 600; }
    blockquote { 
        border-left: 3pt solid #ccc; 
        padding-left: 12pt; 
        margin: 12pt 0 12pt 0;
        color: #666; 
        font-style: italic;
    }
    ul, ol { margin: 6pt 0 12pt 24pt; padding: 0; }
    li { margin: 4pt 0; }
    a { color: #0366d6; text-decoration: underline; }
    hr { border: none; border-top: 1pt solid #ddd; margin: 24pt 0; }
    img { max-width: 100%; height: auto; }
</style>
</head>
<body>
${content}
</body>
</html>`;

    try {
        const blob = new Blob([html], { type: 'application/msword' });
        updateExportProgress(80, 'Preparing download...');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`DOCX exported: ${filename}`, 'success');
        hideExportLoading();
    } catch (err) {
        console.error('DOCX export error:', err);
        failExportLoading('Failed to export DOCX');
        showToast('Failed to export DOCX', 'error');
    }
};

// Export TXT with options
const exportToTXTWithOptions = () => {
    const wordWrap = document.getElementById('export-word-wrap')?.checked ?? true;
    const includeFrontmatter = document.getElementById('export-frontmatter')?.checked ?? false;

    showExportLoading('Converting to plain text...', 40);
    const content = editor?.getValue() ?? '';
    const title = getActiveDocTitle();
    const today = new Date().toISOString().split('T')[0];

    // Size guard: TXT export runs a dozen synchronous regex passes over the
    // entire document. For very large docs, warn the user and continue (the
    // export still works, it just may take a moment) instead of freezing
    // silently. We deliberately do NOT block — that would be worse UX than a
    // slow-but-successful export.
    const TXT_WARN_BYTES = 10 * 1024 * 1024; // 10 MB
    if (content.length > TXT_WARN_BYTES) {
        showToast(
            `Large document (${(content.length / 1024 / 1024).toFixed(1)} MB) — TXT export may take a moment`,
            'warning',
            3000
        );
    }

    // Strip markdown syntax for plain text
    let plainText = content
        .replace(/^#{1,6}\s+(.+)/gm, (match, p1) => p1.toUpperCase())  // Convert headings to uppercase
        .replace(/\*\*(.+?)\*\*/g, '$1')  // Remove bold
        .replace(/\*(.+?)\*/g, '$1')  // Remove italic
        .replace(/~~(.+?)~~/g, '$1')  // Remove strikethrough
        .replace(/`{3}(\w*)\n([\s\S]*?)`{3}/g, (match, lang, code) => `[CODE${lang ? `: ${lang}` : ''}]\n${code}\n[/CODE]`)  // Mark code blocks
        .replace(/`(.+?)`/g, '"$1"')  // Convert inline code to quotes
        .replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)')  // Convert links to text (URL)
        .replace(/!\[(.+?)\]\(.+?\)/g, '[Image: $1]')  // Convert images to placeholder
        .replace(/^[-*+]\s+/gm, '  • ')  // Convert bullets with indent
        .replace(/^\d+\.\s+/gm, '  ')  // Convert numbered lists
        .replace(/^>\s+/gm, '    ')  // Convert blockquotes to indent
        .replace(/^---+$/gm, '\n' + '─'.repeat(50) + '\n')  // Convert horizontal rules
        .replace(/\|(.+)\|/g, (match) => {
            // Convert table rows
            return match.replace(/\|/g, ' | ').replace(/^\s*\|\s*/, '').replace(/\s*\|\s*$/, '');
        })
        .trim();

    // Apply word wrap if enabled
    if (wordWrap) {
        const lines = plainText.split('\n');
        plainText = lines.map(line => {
            if (line.length <= 80) return line;
            const words = line.split(' ');
            let result = '';
            let currentLine = '';
            words.forEach(word => {
                if ((currentLine + ' ' + word).trim().length > 80) {
                    result += currentLine.trim() + '\n';
                    currentLine = word;
                } else {
                    currentLine += ' ' + word;
                }
            });
            result += currentLine.trim();
            return result;
        }).join('\n');
    }

    // Add frontmatter if enabled
    if (includeFrontmatter) {
        const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;
        const frontmatter = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Document: ${title}
Date: ${today}
Words: ${wordCount}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
        plainText = frontmatter + plainText;
    }

    const filename = getExportFilename('txt');
    try {
        updateExportProgress(80, 'Preparing download...');
        const blob = new Blob([plainText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Text exported: ${filename}`, 'success');
        hideExportLoading();
    } catch (err) {
        console.error('TXT export error:', err);
        failExportLoading('Failed to export TXT');
        showToast('Failed to export TXT', 'error');
    }
};

// ----- import utils -----

const importFile = () => {
    const fileInput = document.querySelector('#file-input');
    fileInput.click();
};

const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Guard against OOM/freeze on very large text imports. Mirrors the guard
    // already applied in src/features/import/index.js so both import entry
    // points reject oversized files instead of reading the whole thing in.
    const MAX_IMPORT_BYTES = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_IMPORT_BYTES) {
        showToast(
            `File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 5 MB.`,
            'error'
        );
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        if (!editor) {
            // Editor not ready yet — queue the import until EDITOR_READY
            pendingEditorActions.push(() => {
                editor?.setValue(content);
                editor?.revealPosition({ lineNumber: 1, column: 1 });
                editor?.focus();
            });
            return;
        }
        editor?.setValue(content);
        editor?.revealPosition({ lineNumber: 1, column: 1 });
        editor?.focus();
        hasEdited = true;
        setHasEdited(true);
        showToast(`File "${file.name}" imported successfully!`, 'success');
    };
    reader.onerror = () => {
        showToast('Failed to import file', 'error');
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
};

// ----- image upload -----

const setupImageUpload = () => {
    const imageInput = document.querySelector('#image-input');
    const editorElement = document.querySelector('#editor');

    // Handle image button click
    document.getElementById('toolbar-image').addEventListener('click', (e) => {
        e.preventDefault();
        imageInput.click();
    });

    // Handle image file selection
    imageInput.addEventListener('change', handleImageUpload);

    // Drag and drop support
    editorElement.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        editorElement.classList.add('drag-over');
    });

    editorElement.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        editorElement.classList.remove('drag-over');
    });

    editorElement.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        editorElement.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageDrop(files);
        }
    });
};

const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
    }

    processImageFile(file);
    event.target.value = '';
};

const handleImageDrop = (files) => {
    for (const file of files) {
        if (file.type.startsWith('image/')) {
            processImageFile(file);
        }
    }
};

// Focus traps for key static modals (Phase 4 a11y)
let exportModalFocusTrap = null;
let helpModalFocusTrap = null;
let settingsModalFocusTrap = null;

// Validate image file signature (magic bytes) — shared util
// (local alias kept for call sites / clarity)
const validateImageSignatureLocal = validateImageSignature;

const processImageFile = (file) => {
    // Check file size (configurable max size)
    const maxSize = APP_CONFIG.MAX_IMAGE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSize) {
        showToast(`Image size should be less than ${APP_CONFIG.MAX_IMAGE_SIZE_MB}MB`, 'error');
        return;
    }

    // Validate file type by checking extension against allowed types
    if (!APP_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
        showToast('Please select a valid image file (JPEG, PNG, GIF, WebP, or SVG)', 'error');
        return;
    }

    showToast('Processing image...', 'info', 1500);

    // For SVG files, sanitize the content before creating data URL
    if (file.type === 'image/svg+xml') {
        const textReader = new FileReader();
        textReader.onload = (e) => {
            const cleanDataUrl = sanitizeSvgToDataUrl(e.target.result);
            if (!cleanDataUrl) {
                showToast('SVG rejected: empty or unsafe content', 'error');
                return;
            }
            insertImageIntoEditor(file, cleanDataUrl);
        };
        textReader.onerror = () => {
            showToast('Failed to process SVG image', 'error');
        };
        textReader.readAsText(file);
        return;
    }

    // For non-SVG images, read as ArrayBuffer and verify magic bytes
    const reader = new FileReader();
    reader.onload = async (e) => {
        const buffer = e.target.result;
        if (!validateImageSignatureLocal(buffer, file.type)) {
            showToast('Invalid image file: file content does not match its type', 'error');
            return;
        }

        try {
            const dataUrl = await safeBase64FromArrayBuffer(buffer, file.type);
            insertImageIntoEditor(file, dataUrl);
        } catch {
            showToast('Failed to process image', 'error');
        }
    };

    reader.onerror = () => {
        showToast('Failed to process image', 'error');
    };

    reader.readAsArrayBuffer(file);
};

// Helper: insert image reference into editor after processing
const insertImageIntoEditor = (file, base64Image) => {
    const selection = editor?.getSelection();
    const fileName = sanitizeMarkdownAlt(file.name.replace(/\.[^/.]+$/, "")); // Remove extension + escape alt text

    // Generate short unique ID and store base64 in the image store (LRU-capped)
    const imgId = 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    imageStoreSet(imgId, base64Image);
    saveImageStore();

    // Insert short readable reference instead of enormous base64 string
    const markdown = `![${fileName}](markups-img:${imgId})`;

    editor?.executeEdits('image-upload', [{
        range: selection,
        text: markdown
    }]);

    editor?.focus();
    showToast('Image inserted successfully!', 'success');
};

// ----- dark mode -----

const initDarkMode = (settings) => {
    const checkbox = document.querySelector('#dark-mode-checkbox');
    const toggleBtn = document.querySelector('#dark-mode-toggle');

    checkbox.checked = settings;
    darkMode = settings;
    applyDarkMode(settings);

    checkbox.addEventListener('change', (event) => {
        const checked = event.currentTarget.checked;
        darkMode = checked;
        applyDarkMode(checked);
        saveDarkModeSettings(checked);
    });

    // Dark mode quick toggle button in header
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            darkMode = !darkMode;
            checkbox.checked = darkMode;
            applyDarkMode(darkMode);
            saveDarkModeSettings(darkMode);
            showToast(darkMode ? 'Dark mode enabled' : 'Light mode enabled', 'info', 1500);
        });
    }
};

const applyDarkMode = (enabled) => {
    if (enabled) {
        document.body.classList.add('dark-mode');
        monaco.editor.setTheme('vs-dark');
    } else {
        document.body.classList.remove('dark-mode');
        monaco.editor.setTheme('vs');
    }
};

// Alias used by settings handlers (dark-mode checkbox + initial load).
// Defined here so both entry points share the same implementation.
function toggleDarkMode(enabled) {
    applyDarkMode(enabled);
}

// ----- settings modal -----

// Settings state storage
const SETTINGS_STORAGE_KEY = 'markdown_editor_settings';

const loadSettings = () => {
    try {
        const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!saved) return getDefaultSettings();
        const parsed = JSON.parse(saved);
        const defaults = getDefaultSettings();
        return {
            ...defaults,
            ...parsed,
            general: { ...defaults.general, ...(parsed.general || {}) },
            editor: { ...defaults.editor, ...(parsed.editor || {}) },
            preview: { ...defaults.preview, ...(parsed.preview || {}) }
        };
    } catch {
        return getDefaultSettings();
    }
};

const getDefaultSettings = () => ({
    general: {
        darkMode: false,
        autoSave: true,
        scrollSync: true
    },
    editor: {
        fontFamily: 'JetBrains Mono',
        fontSize: 14,
        lineHeight: 1.6,
        tabSize: 2,
        wordWrap: true,
        lineNumbers: true,
        minimap: false,
        bracketMatching: true
    },
    preview: {
        livePreview: true,
        syntaxHighlight: true,
        mathRendering: true,
        mermaid: true,
        videoMode: 'smart',
        imageMode: 'smart'
    },
    theme: 'vs-dark'
});

const saveSettings = (settings) => {
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error('Failed to save settings:', e);
    }
};

let currentSettings = loadSettings();

const setupSettingsModal = () => {
    const settingsBtn = document.querySelector('#settings-btn');
    const modal = document.querySelector('#settings-modal');
    const overlay = document.querySelector('#settings-modal-overlay');
    const closeBtn = document.querySelector('#settings-close');
    const saveBtn = document.querySelector('#settings-save-btn');
    const resetBtn = document.querySelector('#settings-reset-btn');

    // Tab navigation
    const navItems = document.querySelectorAll('.settings-nav-item');
    const tabPanels = document.querySelectorAll('.settings-tab-panel');

    // Panel titles and descriptions
    const panelInfo = {
        general: { title: 'General Settings', desc: 'Configure your general preferences and application behavior.' },
        editor: { title: 'Editor Settings', desc: 'Customize the code editor appearance and behavior.' },
        preview: { title: 'Preview Settings', desc: 'Configure the markdown preview options.' },
        themes: { title: 'Themes', desc: 'Choose your preferred color theme for the editor.' },
        keyboard: { title: 'Keyboard Shortcuts', desc: 'View and customize keyboard shortcuts.' },
        about: { title: 'About', desc: 'Information about Markdown Live Preview.' }
    };

    // Open modal
    if (settingsBtn && modal) {
        settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openSettingsModal();
        });
    }

    const openSettingsModal = () => {
        modal.classList.add('active');
        overlay.classList.add('active');
        loadSettingsUI();
        settingsModalFocusTrap?.deactivate();
        settingsModalFocusTrap = createFocusTrap(modal, { onEscape: () => closeSettingsModal() });
        settingsModalFocusTrap.activate();
    };

    const closeSettingsModal = () => {
        settingsModalFocusTrap?.deactivate();
        settingsModalFocusTrap = null;
        modal.classList.remove('active');
        overlay.classList.remove('active');
    };

    // Close handlers
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSettingsModal);
    }

    if (overlay) {
        overlay.addEventListener('click', closeSettingsModal);
    }

    // Close on Escape
    trackedAddEventListener(document, 'keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeSettingsModal();
        }
    });

    // Tab switching
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabName = item.dataset.tab;

            // Update nav active state
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Update panel visibility
            tabPanels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === `settings-tab-${tabName}`) {
                    panel.classList.add('active');
                }
            });

            // Update header
            const titleEl = document.getElementById('settings-panel-title');
            const descEl = document.getElementById('settings-panel-description');
            if (titleEl && panelInfo[tabName]) {
                titleEl.textContent = panelInfo[tabName].title;
            }
            if (descEl && panelInfo[tabName]) {
                descEl.textContent = panelInfo[tabName].desc;
            }
        });
    });

    // Load settings into UI
    const loadSettingsUI = () => {
        // General
        setCheckbox('dark-mode-checkbox', document.body.classList.contains('dark-mode'));
        setCheckbox('auto-save-checkbox', currentSettings.general.autoSave);
        setCheckbox('sync-scroll-checkbox', currentSettings.general.scrollSync);

        // Editor
        setDropdown('font-family-dropdown', currentSettings.editor.fontFamily);
        setDropdown('font-size-dropdown', currentSettings.editor.fontSize);
        setDropdown('line-height-dropdown', currentSettings.editor.lineHeight);
        setDropdown('tab-size-dropdown', currentSettings.editor.tabSize);
        setCheckbox('word-wrap-checkbox', currentSettings.editor.wordWrap);
        setCheckbox('line-numbers-checkbox', currentSettings.editor.lineNumbers);
        setCheckbox('minimap-checkbox', currentSettings.editor.minimap);
        setCheckbox('bracket-matching-checkbox', currentSettings.editor.bracketMatching);

        // Preview
        setCheckbox('live-preview-checkbox', currentSettings.preview.livePreview);
        setCheckbox('syntax-highlight-checkbox', currentSettings.preview.syntaxHighlight);
        setCheckbox('math-rendering-checkbox', currentSettings.preview.mathRendering);
        setCheckbox('mermaid-checkbox', currentSettings.preview.mermaid);
        setDropdown('video-mode-dropdown', currentSettings.preview.videoMode || 'smart');

        // Theme
        const themeRadios = document.querySelectorAll('input[name="editor-theme"]');
        themeRadios.forEach(radio => {
            radio.checked = (radio.value === currentSettings.theme);
        });
    };

    const setCheckbox = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.checked = value;
    };

    const setDropdown = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    };

    // Setup all settings event listeners
    setupGeneralSettings();
    setupEditorSettings();
    setupPreviewSettings();
    setupThemeSettings();
    setupKeyboardSearch();

    // Save button
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            saveSettings(currentSettings);
            showToast('Settings saved successfully!', 'success', 2000);
            closeSettingsModal();
        });
    }

    // Reset button
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all settings to defaults?')) {
                currentSettings = getDefaultSettings();
                applyAllSettings();
                loadSettingsUI();
                saveSettings(currentSettings);
                showToast('Settings reset to defaults', 'info', 2000);
            }
        });
    }
};

const setupGeneralSettings = () => {
    // Dark mode toggle
    const darkModeCheckbox = document.getElementById('dark-mode-checkbox');
    if (darkModeCheckbox) {
        darkModeCheckbox.addEventListener('change', (e) => {
            currentSettings.general.darkMode = e.target.checked;
            toggleDarkMode(e.target.checked);
        });
    }

    // Auto save toggle
    const autoSaveCheckbox = document.getElementById('auto-save-checkbox');
    if (autoSaveCheckbox) {
        autoSaveCheckbox.addEventListener('change', (e) => {
            currentSettings.general.autoSave = e.target.checked;
            showToast(e.target.checked ? 'Auto save enabled' : 'Auto save disabled', 'info', 1500);
        });
    }

    // Scroll sync toggle
    const syncScrollCheckbox = document.getElementById('sync-scroll-checkbox');
    if (syncScrollCheckbox) {
        syncScrollCheckbox.addEventListener('change', (e) => {
            currentSettings.general.scrollSync = e.target.checked;
            scrollBarSync = e.target.checked;
            scrollSync.setEnabled(e.target.checked);
            showToast(e.target.checked ? 'Scroll sync enabled' : 'Scroll sync disabled', 'info', 1500);
        });
    }
};

const setupEditorSettings = () => {
    // Font family
    const fontFamilyDropdown = document.getElementById('font-family-dropdown');
    if (fontFamilyDropdown) {
        fontFamilyDropdown.addEventListener('change', (e) => {
            currentSettings.editor.fontFamily = e.target.value;
            editor?.updateOptions({ fontFamily: e.target.value });
            showToast(`Font: ${e.target.value}`, 'info', 1500);
        });
    }

    // Font size
    const fontSizeDropdown = document.getElementById('font-size-dropdown');
    if (fontSizeDropdown) {
        fontSizeDropdown.addEventListener('change', (e) => {
            const size = parseInt(e.target.value);
            currentSettings.editor.fontSize = size;
            editor?.updateOptions({ fontSize: size });
            showToast(`Font size: ${size}px`, 'info', 1500);
        });
    }

    // Line height
    const lineHeightDropdown = document.getElementById('line-height-dropdown');
    if (lineHeightDropdown) {
        lineHeightDropdown.addEventListener('change', (e) => {
            const height = parseFloat(e.target.value);
            currentSettings.editor.lineHeight = height;
            editor?.updateOptions({ lineHeight: height * 14 }); // Monaco uses pixels
            showToast(`Line height: ${height}`, 'info', 1500);
        });
    }

    // Tab size
    const tabSizeDropdown = document.getElementById('tab-size-dropdown');
    if (tabSizeDropdown) {
        tabSizeDropdown.addEventListener('change', (e) => {
            const size = parseInt(e.target.value);
            currentSettings.editor.tabSize = size;
            editor?.updateOptions({ tabSize: size });
            showToast(`Tab size: ${size} spaces`, 'info', 1500);
        });
    }

    // Word wrap
    const wordWrapCheckbox = document.getElementById('word-wrap-checkbox');
    if (wordWrapCheckbox) {
        wordWrapCheckbox.addEventListener('change', (e) => {
            currentSettings.editor.wordWrap = e.target.checked;
            editor?.updateOptions({ wordWrap: e.target.checked ? 'on' : 'off' });
            showToast(e.target.checked ? 'Word wrap enabled' : 'Word wrap disabled', 'info', 1500);
        });
    }

    // Line numbers
    const lineNumbersCheckbox = document.getElementById('line-numbers-checkbox');
    if (lineNumbersCheckbox) {
        lineNumbersCheckbox.addEventListener('change', (e) => {
            currentSettings.editor.lineNumbers = e.target.checked;
            editor?.updateOptions({ lineNumbers: e.target.checked ? 'on' : 'off' });
            showToast(e.target.checked ? 'Line numbers enabled' : 'Line numbers disabled', 'info', 1500);
        });
    }

    // Minimap
    const minimapCheckbox = document.getElementById('minimap-checkbox');
    if (minimapCheckbox) {
        minimapCheckbox.addEventListener('change', (e) => {
            currentSettings.editor.minimap = e.target.checked;
            editor?.updateOptions({ minimap: { enabled: e.target.checked } });
            showToast(e.target.checked ? 'Minimap enabled' : 'Minimap disabled', 'info', 1500);
        });
    }

    // Bracket matching
    const bracketMatchingCheckbox = document.getElementById('bracket-matching-checkbox');
    if (bracketMatchingCheckbox) {
        bracketMatchingCheckbox.addEventListener('change', (e) => {
            currentSettings.editor.bracketMatching = e.target.checked;
            editor?.updateOptions({ matchBrackets: e.target.checked ? 'always' : 'never' });
            showToast(e.target.checked ? 'Bracket matching enabled' : 'Bracket matching disabled', 'info', 1500);
        });
    }
};

const setupPreviewSettings = () => {
    // Live preview
    const livePreviewCheckbox = document.getElementById('live-preview-checkbox');
    if (livePreviewCheckbox) {
        livePreviewCheckbox.addEventListener('change', (e) => {
            currentSettings.preview.livePreview = e.target.checked;
            showToast(e.target.checked ? 'Live preview enabled' : 'Live preview disabled', 'info', 1500);
        });
    }

    // Syntax highlighting
    const syntaxHighlightCheckbox = document.getElementById('syntax-highlight-checkbox');
    if (syntaxHighlightCheckbox) {
        syntaxHighlightCheckbox.addEventListener('change', (e) => {
            currentSettings.preview.syntaxHighlight = e.target.checked;
            updatePreview();
            showToast(e.target.checked ? 'Syntax highlighting enabled' : 'Syntax highlighting disabled', 'info', 1500);
        });
    }

    // Math rendering
    const mathRenderingCheckbox = document.getElementById('math-rendering-checkbox');
    if (mathRenderingCheckbox) {
        mathRenderingCheckbox.addEventListener('change', (e) => {
            currentSettings.preview.mathRendering = e.target.checked;
            updatePreview();
            showToast(e.target.checked ? 'Math rendering enabled' : 'Math rendering disabled', 'info', 1500);
        });
    }

    // Mermaid diagrams
    const mermaidCheckbox = document.getElementById('mermaid-checkbox');
    if (mermaidCheckbox) {
        mermaidCheckbox.addEventListener('change', (e) => {
            currentSettings.preview.mermaid = e.target.checked;
            updatePreview();
            showToast(e.target.checked ? 'Mermaid diagrams enabled' : 'Mermaid diagrams disabled', 'info', 1500);
        });
    }

    // Default video embed behavior
    const videoModeDropdown = document.getElementById('video-mode-dropdown');
    if (videoModeDropdown) {
        videoModeDropdown.addEventListener('change', (e) => {
            currentSettings.preview.videoMode = e.target.value || 'smart';
            saveSettings(currentSettings);
            updatePreview();
            showToast(`Video embeds: ${currentSettings.preview.videoMode}`, 'info', 1500);
        });
    }
};

const setupThemeSettings = () => {
    const themeRadios = document.querySelectorAll('input[name="editor-theme"]');
    themeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                const theme = e.target.value;
                currentSettings.theme = theme;
                currentTheme = theme;
                applyTheme(theme);
                saveThemeSettings(theme);
                showToast(`Theme: ${getThemeName(theme)}`, 'success', 2000);
            }
        });
    });
};

const setupKeyboardSearch = () => {
    const searchInput = document.getElementById('shortcuts-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const shortcutItems = document.querySelectorAll('.shortcut-item');

            shortcutItems.forEach(item => {
                const action = item.querySelector('.shortcut-action');
                if (action) {
                    const text = action.textContent.toLowerCase();
                    item.style.display = text.includes(query) ? 'flex' : 'none';
                }
            });
        });
    }
};

const applyAllSettings = () => {
    // Apply dark mode
    toggleDarkMode(currentSettings.general.darkMode);

    // Apply editor settings
    if (editor) {
        editor?.updateOptions({
            fontFamily: currentSettings.editor.fontFamily,
            fontSize: currentSettings.editor.fontSize,
            lineHeight: currentSettings.editor.lineHeight * 14,
            tabSize: currentSettings.editor.tabSize,
            wordWrap: currentSettings.editor.wordWrap ? 'on' : 'off',
            lineNumbers: currentSettings.editor.lineNumbers ? 'on' : 'off',
            minimap: { enabled: currentSettings.editor.minimap },
            matchBrackets: currentSettings.editor.bracketMatching ? 'always' : 'never'
        });
    }

    // Apply theme
    currentTheme = currentSettings.theme;
    applyTheme(currentSettings.theme);

    // Update preview
    updatePreview();
};

// ----- theme switching -----

const initThemeSelector = (savedTheme) => {
    const themeRadios = document.querySelectorAll('input[name="editor-theme"]');

    // Check for system preference if no saved theme
    if (!savedTheme) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        savedTheme = prefersDark ? 'vs-dark' : 'vs';
    }

    currentTheme = savedTheme;
    currentSettings.theme = savedTheme;

    // Set the correct radio button
    themeRadios.forEach(radio => {
        radio.checked = (radio.value === currentTheme);
    });

    applyTheme(currentTheme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only auto-switch if user hasn't explicitly set a theme
        const userTheme = loadThemeSettings();
        if (!userTheme) {
            const newTheme = e.matches ? 'vs-dark' : 'vs';
            currentTheme = newTheme;
            currentSettings.theme = newTheme;
            themeRadios.forEach(radio => {
                radio.checked = (radio.value === newTheme);
            });
            applyTheme(newTheme);
            showToast(`Theme auto-switched to ${getThemeName(newTheme)}`, 'info', 2000);
        }
    });
};

const defineCustomThemes = () => {
    monaco.editor.defineTheme('dracula', {
        base: 'vs-dark',
        inherit: true,
        rules: [{ background: '282a36' }],
        colors: { 'editor.background': '#282a36' }
    });
    monaco.editor.defineTheme('solarized-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [{ background: '002b36' }],
        colors: { 'editor.background': '#002b36' }
    });
    monaco.editor.defineTheme('solarized-light', {
        base: 'vs',
        inherit: true,
        rules: [{ background: 'fdf6e3' }],
        colors: { 'editor.background': '#fdf6e3' }
    });
    monaco.editor.defineTheme('github-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [{ background: '0d1117' }],
        colors: { 'editor.background': '#0d1117' }
    });
    monaco.editor.defineTheme('github-light', {
        base: 'vs',
        inherit: true,
        rules: [{ background: 'ffffff' }],
        colors: { 'editor.background': '#ffffff' }
    });
};

const applyTheme = (theme) => {
    monaco.editor.setTheme(theme);

    // Remove all theme classes
    document.body.classList.remove('dark-mode', 'light-mode', 'hc-mode');
    const themes = ['dracula', 'solarized-dark', 'solarized-light', 'github-dark', 'github-light'];
    themes.forEach(t => document.body.classList.remove(`theme-${t}`));

    const isDark = theme.includes('dark') || theme === 'hc-black' || theme === 'dracula';

    // Apply base mode
    if (isDark) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.add('light-mode');
    }

    // Apply specific theme class
    if (theme === 'hc-black') {
        document.body.classList.add('hc-mode');
    } else if (theme !== 'vs' && theme !== 'vs-dark') {
        document.body.classList.add(`theme-${theme}`);
    }

    // Switch mermaid diagram theme to match
    if (typeof mermaid !== 'undefined') {
        try {
            mermaid.initialize({
                startOnLoad: false,
                theme: isDark ? 'dark' : 'default'
            });
        } catch (_e) { /* mermaid not ready yet */ }
    }
};

const getThemeName = (theme) => {
    const themeNames = {
        'vs': 'Light',
        'vs-dark': 'Dark',
        'hc-black': 'High Contrast'
    };
    return themeNames[theme] || theme;
};

const loadThemeSettings = () => {
    return Storehouse.getItem(localStorageNamespace, localStorageThemeKey);
};

const saveThemeSettings = (theme) => {
    const expiredAt = new Date(2099, 1, 1);
    Storehouse.setItem(localStorageNamespace, localStorageThemeKey, theme, expiredAt);
};

// ----- setup -----

// setup navigation actions
const setupResetButton = () => {
    const btn = document.querySelector("#reset-button");
    if (btn) {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            reset();
        });
    }
};

const setupCopyButton = (editor) => {
    const btn = document.querySelector("#copy-button");
    if (btn) {
        btn.addEventListener('click', async (event) => {
            event.preventDefault();
            const value = editor?.getValue();
            const ok = await copyToClipboard(value);
            if (ok) notifyCopied();
        });
    }
};

const setupCopyHTMLButton = () => {
    const btn = document.querySelector("#copy-html-button");
    if (btn) {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            copyHTMLToClipboard();
        });
    }
};

const setupDownloadButton = () => {
    const btn = document.querySelector("#download-md-button");
    if (btn) {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            downloadMarkdown();
        });
    }
};

const setupExportPDFButton = () => {
    const btn = document.querySelector("#export-pdf-button");
    if (btn) {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            exportToPDF();
        });
    }
};

const setupImportButton = () => {
    const btn = document.querySelector("#import-button");
    if (btn) {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            importFile();
        });
    }

    const fileInput = document.querySelector("#file-input");
    if (fileInput) {
        fileInput.addEventListener('change', handleFileImport);
    }
};

const setupHelpButton = () => {
    const modal = document.querySelector("#help-modal");
    const overlay = document.querySelector("#help-modal-overlay");
    const helpBtn = document.querySelector("#help-button");
    const closeBtns = modal?.querySelectorAll(".close-modal");

    const openModal = () => {
        if (modal) modal.style.display = "block";
        if (overlay) overlay.style.display = "block";
        helpModalFocusTrap?.deactivate();
        if (modal) {
            helpModalFocusTrap = createFocusTrap(modal, { onEscape: () => closeModal() });
            helpModalFocusTrap.activate();
        }
    };

    const closeModal = () => {
        helpModalFocusTrap?.deactivate();
        helpModalFocusTrap = null;
        if (modal) modal.style.display = "none";
        if (overlay) overlay.style.display = "none";
    };

    if (helpBtn) {
        helpBtn.addEventListener('click', (event) => {
            event.preventDefault();
            openModal();
        });
    }

    // All close buttons in modal
    closeBtns?.forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModal);
    });

    // Click overlay to close
    if (overlay) {
        overlay.addEventListener('click', closeModal);
    }

    // Click outside modal to close
    trackedAddEventListener(window, 'click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
};

/**
 * Subtle header tip: hard-refresh after updates (Ctrl/Cmd+Shift+R).
 * Shows an unread dot until the user opens/dismisses once for this notice version.
 * Bump NOTICE_KEY (e.g. v2) when you want the badge to reappear for a new tip.
 */
const setupUpdateNotice = () => {
    const NOTICE_KEY = 'com.markdownlivepreview.update_notice_v3';
    const root = document.getElementById('header-notice');
    const btn = document.getElementById('update-notice-btn');
    const popover = document.getElementById('update-notice-popover');
    const closeBtn = document.getElementById('update-notice-close');
    const dismissBtn = document.getElementById('update-notice-dismiss');
    const shortcutEl = document.getElementById('update-notice-shortcut');
    const footnoteEl = document.querySelector('.header-notice-footnote');

    if (!root || !btn || !popover) return;

    const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');
    if (shortcutEl) {
        shortcutEl.innerHTML = isMac
            ? '<kbd>Cmd</kbd><span>+</span><kbd>Shift</kbd><span>+</span><kbd>R</kbd>'
            : '<kbd>Ctrl</kbd><span>+</span><kbd>Shift</kbd><span>+</span><kbd>R</kbd>';
    }
    if (footnoteEl) {
        if (isMac) {
            footnoteEl.hidden = true;
        } else {
            footnoteEl.innerHTML = 'Mac: use <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>';
        }
    }

    const isSeen = () => {
        try {
            return localStorage.getItem(NOTICE_KEY) === '1';
        } catch {
            return false;
        }
    };

    const markSeen = () => {
        try {
            localStorage.setItem(NOTICE_KEY, '1');
        } catch {
            // ignore quota / private mode
        }
        root.classList.remove('has-unread');
    };

    const syncUnread = () => {
        root.classList.toggle('has-unread', !isSeen());
    };

    const close = () => {
        popover.classList.add('hidden');
        popover.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
    };

    const open = () => {
        popover.classList.remove('hidden');
        popover.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        markSeen();
    };

    const toggle = () => {
        if (popover.hidden || popover.classList.contains('hidden')) open();
        else close();
    };

    syncUnread();

    btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle();
    });

    closeBtn?.addEventListener('click', (event) => {
        event.preventDefault();
        close();
    });

    dismissBtn?.addEventListener('click', (event) => {
        event.preventDefault();
        markSeen();
        close();
    });

    trackedAddEventListener(document, 'click', (event) => {
        if (!root.contains(event.target)) close();
    });

    trackedAddEventListener(document, 'keydown', (event) => {
        if (event.key === 'Escape') close();
    });
};

const saveTocSidebarVisibility = (isVisible) => {
    const expiredAt = new Date(2099, 1, 1);
    Storehouse.setItem(localStorageNamespace, localStorageTocVisibilityKey, isVisible, expiredAt);
};

const loadTocSidebarVisibility = () => {
    const stored = Storehouse.getItem(localStorageNamespace, localStorageTocVisibilityKey);
    if (typeof stored === 'boolean') return stored;
    return false;
};

const applyTocVisibility = (tocSidebar, tocBtn, mobileOverlay, isVisible) => {
    if (!tocSidebar) return;
    tocSidebar.classList.toggle('hidden', !isVisible);
    tocSidebar.classList.toggle('visible', isVisible && window.innerWidth <= 768);
    if (!isVisible) {
        mobileOverlay?.classList.remove('active');
    }
    tocBtn?.classList.toggle('active', isVisible);
    saveTocSidebarVisibility(isVisible);
};

// TOC toggle button (right sidebar only)
const setupTOCButton = () => {
    const tocBtn = document.querySelector("#toc-button");
    const tocSidebar = document.querySelector("#toc-sidebar");
    const mobileOverlay = document.querySelector('#mobile-toc-overlay');
    const initialTocVisible = loadTocSidebarVisibility();

    applyTocVisibility(tocSidebar, tocBtn, mobileOverlay, initialTocVisible);

    if (tocBtn && tocSidebar) {
        tocBtn.addEventListener('click', (event) => {
            event.preventDefault();
            const nextVisible = tocSidebar.classList.contains('hidden');
            applyTocVisibility(tocSidebar, tocBtn, mobileOverlay, nextVisible);
            showToast(nextVisible ? 'Table of contents shown' : 'Table of contents hidden', 'info', 1400);
        });
    }

    // Close button for floating TOC panel
    const tocPanel = document.getElementById('toc-panel');
    const closeTocBtn = document.querySelector('.close-toc');
    if (closeTocBtn && tocPanel) {
        closeTocBtn.addEventListener('click', () => {
            tocPanel.classList.add('hidden');
            tocBtn?.classList.remove('active');
        });
    }
    const tocCloseBtn = document.querySelector("#toc-close-btn");

    if (tocCloseBtn && tocSidebar) {
        tocCloseBtn.addEventListener('click', () => {
            applyTocVisibility(tocSidebar, tocBtn, mobileOverlay, false);
            showToast('Table of contents hidden', 'info', 1500);
        });
    }

    // Floating TOC button for mobile
    const floatingTocBtn = document.querySelector('#floating-toc-btn');

    if (floatingTocBtn && tocSidebar) {
        floatingTocBtn.addEventListener('click', () => {
            const nextVisible = tocSidebar.classList.contains('hidden');
            applyTocVisibility(tocSidebar, tocBtn, mobileOverlay, nextVisible);
            if (nextVisible && mobileOverlay) mobileOverlay.classList.add('active');
        });
    }

    // Close TOC when clicking overlay
    if (mobileOverlay && tocSidebar) {
        mobileOverlay.addEventListener('click', () => {
            applyTocVisibility(tocSidebar, tocBtn, mobileOverlay, false);
        });
    }
};

// Scroll Sync toggle button
const setupScrollSyncButton = () => {
    const scrollSyncBtn = document.querySelector("#scroll-sync-button");
    const syncScrollCheckbox = document.querySelector('#sync-scroll-checkbox');

    if (scrollSyncBtn) {
        // Set initial state
        if (scrollBarSync) {
            scrollSyncBtn.classList.add('active');
        }

        scrollSyncBtn.addEventListener('click', (event) => {
            event.preventDefault();
            scrollBarSync = !scrollBarSync;
            scrollSync.setEnabled(scrollBarSync);
            scrollSyncBtn.classList.toggle('active', scrollBarSync);

            // Sync with checkbox if exists
            if (syncScrollCheckbox) {
                syncScrollCheckbox.checked = scrollBarSync;
            }

            saveScrollBarSettings(scrollBarSync);
            showToast(scrollBarSync ? 'Scroll sync enabled' : 'Scroll sync disabled', 'info', 1500);
        });
    }
};

// ----- Focus Mode -----

// ----- View Mode -----

// Helper to determine current view mode from body class
const getCurrentViewMode = () => {
    if (document.body.classList.contains('view-editor')) return 'code';
    if (document.body.classList.contains('view-preview')) return 'preview';
    return 'split';
};

const setViewMode = (mode) => {
    // Use the actual pane elements (same IDs as setupDivider uses)
    const leftPane = document.getElementById('edit');      // .editor-pane
    const rightPane = document.getElementById('preview');  // .preview-pane
    const divider = document.getElementById('split-divider');
    const tocSidebar = document.querySelector('#toc-sidebar');
    const btns = {
        code: document.getElementById('view-code'),
        split: document.getElementById('view-split'),
        preview: document.getElementById('view-preview')
    };

    // Reset active state
    Object.values(btns).forEach(btn => {
        if (btn) btn.classList.remove('active')
    });
    if (btns[mode]) btns[mode].classList.add('active');

    // Update body class for CSS styling
    document.body.classList.remove('view-editor', 'view-split', 'view-preview');

    // Reset ALL inline styles first (including flex from divider resizing)
    if (leftPane) {
        leftPane.style.display = '';
        leftPane.style.width = '';
        leftPane.style.flex = '';
    }
    if (rightPane) {
        rightPane.style.display = '';
        rightPane.style.width = '';
        rightPane.style.flex = '';
    }
    if (divider) divider.style.display = '';
    if (tocSidebar) tocSidebar.style.display = '';

    if (mode === 'code') {
        document.body.classList.add('view-editor');
        // Editor only - full width, hide preview and divider
        if (rightPane) rightPane.style.display = 'none';
        if (divider) divider.style.display = 'none';
        if (tocSidebar) tocSidebar.style.display = 'none';
    } else if (mode === 'preview') {
        document.body.classList.add('view-preview');
        // Preview only - full width, hide editor and divider
        if (leftPane) leftPane.style.display = 'none';
        if (divider) divider.style.display = 'none';
        // TOC sidebar stays visible in preview mode
    } else {
        document.body.classList.add('view-split');
        // Split view - let CSS handle 50/50 with flex: 1
    }

    // Trigger resize for Monaco
    setTimeout(() => {
        if (editor) editor?.layout();
    }, 50);

    // Save view mode preference
    saveViewMode(mode);
};

const setupViewButtons = () => {
    const btnCode = document.getElementById('view-code');
    const btnSplit = document.getElementById('view-split');
    const btnPreview = document.getElementById('view-preview');
    const floatingEditBtn = document.getElementById('floating-edit-btn');

    if (btnCode) btnCode.addEventListener('click', () => setViewMode('code'));
    if (btnSplit) btnSplit.addEventListener('click', () => setViewMode('split'));
    if (btnPreview) btnPreview.addEventListener('click', () => setViewMode('preview'));

    // Floating edit button - switches to split mode
    if (floatingEditBtn) {
        floatingEditBtn.addEventListener('click', () => {
            setViewMode('split');
        });
    }
};

// ----- Focus Mode -----

let isFocusMode = false;

const toggleFocusMode = () => {
    const focusBtn = document.querySelector("#focus-button");
    isFocusMode = !isFocusMode;

    if (isFocusMode) {
        document.body.classList.add('focus-mode');
        if (focusBtn) focusBtn.title = 'Exit Focus Mode';
        showToast('Focus Mode Enabled (Press ESC to exit)', 'success');
    } else {
        document.body.classList.remove('focus-mode');
        if (focusBtn) focusBtn.title = 'Focus Mode';
        showToast('Focus Mode Disabled', 'info', 1500);
    }
};

const setupFocusMode = () => {
    const focusBtn = document.querySelector("#focus-button");
    if (focusBtn) {
        focusBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleFocusMode();
        });
    }
};

// ----- Typewriter Mode -----

let isTypewriterMode = false;

const toggleTypewriterMode = () => {
    const typewriterBtn = document.querySelector("#typewriter-button");
    isTypewriterMode = !isTypewriterMode;

    if (isTypewriterMode) {
        if (typewriterBtn) typewriterBtn.classList.add('active');

        // Center current line immediately
        const position = editor?.getPosition();
        if (position) {
            editor?.revealLineInCenter(position.lineNumber);
        }

        showToast('Typewriter Mode Enabled', 'success', 1500);
    } else {
        if (typewriterBtn) typewriterBtn.classList.remove('active');
        showToast('Typewriter Mode Disabled', 'info', 1500);
    }
};

const setupTypewriterButton = () => {
    const typewriterBtn = document.querySelector("#typewriter-button");
    if (typewriterBtn) {
        typewriterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleTypewriterMode();
        });
    }
};

// ----- fullscreen -----

let isFullscreen = false;

const toggleFullscreen = () => {
    const fullscreenBtn = document.querySelector("#fullscreen-button");

    if (!isFullscreen) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        }
        document.body.classList.add('fullscreen-mode');
        if (fullscreenBtn) {
            fullscreenBtn.title = 'Exit Fullscreen';
        }
        isFullscreen = true;
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        document.body.classList.remove('fullscreen-mode');
        if (fullscreenBtn) {
            fullscreenBtn.title = 'Fullscreen';
        }
        isFullscreen = false;
    }
};

const setupFullscreenButton = () => {
    const fullscreenBtn = document.querySelector("#fullscreen-button");
    if (!fullscreenBtn) return;

    fullscreenBtn.addEventListener('click', (event) => {
        event.preventDefault();
        toggleFullscreen();
    });

    // Handle fullscreen change from browser (e.g., ESC key)
    trackedAddEventListener(document, 'fullscreenchange', () => {
        if (!document.fullscreenElement) {
            document.body.classList.remove('fullscreen-mode');
            if (fullscreenBtn) fullscreenBtn.title = 'Fullscreen';
            isFullscreen = false;
        }
    });

    trackedAddEventListener(document, 'webkitfullscreenchange', () => {
        if (!document.webkitFullscreenElement) {
            document.body.classList.remove('fullscreen-mode');
            if (fullscreenBtn) fullscreenBtn.title = 'Fullscreen';
            isFullscreen = false;
        }
    });
};

const setupKeyboardShortcuts = () => {
    trackedAddEventListener(document, 'keydown', (event) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

        // Ctrl/Cmd + S: Download Markdown
        if (ctrlKey && event.key === 's') {
            event.preventDefault();
            downloadMarkdown();
        }
        // Ctrl/Cmd + Shift + P: Print document
        else if (ctrlKey && event.shiftKey && event.key === 'p') {
            event.preventDefault();
            printDocument();
        }
        // Ctrl/Cmd + P: Export PDF
        else if (ctrlKey && event.key === 'p') {
            event.preventDefault();
            exportToPDF();
        }
        // Ctrl/Cmd + O: Import file
        else if (ctrlKey && event.key === 'o') {
            event.preventDefault();
            importFile();
        }
        // Ctrl/Cmd + Shift + E: Open Export Modal
        else if (ctrlKey && event.shiftKey && event.key === 'E') {
            event.preventDefault();
            openExportModal();
        }
        // Ctrl/Cmd + H: Show/Hide help
        else if (ctrlKey && event.key === 'h') {
            event.preventDefault();
            const modal = document.querySelector("#help-modal");
            if (!modal) return;
            const isVisible = modal.style.display === "block";
            modal.style.display = isVisible ? "none" : "block";
        }
        // Ctrl/Cmd + D: Cycle through themes
        else if (ctrlKey && event.key === 'd') {
            event.preventDefault();
            const themeDropdown = document.querySelector('#theme-dropdown');
            const themes = ['vs', 'vs-dark', 'hc-black'];
            const currentIndex = themes.indexOf(currentTheme);
            const nextIndex = (currentIndex + 1) % themes.length;
            const nextTheme = themes[nextIndex];
            themeDropdown.value = nextTheme;
            currentTheme = nextTheme;
            applyTheme(nextTheme);
            saveThemeSettings(nextTheme);
            showToast(`Theme: ${getThemeName(nextTheme)}`, 'info', 1500);
        }
        // Ctrl/Cmd + K: Reset
        else if (ctrlKey && event.key === 'k') {
            event.preventDefault();
            reset();
        }
        // Ctrl/Cmd + B: Bold
        else if (ctrlKey && event.key === 'b') {
            event.preventDefault();
            insertMarkdown('bold');
        }
        // Ctrl/Cmd + I: Italic
        else if (ctrlKey && event.key === 'i') {
            event.preventDefault();
            insertMarkdown('italic');
        }
        // Ctrl/Cmd + Shift + F: Focus Mode
        else if (ctrlKey && event.shiftKey && event.key === 'F') {
            event.preventDefault();
            toggleFocusMode();
        }
        // ESC: Exit Focus/Fullscreen
        else if (event.key === 'Escape') {
            if (closeTableSizePopover()) {
                return;
            }
            if (isFocusMode) {
                toggleFocusMode();
            }
        }
    });
};

// ----- toolbar actions -----

let tableSizePopoverState = {
    panel: null,
    trigger: null,
    onDocumentMouseDown: null,
    onDocumentKeyDown: null
};

const closeTableSizePopover = () => {
    if (!tableSizePopoverState.panel) return false;

    if (tableSizePopoverState.onDocumentMouseDown) {
        document.removeEventListener('mousedown', tableSizePopoverState.onDocumentMouseDown, true);
    }
    if (tableSizePopoverState.onDocumentKeyDown) {
        document.removeEventListener('keydown', tableSizePopoverState.onDocumentKeyDown, true);
    }

    tableSizePopoverState.panel.remove();
    tableSizePopoverState = {
        panel: null,
        trigger: null,
        onDocumentMouseDown: null,
        onDocumentKeyDown: null
    };
    return true;
};

const openTableSizePopover = (triggerEl) => {
    if (!triggerEl) return;

    closeTableSizePopover();

    const panel = document.createElement('div');
    panel.className = 'table-size-popover';
    panel.innerHTML = `
        <div class="table-size-popover-title">Insert table</div>
        <div class="table-size-presets" role="group" aria-label="Quick table sizes">
            <button class="table-size-preset-btn" type="button" data-rows="2" data-cols="2">2x2</button>
            <button class="table-size-preset-btn" type="button" data-rows="3" data-cols="3">3x3</button>
            <button class="table-size-preset-btn" type="button" data-rows="4" data-cols="4">4x4</button>
        </div>
        <div class="table-size-custom">
            <label class="table-size-field">
                <span>Rows</span>
                <input type="number" min="1" max="${TABLE_POPUP_MAX_SIZE}" value="3" id="table-size-rows" />
            </label>
            <label class="table-size-field">
                <span>Columns</span>
                <input type="number" min="1" max="${TABLE_POPUP_MAX_SIZE}" value="3" id="table-size-cols" />
            </label>
        </div>
        <div class="table-size-actions">
            <button class="table-size-insert-btn" type="button">Insert</button>
        </div>
        <div class="table-size-error" aria-live="polite"></div>
    `;

    document.body.appendChild(panel);

    const rect = triggerEl.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    let left = rect.left;
    const top = rect.bottom + 8;

    if (left + panelRect.width > window.innerWidth - 8) {
        left = window.innerWidth - panelRect.width - 8;
    }
    if (left < 8) {
        left = 8;
    }

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;

    const rowsInput = panel.querySelector('#table-size-rows');
    const colsInput = panel.querySelector('#table-size-cols');
    const insertBtn = panel.querySelector('.table-size-insert-btn');
    const errorEl = panel.querySelector('.table-size-error');

    const parseSafeDimension = (value) => {
        const n = Number.parseInt(String(value), 10);
        if (!Number.isFinite(n) || n < 1) return null;
        return Math.min(n, TABLE_POPUP_MAX_SIZE);
    };

    const insertWithSize = (rows, cols) => {
        insertTable(rows, cols);
        closeTableSizePopover();
    };

    const showError = (message) => {
        errorEl.textContent = message;
    };

    panel.querySelectorAll('.table-size-preset-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const rows = Number.parseInt(btn.dataset.rows, 10);
            const cols = Number.parseInt(btn.dataset.cols, 10);
            insertWithSize(rows, cols);
        });
    });

    const submitCustom = () => {
        const rows = parseSafeDimension(rowsInput.value);
        const cols = parseSafeDimension(colsInput.value);

        if (!rows || !cols) {
            showError(`Please enter valid numbers between 1 and ${TABLE_POPUP_MAX_SIZE}.`);
            return;
        }

        rowsInput.value = String(rows);
        colsInput.value = String(cols);
        showError('');
        insertWithSize(rows, cols);
    };

    rowsInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            submitCustom();
        }
    });
    colsInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            submitCustom();
        }
    });
    insertBtn.addEventListener('click', submitCustom);

    const onDocumentMouseDown = (event) => {
        const target = event.target;
        if (!panel.contains(target) && !triggerEl.contains(target)) {
            closeTableSizePopover();
        }
    };
    const onDocumentKeyDown = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeTableSizePopover();
        }
    };

    document.addEventListener('mousedown', onDocumentMouseDown, true);
    document.addEventListener('keydown', onDocumentKeyDown, true);

    tableSizePopoverState = {
        panel,
        trigger: triggerEl,
        onDocumentMouseDown,
        onDocumentKeyDown
    };

    rowsInput.focus();
    rowsInput.select();
};

const insertMarkdown = (type) => {
    switch (type) {
        case 'bold':
            wrapSelection('**', '**');
            break;
        case 'italic':
            wrapSelection('*', '*');
            break;
        case 'strikethrough':
            wrapSelection('~~', '~~');
            break;
        case 'h1':
            prefixLine('# ');
            break;
        case 'h2':
            prefixLine('## ');
            break;
        case 'h3':
            prefixLine('### ');
            break;
        case 'link':
            insertLink();
            break;
        case 'image':
            insertImage();
            break;
        case 'code':
            wrapSelection('```\n', '\n```');
            break;
        case 'inline-code':
            wrapSelection('`', '`');
            break;
        case 'ul':
            prefixLine('- ');
            break;
        case 'ol':
            prefixLine('1. ');
            break;
        case 'task':
            prefixLine('- [ ] ');
            break;
        case 'quote':
            prefixLine('> ');
            break;
        case 'table':
            insertTable();
            break;
        case 'emoji':
            insertText('😊');
            break;
    }
};

const setupInsertVideoButton = () => {
    const btn = document.getElementById('toolbar-video');
    if (!btn) return;

    let panel = null;

    const close = () => {
        if (!panel) return;
        panel.remove();
        panel = null;
        btn.setAttribute('aria-expanded', 'false');
        document.removeEventListener('mousedown', onDocDown, true);
        document.removeEventListener('keydown', onKeyDown, true);
    };

    const onDocDown = (event) => {
        if (!panel) return;
        if (panel.contains(event.target) || btn.contains(event.target)) return;
        close();
    };

    const onKeyDown = (event) => {
        if (event.key === 'Escape') close();
    };

    const insert = () => {
        const input = panel?.querySelector('#video-insert-url');
        const errorEl = panel?.querySelector('.video-insert-error');
        const raw = String(input?.value || '').trim();
        const url = normalizeInsertVideoUrl(raw);

        if (!url || !isEmbeddableVideoUrl(url)) {
            if (errorEl) {
                errorEl.textContent = 'Paste an MP4, GitHub video, YouTube, or Vimeo URL.';
            }
            input?.focus();
            return;
        }

        // Bare URL on its own lines → Smart mode embeds a player
        insertText(`\n${url}\n`);
        showToast('Video URL inserted — preview will embed it', 'success', 2000);
        close();
        editor?.focus();
    };

    const open = () => {
        close();
        panel = document.createElement('div');
        panel.id = 'video-insert-popover';
        panel.className = 'video-insert-popover';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-label', 'Insert video');
        panel.innerHTML = `
            <div class="video-insert-title">Insert video</div>
            <p class="video-insert-hint">
                Bare URL = player in preview.<br>
                <code>[text](url)</code> = clickable link (use <strong>Show as video</strong> to embed).
            </p>
            <label class="video-insert-field">
                <span>Video URL</span>
                <input type="url" id="video-insert-url" placeholder="https://…/video.mp4 or YouTube / GitHub" autocomplete="off" />
            </label>
            <div class="video-insert-error" aria-live="polite"></div>
            <div class="video-insert-actions">
                <button type="button" class="video-insert-cancel">Cancel</button>
                <button type="button" class="video-insert-confirm">Insert</button>
            </div>
        `;
        document.body.appendChild(panel);

        const rect = btn.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        let left = rect.left;
        let top = rect.bottom + 8;
        if (left + panelRect.width > window.innerWidth - 8) {
            left = window.innerWidth - panelRect.width - 8;
        }
        if (left < 8) left = 8;
        if (top + panelRect.height > window.innerHeight - 8) {
            top = Math.max(8, rect.top - panelRect.height - 8);
        }
        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;

        btn.setAttribute('aria-expanded', 'true');
        panel.querySelector('.video-insert-cancel')?.addEventListener('click', close);
        panel.querySelector('.video-insert-confirm')?.addEventListener('click', insert);
        panel.querySelector('#video-insert-url')?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                insert();
            }
        });
        document.addEventListener('mousedown', onDocDown, true);
        document.addEventListener('keydown', onKeyDown, true);
        panel.querySelector('#video-insert-url')?.focus();
    };

    btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (panel) close();
        else open();
    });
};

const setupToolbar = () => {
    document.getElementById('toolbar-undo').addEventListener('click', () => {
        editor?.trigger('toolbar', 'undo');
    });
    document.getElementById('toolbar-redo').addEventListener('click', () => {
        editor?.trigger('toolbar', 'redo');
    });
    document.getElementById('toolbar-bold').addEventListener('click', () => insertMarkdown('bold'));
    document.getElementById('toolbar-italic').addEventListener('click', () => insertMarkdown('italic'));
    document.getElementById('toolbar-strikethrough').addEventListener('click', () => insertMarkdown('strikethrough'));
    document.getElementById('toolbar-highlight').addEventListener('click', () => wrapSelectionHtml('mark'));
    document.getElementById('toolbar-text-color').addEventListener('click', (e) => {
        toolbarManager._openColorPicker(e.currentTarget, 'text');
    });
    document.getElementById('toolbar-highlight-color').addEventListener('click', (e) => {
        toolbarManager._openColorPicker(e.currentTarget, 'highlight');
    });
    document.getElementById('toolbar-special-chars').addEventListener('click', (e) => {
        toolbarManager._openSpecialChars(e.currentTarget);
    });
    document.getElementById('toolbar-h1').addEventListener('click', () => insertMarkdown('h1'));
    document.getElementById('toolbar-h2').addEventListener('click', () => insertMarkdown('h2'));
    document.getElementById('toolbar-h3').addEventListener('click', () => insertMarkdown('h3'));
    document.getElementById('toolbar-link').addEventListener('click', () => insertMarkdown('link'));
    // toolbar-image is handled in setupImageUpload for file upload functionality
    setupInsertVideoButton();
    document.getElementById('toolbar-code').addEventListener('click', () => insertMarkdown('code'));
    document.getElementById('toolbar-inline-code').addEventListener('click', () => insertMarkdown('inline-code'));
    document.getElementById('toolbar-ul').addEventListener('click', () => insertMarkdown('ul'));
    document.getElementById('toolbar-ol').addEventListener('click', () => insertMarkdown('ol'));
    document.getElementById('toolbar-task').addEventListener('click', () => insertMarkdown('task'));
    document.getElementById('toolbar-quote').addEventListener('click', () => insertMarkdown('quote'));
    document.getElementById('toolbar-table').addEventListener('click', (event) => {
        openTableSizePopover(event.currentTarget);
    });
    document.getElementById('toolbar-emoji').addEventListener('click', () => insertMarkdown('emoji'));
};

// ----- local state -----

const loadLastContent = () => {
    const lastContent = Storehouse.getItem(localStorageNamespace, localStorageKey);
    return lastContent;
};

const _saveLastContent = (content) => {
    const expiredAt = new Date(2099, 1, 1);
    Storehouse.setItem(localStorageNamespace, localStorageKey, content, expiredAt);
    showAutosaveIndicator();
};

const showAutosaveIndicator = () => {
    const indicator = document.querySelector('#autosave-indicator');
    if (!indicator) return;
    indicator.textContent = '💾 Saving...';
    indicator.classList.add('saving');

    setTimeout(() => {
        indicator.textContent = '✓ Saved';
        indicator.classList.remove('saving');
    }, 500);
};

const loadScrollBarSettings = () => {
    const lastContent = Storehouse.getItem(localStorageNamespace, localStorageScrollBarKey);
    return lastContent;
};

const saveScrollBarSettings = (settings) => {
    const expiredAt = new Date(2099, 1, 1);
    Storehouse.setItem(localStorageNamespace, localStorageScrollBarKey, settings, expiredAt);
};

const loadCursorSyncSettings = () => {
    const lastContent = Storehouse.getItem(localStorageNamespace, localStorageCursorSyncKey);
    return lastContent;
};

const saveCursorSyncSettings = (settings) => {
    const expiredAt = new Date(2099, 1, 1);
    Storehouse.setItem(localStorageNamespace, localStorageCursorSyncKey, settings, expiredAt);
};

const loadDarkModeSettings = () => {
    const lastSettings = Storehouse.getItem(localStorageNamespace, localStorageDarkModeKey);
    return lastSettings;
};

const saveDarkModeSettings = (settings) => {
    const expiredAt = new Date(2099, 1, 1);
    Storehouse.setItem(localStorageNamespace, localStorageDarkModeKey, settings, expiredAt);
};

// ----- Image Store Persistence (LRU + tab-close cleanup) -----

const loadImageStore = () => {
    const saved = Storehouse.getItem(localStorageNamespace, localStorageImagesKey);
    if (saved && typeof saved === 'object') {
        // Load via LRU setter so oversized stores are trimmed on boot
        Object.entries(saved).forEach(([key, value]) => {
            imageStoreSet(key, value);
        });
    }
};

const saveImageStore = () => {
    const expiredAt = new Date(2099, 1, 1);
    const obj = Object.fromEntries(imageStore);
    Storehouse.setItem(localStorageNamespace, localStorageImagesKey, obj, expiredAt);
};

const resolveImageReferences = (text, forPreview = true) => {
    return text.replace(
        /markups-img:(img_\w+)/g,
        (match, imgId) => forPreview ? (imageStoreGet(imgId) || match) : match
    );
};

/**
 * Process images in the preview to prevent broken image layout shift (Issue #24).
 * CSS hides images by default via :not([data-loaded="true"]).
 * This function monitors load/error events and sets data-loaded="true" only
 * when an image successfully loads. Failed/invalid images stay hidden.
 * 
 * @param {HTMLElement} container - The preview container element
 */
const decodeImageState = (serialized) => {
    if (!serialized) return null;

    try {
        const decoded = decodeURIComponent(serialized);
        const parsed = JSON.parse(decoded);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (error) {
        console.warn('[Image preview] Failed to decode image state', error);
        return null;
    }
};

const parseImageAttributeBlock = (rawAttrs) => {
    const attrs = {};
    const pattern = /([A-Za-z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+))/g;
    let match;

    while ((match = pattern.exec(rawAttrs)) !== null) {
        const key = match[1].toLowerCase();
        const value = match[2] ?? match[3] ?? match[4] ?? '';
        attrs[key] = value;
    }

    return attrs;
};

const parseImageAttributes = (content) => {
    const result = [];
    const pattern = /!\[([^\]]*)\]\(([^)]+)\)\s*(\{([^}]+)\})?/g;
    let match;

    while ((match = pattern.exec(content)) !== null) {
        const markdownSrc = match[2];
        const attrs = { src: markdownSrc, alt: match[1], markdownSrc };

        if (match[4]) {
            const rawAttrs = parseImageAttributeBlock(match[4]);
            const decodedState = decodeImageState(rawAttrs['data-ir']);

            if (decodedState) {
                Object.assign(attrs, decodedState);
            } else {
                if (rawAttrs.width) {
                    const width = parseInt(rawAttrs.width, 10);
                    if (!Number.isNaN(width)) attrs.width = width;
                }

                if (rawAttrs.height) {
                    const height = parseInt(rawAttrs.height, 10);
                    if (!Number.isNaN(height)) attrs.height = height;
                }

                if (rawAttrs.align) {
                    attrs.align = rawAttrs.align;
                }

                if (rawAttrs.filter) {
                    attrs.filter = rawAttrs.filter;
                }

                if (rawAttrs.borderradius || rawAttrs['border-radius']) {
                    attrs.borderRadius = rawAttrs.borderradius || rawAttrs['border-radius'];
                }

                if (rawAttrs.boxshadow || rawAttrs['box-shadow']) {
                    attrs.boxShadow = rawAttrs.boxshadow || rawAttrs['box-shadow'];
                }

                if (rawAttrs.opacity) {
                    const opacity = parseFloat(rawAttrs.opacity);
                    if (!Number.isNaN(opacity)) attrs.opacity = opacity;
                }

                if (rawAttrs.transform) {
                    attrs.transform = rawAttrs.transform;
                }
            }
        }

        // Never let decoded resize metadata overwrite the Markdown source URL.
        // Document Mode serialization depends on markups-img: staying intact.
        attrs.markdownSrc = markdownSrc;
        result.push(attrs);
    }

    return result;
};

const applySavedImageState = (img, state) => {
    if (!state) return;

    const width = parseInt(state.width, 10);
    if (!Number.isNaN(width) && width > 0) {
        img.style.width = `${width}px`;
    } else if (state.width === null || state.width === undefined || state.width === '') {
        img.style.width = '';
    }

    const height = parseInt(state.height, 10);
    if (!Number.isNaN(height) && height > 0) {
        img.style.height = `${height}px`;
    } else if (state.height === null || state.height === undefined || state.height === '') {
        img.style.height = '';
    }

    if (state.align) {
        img.setAttribute('align', state.align);
        img.style.display = 'block';
        switch (state.align) {
            case 'left':
                img.style.marginLeft = '0';
                img.style.marginRight = 'auto';
                break;
            case 'center':
                img.style.marginLeft = 'auto';
                img.style.marginRight = 'auto';
                break;
            case 'right':
                img.style.marginLeft = 'auto';
                img.style.marginRight = '0';
                break;
        }
    } else {
        img.removeAttribute('align');
        img.style.marginLeft = '';
        img.style.marginRight = '';
        img.style.display = '';
    }

    const styleProps = ['filter', 'borderRadius', 'boxShadow', 'opacity', 'transform'];
    styleProps.forEach((prop) => {
        const value = state[prop];
        if (value === null || value === undefined || value === '') {
            img.style[prop] = '';
            return;
        }
        if (prop === 'opacity') {
            const opacity = typeof value === 'number' ? value : parseFloat(value);
            img.style[prop] = Number.isNaN(opacity) ? '' : String(opacity);
            return;
        }
        img.style[prop] = String(value);
    });
};

const processPreviewImages = (container) => {
    const images = container.querySelectorAll('img');

    // Get markdown source to parse saved image state
    const editorContent = editor ? editor?.getValue() : '';
    const imageAttrsMap = parseImageAttributes(editorContent);
    const markdownImageSrcs = Array.from(editorContent.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)).map((m) => m[2]);

    images.forEach((img, index) => {
        const markdownAttrs = imageAttrsMap[index] || null;
        const domState = decodeImageState(img.getAttribute('data-ir'));
        const imageState = domState || markdownAttrs;
        const markdownSrc = markdownAttrs?.markdownSrc || markdownAttrs?.src || markdownImageSrcs[index] || '';

        // Always prefer stable Markdown refs (especially markups-img:) over the
        // resolved preview src. Document Mode serialization depends on this.
        if (markdownSrc) {
            img.dataset.originalSrc = markdownSrc;
            img.setAttribute('data-original-src', markdownSrc);
            img.dataset.irIndex = String(index);
        } else if (!img.dataset.originalSrc) {
            const currentSrc = img.getAttribute('src') || '';
            if (!currentSrc.startsWith('data:') && !currentSrc.startsWith('blob:')) {
                img.dataset.originalSrc = currentSrc;
                img.setAttribute('data-original-src', currentSrc);
            }
        }

        // Images start hidden via CSS (:not([data-loaded="true"]))
        // We only reveal them when they successfully load

        const onLoad = function () {
            this.setAttribute('data-loaded', 'true');

            // Apply saved dimensions and styling from markdown if available
            applySavedImageState(this, imageState);

            this.removeEventListener('load', onLoad);
            this.removeEventListener('error', onError);
        };

        const onError = function () {
            // Keep hidden on failure (CSS already hides, display:none is backup)
            this.style.display = 'none';
            this.removeEventListener('load', onLoad);
            this.removeEventListener('error', onError);
        };

        img.addEventListener('load', onLoad);
        img.addEventListener('error', onError);

        // Handle already-cached/loaded images (base64 data URLs load synchronously)
        if (img.complete) {
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                // Already loaded (e.g., base64 data URL) — reveal immediately
                img.setAttribute('data-loaded', 'true');
                // Apply saved dimensions and styling from markdown if available
                applySavedImageState(img, imageState);
            } else {
                // complete but no dimensions means it failed
                img.style.display = 'none';
            }
        }
    });
};

// ----- Find & Replace Button -----

let monacoFindControllerPromise = null;

const ensureMonacoFindController = () => {
    if (!monacoFindControllerPromise) {
        monacoFindControllerPromise = import('monaco-editor/esm/vs/editor/contrib/find/browser/findController.js');
    }
    return monacoFindControllerPromise;
};

const openFindReplace = async () => {
    if (!editor) return;

    try {
        // Monaco's find/replace contribution is useful but heavy. Load it only when
        // the user explicitly asks for find/replace instead of putting it in the
        // initial editor bundle.
        await ensureMonacoFindController();
        editor?.trigger('keyboard', 'editor.action.startFindReplaceAction', null);
    } catch (error) {
        console.warn('Find/replace controller failed to load; falling back to search overlay.', error);
        const searchOverlay = document.getElementById('search-overlay');
        const searchInput = document.getElementById('search-input');
        if (searchOverlay && searchInput) {
            searchOverlay.classList.remove('hidden');
            searchInput.focus();
            searchInput.select();
        }
    }
};

const setupFindReplaceButton = () => {
    const btn = document.getElementById('find-replace-btn');
    if (btn) {
        btn.addEventListener('click', () => {
            openFindReplace();
        });
    }

    // Keyboard shortcut Ctrl+Shift+H for Find & Replace
    trackedAddEventListener(document, 'keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
            e.preventDefault();
            openFindReplace();
        }
    });
};

// ----- URL Auto-Format on Paste + Toolbar Button -----

const extractDomain = (url) => {
    try {
        const parsed = new URL(url);
        return parsed.hostname.replace(/^www\./, '');
    } catch {
        return null;
    }
};

const setupURLAutoFormat = () => {
    // Auto-format URLs on paste
    const editorElement = document.querySelector('#editor');
    if (editorElement) {
        editorElement.addEventListener('paste', (e) => {
            const clipboardData = e.clipboardData || window.clipboardData;
            if (!clipboardData) return;

            // Check for images first (higher priority)
            const items = clipboardData.items;
            if (items) {
                for (const item of items) {
                    if (item.type.startsWith('image/')) {
                        return; // Let clipboard image paste handler deal with it
                    }
                }
            }

            const text = clipboardData.getData('text/plain');
            if (!text) return;

            // Check if the pasted text is a raw URL
            const urlRegex = /^https?:\/\/[^\s]+$/;
            if (urlRegex.test(text.trim())) {
                e.preventDefault();
                e.stopPropagation();
                const url = text.trim();
                const domain = extractDomain(url);
                const markdownLink = domain ? `[${domain}](${url})` : `[link](${url})`;

                const selection = editor?.getSelection();
                editor?.executeEdits('url-format', [{
                    range: selection,
                    text: markdownLink
                }]);
                editor?.focus();
                showToast('URL formatted as markdown link', 'success', 1500);
            }
        }, true);
    }
};

const setupURLToolbarButton = () => {
    const urlBtn = document.getElementById('toolbar-url');
    if (!urlBtn) return;

    urlBtn.addEventListener('click', () => {
        const selection = editor?.getSelection();
        const selectedText = editor?.getModel().getValueInRange(selection);

        // Check if selected text is a URL
        const urlRegex = /^https?:\/\/[^\s]+$/;
        if (selectedText && urlRegex.test(selectedText.trim())) {
            const url = selectedText.trim();
            const domain = extractDomain(url);
            const markdownLink = domain ? `[${domain}](${url})` : `[link](${url})`;
            editor?.executeEdits('url-format', [{
                range: selection,
                text: markdownLink
            }]);
            showToast('URL formatted', 'success', 1500);
        } else if (selectedText) {
            // Wrap selected text as link text with placeholder URL
            const markdownLink = `[${selectedText}](https://)`;
            editor?.executeEdits('url-format', [{
                range: selection,
                text: markdownLink
            }]);
        } else {
            // Insert link template
            const markdownLink = `[link text](https://url)`;
            editor?.executeEdits('url-format', [{
                range: selection,
                text: markdownLink
            }]);
        }
        editor?.focus();
    });
};

// ----- Paste Image from Clipboard (Ctrl+V) -----

const setupClipboardImagePaste = () => {
    const editorElement = document.querySelector('#editor');
    if (!editorElement) return;

    editorElement.addEventListener('paste', (e) => {
        const clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData || !clipboardData.items) return;

        for (const item of clipboardData.items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                e.stopPropagation();
                const file = item.getAsFile();
                if (file) {
                    processImageFile(file);
                    showToast('Image pasted from clipboard', 'success', 1500);
                }
                return;
            }
        }
    }, true);
};

// ----- Remember Last View Mode -----

const localStorageViewModeKey = 'view_mode';

const saveViewMode = (mode) => {
    const expiredAt = new Date(2099, 1, 1);
    Storehouse.setItem(localStorageNamespace, localStorageViewModeKey, mode, expiredAt);
};

const loadViewMode = () => {
    return Storehouse.getItem(localStorageNamespace, localStorageViewModeKey);
};

// ----- Drag-and-Drop Tab Reordering -----

let draggedTabId = null;

const setupDragDropTabs = () => {
    // Hook into renderTabs to add drag attributes after each render
    const originalRenderTabs = renderTabs;

    renderTabs = () => {
        originalRenderTabs();
        // Add drag attributes to all tabs
        const tabs = document.querySelectorAll('.header-tab');
        tabs.forEach(tab => {
            tab.setAttribute('draggable', 'true');

            tab.addEventListener('dragstart', (e) => {
                draggedTabId = tab.dataset.docId;
                tab.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            tab.addEventListener('dragend', () => {
                tab.classList.remove('dragging');
                draggedTabId = null;
                // Remove all drag-over indicators
                document.querySelectorAll('.header-tab.drag-over').forEach(t => t.classList.remove('drag-over'));
            });

            tab.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                tab.classList.add('drag-over');
            });

            tab.addEventListener('dragleave', () => {
                tab.classList.remove('drag-over');
            });

            tab.addEventListener('drop', (e) => {
                e.preventDefault();
                tab.classList.remove('drag-over');
                const targetDocId = tab.dataset.docId;

                if (draggedTabId && draggedTabId !== targetDocId) {
                    const fromIndex = documents.findIndex(d => d.id === draggedTabId);
                    const toIndex = documents.findIndex(d => d.id === targetDocId);

                    if (fromIndex !== -1 && toIndex !== -1) {
                        // Reorder documents array
                        const [moved] = documents.splice(fromIndex, 1);
                        documents.splice(toIndex, 0, moved);
                        saveDocsToStorage();
                        fileTreeStorage.reorderNode(moved.id, toIndex);
                        renderTabs();
                        showToast('Tab reordered', 'info', 1000);
                    }
                }
            });
        });
    };
};

// ----- Word Wrap Quick Toggle -----

const setupWordWrapToggle = () => {
    const btn = document.getElementById('word-wrap-toggle');
    if (!btn) return;

    let isWrapped = true; // Matches editor default wordWrap: 'on'

    btn.addEventListener('click', () => {
        isWrapped = !isWrapped;
        editor?.updateOptions({ wordWrap: isWrapped ? 'on' : 'off' });
        btn.querySelector('span').textContent = isWrapped ? 'Wrap: On' : 'Wrap: Off';
        showToast(isWrapped ? 'Word wrap enabled' : 'Word wrap disabled', 'info', 1000);
    });
};

// ----- Version History -----
// Inline helpers removed — use initVersionHistory() from features/version-history/index.js

// ----- Mobile Swipe Gestures -----
// Now handled by MobileUIManager in features/mobile/index.js
const setupMobileSwipeGestures = () => {
    // No-op: swipe gestures are handled by mobile module
};

// ----- Mobile UI Setup -----
// Now handled by MobileUIManager in features/mobile/index.js
const setupMobileUI = () => {
    // Expose tab data and functions globally for mobile module
    window.__markups_documents = documents;
    window.__markups_activeDocId = activeDocId;
    window.__markups_switchTab = switchTab;
    window.__markups_closeTab = closeTab;

    // Import and initialize mobile module
    import('./features/mobile/index.js').then(({ mobileUIManager }) => {
        mobileUIManager.initialize();
        // Expose for E2E tests and debug only — no runtime dependency
        if (typeof window !== 'undefined') {
            window.mobileUIManager = mobileUIManager;
        }

        // Apply mobile-specific Monaco settings
        if (mobileUIManager.isMobile() && editor) {
            editor?.updateOptions({
                minimap: { enabled: false },
                lineNumbers: 'off',
                folding: false,
                glyphMargin: false,
                lineDecorationsWidth: 0,
                lineNumbersMinChars: 0,
                overviewRulerLanes: 0,
                scrollbar: {
                    vertical: 'auto',
                    horizontal: 'hidden',
                    verticalScrollbarSize: 8,
                },
                wordWrap: 'on',
                fontSize: 15,
            });
            editor?.layout();
        }
    }).catch(err => {
        console.warn('Mobile module load error:', err);
    });
};

// Handle mobile drawer actions - now handled by mobile module
const _handleMobileDrawerAction = (_action) => { };

// Handle FAB actions - now handled by mobile module
const _handleFabAction = (_action) => { };

const setupDivider = () => {
    let lastLeftRatio = 0.5;
    const divider = document.getElementById('split-divider');
    const leftPane = document.getElementById('edit');
    const rightPane = document.getElementById('preview');
    const container = document.getElementById('container');

    if (!divider || !leftPane || !rightPane || !container) return;

    let isDragging = false;

    // Helper to calculate available width between panes (excluding divider).
    // NOTE: containerRect.width already reflects explorer width because explorer
    // lives inside the container, so we only subtract the divider here.
    const getAvailableWidth = () => {
        const containerRect = container.getBoundingClientRect();
        const dividerWidth = divider.offsetWidth || 8;
        return Math.max(0, containerRect.width - dividerWidth);
    };

    // Helper: get left sidebar offset, used only for coordinate translation.
    const _getOutlineOffset = () => {
        const explorer = document.getElementById('explorer-drawer');
        return explorer && explorer.classList.contains('open') ? explorer.offsetWidth : 0;
    };

    divider.addEventListener('mouseenter', () => {
        divider.classList.add('hover');
    });

    divider.addEventListener('mouseleave', () => {
        if (!isDragging) {
            divider.classList.remove('hover');
        }
    });

    divider.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        divider.classList.add('active');
        document.body.style.cursor = 'col-resize';
        document.body.classList.add('resizing');
    });

    divider.addEventListener('dblclick', () => {
        // Reset to 50/50 split
        const availableWidth = getAvailableWidth();
        const halfWidth = availableWidth / 2;
        leftPane.style.flex = 'none';
        rightPane.style.flex = 'none';
        leftPane.style.width = halfWidth + 'px';
        rightPane.style.width = halfWidth + 'px';
        lastLeftRatio = 0.5;
        if (typeof modesManager !== 'undefined' && modesManager.setSplitRatio) {
            modesManager.setSplitRatio(50);
        }
    });

    const endDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        divider.classList.remove('active');
        divider.classList.remove('hover');
        document.body.style.cursor = 'default';
        document.body.classList.remove('resizing');

        // Persist ratio so it survives reload and stays in sync with modesManager.
        try {
            const availableWidth = getAvailableWidth();
            const ratio = availableWidth > 0 ? parseFloat(leftPane.style.width) / availableWidth : 0.5;
            if (Number.isFinite(ratio) && ratio > 0 && ratio < 1) {
                lastLeftRatio = ratio;
                if (typeof modesManager !== 'undefined' && modesManager.setSplitRatio) {
                    modesManager.setSplitRatio(Math.round(ratio * 100));
                }
            }
        } catch {
            // ignore persistence errors
        }
    };

    divider.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        divider.classList.add('active');
        document.body.style.cursor = 'col-resize';
        document.body.classList.add('resizing');
    });

    divider.addEventListener('touchstart', (e) => {
        if (!e.touches || e.touches.length === 0) return;
        isDragging = true;
        divider.classList.add('active');
        document.body.style.cursor = 'col-resize';
        document.body.classList.add('resizing');
    }, { passive: true });

    const applyDrag = (clientX) => {
        if (!isDragging) return;
        const containerRect = container.getBoundingClientRect();
        const availableWidth = getAvailableWidth();

        const offsetX = clientX - containerRect.left;
        const minWidth = 200;
        const maxWidth = availableWidth - minWidth;
        const leftWidth = Math.max(minWidth, Math.min(offsetX, maxWidth));
        const rightWidth = availableWidth - leftWidth;

        leftPane.style.flex = 'none';
        rightPane.style.flex = 'none';
        leftPane.style.width = leftWidth + 'px';
        rightPane.style.width = rightWidth + 'px';

        lastLeftRatio = leftWidth / availableWidth;
    };

    trackedAddEventListener(document, 'mousemove', (e) => {
        applyDrag(e.clientX);
    });

    trackedAddEventListener(document, 'touchmove', (e) => {
        if (!isDragging || !e.touches || e.touches.length === 0) return;
        applyDrag(e.touches[0].clientX);
    }, { passive: true });

    trackedAddEventListener(document, 'mouseup', endDrag);
    trackedAddEventListener(document, 'touchend', endDrag);
    trackedAddEventListener(document, 'touchcancel', endDrag);

    trackedAddEventListener(window, 'resize', () => {
        if (isDragging) return; // Don't resize during drag
        // Only resize in split mode
        if (!document.body.classList.contains('view-split')) return;

        const availableWidth = getAvailableWidth();
        if (availableWidth <= 0) return;

        const newLeft = availableWidth * lastLeftRatio;
        const newRight = availableWidth * (1 - lastLeftRatio);

        leftPane.style.flex = 'none';
        rightPane.style.flex = 'none';
        leftPane.style.width = newLeft + 'px';
        rightPane.style.width = newRight + 'px';
    });

    // Initialize with 50/50 split - only if in split mode
    setTimeout(() => {
        // Only set dimensions if in split mode
        if (!document.body.classList.contains('view-split')) return;

        const availableWidth = getAvailableWidth();
        if (availableWidth > 0) {
            const halfWidth = availableWidth / 2;
            leftPane.style.flex = 'none';
            rightPane.style.flex = 'none';
            leftPane.style.width = halfWidth + 'px';
            rightPane.style.width = halfWidth + 'px';
        }
    }, 100);
};

// ----- Global Escape Key Handler -----
const setupGlobalEscapeKey = () => {
    trackedAddEventListener(document, 'keydown', (e) => {
        if (e.key === 'Escape') {
            let closed = false;

            // Close all modals
            const modals = [
                { modal: '#stats-modal', overlay: '#stats-modal-overlay' },
                { modal: '#help-modal', overlay: '#help-modal-overlay' },
                { modal: '#goals-modal', overlay: '#goals-modal-overlay' },
                { modal: '#templates-modal', overlay: '#templates-modal-overlay' },
                { modal: '#settings-modal', overlay: '#settings-modal-overlay' }
            ];

            modals.forEach(({ modal, overlay }) => {
                const modalEl = document.querySelector(modal);
                const overlayEl = document.querySelector(overlay);
                if (modalEl && modalEl.style.display === 'block') {
                    modalEl.style.display = 'none';
                    if (overlayEl) overlayEl.style.display = 'none';
                    closed = true;
                }
            });

            // Close floating panels
            const panels = ['#lint-panel', '#toc-panel', '#snippets-dropdown', '#toolbar-overflow-sheet', '#callout-dropdown-sheet'];
            panels.forEach(panelId => {
                const panel = document.querySelector(panelId);
                if (panel && !panel.classList.contains('hidden')) {
                    panel.classList.add('hidden');
                    // Also update button active state
                    if (panelId === '#lint-panel') {
                        document.querySelector('#lint-button')?.classList.remove('active');
                    }
                    closed = true;
                }
            });

            // Close search overlay
            const searchOverlay = document.querySelector('#search-overlay');
            if (searchOverlay && !searchOverlay.classList.contains('hidden')) {
                searchOverlay.classList.add('hidden');
                closed = true;
            }

            // Close mobile drawer
            const mobileDrawer = document.querySelector('#mobile-nav-drawer');
            const mobileOverlay = document.querySelector('#mobile-nav-overlay');
            if (mobileDrawer && mobileDrawer.classList.contains('open')) {
                mobileDrawer.classList.remove('open');
                mobileOverlay?.classList.remove('active');
                closed = true;
            }

            // Close export dropdown
            const exportDropdown = document.querySelector('#export-dropdown-wrapper');
            if (exportDropdown?.classList.contains('open')) {
                exportDropdown.classList.remove('open');
                closed = true;
            }

            if (closed) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    });
};

// ----- entry point -----
const initializeApp = async () => {
    // Define custom Monaco themes first
    defineCustomThemes();

    const lastContent = loadLastContent();
    loadImageStore(); // Load image store before editor setup so convert() can resolve refs
    editor = setupEditor();
    if (typeof window !== 'undefined') {
        window.editor = editor;
    }
    // Flush any actions queued before the editor was ready (EDITOR_READY)
    if (pendingEditorActions.length) {
        const queued = pendingEditorActions;
        pendingEditorActions = [];
        queued.forEach((action) => {
            try { action(); } catch (err) { console.error('pendingEditorActions flush failed:', err); }
        });
    }
    if (lastContent) {
        presetValue(lastContent);
    } else {
        presetValue(defaultInput);
    }

    // Initialize UI components
    setupToolbar();
    if (document.getElementById('enhanced-toolbar')) {
        toolbarManager.initialize('#enhanced-toolbar', { render: false });
    }
    setupResetButton();
    setupCopyButton(editor);
    setupCopyHTMLButton();
    setupDownloadButton();
    setupExportPDFButton();
    setupAdditionalExportButtons();
    setupImportButton();
    setupImageUpload();
    setupHelpButton();
    setupUpdateNotice();
    setupStatsButton();
    setupTemplatesButton();
    setupSnippetsButton();
    setupCalloutDropdown();
    setupTOCButton();

    // Load and apply scroll sync settings BEFORE setting up the button
    // so the button reads the correct scrollBarSync value
    const scrollBarSettings = loadScrollBarSettings() ?? true;
    initScrollBarSync(scrollBarSettings);

    const cursorSyncSettings = loadCursorSyncSettings() ?? false;
    initCursorSync(cursorSyncSettings);

    setupScrollSyncButton();
    setupFocusMode();
    setupTypewriterButton();
    setupFullscreenButton();
    setupViewButtons();
    setupLivePreviewEdit();
    setupVideoControls();
    setupImageControls();
    await initTabs();
    pruneUnreferencedImages();
    window.addEventListener('pagehide', () => {
        for (const [key, value] of [...imageStore.entries()]) {
            if (typeof value === 'string' && value.startsWith('blob:')) {
                revokeImageStoreValue(value);
                imageStore.delete(key);
            }
        }
    });
    setupSearch();
    setupLinter();
    setupGoals();
    setupKeyboardShortcuts();
    setupGlobalEscapeKey();

    const themeSettings = loadThemeSettings() || 'vs';
    initThemeSelector(themeSettings);

    // Initialize split-view divider after modes/editor are ready.
    setupDivider();

    const darkModeSettings = loadDarkModeSettings() || false;
    initDarkMode(darkModeSettings);

    setupSettingsModal();
    setupMobileUI();
    setupExportModal();

    // New features
    setupFindReplaceButton();
    setupURLAutoFormat();
    setupURLToolbarButton();
    setupClipboardImagePaste();
    setupDragDropTabs();
    setupWordWrapToggle();
    // Version history (modular)
    initVersionHistory({
        editorInstance: editor,
        defaultContent: defaultInput,
        hasEdited
    });
    setupMobileSwipeGestures();

    // Restore saved view mode
    const savedViewMode = loadViewMode();
    if (savedViewMode && savedViewMode !== 'split') {
        setViewMode(savedViewMode);
    }

    // Initialize stats with current content
    updateStats(editor?.getValue());

    // Custom context menu
    appContextMenuManager.initialize();

    // Initialize image resize feature (lazy — keep off critical boot path)
    import('./features/image-resize/index.js')
        .then(({ initImageResize }) => initImageResize({ editor }))
        .catch((err) => console.warn('Image resize module load error:', err));
};

// ----- PWA Support -----

// Capture the install prompt event
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    // Show install button/prompt if needed

});

// Handle app installed
window.addEventListener('appinstalled', () => {

});

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {

                // Check for updates periodically (every 30 minutes)
                setInterval(() => {
                    registration.update();
                }, APP_CONFIG.SERVICE_WORKER_UPDATE_INTERVAL_MS);
            })
            .catch((_error) => {
            });
    });
}

window.addEventListener("load", () => {
    initializeApp().catch((error) => {
        console.error('Failed to initialize app:', error);
    });

    // Cleanup custom context menu on unload/reload to avoid duplicate listeners.
    window.addEventListener('pagehide', () => {
        try {
            appContextMenuManager.dispose();
        } catch {
            // ignore cleanup errors
        }
    });
});
