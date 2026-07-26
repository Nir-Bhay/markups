/**
 * Enhanced Toolbar Feature Module v2.0
 * Orchestrator — public API preserved for main.js / mobile / app.js
 * @module features/toolbar
 */

export { CALLOUT_TYPES } from './constants.js';
export {
  wrapSelection,
  wrapSelectionHtml,
  prefixLine,
  insertText,
  replaceSelection,
  getSelection,
  transformSelection,
  insertLink,
  insertImage,
  insertTable,
  getDateFormatted,
  generateLorem,
  resolveEditor,
} from './utils.js';
export { ToolbarManager } from './manager.js';
export { prefs as toolbarPrefs } from './preferences.js';
export { popover as toolbarPopover } from './popovers.js';
export { TOOLBAR_GROUPS } from './dropdowns.js';

import { ToolbarManager } from './manager.js';

/** Singleton toolbar manager */
export const toolbarManager = new ToolbarManager();

export default toolbarManager;
