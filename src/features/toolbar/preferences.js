/**
 * Toolbar user preferences (localStorage)
 * @module features/toolbar/preferences
 */

import { TOOLBAR_STORAGE_KEY } from './constants.js';

export class ToolbarPreferences {
    constructor() {
        this._prefs = this._load();
    }

    _load() {
        try {
            const raw = localStorage.getItem(TOOLBAR_STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    _save() {
        try {
            localStorage.setItem(TOOLBAR_STORAGE_KEY, JSON.stringify(this._prefs));
        } catch { /* ignore */ }
    }

    get(key, fallback = null) {
        return this._prefs[key] !== undefined ? this._prefs[key] : fallback;
    }

    set(key, value) {
        this._prefs[key] = value;
        this._save();
    }

    get recentColors() { return this.get('recentColors', []); }
    addRecentColor(hex) {
        let arr = this.recentColors.filter(c => c !== hex);
        arr.unshift(hex);
        if (arr.length > 8) arr = arr.slice(0, 8);
        this.set('recentColors', arr);
    }

    get recentEmojis() { return this.get('recentEmojis', []); }
    addRecentEmoji(emoji) {
        let arr = this.recentEmojis.filter(e => e !== emoji);
        arr.unshift(emoji);
        if (arr.length > 16) arr = arr.slice(0, 16);
        this.set('recentEmojis', arr);
    }

    get recentLanguages() { return this.get('recentLangs', []); }
    addRecentLanguage(lang) {
        let arr = this.recentLanguages.filter(l => l !== lang);
        arr.unshift(lang);
        if (arr.length > 5) arr = arr.slice(0, 5);
        this.set('recentLangs', arr);
    }

    get customSnippets() { return this.get('snippets', []); }
    saveSnippets(snippets) { this.set('snippets', snippets); }

    get hiddenButtons() { return this.get('hiddenButtons', []); }
    toggleButtonVisibility(id) {
        let arr = this.hiddenButtons;
        if (arr.includes(id)) {
            arr = arr.filter(x => x !== id);
        } else {
            arr.push(id);
        }
        this.set('hiddenButtons', arr);
    }
}

export const prefs = new ToolbarPreferences();
