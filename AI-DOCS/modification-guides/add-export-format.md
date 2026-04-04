# 🔨 Modification Guide: Add a New Export Format

> Step-by-step guide for adding a new export format to Markups

## 📋 What You'll Create

A new export format (e.g., AsciiDoc, reStructuredText, LaTeX, etc.) that users can download from the Export modal.

---

## 📝 Step-by-Step Guide

### Step 1: Create Export Module

**File**: `src/services/export/myformat.js` (create new)

```javascript
/**
 * My Format Export Service
 * Exports markdown content to MyFormat
 */

import { toast } from '../../ui/index.js';

/**
 * Export content to MyFormat
 * @param {string} content - Markdown content
 * @param {string} title - Document title
 */
export async function exportToMyFormat(content, title = 'Untitled') {
  try {
    // Step 1: Convert markdown to your format
    const converted = convertToMyFormat(content);
    
    // Step 2: Create blob
    const blob = new Blob([converted], { 
      type: 'text/plain' // or your MIME type
    });
    
    // Step 3: Download
    downloadBlob(blob, `${sanitizeFilename(title)}.myext`);
    
    // Step 4: Show success message
    toast.success('Exported to MyFormat successfully!');
    
  } catch (error) {
    console.error('MyFormat export error:', error);
    toast.error('Failed to export to MyFormat');
  }
}

/**
 * Convert markdown to MyFormat
 * @param {string} markdown - Markdown content
 * @returns {string} Converted content
 */
function convertToMyFormat(markdown) {
  // Your conversion logic here
  let result = markdown;
  
  // Example conversions:
  // Headers
  result = result.replace(/^# (.*?)$/gm, '= $1 =');
  result = result.replace(/^## (.*?)$/gm, '== $1 ==');
  result = result.replace(/^### (.*?)$/gm, '=== $1 ===');
  
  // Bold
  result = result.replace(/\*\*(.*?)\*\*/g, '\'\'\'$1\'\'\'');
  
  // Italic
  result = result.replace(/\*(.*?)\*/g, '\'\'$1\'\'');
  
  // Code blocks
  result = result.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `[code lang="${lang || 'text'}"]\n${code}[/code]`;
  });
  
  // Links
  result = result.replace(/\[(.*?)\]\((.*?)\)/g, '[$2 $1]');
  
  // Add more conversions as needed
  
  return result;
}

/**
 * Download blob as file
 * @param {Blob} blob - File blob
 * @param {string} filename - Download filename
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Sanitize filename for download
 * @param {string} filename - Raw filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-z0-9\-_\.]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default { exportToMyFormat };
```

---

### Step 2: Register in Export Service

**File**: `src/services/export/index.js`
**Location**: Add import and export

```javascript
// Add import at top
import { exportToMyFormat } from './myformat.js';

// Add to exports
export {
  exportToPDF,
  exportToHTML,
  exportToMarkdown,
  exportToDOCX,
  exportToMyFormat,  // <- Add this
  initExport
};

// Update initExport function to add event listener
export function initExport() {
  // Existing code...
  
  // Add handler for your format
  const myFormatBtn = document.getElementById('export-myformat');
  if (myFormatBtn) {
    myFormatBtn.addEventListener('click', async () => {
      const content = window.editor.getValue();
      const title = getCurrentTabTitle(); // Implement this
      await exportToMyFormat(content, title);
      closeExportModal(); // Close modal after export
    });
  }
}
```

---

### Step 3: Add Button to Export Modal

**File**: `index.html`
**Location**: Around lines 1260-1450 (export modal section)

```html
<!-- Find the export-modal div and add your button -->
<div id="export-modal" class="modal">
  <div class="modal-content">
    <h2>Export Document</h2>
    
    <div class="export-options">
      <!-- Existing buttons (PDF, HTML, Markdown, DOCX) -->
      
      <!-- Add your button -->
      <button class="export-option-btn" id="export-myformat">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <!-- Your icon SVG path -->
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="12" y1="18" x2="12" y2="12"></line>
          <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
        <span class="export-label">MyFormat</span>
        <span class="export-desc">Export as .myext</span>
      </button>
    </div>
    
    <!-- Existing modal footer -->
  </div>
</div>
```

---

### Step 4: Add CSS Styling (Optional)

**File**: `public/css/premium-ui.css`
**Location**: Around lines 1260-1450 (export modal styles)

```css
/* Custom styling for your export button */
#export-myformat {
  /* Inherits from .export-option-btn */
}

/* Icon color */
#export-myformat svg {
  stroke: #f59e0b; /* Your color */
}

/* Hover effect */
#export-myformat:hover {
  border-color: #f59e0b;
}

#export-myformat:hover svg {
  stroke: #d97706;
}
```

---

## 🎨 Advanced: Using External Library

If your format requires a library (e.g., LaTeX conversion):

### Step 1: Install Library

```bash
npm install my-converter-library
```

### Step 2: Import in Module

```javascript
// src/services/export/myformat.js
import MyConverter from 'my-converter-library';

export async function exportToMyFormat(content, title) {
  try {
    // Use library
    const converter = new MyConverter();
    const converted = await converter.convert(content);
    
    // Create blob
    const blob = new Blob([converted], { type: 'application/myformat' });
    
    // Download
    downloadBlob(blob, `${sanitizeFilename(title)}.myext`);
    
    toast.success('Exported successfully!');
  } catch (error) {
    console.error('Export error:', error);
    toast.error('Export failed: ' + error.message);
  }
}
```

---

## 📋 Real Example: AsciiDoc Export

Complete working example:

### File: `src/services/export/asciidoc.js`

```javascript
/**
 * AsciiDoc Export Service
 */

import { toast } from '../../ui/index.js';

export async function exportToAsciiDoc(content, title = 'Untitled') {
  try {
    const asciidoc = convertMarkdownToAsciiDoc(content);
    const blob = new Blob([asciidoc], { type: 'text/plain' });
    downloadBlob(blob, `${sanitizeFilename(title)}.adoc`);
    toast.success('Exported to AsciiDoc!');
  } catch (error) {
    console.error('AsciiDoc export error:', error);
    toast.error('Failed to export to AsciiDoc');
  }
}

function convertMarkdownToAsciiDoc(markdown) {
  let adoc = markdown;
  
  // Document title (first # becomes = Document Title)
  adoc = adoc.replace(/^# (.+)$/m, '= $1\n:toc:\n:icons: font\n');
  
  // Headers
  adoc = adoc.replace(/^## (.+)$/gm, '== $1');
  adoc = adoc.replace(/^### (.+)$/gm, '=== $1');
  adoc = adoc.replace(/^#### (.+)$/gm, '==== $1');
  adoc = adoc.replace(/^##### (.+)$/gm, '===== $1');
  adoc = adoc.replace(/^###### (.+)$/gm, '====== $1');
  
  // Bold: **text** → *text*
  adoc = adoc.replace(/\*\*(.+?)\*\*/g, '*$1*');
  
  // Italic: *text* → _text_
  adoc = adoc.replace(/\*(.+?)\*/g, '_$1_');
  
  // Code: `code` → `code` (same)
  
  // Code blocks: ```lang\ncode\n``` → [source,lang]\n----\ncode\n----
  adoc = adoc.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `[source,${lang || 'text'}]\n----\n${code}----`;
  });
  
  // Links: [text](url) → link:url[text]
  adoc = adoc.replace(/\[(.+?)\]\((.+?)\)/g, 'link:$2[$1]');
  
  // Images: ![alt](url) → image::url[alt]
  adoc = adoc.replace(/!\[(.+?)\]\((.+?)\)/g, 'image::$2[$1]');
  
  // Lists: - item → * item
  adoc = adoc.replace(/^- (.+)$/gm, '* $1');
  
  // Ordered lists: 1. item → . item
  adoc = adoc.replace(/^\d+\. (.+)$/gm, '. $1');
  
  // Blockquotes: > text → [quote]\ntext
  adoc = adoc.replace(/^> (.+)$/gm, '[quote]\n____\n$1\n____');
  
  // Horizontal rules: --- → ''''
  adoc = adoc.replace(/^---$/gm, "''''");
  
  return adoc;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9\-_\.]/gi, '-').replace(/-+/g, '-');
}

export default { exportToAsciiDoc };
```

---

## ✅ Testing Checklist

- [ ] Button appears in export modal
- [ ] Click triggers export
- [ ] File downloads with correct extension
- [ ] Content is properly converted
- [ ] Success toast appears
- [ ] Error handling works
- [ ] Filename sanitization works
- [ ] Works with special characters
- [ ] Works with empty content
- [ ] Dark mode styling looks good

---

## 🐛 Common Issues

### Export button doesn't work
- Check if ID matches in HTML and JS
- Verify import in `export/index.js`
- Check browser console for errors

### File downloads but is empty
- Verify conversion function returns content
- Check blob type is correct
- Test conversion function separately

### Conversion is incorrect
- Test with simple markdown first
- Add console.log to see intermediate steps
- Use regex tester (regex101.com)

### Toast doesn't appear
- Verify toast is imported
- Check if toast container exists in DOM

---

## 🔗 Related Documentation

- **Export Service**: `AI-DOCS/features/export.md`
- **Modal System**: `AI-DOCS/features/modals.md`
- **Toast Notifications**: `AI-DOCS/features/toast.md`

---

**Last Updated**: 2026-04-04
