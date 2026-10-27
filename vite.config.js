import { defineConfig } from 'vite';
import { readdirSync, existsSync } from 'fs';
import { resolve, relative, sep } from 'path';

const projectRoot = import.meta.dirname;

function collectHtmlInputs(rootDir, inputs) {
    if (!existsSync(rootDir)) {
        return;
    }

    for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
        const fullPath = resolve(rootDir, entry.name);

        // Keep the internal strategy document in Git, not in the public app.
        // A noindex directive is NOT access control.
        if (relative(projectRoot, fullPath).split(sep).join('/') === 'seo/global-growth-playbook') {
            continue;
        }

        if (entry.isDirectory()) {
            collectHtmlInputs(fullPath, inputs);
            continue;
        }

        if (entry.isFile() && entry.name === 'index.html') {
            const dirName = relative(projectRoot, resolve(fullPath, '..'));
            const key = dirName === '' ? 'main' : dirName.split(sep).join('-');
            inputs[key] = fullPath;
        }
    }
}

const input = {
    main: resolve(projectRoot, 'index.html')
};

for (const entry of readdirSync(projectRoot, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.html') && entry.name !== 'index.html') {
        input[entry.name.replace(/\.html$/, '')] = resolve(projectRoot, entry.name);
    }
}

['landing', 'seo', 'policy', 'strategy', 'privacy-policy', 'terms', 'cookie-policy', 'accessibility'].forEach((folder) => {
    collectHtmlInputs(resolve(projectRoot, folder), input);
});

// Vite dev/preview normally SPA-falls back to root index.html for extensionless
// multi-page URLs. Keep local URLs aligned with Vercel cleanUrls and canonical URLs.
const publicHtmlRoutes = new Set(Object.values(input)
    .filter((file) => file !== input.main && file.endsWith('index.html'))
    .map((file) => '/' + relative(projectRoot, resolve(file, '..')).split(sep).join('/')));

function getVendorChunkName(id) {
    const normalizedId = id.replace(/\\/g, '/');

    if (!normalizedId.includes('/node_modules/')) return null;

    // Keep the optional Monaco find/replace UI lazy. The core app has its own search
    // overlay, while Monaco's full find controller is loaded only on Ctrl+Shift+H.
    if (normalizedId.includes('/monaco-editor/esm/vs/editor/contrib/find/')) return 'monaco-find';

    // Keep Monaco as one cacheable editor vendor chunk. Finer-grained manual splits
    // create circular chunk graphs in Monaco's internal module structure.
    if (normalizedId.includes('/monaco-editor/')) return 'monaco-editor';

    // Keep PDF export dependencies lazy and split by library so one export action does not
    // create a single >1 MB vendor chunk. These modules are reached through dynamic imports.
    if (normalizedId.includes('/html2pdf.js/')) return 'pdf-html2pdf';
    if (normalizedId.includes('/html2canvas/')) return 'pdf-html2canvas';
    if (normalizedId.includes('/jspdf/')) return 'pdf-jspdf';
    if (
        normalizedId.includes('/canvg/') ||
        normalizedId.includes('/core-js/') ||
        normalizedId.includes('/fflate/') ||
        normalizedId.includes('/pako/') ||
        normalizedId.includes('/rgbcolor/') ||
        normalizedId.includes('/svg-pathdata/') ||
        normalizedId.includes('/@babel/runtime/')
    ) {
        return 'pdf-support';
    }

    // Mermaid is intentionally left to automatic dynamic chunking.
    if (normalizedId.includes('/katex/')) return 'katex-vendor';
    if (normalizedId.includes('/prismjs/') || normalizedId.includes('/github-markdown-css/')) {
        return 'highlight-vendor';
    }
    if (normalizedId.includes('/dompurify/')) return 'sanitize-vendor';
    if (
        normalizedId.includes('/marked/') ||
        normalizedId.includes('/marked-katex-extension/') ||
        normalizedId.includes('/marked-highlight/') ||
        normalizedId.includes('/marked-gfm-heading-id/') ||
        normalizedId.includes('/marked-footnote/') ||
        normalizedId.includes('/marked-alert/')
    ) {
        return 'markdown-vendor';
    }
    if (normalizedId.includes('/dexie/')) return 'storage-vendor';

    return null;
}

function rewriteCleanHtmlRoute(req, _res, next) {
    const raw = req.url || '/';
    const q = raw.indexOf('?');
    const path = (q >= 0 ? raw.slice(0, q) : raw).replace(/\/$/, '');
    if (publicHtmlRoutes.has(path)) {
        req.url = path + '/index.html' + (q < 0 ? '' : raw.slice(q));
    }
    next();
}

export default defineConfig(({ mode }) => {
    const useModularEntry = mode === 'modular' || process.env.MARKUPS_ENTRY === 'modular';

    return {
        plugins: [
            {
                name: 'markups-clean-html-routes',
                configureServer(server) {
                    server.middlewares.use(rewriteCleanHtmlRoute);
                },
                configurePreviewServer(server) {
                    server.middlewares.use(rewriteCleanHtmlRoute);
                }
            },
            {
                name: 'markups-entry-selector',
                transformIndexHtml(html) {
                    if (!useModularEntry) return html;
                    return html.replace('src="/src/main.js"', 'src="/src/main.modular.js"');
                }
            }
        ],
        target: 'es2020',
        css: {
            devSourcemap: false
        },
        build: {
            target: 'es2020',
            cssCodeSplit: true,
            minify: 'oxc',
            sourcemap: false,
            reportCompressedSize: true,
            // Monaco is the core editor dependency and is intentionally isolated into a
            // cacheable vendor chunk. Keep the warning budget tight enough to catch
            // regressions in app/PDF/Mermaid chunks while allowing the known editor cost.
            chunkSizeWarningLimit: 2400,
            assetsInlineLimit: 4096,
            rolldownOptions: {
                input,
                output: {
                    // Long-term caching: include content hash in the bundle file names.
                    entryFileNames: 'assets/[name]-[hash].js',
                    chunkFileNames: 'assets/[name]-[hash].js',
                    assetFileNames: 'assets/[name]-[hash][extname]',
                    comments: { legal: false },
                    codeSplitting: {
                        groups: [{
                            test: (id) => id.replace(/\\/g, '/').includes('/node_modules/'),
                            name: getVendorChunkName,
                            debugName: 'named-vendor-chunks',
                            priority: 100
                        }]
                    }
                }
            }
        },
        resolve: {
            alias: [
                {
                    // Monaco 0.57 embeds DOMPurify 3.4.15. Resolve its sanitizer import to
                    // the patched 3.4.17 package until Monaco publishes a fixed bundle.
                    find: /[/\\]monaco-editor[/\\]esm[/\\]vs[/\\]base[/\\]browser[/\\]dompurify[/\\]dompurify\.js$/,
                    replacement: resolve(projectRoot, 'node_modules/dompurify/dist/purify.es.mjs')
                },
                {
                    // Prefer the ESM build; the package browser export is a UMD bundle.
                    find: 'monaco-vim',
                    replacement: resolve(projectRoot, 'node_modules/monaco-vim/dist/index.mjs')
                }
            ]
        },
        optimizeDeps: {
            include: [
                'monaco-editor/esm/vs/editor/editor.api',
                'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution',
                'monaco-vim',
                // Mermaid lazy-loads diagram chunks (sequence/pie/state/…). Pre-bundle
                // the entry so first non-flowchart diagram does not hit a stale/missing
                // deps chunk and render as a bogus "Syntax error" SVG.
                'mermaid'
            ]
        },
        server: {
            proxy: {
                '/api/ai-proxy/kilo': {
                    target: 'https://api.kilo.ai',
                    changeOrigin: true,
                    secure: true,
                    rewrite: (path) => path.replace(/^\/api\/ai-proxy\/kilo/, '/api/gateway')
                },
                '/api/ai-proxy/tokenrouter': {
                    target: 'https://api.tokenrouter.com',
                    changeOrigin: true,
                    secure: true,
                    rewrite: (path) => path.replace(/^\/api\/ai-proxy\/tokenrouter/, '/v1')
                }
            }
        },
        preview: {
            proxy: {
                '/api/ai-proxy/kilo': {
                    target: 'https://api.kilo.ai',
                    changeOrigin: true,
                    secure: true,
                    rewrite: (path) => path.replace(/^\/api\/ai-proxy\/kilo/, '/api/gateway')
                },
                '/api/ai-proxy/tokenrouter': {
                    target: 'https://api.tokenrouter.com',
                    changeOrigin: true,
                    secure: true,
                    rewrite: (path) => path.replace(/^\/api\/ai-proxy\/tokenrouter/, '/v1')
                }
            }
        }
    };
});
