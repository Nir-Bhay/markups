/**
 * Enhanced Image Resize Feature v2.0
 * Orchestrator — public API preserved for main.js
 * @module features/image-resize
 */

import { ImageResizeManager } from './core.js';

export { CONFIG, SIZE_PRESETS } from './constants.js';
export { HistoryStack } from './history.js';
export { ToastManager, SnapGuides, toast } from './ui.js';
export { ImageResizeManager } from './core.js';

/** Singleton manager instance */
const imageResizeManager = new ImageResizeManager();

/**
 * Initialize the image resize feature
 * @param {Object} options - Configuration options
 * @param {Object} options.editor - Monaco editor instance
 */
export function initImageResize(options = {}) {
  imageResizeManager.initialize(options);
}

/**
 * Destroy image resize and clear listeners/timers
 */
export function disposeImageResize() {
  imageResizeManager.destroy();
}

/**
 * Get the image resize manager instance
 * @returns {ImageResizeManager}
 */
export function getImageResizeManager() {
  return imageResizeManager;
}

export default imageResizeManager;
