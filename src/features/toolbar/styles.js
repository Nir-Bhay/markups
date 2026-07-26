/**
 * Toolbar injected CSS
 * @module features/toolbar/styles
 */

import { TABLE_MAX } from './constants.js';

export function injectToolbarStyles() {
    if (document.getElementById('tb-enhanced-styles')) return;

    const s = document.createElement('style');
    s.id = 'tb-enhanced-styles';
    s.textContent = `
    /* ── Toolbar Container ── */
    .tb-toolbar {
      display: flex;
      align-items: center;
      gap: 1px;
      padding: 4px 8px;
      background: var(--bg-secondary, #1e293b);
      border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.08));
      flex-wrap: wrap;
      min-height: 36px;
      user-select: none;
    }

    /* ── Buttons ── */
    .tb-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 30px;
      height: 28px;
      padding: 0 6px;
      background: transparent;
      border: none;
      border-radius: 5px;
      color: var(--text-secondary, #94a3b8);
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.12s, color 0.12s, transform 0.08s;
      position: relative;
      line-height: 1;
    }

    .tb-btn:hover {
      background: rgba(99, 102, 241, 0.12);
      color: var(--text-primary, #f1f5f9);
    }

    .tb-btn:active {
      transform: scale(0.92);
    }

    .tb-btn.active {
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
    }

    .tb-btn[data-has-dropdown]::after {
      content: '▾';
      font-size: 8px;
      margin-left: 2px;
      opacity: 0.5;
    }

    /* ── Tooltip ── */
    .tb-btn[data-tooltip]:hover::before {
      content: attr(data-tooltip);
      position: absolute;
      top: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.95);
      color: #e2e8f0;
      padding: 4px 8px;
      border-radius: 5px;
      font-size: 11px;
      white-space: nowrap;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 15002;
      border: 1px solid rgba(255,255,255,0.06);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    /* ── Divider ── */
    .tb-divider {
      width: 1px;
      height: 20px;
      background: var(--border-color, rgba(255,255,255,0.08));
      margin: 0 4px;
      flex-shrink: 0;
    }

    /* ── Popover Panel ── */
    .tb-popover {
      animation: tb-pop-in 0.15s ease;
    }

    @keyframes tb-pop-in {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .tb-panel {
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 10px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);
      padding: 6px;
      min-width: 160px;
      max-height: 380px;
      overflow-y: auto;
    }

    .tb-panel::-webkit-scrollbar { width: 5px; }
    .tb-panel::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.12);
      border-radius: 4px;
    }

    /* ── Dropdown Items ── */
    .tb-dd-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
      color: #e2e8f0;
      font-size: 12px;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      transition: background 0.1s;
      font-family: inherit;
    }

    .tb-dd-item:hover {
      background: rgba(99, 102, 241, 0.15);
    }

    .tb-dd-item .tb-dd-icon {
      width: 20px;
      text-align: center;
      flex-shrink: 0;
      font-size: 13px;
    }

    .tb-dd-item .tb-dd-shortcut {
      margin-left: auto;
      color: #64748b;
      font-size: 10px;
      font-family: monospace;
    }

    .tb-dd-sep {
      height: 1px;
      background: rgba(255,255,255,0.06);
      margin: 4px 8px;
    }

    .tb-dd-label {
      padding: 4px 10px;
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    /* ── Color Picker Panel ── */
    .tb-color-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 4px;
      padding: 8px;
    }

    .tb-color-swatch {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      border: 2px solid transparent;
      cursor: pointer;
      transition: transform 0.1s, border-color 0.1s;
    }

    .tb-color-swatch:hover {
      transform: scale(1.2);
      border-color: rgba(255,255,255,0.5);
    }

    .tb-color-section-label {
      padding: 6px 8px 2px;
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .tb-custom-color-row {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
    }

    .tb-custom-color-row input[type="color"] {
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      background: none;
      padding: 0;
    }

    .tb-custom-color-row input[type="text"] {
      flex: 1;
      padding: 4px 8px;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 5px;
      background: rgba(255,255,255,0.05);
      color: #e2e8f0;
      font-size: 12px;
      font-family: monospace;
      outline: none;
    }

    .tb-custom-color-row input[type="text"]:focus {
      border-color: #6366f1;
    }

    .tb-custom-color-row button {
      padding: 4px 10px;
      border-radius: 5px;
      border: none;
      background: #6366f1;
      color: #fff;
      font-size: 11px;
      cursor: pointer;
    }

    /* ── Emoji Panel ── */
    .tb-emoji-tabs {
      display: flex;
      gap: 2px;
      padding: 4px 6px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      overflow-x: auto;
    }

    .tb-emoji-tab {
      padding: 4px 8px;
      border-radius: 5px;
      border: none;
      background: transparent;
      color: #94a3b8;
      font-size: 11px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.1s;
    }

    .tb-emoji-tab:hover { background: rgba(255,255,255,0.06); }
    .tb-emoji-tab.active { background: rgba(99,102,241,0.2); color: #a5b4fc; }

    .tb-emoji-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 2px;
      padding: 6px;
      max-height: 200px;
      overflow-y: auto;
    }

    .tb-emoji-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      border-radius: 5px;
      font-size: 18px;
      cursor: pointer;
      transition: background 0.1s, transform 0.1s;
    }

    .tb-emoji-btn:hover {
      background: rgba(99,102,241,0.15);
      transform: scale(1.15);
    }

    .tb-emoji-search {
      width: 100%;
      padding: 6px 10px;
      border: none;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      background: transparent;
      color: #e2e8f0;
      font-size: 12px;
      outline: none;
      box-sizing: border-box;
    }

    .tb-emoji-search::placeholder { color: #475569; }

    /* ── Special Chars Panel ── */
    .tb-chars-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 2px;
      padding: 6px;
    }

    .tb-char-btn {
      width: 36px;
      height: 36px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      border-radius: 5px;
      cursor: pointer;
      transition: background 0.1s;
      color: #e2e8f0;
      gap: 1px;
    }

    .tb-char-btn:hover { background: rgba(99,102,241,0.15); }
    .tb-char-btn .char { font-size: 16px; }
    .tb-char-btn .name { font-size: 7px; color: #64748b; overflow: hidden; text-overflow: ellipsis; max-width: 34px; }

    /* ── Table Picker Grid ── */
    .tb-table-picker {
      padding: 8px;
    }

    .tb-table-grid {
      display: grid;
      grid-template-columns: repeat(${TABLE_MAX}, 1fr);
      gap: 2px;
    }

    .tb-table-cell {
      width: 18px;
      height: 18px;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 2px;
      cursor: pointer;
      transition: background 0.08s, border-color 0.08s;
    }

    .tb-table-cell.active {
      background: rgba(99, 102, 241, 0.4);
      border-color: #6366f1;
    }

    .tb-table-label {
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      padding-top: 6px;
      font-family: monospace;
    }

    /* ── Snippet Panel ── */
    .tb-snippet-panel {
      min-width: 240px;
    }

    .tb-snippet-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
      color: #e2e8f0;
      font-size: 12px;
      transition: background 0.1s;
    }

    .tb-snippet-item:hover { background: rgba(99,102,241,0.15); }

    .tb-snippet-item .snippet-name { flex: 1; }
    .tb-snippet-item .snippet-del {
      opacity: 0;
      color: #ef4444;
      cursor: pointer;
      padding: 2px;
      transition: opacity 0.1s;
    }
    .tb-snippet-item:hover .snippet-del { opacity: 0.7; }
    .tb-snippet-item .snippet-del:hover { opacity: 1; }

    .tb-snippet-add-row {
      display: flex;
      gap: 4px;
      padding: 6px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }

    .tb-snippet-add-row input {
      flex: 1;
      padding: 4px 8px;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 5px;
      background: rgba(255,255,255,0.05);
      color: #e2e8f0;
      font-size: 11px;
      outline: none;
    }

    .tb-snippet-add-row input:focus { border-color: #6366f1; }

    .tb-snippet-add-row button {
      padding: 4px 10px;
      border-radius: 5px;
      border: none;
      background: #6366f1;
      color: #fff;
      font-size: 11px;
      cursor: pointer;
    }

    /* ── Word Count Badge ── */
    .tb-wc-panel {
      padding: 12px 16px;
      min-width: 180px;
    }

    .tb-wc-panel table { width: 100%; border-collapse: collapse; }
    .tb-wc-panel td {
      padding: 3px 0;
      font-size: 12px;
      color: #94a3b8;
    }
    .tb-wc-panel td:first-child { font-weight: 600; color: #cbd5e1; }
    .tb-wc-panel td:last-child { text-align: right; color: #e2e8f0; font-family: monospace; }

    /* ── Settings Panel ── */
    .tb-settings-panel {
      min-width: 220px;
      max-height: 350px;
      overflow-y: auto;
    }

    .tb-settings-panel .tb-setting-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 12px;
      color: #e2e8f0;
      cursor: pointer;
      transition: background 0.1s;
    }

    .tb-settings-panel .tb-setting-item:hover {
      background: rgba(255,255,255,0.04);
    }

    .tb-settings-panel .tb-setting-check {
      width: 16px;
      text-align: center;
      color: #22c55e;
    }

    .tb-settings-panel .tb-setting-label { flex: 1; }

    /* ── Group wrapper ── */
    .tb-group {
      display: inline-flex;
      align-items: center;
      gap: 1px;
    }
  `;
    document.head.appendChild(s);
}
