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
  clearMarkdownFormatting,
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
export {
  DIAGRAM_PRESETS,
  EXTRA_SLASH_COMMANDS,
  TOOLBAR_CUSTOMIZATION_GROUPS,
  TOOLBAR_HELP,
} from './catalog.js';
export {
  DENSITIES,
  applyToolbarDensity,
  initToolbarDensity,
  resetToolbarDensityForTests,
} from './density.js';
export { smartInsertLink, initPremiumToolbarChrome } from './chrome.js';

import { ToolbarManager } from './manager.js';
import { initPremiumToolbarChrome } from './chrome.js';

/** Singleton toolbar manager */
export const toolbarManager = new ToolbarManager();

const _initialize = toolbarManager.initialize.bind(toolbarManager);
toolbarManager.initialize = function initialize(container, options = {}) {
    _initialize(container, options);
    initPremiumToolbarChrome();
};

export default toolbarManager;
