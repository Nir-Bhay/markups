import { defineConfig } from 'vite';
import { readdirSync, existsSync } from 'fs';
import { resolve, relative, sep } from 'path';

function collectHtmlInputs(rootDir, inputs) {
    if (!existsSync(rootDir)) {
        return;
    }

    for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
        const fullPath = resolve(rootDir, entry.name);

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

['landing', 'seo', 'policy', 'strategy'].forEach((folder) => {
    collectHtmlInputs(resolve(__dirname, folder), input);
});

export default defineConfig(({ mode }) => {
    const useModularEntry = mode === 'modular' || process.env.MARKUPS_ENTRY === 'modular';

    return {
        plugins: [
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
                external: ['monaco-vim'],
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
        optimizeDeps: {
            include: ['monaco-editor/esm/vs/editor/editor.api']
        }
    };
});
