/**
 * Global Error Handler
 * Catches uncaught errors and unhandled rejections to prevent white screen
 * @module utils/errorHandler
 */

import { eventBus, EVENTS } from './eventBus.js';

/**
 * ErrorHandler — Global error catching and graceful degradation
 */
class ErrorHandler {
    static instance = null;

    constructor() {
        if (ErrorHandler.instance) {
            return ErrorHandler.instance;
        }

        /** @type {Array<{message: string, timestamp: number, stack?: string}>} */
        this._errorLog = [];

        /** @type {number} Max errors to keep in memory */
        this._maxErrors = 50;

        /** @type {boolean} */
        this._initialized = false;

        ErrorHandler.instance = this;
    }

    /**
     * Initialize global error handlers
     */
    initialize() {
        if (this._initialized) return;

        // Catch uncaught errors
        window.addEventListener('error', (event) => {
            this._handleError(event.error || event.message, 'uncaught');
            // Prevent default browser error handling (but don't suppress in dev)
            if (import.meta.env?.PROD) {
                event.preventDefault();
            }
        });

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this._handleError(event.reason, 'unhandled-rejection');
            if (import.meta.env?.PROD) {
                event.preventDefault();
            }
        });

        this._initialized = true;
        console.log('ErrorHandler: Initialized global error catching.');
    }

    /**
     * Handle an error
     * @param {Error|string} error
     * @param {string} [source='unknown'] - Where the error came from
     * @private
     */
    _handleError(error, source = 'unknown') {
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;

        // Log to console
        console.error(`[ErrorHandler:${source}]`, error);

        // Store in error log
        this._errorLog.push({
            message,
            stack,
            source,
            timestamp: Date.now()
        });

        // Trim log if too long
        if (this._errorLog.length > this._maxErrors) {
            this._errorLog = this._errorLog.slice(-this._maxErrors);
        }

        // Emit error event for toast/UI notification
        try {
            eventBus.emit(EVENTS.ERROR, {
                message: this._getUserFriendlyMessage(message),
                type: source,
                original: message
            });
        } catch {
            // EventBus itself failed — show fallback UI
            this._showFallbackError(message);
        }
    }

    /**
     * Convert technical error messages to user-friendly ones
     * @param {string} message
     * @returns {string}
     * @private
     */
    _getUserFriendlyMessage(message) {
        const lower = message.toLowerCase();

        if (lower.includes('quota') || lower.includes('storage')) {
            return 'Storage is full. Try deleting some notes to free up space.';
        }
        if (lower.includes('network') || lower.includes('fetch')) {
            return 'Network error. Please check your connection.';
        }
        if (lower.includes('indexeddb') || lower.includes('dexie')) {
            return 'Database error. Your data is safe — try refreshing the page.';
        }
        if (lower.includes('monaco') || lower.includes('editor')) {
            return 'Editor error. Try refreshing the page.';
        }

        return 'Something went wrong. Your data is safe.';
    }

    /**
     * Show a fallback error indicator when EventBus/toast system isn't available
     * @param {string} message
     * @private
     */
    _showFallbackError(message) {
        // Only show in DOM if the page isn't completely broken
        try {
            const existing = document.getElementById('markups-fallback-error');
            if (existing) existing.remove();

            const errorBar = document.createElement('div');
            errorBar.id = 'markups-fallback-error';
            errorBar.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
                background: #dc2626; color: white; padding: 12px 20px;
                font-family: system-ui, sans-serif; font-size: 14px;
                display: flex; justify-content: space-between; align-items: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            `;
            errorBar.innerHTML = `
                <span>⚠ Something went wrong. <button onclick="window.location.reload()" 
                    style="color:white;text-decoration:underline;background:none;border:none;cursor:pointer;font-size:14px">
                    Reload</button></span>
                <button onclick="this.parentElement.remove()" 
                    style="color:white;background:none;border:none;cursor:pointer;font-size:18px">✕</button>
            `;
            document.body.prepend(errorBar);

            // Auto-dismiss after 10 seconds
            setTimeout(() => errorBar?.remove(), 10000);
        } catch {
            // Truly catastrophic — nothing we can do
        }
    }

    /**
     * Get the error log (for debugging/settings display)
     * @returns {Array<{message: string, timestamp: number, stack?: string}>}
     */
    getErrorLog() {
        return [...this._errorLog];
    }

    /**
     * Clear the error log
     */
    clearErrorLog() {
        this._errorLog = [];
    }

    /**
     * Manually report an error (for try/catch blocks)
     * @param {Error|string} error
     * @param {string} [context] - Where the error occurred
     */
    report(error, context = 'manual') {
        this._handleError(error, context);
    }

    /**
     * Wrap a function with error handling
     * @template T
     * @param {() => T} fn - Function to wrap
     * @param {string} [context] - Error context
     * @param {T} [fallback] - Fallback return value on error
     * @returns {T}
     */
    safe(fn, context = 'safe-call', fallback = undefined) {
        try {
            return fn();
        } catch (error) {
            this._handleError(error, context);
            return fallback;
        }
    }

    /**
     * Wrap an async function with error handling
     * @template T
     * @param {() => Promise<T>} fn - Async function to wrap
     * @param {string} [context] - Error context
     * @param {T} [fallback] - Fallback return value on error
     * @returns {Promise<T>}
     */
    async safeAsync(fn, context = 'safe-async-call', fallback = undefined) {
        try {
            return await fn();
        } catch (error) {
            this._handleError(error, context);
            return fallback;
        }
    }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

export { ErrorHandler };

export default errorHandler;
