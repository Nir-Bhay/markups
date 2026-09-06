const FILE_ICON = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/></svg>`;
const FOLDER_ICON = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M.5 3A1.5 1.5 0 0 1 2 1.5h3.793c.2 0 .39.08.53.22l1.457 1.458A.75.75 0 0 0 8.31 3.5H14A1.5 1.5 0 0 1 15.5 5v7A1.5 1.5 0 0 1 14 13.5H2A1.5 1.5 0 0 1 .5 12V3z"/></svg>`;
const RENAME_ICON = `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M12.854.146a.5.5 0 0 1 .707 0l2.293 2.293a.5.5 0 0 1 0 .707l-9.5 9.5L4 13l.354-2.354 9.5-9.5zM3.5 13.5l2.25-.35L3.85 11.25 3.5 13.5z"/></svg>`;
const DELETE_ICON = `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M6.5 1a1 1 0 0 0-1 1V3H2.75a.75.75 0 0 0 0 1.5h.41l.73 9.3A2 2 0 0 0 5.88 15h4.24a2 2 0 0 0 1.99-1.2l.73-9.3h.41a.75.75 0 0 0 0-1.5H10.5V2a1 1 0 0 0-1-1h-3zm2.5 2h-2V2h2v1z"/></svg>`;

import { storageService } from '../../core/storage/index.js';
import { STORAGE_KEYS } from '../../core/storage/keys.js';

export class ExplorerManager {
    constructor(config) {
        this.config = config;
        this.nodes = [];
        this.selectedNodeId = null;
        this.selectedFolderId = 'root';
        this.expandedFolders = new Set(['root']);
        this.filterQuery = '';
        this.sortMode = 'manual';
        this.renamingNodeId = null;
        this.draggedNodeId = null;
        this.pendingDrop = null;

        this.minDrawerWidth = 210;
        this.maxDrawerWidth = 460;
        this.defaultDrawerWidth = 280;
        this.drawerWidthKey = 'com.markdownlivepreview.explorer_width';
        this.sortModeKey = 'com.markdownlivepreview.explorer_sort_mode';
    }

    initialize() {
        this.container = document.getElementById('explorer-tree');
        this.drawer = document.getElementById('explorer-drawer');
        this.toggleBtn = document.getElementById('explorer-toggle-btn');
        this.newFileBtn = document.getElementById('explorer-new-file-btn');
        this.newFolderBtn = document.getElementById('explorer-new-folder-btn');
        this.resizeHandle = document.getElementById('explorer-resize-handle');
        this.filterInput = document.getElementById('explorer-filter-input');
        this.sortSelect = document.getElementById('explorer-sort-select');
        this.contextMenu = document.getElementById('explorer-context-menu');

        this._boundToggle = () => this.toggleDrawer();
        this._boundNewFile = () => this.config.onCreateFile?.(this.selectedFolderId);
        this._boundNewFolder = (event) => {
            const targetFolderId = event.shiftKey ? this.getSelectedFolderId() : 'root';
            this.config.onCreateFolder?.(targetFolderId);
        };
        this._boundFilterInput = () => {
            this.filterQuery = this.filterInput.value.trim().toLowerCase();
            this.render();
        };
        this._boundSortChange = () => {
            this.sortMode = this.sortSelect.value || 'manual';
            storageService.set(STORAGE_KEYS.EXPLORER_SORT_MODE, this.sortMode);
            this.render();
        };
        this._boundTreeClick = (event) => this.onTreeClick(event);
        this._boundContextMenu = (event) => this.onContextMenu(event);
        this._boundDragStart = (event) => this.onDragStart(event);
        this._boundDragOver = (event) => this.onDragOver(event);
        this._boundDragLeave = (event) => this.onDragLeave(event);
        this._boundDrop = (event) => this.onDrop(event);
        this._boundDragEnd = () => this.clearDragState();
        this._boundDocumentClick = () => this.hideContextMenu();
        this._boundKeydown = (event) => {
            if (event.key === 'Shift') this.setFolderButtonShiftState(true);
            this.onGlobalKeydown(event);
        };
        this._boundKeyup = (event) => {
            if (event.key === 'Shift') this.setFolderButtonShiftState(false);
        };

        this.toggleBtn?.addEventListener('click', this._boundToggle);
        this.newFileBtn?.addEventListener('click', this._boundNewFile);
        this.newFolderBtn?.addEventListener('click', this._boundNewFolder);
        this.setFolderButtonShiftState(false);
        this.resizeHandle?.addEventListener('mousedown', (event) => this.startResize(event));

        this.filterInput?.addEventListener('input', this._boundFilterInput);

        this.sortMode = storageService.getString(STORAGE_KEYS.EXPLORER_SORT_MODE) ||
            localStorage.getItem(this.sortModeKey) || 'manual';
        if (this.sortSelect) this.sortSelect.value = this.sortMode;
        this.sortSelect?.addEventListener('change', this._boundSortChange);

        this.container?.addEventListener('click', this._boundTreeClick);
        this.container?.addEventListener('contextmenu', this._boundContextMenu);
        this.container?.addEventListener('dragstart', this._boundDragStart);
        this.container?.addEventListener('dragover', this._boundDragOver);
        this.container?.addEventListener('dragleave', this._boundDragLeave);
        this.container?.addEventListener('drop', this._boundDrop);
        this.container?.addEventListener('dragend', this._boundDragEnd);

        document.addEventListener('click', this._boundDocumentClick);
        document.addEventListener('keydown', this._boundKeydown);
        document.addEventListener('keyup', this._boundKeyup);

        this.applySavedWidth();
    }

    dispose() {
        if (this._disposed) return;
        this._disposed = true;

        this.toggleBtn?.removeEventListener('click', this._boundToggle);
        this.newFileBtn?.removeEventListener('click', this._boundNewFile);
        this.newFolderBtn?.removeEventListener('click', this._boundNewFolder);
        this.filterInput?.removeEventListener('input', this._boundFilterInput);
        this.sortSelect?.removeEventListener('change', this._boundSortChange);
        this.container?.removeEventListener('click', this._boundTreeClick);
        this.container?.removeEventListener('contextmenu', this._boundContextMenu);
        this.container?.removeEventListener('dragstart', this._boundDragStart);
        this.container?.removeEventListener('dragover', this._boundDragOver);
        this.container?.removeEventListener('dragleave', this._boundDragLeave);
        this.container?.removeEventListener('drop', this._boundDrop);
        this.container?.removeEventListener('dragend', this._boundDragEnd);
        document.removeEventListener('click', this._boundDocumentClick);
        document.removeEventListener('keydown', this._boundKeydown);
        document.removeEventListener('keyup', this._boundKeyup);

        if (this._boundMousemove) {
            document.removeEventListener('mousemove', this._boundMousemove);
            document.removeEventListener('mouseup', this._boundMouseup);
        }

        this.toggleBtn = null;
        this.newFileBtn = null;
        this.newFolderBtn = null;
        this.resizeHandle = null;
        this.filterInput = null;
        this.sortSelect = null;
        this.container = null;
        this.contextMenu = null;
        this.drawer = null;
        this._boundResize = null;
        this._boundMousemove = null;
        this._boundMouseup = null;
        this._boundKeydown = null;
        this._boundKeyup = null;
        this._boundDocumentClick = null;
        this._boundOverflowOutsideClick = null;
        this._boundOverflowResize = null;
        this._boundBreakpointResize = null;
    }

    setNodes(nodes) {
        this.nodes = Array.isArray(nodes) ? nodes : [];
        this.nodes.filter((n) => n.type === 'folder').forEach((folder) => this.expandedFolders.add(folder.id));
        this.render();
    }

    setSelection(nodeId) {
        this.selectedNodeId = nodeId;
        const node = this.nodes.find((item) => item.id === nodeId);
        if (node?.type === 'folder') {
            this.selectedFolderId = node.id;
        } else if (node) {
            this.selectedFolderId = node.parentId || 'root';
        }
        this.render();
    }

    getSelectedFolderId() {
        return this.selectedFolderId || 'root';
    }

    toggleDrawer(forceOpen) {
        if (!this.drawer) return;
        const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !this.drawer.classList.contains('open');
        this.drawer.classList.toggle('open', shouldOpen);
        this.toggleBtn?.classList.toggle('active', shouldOpen);
        if (shouldOpen) this.applySavedWidth();
        this.config.onLayoutChange?.();
    }

    clampWidth(width) {
        return Math.max(this.minDrawerWidth, Math.min(this.maxDrawerWidth, width));
    }

    getSavedWidth() {
        const stored = storageService.getNumber(STORAGE_KEYS.EXPLORER_DRAWER_WIDTH);
        const value = Number.isFinite(stored) ? stored : Number(localStorage.getItem(this.drawerWidthKey));
        return Number.isFinite(value) ? this.clampWidth(value) : this.defaultDrawerWidth;
    }

    setDrawerWidth(width, persist = true) {
        if (!this.drawer) return;
        const finalWidth = this.clampWidth(width);
        this.drawer.style.setProperty('--explorer-width', `${finalWidth}px`);
        this.updateCompactMode(finalWidth);
        if (persist) {
            storageService.set(STORAGE_KEYS.EXPLORER_DRAWER_WIDTH, finalWidth);
        }
    }

    applySavedWidth() {
        this.setDrawerWidth(this.getSavedWidth(), false);
    }

    updateCompactMode(width) {
        if (!this.drawer) return;
        this.drawer.classList.toggle('compact', width <= 250);
    }

    setFolderButtonShiftState(isShiftMode) {
        if (!this.newFolderBtn) return;
        this.newFolderBtn.classList.toggle('shift-mode', isShiftMode);
        this.newFolderBtn.title = isShiftMode
            ? 'Nested mode: click to create inside selected folder'
            : 'Root mode: click to create at explorer root (hold Shift for nested)';
    }

    startResize(event) {
        if (!this.drawer || !this.drawer.classList.contains('open')) return;
        event.preventDefault();
        const startX = event.clientX;
        const startWidth = this.drawer.getBoundingClientRect().width;
        this.drawer.classList.add('resizing');

        this._boundMousemove = (moveEvent) => {
            const delta = moveEvent.clientX - startX;
            this.setDrawerWidth(startWidth + delta, false);
            this.config.onLayoutChange?.();
        };

        this._boundMouseup = () => {
            const finalWidth = this.drawer.getBoundingClientRect().width;
            this.setDrawerWidth(finalWidth, true);
            this.drawer.classList.remove('resizing');
            document.removeEventListener('mousemove', this._boundMousemove);
            document.removeEventListener('mouseup', this._boundMouseup);
            this._boundMousemove = null;
            this._boundMouseup = null;
            this.config.onLayoutChange?.();
        };

        document.addEventListener('mousemove', this._boundMousemove);
        document.addEventListener('mouseup', this._boundMouseup);
    }

    onGlobalKeydown(event) {
        if (event.key !== 'F2') return;
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        const selected = this.nodes.find((node) => node.id === this.selectedNodeId);
        if (!selected || selected.id === 'root') return;
        event.preventDefault();
        this.startInlineRename(selected.id);
    }

    startInlineRename(nodeId) {
        this.renamingNodeId = nodeId;
        this.render();
        const input = this.container?.querySelector(`.explorer-rename-input[data-node-id="${nodeId}"]`);
        if (!input) return;
        input.focus();
        input.select();
    }

    async commitInlineRename(nodeId, newName) {
        const node = this.nodes.find((item) => item.id === nodeId);
        const trimmed = (newName || '').trim();
        this.renamingNodeId = null;
        this.render();
        if (!node || !trimmed) return;
        await this.config.onRenameNode?.(node, trimmed.replace(/\.md$/i, ''));
    }

    onTreeClick(event) {
        const row = event.target.closest('.explorer-node-row');
        if (!row) return;
        const nodeId = row.dataset.nodeId;
        const node = this.nodes.find((item) => item.id === nodeId);
        if (!node) return;

        if (event.target.closest('.explorer-node-twisty') && node.type === 'folder') {
            if (this.expandedFolders.has(node.id)) this.expandedFolders.delete(node.id);
            else this.expandedFolders.add(node.id);
            this.render();
            return;
        }

        if (event.target.closest('[data-action="rename"]')) {
            this.startInlineRename(node.id);
            return;
        }
        if (event.target.closest('[data-action="delete"]')) {
            this.config.onDeleteNode?.(node);
            return;
        }

        if (node.type === 'folder') {
            this.selectedNodeId = node.id;
            this.selectedFolderId = node.id;
            if (!this.expandedFolders.has(node.id)) this.expandedFolders.add(node.id);
            this.render();
            return;
        }

        this.selectedNodeId = node.id;
        this.selectedFolderId = node.parentId || 'root';
        this.config.onOpenFile?.(node.id);
        this.render();
    }

    onContextMenu(event) {
        const row = event.target.closest('.explorer-node-row');
        if (!row) return;
        event.preventDefault();
        const node = this.nodes.find((item) => item.id === row.dataset.nodeId);
        if (!node) return;
        this.selectedNodeId = node.id;
        this.selectedFolderId = node.type === 'folder' ? node.id : (node.parentId || 'root');
        this.showContextMenu(node, event.clientX, event.clientY);
        this.render();
    }

    showContextMenu(node, x, y) {
        if (!this.contextMenu) return;
        const folderId = node.type === 'folder' ? node.id : (node.parentId || 'root');
        const items = [
            { id: 'new-file', label: 'New File', action: () => this.config.onCreateFile?.(folderId) },
            { id: 'new-folder', label: 'New Folder', action: () => this.config.onCreateFolder?.(folderId) }
        ];
        if (node.id !== 'root') {
            items.push({ id: 'rename', label: 'Rename', action: () => this.startInlineRename(node.id) });
            items.push({ id: 'delete', label: 'Delete', action: () => this.config.onDeleteNode?.(node) });
        }

        this.contextMenu.innerHTML = items.map((item) =>
            `<button class="explorer-context-item" data-action="${item.id}" role="menuitem">${item.label}</button>`
        ).join('');

        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.classList.add('open');
        this.contextMenu.setAttribute('aria-hidden', 'false');
        this.contextMenu.onclick = (evt) => {
            const action = evt.target.closest('.explorer-context-item')?.dataset.action;
            const selected = items.find((item) => item.id === action);
            if (selected) selected.action();
            this.hideContextMenu();
        };
    }

    hideContextMenu() {
        if (!this.contextMenu) return;
        this.contextMenu.classList.remove('open');
        this.contextMenu.setAttribute('aria-hidden', 'true');
    }

    isDescendant(nodeId, potentialDescendantId) {
        let current = this.nodes.find((node) => node.id === potentialDescendantId);
        while (current && current.parentId) {
            if (current.parentId === nodeId) return true;
            current = this.nodes.find((node) => node.id === current.parentId);
        }
        return false;
    }

    onDragStart(event) {
        const row = event.target.closest('.explorer-node-row');
        if (!row) return;
        const nodeId = row.dataset.nodeId;
        if (!nodeId || nodeId === 'root') return;
        this.draggedNodeId = nodeId;
        row.classList.add('dragging');
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', nodeId);
        }
    }

    onDragOver(event) {
        if (!this.draggedNodeId) return;
        const row = event.target.closest('.explorer-node-row');
        if (!row) return;
        const targetNodeId = row.dataset.nodeId;
        if (!targetNodeId || targetNodeId === this.draggedNodeId) return;

        const dragged = this.nodes.find((node) => node.id === this.draggedNodeId);
        const target = this.nodes.find((node) => node.id === targetNodeId);
        if (!dragged || !target) return;

        if (dragged.type === 'folder' && this.isDescendant(dragged.id, target.id)) return;
        event.preventDefault();

        this.container?.querySelectorAll('.drop-before,.drop-after,.drop-inside')
            .forEach((el) => el.classList.remove('drop-before', 'drop-after', 'drop-inside'));

        let position = 'inside';
        if (target.type === 'file') {
            const rect = row.getBoundingClientRect();
            position = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
            row.classList.add(position === 'before' ? 'drop-before' : 'drop-after');
        } else {
            row.classList.add('drop-inside');
        }
        this.pendingDrop = { draggedNodeId: dragged.id, targetNodeId: target.id, position };
    }

    onDragLeave(event) {
        const row = event.target.closest('.explorer-node-row');
        if (!row) return;
        row.classList.remove('drop-before', 'drop-after', 'drop-inside');
    }

    async onDrop(event) {
        if (!this.pendingDrop) return;
        event.preventDefault();
        const dragged = this.nodes.find((node) => node.id === this.pendingDrop.draggedNodeId);
        const target = this.nodes.find((node) => node.id === this.pendingDrop.targetNodeId);
        if (!dragged || !target) {
            this.clearDragState();
            return;
        }
        await this.config.onMoveNode?.({
            draggedNode: dragged,
            targetNode: target,
            position: this.pendingDrop.position,
            sortMode: this.sortMode
        });
        this.clearDragState();
    }

    clearDragState() {
        this.draggedNodeId = null;
        this.pendingDrop = null;
        this.container?.querySelectorAll('.dragging,.drop-before,.drop-after,.drop-inside')
            .forEach((el) => el.classList.remove('dragging', 'drop-before', 'drop-after', 'drop-inside'));
    }

    sortChildren(children) {
        if (this.sortMode === 'name') {
            return [...children].sort((a, b) => a.name.localeCompare(b.name));
        }
        if (this.sortMode === 'updated') {
            return [...children].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        }
        return [...children].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    filterMatches(node) {
        if (!this.filterQuery) return true;
        const label = node.type === 'file' ? `${node.name}.md` : node.name;
        return label.toLowerCase().includes(this.filterQuery);
    }

    hasVisibleDescendant(nodeId) {
        const children = this.nodes.filter((node) => node.parentId === nodeId);
        return children.some((child) => this.filterMatches(child) || this.hasVisibleDescendant(child.id));
    }

    render() {
        if (!this.container) return;
        const treeHtml = this.buildTree('root', 0);
        this.container.innerHTML = treeHtml || '<div class="explorer-empty">No matching files.</div>';

        const renameInput = this.renamingNodeId
            ? this.container.querySelector(`.explorer-rename-input[data-node-id="${this.renamingNodeId}"]`)
            : null;
        if (renameInput) {
            renameInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    this.commitInlineRename(this.renamingNodeId, renameInput.value);
                } else if (event.key === 'Escape') {
                    event.preventDefault();
                    this.renamingNodeId = null;
                    this.render();
                }
            });
            renameInput.addEventListener('blur', () => this.commitInlineRename(this.renamingNodeId, renameInput.value));
            renameInput.focus();
            renameInput.select();
        }
    }

    buildTree(parentId, level) {
        const children = this.sortChildren(this.nodes.filter((node) => node.parentId === parentId));
        const visible = children.filter((node) => this.filterMatches(node) || this.hasVisibleDescendant(node.id));

        return visible.map((node) => {
            const selectedClass = this.selectedNodeId === node.id ? 'selected' : '';
            const isFolder = node.type === 'folder';
            const nodeLabel = isFolder ? node.name : `${node.name}.md`;
            const icon = isFolder ? FOLDER_ICON : FILE_ICON;
            const childCount = this.nodes.filter((item) => item.parentId === node.id).length;
            const expanded = this.expandedFolders.has(node.id);
            const twisty = isFolder
                ? `<button class="explorer-node-twisty" data-action="toggle-folder" aria-label="Toggle folder">${expanded ? '▼' : '▶'}</button>`
                : '<span class="explorer-node-twisty"></span>';
            const subtree = isFolder && expanded ? this.buildTree(node.id, level + 1) : '';
            const renameContent = this.renamingNodeId === node.id
                ? `<input class="explorer-rename-input" data-node-id="${node.id}" value="${node.name}" />`
                : `<span class="explorer-node-label">${nodeLabel}</span>`;

            return `
                <div class="explorer-node ${selectedClass}">
                    <div class="explorer-node-row ${selectedClass}" draggable="${node.id !== 'root' && (this.sortMode === 'manual' || isFolder)}" data-node-id="${node.id}" style="--explorer-level:${level}">
                        ${twisty}
                        <span class="explorer-node-icon">${icon}</span>
                        ${renameContent}
                        ${node.id !== 'root' ? `
                            <button class="explorer-node-action" data-action="rename" aria-label="Rename ${nodeLabel}" title="Rename">${RENAME_ICON}</button>
                            <button class="explorer-node-action" data-action="delete" aria-label="Delete ${nodeLabel}" title="Delete">${DELETE_ICON}</button>
                        ` : ''}
                    </div>
                    ${isFolder && childCount === 0 && expanded ? '<div class="explorer-node-empty"></div>' : ''}
                    ${subtree}
                </div>
            `;
        }).join('');
    }
}

export const createExplorerManager = (config) => new ExplorerManager(config);
