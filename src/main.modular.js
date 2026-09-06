/**
 * Markdown Live Preview
 * Main entry point (modular)
 *
 * Feature-complete drop-in replacement for src/main.js.
 * @module main
 */

// ============================================================
// Monaco Editor Worker Setup
// ============================================================
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
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
import { markedHighlight } from 'marked-highlight';
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
// ============================================================
import mermaid from 'mermaid';
mermaid.initialize({ startOnLoad: false, theme: 'default', suppressErrors: true });

// ============================================================
// KaTeX for math
// ============================================================
import 'katex/dist/katex.min.css';
import markedKatex from 'marked-katex-extension';

// ============================================================
// Global styles
// ============================================================
import 'github-markdown-css/github-markdown-light.css';
import exportCss from './styles/export.css?raw';

// ============================================================
// Marked extensions
// ============================================================
import { marked } from 'marked';
import markedAlert from 'marked-alert';
import markedFootnote from 'marked-footnote';
import { markedEmoji } from 'marked-emoji';
import { emojiMarkedOptions } from './utils/emoji-shortcodes.js';

// Issue #42: normalize language ids (GitHub is case-insensitive; Prism keys are lowercase)
const PRISM_LANG_ALIASES = {
    htm: 'markup',
    xhtml: 'markup',
    xml: 'xml',
    svg: 'svg',
    html: 'markup',
    mathml: 'mathml',
    ssml: 'xml',
    atom: 'xml',
    rss: 'xml',
    sh: 'bash',
    py: 'python',
    yml: 'yaml',
    md: 'markdown',
    'c#': 'csharp',
    'c++': 'cpp',
    dockerfile: 'docker',
    text: 'plaintext',
    txt: 'plaintext'
};

function resolvePrismLanguage(lang) {
    if (!lang) return null;
    const normalized = String(lang).trim().toLowerCase();
    const aliased = PRISM_LANG_ALIASES[normalized] || normalized;
    if (Prism.languages[aliased]) return aliased;
    if (Prism.languages[normalized]) return normalized;
    return null;
}

// Configure marked with syntax highlighting
marked.use(markedHighlight({
    langPrefix: 'language-',
    highlight(code, lang) {
        const language = resolvePrismLanguage(lang);
        if (!language) return code;
        try {
            const grammar = Prism.languages[language];
            if (typeof grammar !== 'object') return code;
            return Prism.highlight(code, grammar, language);
        } catch (_e) {
            // Silently fall back for languages with missing dependencies
            return code;
        }
    }
}));

// Configure marked with KaTeX
marked.use(markedKatex({
    throwOnError: false,
    output: 'html' // or 'mathml'
}));

// Configure GFM Extensions
marked.use(markedAlert());
marked.use(markedFootnote());
// Emoji shortcode syntax (:smile:) for the preview (Issue #45)
marked.use(markedEmoji(emojiMarkedOptions));

// ============================================================
// Application entry
// ============================================================

import { app } from './app.js';

/**
 * DOM Ready handler
 */
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

// Export for external use
export { app };
export default app;
