import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    optimizeDeps: {
        include: ['monaco-editor']
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                landing: resolve(__dirname, 'landing/index.html'),
            },
            output: {
                manualChunks: {
                    'monaco-editor': ['monaco-editor']
                }
            }
        }
    }
});
