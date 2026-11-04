/**
 * Markdown Live Preview — Experimental modular entry point
 *
 * This alternate boot path is used for architecture and parity checks. It is
 * not currently a production drop-in: the full shared browser suite exposes
 * feature gaps compared with src/main.js. Keep the deployed entry on main.js
 * until every required user workflow is implemented and verified here.
 *
 * It sets up editor/Prism/Mermaid/CSS globals and delegates lifecycle work to
 * src/app.js. All `marked.use(...)` calls live in src/core/markdown/index.js
 * so extensions are not registered twice.
 *
 * Build with `MARKUPS_ENTRY=modular` or `vite build --mode modular` only for
 * local parity validation; do not deploy this entry until the parity gate passes.
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
import { tabsManager } from './features/tabs/index.js';
import { mobileUIManager } from './features/mobile/index.js';

// The static page can become interactive before async IndexedDB hydration
// finishes. Do not accept a view click until its event handlers exist.
const startupViewControls = ['toolbar-preview-toggle', 'view-code', 'view-split', 'view-preview']
    .map(id => document.getElementById(id)).filter(Boolean);
startupViewControls.forEach(button => { button.disabled = true; });

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
                toolbar: '#toolbar',
                tabs: '#tabs-list',
                stats: '#stats-button',
                toc: '#toc-sidebar',
                search: '#search-overlay',
                linter: '#lint-button',
                templates: '#templates-button',
                // NOTE: no #snippets-button in index.html (only #snippets-dropdown);
                // manager resolves null and skips init. Toggle UX is a Phase 6 item.
                snippets: '#snippets-dropdown',
                goals: '#goals-button'
            }
        });
        startupViewControls.forEach(button => { button.disabled = false; });

        // Expose app to window for debugging
        if (import.meta.env.DEV) {
            window.app = app;
            // Match the production entry's dev diagnostics so the shared E2E
            // suite can exercise either boot path without production globals.
            window.editor = app.getEditor();
            window.mobileUIManager = mobileUIManager;
            Object.defineProperties(window, {
                __markups_documents: {
                    configurable: true,
                    get: () => tabsManager.getAllTabs()
                },
                __markups_activeDocId: {
                    configurable: true,
                    get: () => tabsManager.getActiveTab()?.id ?? null
                }
            });
            window.__markups_createFile = () => app.createFile();
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
        const heading = document.createElement('h1');
        heading.textContent = 'Failed to Load';
        const explanation = document.createElement('p');
        explanation.textContent = 'Something went wrong while loading the application.';
        const detail = document.createElement('pre');
        detail.textContent = error?.message || 'Unknown error';
        const reload = document.createElement('button');
        reload.textContent = 'Reload';
        reload.addEventListener('click', () => location.reload());
        errorContainer.append(heading, explanation, detail, reload);
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
