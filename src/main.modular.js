/**
 * Markdown Live Preview — Modular entry point
 *
 * This file is the modular drop-in for src/main.js. It sets up the global
 * editor/prism/mermaid/CSS environment that main.js does, then delegates the
 * rest of the application lifecycle to src/app.js. All `marked.use(...)`
 * calls live in src/core/markdown/index.js so we don't double-register
 * extensions when both main.js and the modular app initialise markdown.
 *
 * To switch the production bundle to the modular app, change
 * `index.html` line 141 from `/src/main.js` to `/src/main.modular.js` and
 * set `MARKUPS_ENTRY=modular` (or `vite build --mode modular`).
 *
 * @module main.modular
 */

// ============================================================
// Monaco Editor Worker Setup
// ============================================================
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

self.MonacoEnvironment = {
    getWorker() {
        return new editorWorker();
    }
};

// ============================================================
// Prism syntax highlighting
// ============================================================
import Prism from 'prismjs';

import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-ini';

import 'prismjs/themes/prism-tomorrow.css';

// Issue #42: prism-markup already covers XML; keep explicit aliases for fences.
Prism.languages.xml = Prism.languages.markup;
Prism.languages.XML = Prism.languages.markup;
Prism.languages.svg = Prism.languages.svg || Prism.languages.markup;
Prism.languages.html = Prism.languages.html || Prism.languages.markup;

// ============================================================
// Mermaid for diagrams
// markdownService.initialize() also calls mermaid.initialize(); running it
// here is harmless because the second call only re-applies options.
// ============================================================
import mermaid from 'mermaid';
mermaid.initialize({ startOnLoad: false, theme: 'default', suppressErrors: true });

// ============================================================
// KaTeX CSS
// ============================================================
import 'katex/dist/katex.min.css';

// ============================================================
// Global styles
// ============================================================
import 'github-markdown-css/github-markdown-light.css';

// ============================================================
// Application entry
// All marked extensions (KaTeX, alerts, footnotes, emoji, prism highlight)
// are registered inside src/core/markdown/index.js → markdownService.initialize(),
// which app.initialize() calls. Do NOT re-register them here.
// ============================================================

import { app } from './app.js';

function onReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

onReady(async () => {
    try {
        await app.initialize({
            containers: {
                editor: '#editor',
                preview: '#output',
                main: '.main-container',
                toolbar: '.toolbar-container',
                tabs: '.tabs-container',
                stats: '.stats-container',
                toc: '.toc-panel',
                search: '.search-panel',
                linter: '.linter-panel',
                templates: '.templates-panel',
                snippets: '.snippets-panel',
                goals: '.goals-container'
            }
        });

        // Expose app to window for debugging
        if (import.meta.env.DEV) {
            window.app = app;
            window.mdPreview = {
                app,
                editor: () => import('./core/editor/index.js'),
                markdown: () => import('./core/markdown/index.js'),
                eventBus: () => import('./utils/eventBus.js'),
                features: () => import('./features/index.js'),
                services: () => import('./services/index.js'),
                ui: () => import('./ui/index.js')
            };
            console.log('📚 Dev mode: Access app via window.mdPreview');
        }
    } catch (error) {
        console.error('Failed to initialize application:', error);

        // Show error message
        const errorContainer = document.createElement('div');
        errorContainer.className = 'app-error';
        errorContainer.innerHTML = `
            <h1>Failed to Load</h1>
            <p>Something went wrong while loading the application.</p>
            <pre>${error.message}</pre>
            <button onclick="location.reload()">Reload</button>
        `;
        errorContainer.style.cssText = `
            position: fixed;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #1a1a1a;
            color: #fff;
            font-family: system-ui;
            text-align: center;
            padding: 20px;
        `;
        document.body.appendChild(errorContainer);
    }
});

export { app };
export default app;
