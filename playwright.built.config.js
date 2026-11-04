import base from './playwright.config.js';

// A compiled artifact has no /src modules. Source-instrumentation-only tests
// remain in the development suite; public UI/data/security journeys run here.
export default {
    ...base,
    workers: 1,
    webServer: undefined,
    testIgnore: ['**/image-ir-update.spec.js', '**/modular-*.spec.js'],
    outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR || 'test-results/built-production',
    use: { ...base.use, baseURL: process.env.PLAYWRIGHT_BUILT_URL, video: 'off' },
    projects: base.projects.map(project => ({ ...project, name: 'built-production' }))
};
