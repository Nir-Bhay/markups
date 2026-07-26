/**
 * File Utilities
 * Helpers for file operations
 * @module utils/file
 */

import DOMPurify from 'dompurify';

/**
 * Validate image file signature (magic bytes) to prevent MIME spoofing.
 * SVG is text-based and must be sanitized separately.
 * @param {ArrayBuffer|ArrayBufferView} buffer - File contents (at least first 12 bytes)
 * @param {string} fileType - Declared MIME type
 * @returns {boolean} Whether the signature matches the declared type
 */
export function validateImageSignature(buffer, fileType) {
    if (!buffer || !fileType) return false;

    const arr = buffer instanceof ArrayBuffer
        ? new Uint8Array(buffer)
        : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    if (arr.length < 12 && fileType === 'image/webp') return false;
    if (arr.length < 4) return false;

    const hex = Array.from(arr.subarray(0, Math.min(12, arr.length)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    switch (fileType) {
        case 'image/jpeg':
            return hex.startsWith('ffd8ff');
        case 'image/png':
            return hex.startsWith('89504e47');
        case 'image/gif':
            return hex.startsWith('47494638');
        case 'image/webp':
            // RIFF....WEBP (bytes 0-3 RIFF, bytes 8-11 WEBP)
            return hex.startsWith('52494646') && hex.slice(16, 24) === '57454250';
        case 'image/svg+xml':
            return true; // validated via sanitizeSvgToDataUrl
        default:
            return false;
    }
}

/**
 * Sanitize SVG markup and return a safe data URL.
 * Strips script / foreignObject / event handlers (on*).
 * @param {string} svgText - Raw SVG text
 * @returns {string|null} data:image/svg+xml;base64,... or null if empty/unsafe after sanitize
 */
export function sanitizeSvgToDataUrl(svgText) {
    if (typeof svgText !== 'string' || !svgText.trim()) return null;

    const cleanSvg = DOMPurify.sanitize(svgText, {
        USE_PROFILES: { svg: true, svgFilters: true },
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'foreignObject', 'form'],
        // Explicit handlers — DOMPurify does not expand "on*" wildcards in FORBID_ATTR
        FORBID_ATTR: [
            'onerror', 'onload', 'onclick', 'ondblclick', 'onmouseover', 'onmouseout',
            'onfocus', 'onblur', 'onmouseenter', 'onmouseleave', 'onmousedown', 'onmouseup',
            'onmousemove', 'onkeydown', 'onkeyup', 'onkeypress', 'onchange', 'onsubmit',
            'onbegin', 'onend', 'onanimationstart', 'style', 'srcdoc'
        ],
        ALLOW_UNKNOWN_PROTOCOLS: false,
        ALLOW_DATA_ATTR: false
    });

    if (!cleanSvg || !cleanSvg.trim()) return null;

    // Defense-in-depth: strip residual on* attrs; require a real <svg> root
    const stripped = cleanSvg.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    if (/<script[\s>]/i.test(stripped) || !/<svg[\s>]/i.test(stripped)) {
        return null;
    }

    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(stripped)));
}

/**
 * Download content as file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Download as Markdown file
 * @param {string} content - Markdown content
 * @param {string} filename - File name (without extension)
 */
export function downloadMarkdown(content, filename = 'document') {
    downloadFile(content, `${filename}.md`, 'text/markdown');
}

/**
 * Download as HTML file
 * @param {string} content - HTML content
 * @param {string} filename - File name (without extension)
 */
export function downloadHTML(content, filename = 'document') {
    downloadFile(content, `${filename}.html`, 'text/html');
}

/**
 * Download as JSON file
 * @param {Object} data - JSON data
 * @param {string} filename - File name (without extension)
 */
export function downloadJSON(data, filename = 'data') {
    const content = JSON.stringify(data, null, 2);
    downloadFile(content, `${filename}.json`, 'application/json');
}

/**
 * Read file as text
 * @param {File} file - File object
 * @returns {Promise<string>} File content
 */
export function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Read file as Data URL
 * @param {File} file - File object
 * @returns {Promise<string>} Data URL
 */
export function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Read file as ArrayBuffer
 * @param {File} file - File object
 * @returns {Promise<ArrayBuffer>} Array buffer
 */
export function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Get file extension
 * @param {string} filename - File name
 * @returns {string} Extension (lowercase, without dot)
 */
export function getExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * Get file name without extension
 * @param {string} filename - File name
 * @returns {string} Name without extension
 */
export function getBaseName(filename) {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.slice(0, lastDot) : filename;
}

/**
 * Check if file is an image
 * @param {File} file - File object
 * @returns {boolean} Whether file is an image
 */
export function isImageFile(file) {
    return file.type.startsWith('image/');
}

/**
 * Check if file is a markdown file
 * @param {File} file - File object
 * @returns {boolean} Whether file is markdown
 */
export function isMarkdownFile(file) {
    const ext = getExtension(file.name);
    return ['md', 'markdown', 'mdown', 'mkdn', 'mkd'].includes(ext);
}

/**
 * Check if file is a text file
 * @param {File} file - File object
 * @returns {boolean} Whether file is text
 */
export function isTextFile(file) {
    return file.type.startsWith('text/') || isMarkdownFile(file);
}

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted size
 */
export function formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Validate file size
 * @param {File} file - File object
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {boolean} Whether file is within size limit
 */
export function validateFileSize(file, maxSizeMB) {
    const maxBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxBytes;
}

/**
 * Create file input and trigger click
 * @param {Object} options - Options
 * @param {string} options.accept - Accept attribute
 * @param {boolean} options.multiple - Allow multiple files
 * @returns {Promise<FileList>} Selected files
 */
export function selectFiles({ accept = '*', multiple = false } = {}) {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.multiple = multiple;
        input.style.display = 'none';

        input.addEventListener('change', () => {
            resolve(input.files);
            document.body.removeChild(input);
        });

        input.addEventListener('cancel', () => {
            resolve(null);
            document.body.removeChild(input);
        });

        document.body.appendChild(input);
        input.click();
    });
}

/**
 * Select markdown files
 * @returns {Promise<FileList>} Selected files
 */
export function selectMarkdownFile() {
    return selectFiles({ accept: '.md,.markdown,.txt' });
}

/**
 * Select image files
 * @param {boolean} multiple - Allow multiple
 * @returns {Promise<FileList>} Selected files
 */
export function selectImageFiles(multiple = false) {
    return selectFiles({ accept: 'image/*', multiple });
}

export default {
    downloadFile,
    downloadMarkdown,
    downloadHTML,
    downloadJSON,
    readFileAsText,
    readFileAsDataURL,
    readFileAsArrayBuffer,
    getExtension,
    getBaseName,
    isImageFile,
    isMarkdownFile,
    isTextFile,
    formatFileSize,
    validateFileSize,
    validateImageSignature,
    sanitizeSvgToDataUrl,
    selectFiles,
    selectMarkdownFile,
    selectImageFiles
};
