import { defineConfig } from 'vite';
import { readdirSync, existsSync } from 'fs';
import { resolve, relative, sep } from 'path';

function collectHtmlInputs(rootDir, inputs) {
    if (!existsSync(rootDir)) {
        return;
    }

    for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
        const fullPath = resolve(rootDir, entry.name);

        // Keep the internal strategy document in Git, not in the public app.
        // A noindex directive is NOT access control.
        if (relative(__dirname, fullPath).split(sep).join('/') === 'seo/global-growth-playbook') {
            continue;
        }

        if (entry.isDirectory()) {
            collectHtmlInputs(fullPath, inputs);
            continue;
        }

        if (entry.isFile() && entry.name === 'index.html') {
            const dirName = relative(__dirname, resolve(fullPath, '..'));
            const key = dirName === '' ? 'main' : dirName.split(sep).join('-');
            inputs[key] = fullPath;
        }
    }
}

const input = {
    main: resolve(__dirname, 'index.html')
};

for (const entry of readdirSync(__dirname, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.html') && entry.name !== 'index.html') {
        input[entry.name.replace(/\.html$/, '')] = resolve(__dirname, entry.name);
    }
}

['landing', 'seo', 'policy', 'strategy', 'privacy-policy', 'terms', 'cookie-policy', 'accessibility'].forEach((folder) => {
    collectHtmlInputs(resolve(__dirname, folder), input);
});

// Vite dev/preview normally SPA-falls back to root index.html for extensionless
// multi-page URLs. Keep local URLs aligned with Vercel cleanUrls and canonical URLs.
const publicHtmlRoutes = new Set(Object.values(input)
    .filter((file) => file !== input.main && file.endsWith('index.html'))
    .map((file) => '/' + relative(__dirname, resolve(file, '..')).split(sep).join('/')));

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
                // Select the real entry before Vite parses HTML module scripts.
                transformIndexHtml: {
                    order: 'pre',
                    handler(html) {
                        if (!useModularEntry) return html;
                        return html.replace('src="/src/main.js"', 'src="/src/main.modular.js"');
                    }
                },
                generateBundle(_options, bundle) {
                    const expected = resolve(__dirname, useModularEntry ? 'src/main.modular.js' : 'src/main.js').split(sep).join('/');
                    const unexpected = resolve(__dirname, useModularEntry ? 'src/main.js' : 'src/main.modular.js').split(sep).join('/');
                    const modules = new Set(Object.values(bundle)
                        .filter((item) => item.type === 'chunk')
                        .flatMap((chunk) => Object.keys(chunk.modules)));
                    if (!modules.has(expected) || modules.has(unexpected)) {
                        this.error('Build entry mismatch: expected only ' + expected);
                    }
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
            minify: 'esbuild',
            sourcemap: false,
            reportCompressedSize: true,
            // Monaco is the core editor dependency and is intentionally isolated into a
            // cacheable vendor chunk. Keep the warning budget tight enough to catch
            // regressions in app/PDF/Mermaid chunks while allowing the known editor cost.
            chunkSizeWarningLimit: 2400,
            assetsInlineLimit: 4096,
            rollupOptions: {
                input,
                output: {
                    // Long-term caching: include content hash in the bundle file names.
                    entryFileNames: 'assets/[name]-[hash].js',
                    chunkFileNames: 'assets/[name]-[hash].js',
                    assetFileNames: 'assets/[name]-[hash][extname]',
                    manualChunks(id) {
                        const normalizedId = id.replace(/\\/g, '/');

                        if (!normalizedId.includes('node_modules')) {
                            return undefined;
                        }

                        // Keep the optional Monaco find/replace UI lazy. The core app has its own search
                        // overlay, while Monaco's full find controller is loaded only on Ctrl+Shift+H.
                        if (normalizedId.includes('/monaco-editor/esm/vs/editor/contrib/find/')) {
                            return 'monaco-find';
                        }

                        // Keep Monaco as one cacheable editor vendor chunk. Finer-grained manual splits
                        // currently create circular chunk graphs in Monaco's internal module structure.
                        if (normalizedId.includes('/monaco-editor/')) {
                            return 'monaco-editor';
                        }

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

                        // Mermaid is intentionally left to Rollup's own dynamic chunking. Forcing the whole
                        // package into one manual chunk creates a larger vendor file and worse cache behavior.
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

                        return undefined;
                    }
                }
            }
        },
        esbuild: {
            // Drop debugger statements in production.
            drop: ['debugger'],
            legalComments: 'none'
        },
        resolve: {
            // Prefer the ESM build. The package "browser" export is a UMD bundle
            // that vendors an older Monaco copy and conflicts with monaco-editor 0.52.
            alias: {
                'monaco-vim': resolve(__dirname, 'node_modules/monaco-vim/dist/index.mjs')
            }
        },
        optimizeDeps: {
            include: [
                'monaco-editor/esm/vs/editor/editor.api',
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
