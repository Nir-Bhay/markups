import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { resolve, relative, sep } from 'path';

const projectRoot = import.meta.dirname;

function prismLanguageImports() {
    return {
        name: 'markups-prism-language-imports',
        enforce: 'pre',
        transform(code, id) {
            const path = id.split('?')[0].replaceAll('\\', '/');
            // Prism components are browser-global scripts, not ES modules. Make
            // their core dependency explicit so production chunk evaluation
            // cannot execute a grammar before the CommonJS core initializes.
            if (/\/prismjs\/components\/prism-(?!core\.)[a-z0-9-]+\.js$/.test(path)) {
                return { code: `import Prism from 'prismjs';\n${code}`, map: null };
            }
        }
    };
}

function offlineAssetManifest() {
    return {
        name: 'markups-offline-assets',
        generateBundle(_options, bundle) {
            // Include lazy chunks too: first-load imports can complete before
            // the new worker controls the page, so request caching alone misses them.
            const assets = Object.keys(bundle).filter(file => /\.(?:js|css|woff2?)$/.test(file)).map(file => '/' + file);
            this.emitFile({ type: 'asset', fileName: 'precache-manifest.json', source: JSON.stringify(assets) });
        }
    };
}

function monacoDompurifyResolver() {
    return {
        name: 'markups-monaco-dompurify',
        enforce: 'pre',
        resolveId(source, importer) {
            const normalizedImporter = (importer || '').replace(/\\/g, '/');
            const isMonacoBaseBrowser = normalizedImporter.includes(
                '/node_modules/monaco-editor/esm/vs/base/browser/'
            );
            const isMonacoSanitizer = /^(?:\.{1,2}\/)+dompurify\/dompurify\.js$/.test(source);

            if (isMonacoBaseBrowser && isMonacoSanitizer) {
                // Monaco bundles a stale private DOMPurify copy that npm audit
                // cannot see. Use the patched root dependency instead.
                return resolve(projectRoot, 'src/core/editor/monaco-dompurify-compat.js');
            }

            return null;
        }
    };
}

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

['landing', 'seo', 'blog', 'markdown-guide', 'policy', 'strategy', 'privacy-policy', 'terms', 'cookie-policy', 'accessibility'].forEach((folder) => {
    collectHtmlInputs(resolve(projectRoot, folder), input);
});

// Vite dev/preview normally SPA-falls back to root index.html for extensionless
// multi-page URLs. Keep local URLs aligned with Vercel cleanUrls and canonical URLs.
const publicHtmlRoutes = new Set(Object.values(input)
    .filter((file) => file !== input.main && file.endsWith('index.html'))
    .map((file) => '/' + relative(projectRoot, resolve(file, '..')).split(sep).join('/')));

function rewriteCleanHtmlRoute(req, _res, next) {
    const raw = req.url || '/';
    const q = raw.indexOf('?');
    const path = (q >= 0 ? raw.slice(0, q) : raw).replace(/\/$/, '');
    // Resolve editorial pages added while the dev server is already running.
    // Build inputs are collected at startup, so that snapshot can miss new posts.
    const isEditorialPage = /^\/(?:blog|markdown-guide)(?:\/[a-z0-9-]+)*$/.test(path)
        && existsSync(resolve(projectRoot, '.' + path, 'index.html'));
    if (publicHtmlRoutes.has(path) || isEditorialPage) {
        req.url = path + '/index.html' + (q < 0 ? '' : raw.slice(q));
    }
    next();
}

function landingPrerenderPlugin(command) {
    const renderedPage = resolve(projectRoot, '.tmp/landing-prerender.html');

    return {
        name: 'markups-landing-prerender',
        transformIndexHtml: {
            order: 'pre',
            handler(html) {
                if (
                    command !== 'build' ||
                    !html.includes('<div id="root"></div>') ||
                    !existsSync(renderedPage)
                ) {
                    return html;
                }

                const markup = readFileSync(renderedPage, 'utf8');
                return html.replace(
                    '<div id="root"></div>',
                    () => `<div id="root">${markup}</div>`
                );
            }
        }
    };
}

export default defineConfig(({ mode, command }) => {
    const useModularEntry = mode === 'modular' || process.env.MARKUPS_ENTRY === 'modular';

    return {
        plugins: [
            react(),
            prismLanguageImports(),
            offlineAssetManifest(),
            landingPrerenderPlugin(command),
            monacoDompurifyResolver(),
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
                    // Vite adds a timestamp query after an entry changes during
                    // development. Keep selecting the requested entry after HMR
                    // instead of silently falling back to production.
                    return html.replace(/(src=["'])\/src\/main\.js(?=[?"'])/g, '$1/src/main.modular.js');
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
                }
            }
        },
        resolve: {
            // Prefer the ESM build; the package browser export is a UMD bundle.
            alias: {
                'monaco-vim': resolve(projectRoot, 'node_modules/monaco-vim/dist/index.mjs')
            }
        },
        optimizeDeps: {
            rolldownOptions: {
                plugins: [monacoDompurifyResolver()]
            },
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
