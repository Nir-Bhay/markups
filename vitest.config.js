import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/__tests__/setup.js'],
        include: ['src/__tests__/**/*.test.js'],
        // Cold jsdom + Mermaid imports are memory-heavy. Bound concurrency
        // rather than letting unrelated browser QA turn imports into timeouts.
        maxWorkers: 2,
        coverage: {
            reporter: ['text', 'html'],
            include: ['src/core/storage/**', 'src/utils/**']
        }
    }
});
