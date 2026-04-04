/**
 * Image Resize Feature
 * Allows users to resize images directly in the preview pane
 * 
 * @module features/image-resize
 */

/**
 * Image Resize Manager
 * Handles interactive image resizing in the markdown preview
 */
class ImageResizeManager {
    constructor() {
        this.initialized = false;
        this.activeImage = null;
        this.activeHandle = null;
        this.startX = 0;
        this.startY = 0;
        this.startWidth = 0;
        this.startHeight = 0;
        this.aspectRatio = 1;
        this.resizeOverlay = null;
        this.editor = null;
    }

    /**
     * Initialize the image resize feature
     * @param {Object} options - Configuration options
     * @param {Object} options.editor - Monaco editor instance
     */
    initialize(options = {}) {
        if (this.initialized) return;

        this.editor = options.editor || window.editor;
        
        // Create styles
        this._injectStyles();
        
        // Setup event listeners on preview container
        this._setupEventListeners();
        
        this.initialized = true;
        console.log('[ImageResize] Feature initialized');
    }

    /**
     * Inject CSS styles for resize handles
     * @private
     */
    _injectStyles() {
        if (document.getElementById('image-resize-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'image-resize-styles';
        styles.textContent = `
            /* Image resize container */
            .markdown-body img[data-loaded="true"] {
                cursor: pointer;
                transition: outline 0.15s ease;
            }

            .markdown-body img[data-loaded="true"]:hover {
                outline: 2px solid var(--primary-color, #6366f1);
                outline-offset: 2px;
            }

            .markdown-body img.image-resizing {
                outline: 2px solid var(--primary-color, #6366f1) !important;
                outline-offset: 2px;
            }

            /* Resize overlay */
            .image-resize-overlay {
                position: fixed;
                pointer-events: none;
                z-index: 10000;
                border: 2px dashed var(--primary-color, #6366f1);
                background: rgba(99, 102, 241, 0.1);
                border-radius: 4px;
            }

            /* Resize handles */
            .image-resize-handle {
                position: absolute;
                width: 12px;
                height: 12px;
                background: var(--primary-color, #6366f1);
                border: 2px solid white;
                border-radius: 2px;
                pointer-events: auto;
                z-index: 10001;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }

            .image-resize-handle:hover {
                transform: scale(1.2);
            }

            .image-resize-handle.nw { top: -6px; left: -6px; cursor: nw-resize; }
            .image-resize-handle.ne { top: -6px; right: -6px; cursor: ne-resize; }
            .image-resize-handle.sw { bottom: -6px; left: -6px; cursor: sw-resize; }
            .image-resize-handle.se { bottom: -6px; right: -6px; cursor: se-resize; }
            .image-resize-handle.n { top: -6px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
            .image-resize-handle.s { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
            .image-resize-handle.w { top: 50%; left: -6px; transform: translateY(-50%); cursor: w-resize; }
            .image-resize-handle.e { top: 50%; right: -6px; transform: translateY(-50%); cursor: e-resize; }

            /* Size indicator */
            .image-resize-info {
                position: absolute;
                bottom: -28px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--bg-primary, #1e293b);
                color: var(--text-primary, #f1f5f9);
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-family: monospace;
                white-space: nowrap;
                pointer-events: none;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                z-index: 10002;
            }

            /* Image toolbar */
            .image-toolbar {
                position: absolute;
                top: -40px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 4px;
                background: var(--bg-primary, #1e293b);
                padding: 6px 8px;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                pointer-events: auto;
                z-index: 10002;
            }

            .image-toolbar button {
                background: transparent;
                border: none;
                color: var(--text-primary, #f1f5f9);
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.15s;
            }

            .image-toolbar button:hover {
                background: rgba(255,255,255,0.1);
            }

            .image-toolbar button.active {
                background: var(--primary-color, #6366f1);
            }

            .image-toolbar .separator {
                width: 1px;
                background: rgba(255,255,255,0.2);
                margin: 0 4px;
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Setup event listeners
     * @private
     */
    _setupEventListeners() {
        const preview = document.getElementById('output');
        if (!preview) {
            console.warn('[ImageResize] Preview container #output not found');
            return;
        }

        // Click on image to select
        preview.addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG' && e.target.hasAttribute('data-loaded')) {
                e.preventDefault();
                e.stopPropagation();
                this._selectImage(e.target);
            }
        });

        // Click outside to deselect
        document.addEventListener('click', (e) => {
            if (this.activeImage && !e.target.closest('.image-resize-overlay') && e.target.tagName !== 'IMG') {
                this._deselectImage();
            }
        });

        // Handle mouse move and up for resizing
        document.addEventListener('mousemove', (e) => this._onMouseMove(e));
        document.addEventListener('mouseup', (e) => this._onMouseUp(e));

        // Touch support
        document.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this._onTouchEnd(e));

        // Escape to deselect
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeImage) {
                this._deselectImage();
            }
        });
    }

    /**
     * Select an image for resizing
     * @param {HTMLImageElement} img - The image element
     * @private
     */
    _selectImage(img) {
        // Deselect previous
        if (this.activeImage && this.activeImage !== img) {
            this._deselectImage();
        }

        this.activeImage = img;
        img.classList.add('image-resizing');

        // Create resize overlay
        this._createResizeOverlay(img);
    }

    /**
     * Deselect the active image
     * @private
     */
    _deselectImage() {
        if (this.activeImage) {
            this.activeImage.classList.remove('image-resizing');
            this.activeImage = null;
        }
        this._removeResizeOverlay();
    }

    /**
     * Create resize overlay with handles
     * @param {HTMLImageElement} img - The image element
     * @private
     */
    _createResizeOverlay(img) {
        this._removeResizeOverlay();

        const rect = img.getBoundingClientRect();
        
        const overlay = document.createElement('div');
        overlay.className = 'image-resize-overlay';
        overlay.style.cssText = `
            top: ${rect.top}px;
            left: ${rect.left}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
        `;

        // Add resize handles (corners and edges)
        const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'];
        handles.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `image-resize-handle ${pos}`;
            handle.dataset.handle = pos;
            handle.addEventListener('mousedown', (e) => this._onHandleMouseDown(e, pos));
            handle.addEventListener('touchstart', (e) => this._onHandleTouchStart(e, pos), { passive: false });
            overlay.appendChild(handle);
        });

        // Add size info
        const info = document.createElement('div');
        info.className = 'image-resize-info';
        info.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
        overlay.appendChild(info);

        // Add toolbar
        const toolbar = this._createToolbar(img);
        overlay.appendChild(toolbar);

        document.body.appendChild(overlay);
        this.resizeOverlay = overlay;
    }

    /**
     * Create image toolbar
     * @param {HTMLImageElement} img - The image element
     * @returns {HTMLElement} Toolbar element
     * @private
     */
    _createToolbar(img) {
        const toolbar = document.createElement('div');
        toolbar.className = 'image-toolbar';

        // Alignment buttons
        const alignments = [
            { icon: '◀', value: 'left', title: 'Align Left' },
            { icon: '◆', value: 'center', title: 'Center' },
            { icon: '▶', value: 'right', title: 'Align Right' }
        ];

        alignments.forEach(align => {
            const btn = document.createElement('button');
            btn.innerHTML = align.icon;
            btn.title = align.title;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._setAlignment(img, align.value);
            });
            toolbar.appendChild(btn);
        });

        // Separator
        const sep = document.createElement('div');
        sep.className = 'separator';
        toolbar.appendChild(sep);

        // Reset size button
        const resetBtn = document.createElement('button');
        resetBtn.innerHTML = '↺';
        resetBtn.title = 'Reset to Original Size';
        resetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._resetSize(img);
        });
        toolbar.appendChild(resetBtn);

        // 50% button
        const halfBtn = document.createElement('button');
        halfBtn.innerHTML = '50%';
        halfBtn.title = 'Set to 50% width';
        halfBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._setPercentWidth(img, 50);
        });
        toolbar.appendChild(halfBtn);

        // 100% button
        const fullBtn = document.createElement('button');
        fullBtn.innerHTML = '100%';
        fullBtn.title = 'Set to 100% width';
        fullBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._setPercentWidth(img, 100);
        });
        toolbar.appendChild(fullBtn);

        return toolbar;
    }

    /**
     * Remove resize overlay
     * @private
     */
    _removeResizeOverlay() {
        if (this.resizeOverlay) {
            this.resizeOverlay.remove();
            this.resizeOverlay = null;
        }
    }

    /**
     * Handle mouse down on resize handle
     * @param {MouseEvent} e - Mouse event
     * @param {string} handle - Handle position
     * @private
     */
    _onHandleMouseDown(e, handle) {
        e.preventDefault();
        e.stopPropagation();

        this.activeHandle = handle;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.startWidth = this.activeImage.offsetWidth;
        this.startHeight = this.activeImage.offsetHeight;
        this.aspectRatio = this.startWidth / this.startHeight;

        document.body.style.cursor = `${handle}-resize`;
        document.body.style.userSelect = 'none';
    }

    /**
     * Handle touch start on resize handle
     * @param {TouchEvent} e - Touch event
     * @param {string} handle - Handle position
     * @private
     */
    _onHandleTouchStart(e, handle) {
        e.preventDefault();
        const touch = e.touches[0];
        
        this.activeHandle = handle;
        this.startX = touch.clientX;
        this.startY = touch.clientY;
        this.startWidth = this.activeImage.offsetWidth;
        this.startHeight = this.activeImage.offsetHeight;
        this.aspectRatio = this.startWidth / this.startHeight;
    }

    /**
     * Handle mouse move during resize
     * @param {MouseEvent} e - Mouse event
     * @private
     */
    _onMouseMove(e) {
        if (!this.activeHandle || !this.activeImage) return;

        const deltaX = e.clientX - this.startX;
        const deltaY = e.clientY - this.startY;
        
        this._resize(deltaX, deltaY, e.shiftKey);
    }

    /**
     * Handle touch move during resize
     * @param {TouchEvent} e - Touch event
     * @private
     */
    _onTouchMove(e) {
        if (!this.activeHandle || !this.activeImage) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.startX;
        const deltaY = touch.clientY - this.startY;
        
        this._resize(deltaX, deltaY, false);
    }

    /**
     * Perform the resize
     * @param {number} deltaX - X delta
     * @param {number} deltaY - Y delta
     * @param {boolean} freeResize - If true, don't maintain aspect ratio
     * @private
     */
    _resize(deltaX, deltaY, freeResize) {
        let newWidth = this.startWidth;
        let newHeight = this.startHeight;

        const handle = this.activeHandle;

        // Calculate new dimensions based on handle
        if (handle.includes('e')) newWidth = this.startWidth + deltaX;
        if (handle.includes('w')) newWidth = this.startWidth - deltaX;
        if (handle.includes('s')) newHeight = this.startHeight + deltaY;
        if (handle.includes('n')) newHeight = this.startHeight - deltaY;

        // Maintain aspect ratio for corner handles (unless shift is held)
        if (!freeResize && (handle === 'nw' || handle === 'ne' || handle === 'sw' || handle === 'se')) {
            // Use the larger delta to determine size
            const widthDelta = Math.abs(newWidth - this.startWidth);
            const heightDelta = Math.abs(newHeight - this.startHeight);
            
            if (widthDelta > heightDelta) {
                newHeight = newWidth / this.aspectRatio;
            } else {
                newWidth = newHeight * this.aspectRatio;
            }
        }

        // Enforce minimum size
        newWidth = Math.max(50, newWidth);
        newHeight = Math.max(50, newHeight);

        // Apply to image
        this.activeImage.style.width = `${Math.round(newWidth)}px`;
        this.activeImage.style.height = `${Math.round(newHeight)}px`;

        // Update overlay
        this._updateOverlay(newWidth, newHeight);
    }

    /**
     * Update overlay position and size
     * @param {number} width - New width
     * @param {number} height - New height
     * @private
     */
    _updateOverlay(width, height) {
        if (!this.resizeOverlay || !this.activeImage) return;

        const rect = this.activeImage.getBoundingClientRect();
        
        this.resizeOverlay.style.top = `${rect.top}px`;
        this.resizeOverlay.style.left = `${rect.left}px`;
        this.resizeOverlay.style.width = `${width}px`;
        this.resizeOverlay.style.height = `${height}px`;

        // Update info
        const info = this.resizeOverlay.querySelector('.image-resize-info');
        if (info) {
            info.textContent = `${Math.round(width)} × ${Math.round(height)}`;
        }
    }

    /**
     * Handle mouse up (end resize)
     * @param {MouseEvent} e - Mouse event
     * @private
     */
    _onMouseUp(e) {
        if (this.activeHandle) {
            this._finishResize();
        }
    }

    /**
     * Handle touch end (end resize)
     * @param {TouchEvent} e - Touch event
     * @private
     */
    _onTouchEnd(e) {
        if (this.activeHandle) {
            this._finishResize();
        }
    }

    /**
     * Finish resize and update markdown
     * @private
     */
    _finishResize() {
        if (this.activeImage) {
            const width = Math.round(this.activeImage.offsetWidth);
            const height = Math.round(this.activeImage.offsetHeight);
            
            // Update markdown source
            this._updateMarkdownSource(this.activeImage, { width, height });
            
            // Refresh overlay position
            this._createResizeOverlay(this.activeImage);
        }

        this.activeHandle = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }

    /**
     * Set image alignment
     * @param {HTMLImageElement} img - Image element
     * @param {string} alignment - Alignment value (left, center, right)
     * @private
     */
    _setAlignment(img, alignment) {
        this._updateMarkdownSource(img, { align: alignment });
    }

    /**
     * Reset image to original size
     * @param {HTMLImageElement} img - Image element
     * @private
     */
    _resetSize(img) {
        img.style.width = '';
        img.style.height = '';
        this._updateMarkdownSource(img, { width: null, height: null });
        this._createResizeOverlay(img);
    }

    /**
     * Set image to percentage width
     * @param {HTMLImageElement} img - Image element
     * @param {number} percent - Percentage width
     * @private
     */
    _setPercentWidth(img, percent) {
        const container = img.closest('.markdown-body');
        if (container) {
            const containerWidth = container.clientWidth - 48; // Account for padding
            const newWidth = Math.round((containerWidth * percent) / 100);
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            const newHeight = Math.round(newWidth / aspectRatio);
            
            img.style.width = `${newWidth}px`;
            img.style.height = `${newHeight}px`;
            
            this._updateMarkdownSource(img, { width: newWidth, height: newHeight });
            this._createResizeOverlay(img);
        }
    }

    /**
     * Update the markdown source with new image attributes
     * @param {HTMLImageElement} img - Image element
     * @param {Object} attrs - Attributes to update
     * @private
     */
    _updateMarkdownSource(img, attrs) {
        if (!this.editor) {
            console.warn('[ImageResize] Editor not available');
            return;
        }

        // Get the original source reference from the image
        // The DOM src might be resolved base64, but we need the original markdown reference
        const domSrc = img.getAttribute('src') || '';
        const originalSrc = img.dataset.originalSrc || domSrc;
        
        // Get current editor content
        const content = this.editor.getValue();
        
        const { width, height, align } = attrs;
        
        let newContent = content;
        let found = false;

        // Strategy: Find images by looking for patterns that could match this image
        // We'll use multiple approaches since the DOM src might differ from source

        // 1. Try to find markups-img: pattern (internal image references)
        if (domSrc.startsWith('data:') || originalSrc.startsWith('markups-img:')) {
            // This is likely an uploaded image - find markups-img: patterns
            const markupsImgPattern = /!\[([^\]]*)\]\((markups-img:[^)]+)\)(\{[^}]*\})?/g;
            let matches = [...content.matchAll(markupsImgPattern)];
            
            if (matches.length > 0) {
                // Find the matching image by index in DOM
                const previewImages = document.querySelectorAll('#output img[data-loaded]');
                const imgIndex = Array.from(previewImages).indexOf(img);
                
                if (imgIndex >= 0 && imgIndex < matches.length) {
                    const match = matches[imgIndex];
                    found = true;
                    const altText = match[1];
                    const imgSrc = match[2];
                    const oldFull = match[0];
                    
                    let attrStr = this._buildAttrString(width, height, align);
                    const replacement = `![${altText}](${imgSrc})${attrStr}`;
                    newContent = content.replace(oldFull, replacement);
                }
            }
        }

        // 2. Try standard URL-based markdown patterns (non-base64)
        if (!found && !domSrc.startsWith('data:')) {
            // Safe to use regex for short URLs
            const escapedSrc = this._escapeRegex(domSrc);
            try {
                const mdPattern = new RegExp(
                    `!\\[([^\\]]*)\\]\\(${escapedSrc}\\)(\\{[^}]*\\})?`,
                    'g'
                );

                if (mdPattern.test(content)) {
                    found = true;
                    newContent = content.replace(new RegExp(mdPattern.source, 'g'), (match, altText) => {
                        let attrStr = this._buildAttrString(width, height, align);
                        return `![${altText}](${domSrc})${attrStr}`;
                    });
                }
            } catch (e) {
                console.warn('[ImageResize] Regex error for URL pattern:', e);
            }
        }

        // 3. Try HTML img pattern for short URLs
        if (!found && !domSrc.startsWith('data:') && domSrc.length < 500) {
            try {
                const escapedSrc = this._escapeRegex(domSrc);
                const htmlPattern = new RegExp(
                    `<img([^>]*)src=["']${escapedSrc}["']([^>]*)>`,
                    'gi'
                );

                if (htmlPattern.test(content)) {
                    found = true;
                    newContent = content.replace(new RegExp(htmlPattern.source, 'gi'), (match, before, after) => {
                        let result = match;
                        result = this._updateHtmlAttribute(result, 'width', width);
                        result = this._updateHtmlAttribute(result, 'height', height);
                        if (align) {
                            result = this._updateHtmlAttribute(result, 'align', align);
                        }
                        return result;
                    });
                }
            } catch (e) {
                console.warn('[ImageResize] Regex error for HTML pattern:', e);
            }
        }

        // 4. Fallback: Find by image index for any remaining cases
        if (!found) {
            const allMdImages = [...content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)(\{[^}]*\})?/g)];
            const previewImages = document.querySelectorAll('#output img[data-loaded]');
            const imgIndex = Array.from(previewImages).indexOf(img);
            
            if (imgIndex >= 0 && imgIndex < allMdImages.length) {
                const match = allMdImages[imgIndex];
                found = true;
                const altText = match[1];
                const imgSrc = match[2];
                const oldFull = match[0];
                
                let attrStr = this._buildAttrString(width, height, align);
                const replacement = `![${altText}](${imgSrc})${attrStr}`;
                newContent = content.replace(oldFull, replacement);
            }
        }

        // Update editor if changes were made
        if (found && newContent !== content) {
            // Preserve cursor position
            const position = this.editor.getPosition();
            const scrollTop = this.editor.getScrollTop();
            
            this.editor.setValue(newContent);
            
            // Restore cursor position and scroll
            if (position) {
                this.editor.setPosition(position);
            }
            this.editor.setScrollTop(scrollTop);
            
            console.log('[ImageResize] Markdown updated with new dimensions');
        } else if (!found) {
            console.warn('[ImageResize] Could not find image in markdown source');
        }
    }

    /**
     * Build attribute string for markdown images
     * @private
     */
    _buildAttrString(width, height, align) {
        let parts = [];
        if (width && height) {
            parts.push(`width=${width}`, `height=${height}`);
        }
        if (align) {
            parts.push(`align=${align}`);
        }
        return parts.length > 0 ? `{${parts.join(' ')}}` : '';
    }

    /**
     * Update or add an HTML attribute
     * @private
     */
    _updateHtmlAttribute(html, attr, value) {
        if (value === null) {
            // Remove attribute
            return html.replace(new RegExp(`\\s*${attr}=["'][^"']*["']`, 'gi'), '');
        }
        if (value) {
            const pattern = new RegExp(`${attr}=["'][^"']*["']`, 'gi');
            if (pattern.test(html)) {
                return html.replace(pattern, `${attr}="${value}"`);
            } else {
                return html.replace(/<img/i, `<img ${attr}="${value}"`);
            }
        }
        return html;
    }

    /**
     * Escape string for use in regex (only for short strings)
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     * @private
     */
    _escapeRegex(str) {
        if (!str || str.length > 1000) {
            return ''; // Don't try to escape very long strings
        }
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Cleanup and destroy the feature
     */
    destroy() {
        this._deselectImage();
        this.initialized = false;
    }
}

// Create singleton instance
const imageResizeManager = new ImageResizeManager();

/**
 * Initialize the image resize feature
 * @param {Object} options - Configuration options
 */
export function initImageResize(options = {}) {
    imageResizeManager.initialize(options);
}

/**
 * Get the image resize manager instance
 * @returns {ImageResizeManager} The manager instance
 */
export function getImageResizeManager() {
    return imageResizeManager;
}

export default imageResizeManager;
