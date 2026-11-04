import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({
    configFile: resolve(projectRoot, 'vite.config.js'),
    root: projectRoot,
    mode: 'production',
    appType: 'custom',
    server: {
        middlewareMode: true,
        hmr: false
    },
    logLevel: 'error'
});

try {
    const { default: App } = await server.ssrLoadModule('/landing/src/App.tsx');
    const markup = renderToString(createElement(App));
    const outputPath = resolve(projectRoot, '.tmp/landing-prerender.html');

    await mkdir(resolve(projectRoot, '.tmp'), { recursive: true });
    await writeFile(outputPath, markup, 'utf8');
} finally {
    await server.close();
}
