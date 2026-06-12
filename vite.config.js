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

export default defineConfig({
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
        chunkSizeWarningLimit: 800,
        assetsInlineLimit: 4096,
        rollupOptions: {
            input,
            output: {
                // Long-term caching: include content hash in the bundle file names
                entryFileNames: 'assets/[name]-[hash].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash][extname]',
                manualChunks: {
                    'monaco-editor': ['monaco-editor'],
                    'mermaid-vendor': ['mermaid'],
                    'katex-vendor': ['katex'],
                    'markdown-vendor': ['marked', 'marked-katex-extension', 'marked-highlight', 'marked-gfm-heading-id', 'marked-footnote', 'marked-alert', 'markdownlint'],
                    'dom-utils': ['dompurify', 'html2pdf.js', 'html2canvas', 'prismjs', 'github-markdown-css'],
                    'storage-vendor': ['dexie']
                }
            }
        }
    },
    esbuild: {
        // Drop debugger statements in production
        drop: ['debugger'],
        legalComments: 'none'
    },
    optimizeDeps: {
        include: ['monaco-editor']
    }
});
