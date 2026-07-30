import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/__tests__/setup.js'],
        include: ['src/__tests__/**/*.test.js'],
        coverage: {
            reporter: ['text', 'html'],
            include: ['src/core/storage/**', 'src/utils/**']
        }
    }
});
