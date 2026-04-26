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
    optimizeDeps: {
        include: ['monaco-editor']
    },
    build: {
        rollupOptions: {
            input,
            output: {
                manualChunks: {
                    'monaco-editor': ['monaco-editor']
                }
            }
        }
    }
});
