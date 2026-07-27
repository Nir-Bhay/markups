/**
 * Monaco Editor Workers Configuration
 * Sets up web workers for Monaco editor
 * @module core/editor/workers
 */

// Monaco Editor Worker Setup
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

/**
 * Configure Monaco environment with workers
 */
export function setupMonacoWorkers() {
    self.MonacoEnvironment = {
        getWorker() {
            return new editorWorker();
        }
    };
}

export default setupMonacoWorkers;
