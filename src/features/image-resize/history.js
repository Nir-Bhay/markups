/**
 * Undo/redo history stack for image resize
 * @module features/image-resize/history
 */

import { CONFIG } from './constants.js';

export class HistoryStack {
    constructor(limit = CONFIG.maxHistory) {
        this._stack = [];
        this._index = -1;
        this._limit = limit;
    }

    push(state) {
        // Remove any redo states ahead
        this._stack = this._stack.slice(0, this._index + 1);
        this._stack.push(JSON.parse(JSON.stringify(state)));
        if (this._stack.length > this._limit) {
            this._stack.shift();
        } else {
            this._index++;
        }
    }

    undo() {
        if (this._index <= 0) return null;
        this._index--;
        return JSON.parse(JSON.stringify(this._stack[this._index]));
    }

    redo() {
        if (this._index >= this._stack.length - 1) return null;
        this._index++;
        return JSON.parse(JSON.stringify(this._stack[this._index]));
    }

    get canUndo() { return this._index > 0; }
    get canRedo() { return this._index < this._stack.length - 1; }

    clear() {
        this._stack = [];
        this._index = -1;
    }
}
