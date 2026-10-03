/**
 * Browser spell check for the Monaco markdown editor.
 * Monaco forces spellcheck="false" and the app menu swallows the native
 * context menu, so misspellings are marked with editor markers and
 * suggestions are offered from the app menu.
 */

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import Typo from 'typo-js';
import aff from './dict/en_US.aff?raw';
import dic from './dict/en_US.dic?raw';
import { collectSpellTargets } from './engine.js';

const OWNER = 'spellcheck';
const ENABLED_KEY = 'markups-spellcheck';
const ADDED_KEY = 'markups-spell-added';
const IGNORE_KEY = 'markups-spell-ignore';

let dictionary = null;
let loading = null;
let editorRef = null;
let timer = null;

function loadSet(key) {
    try {
        const raw = localStorage.getItem(key);
        return new Set(raw ? JSON.parse(raw) : []);
    } catch {
        return new Set();
    }
}

function saveSet(key, set) {
    localStorage.setItem(key, JSON.stringify([...set]));
}

export function isSpellcheckEnabled() {
    try {
        return localStorage.getItem(ENABLED_KEY) !== 'off';
    } catch {
        return true;
    }
}

export function loadDictionary() {
    if (dictionary) return Promise.resolve(dictionary);
    if (!loading) {
        loading = new Promise((resolve) => {
            const start = () => {
                dictionary = new Typo('en_US', aff, dic);
                resolve(dictionary);
            };
            if (typeof requestIdleCallback === 'function') {
                requestIdleCallback(start, { timeout: 1500 });
            } else {
                setTimeout(start, 0);
            }
        });
    }
    return loading;
}

function isKnown(word) {
    const lower = word.toLowerCase();
    if (loadSet(ADDED_KEY).has(lower) || loadSet(IGNORE_KEY).has(lower)) return true;
    if (!dictionary) return true;
    return dictionary.check(word) || dictionary.check(lower);
}

export function refreshSpellMarkers() {
    const editor = editorRef;
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;

    if (!dictionary || !isSpellcheckEnabled()) {
        monaco.editor.setModelMarkers(model, OWNER, []);
        return;
    }

    const ranges = editor.getVisibleRanges?.() || [];
    let start = 1;
    let end = model.getLineCount();
    if (ranges.length) {
        start = Math.max(1, ranges[0].startLineNumber - 40);
        end = Math.min(model.getLineCount(), ranges[ranges.length - 1].endLineNumber + 40);
    }

    const text = model.getValueInRange(new monaco.Range(start, 1, end, model.getLineMaxColumn(end)));
    const markers = [];
    for (const target of collectSpellTargets(text)) {
        if (isKnown(target.word)) continue;
        markers.push({
            severity: monaco.MarkerSeverity.Warning,
            message: `Possible spelling: ${target.word}`,
            startLineNumber: start + target.line - 1,
            startColumn: target.startColumn,
            endLineNumber: start + target.line - 1,
            endColumn: target.endColumn
        });
        if (markers.length >= 200) break;
    }
    monaco.editor.setModelMarkers(model, OWNER, markers);
}

function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
        loadDictionary().then(() => refreshSpellMarkers()).catch(() => {});
    }, 200);
}

export function setupSpellcheck(editor) {
    if (!editor) return;
    editorRef = editor;
    editor.onDidChangeModelContent(schedule);
    editor.onDidScrollChange?.(schedule);
    schedule();
    if (typeof window !== 'undefined') {
        window.__getSpellMarkers = () => monaco.editor.getModelMarkers({ owner: OWNER });
    }
}

function activeEditor() {
    return editorRef || (typeof window !== 'undefined' ? window.editor : null);
}

export function spellSuggestionsAtCursor() {
    const editor = activeEditor();
    if (!editor || !dictionary || !isSpellcheckEnabled()) return null;
    const model = editor.getModel();
    const position = editor.getPosition();
    if (!model || !position) return null;
    const hit = model.getWordAtPosition(position);
    if (!hit) return null;
    const word = hit.word.replace(/^'+|'+$/g, '');
    if (!/^[A-Za-z][A-Za-z']+$/.test(word) || word.length < 2) return null;
    if (isKnown(word)) return null;
    const suggestions = (dictionary.suggest(word) || []).slice(0, 5);
    return {
        word,
        suggestions,
        range: new monaco.Range(position.lineNumber, hit.startColumn, position.lineNumber, hit.endColumn)
    };
}

export function applySpellSuggestion(range, text) {
    const editor = activeEditor();
    if (!editor || !range) return;
    editor.executeEdits('spellcheck', [{
        range,
        text,
        forceMoveMarkers: true
    }]);
    editor.focus();
    schedule();
}

export function ignoreWord(word) {
    if (!word) return;
    const set = loadSet(IGNORE_KEY);
    set.add(word.toLowerCase());
    saveSet(IGNORE_KEY, set);
    refreshSpellMarkers();
}

export function addWord(word) {
    if (!word) return;
    const set = loadSet(ADDED_KEY);
    set.add(word.toLowerCase());
    saveSet(ADDED_KEY, set);
    refreshSpellMarkers();
}

export function toggleSpellcheck() {
    try {
        localStorage.setItem(ENABLED_KEY, isSpellcheckEnabled() ? 'off' : 'on');
    } catch {
        // ignore storage failures
    }
    refreshSpellMarkers();
}
