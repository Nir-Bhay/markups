/**
 * Features Index
 * Re-exports all feature modules
 * @module features
 */


export default {
    tabs: () => import('./tabs/index.js'),
    goals: () => import('./goals/index.js'),
    stats: () => import('./stats/index.js'),
    linter: () => import('./linter/index.js'),
    toc: () => import('./toc/index.js'),
    search: () => import('./search/index.js'),
    templates: () => import('./templates/index.js'),
    snippets: () => import('./snippets/index.js'),
    toolbar: () => import('./toolbar/index.js'),
    modes: () => import('./modes/index.js'),
    focus: () => import('./focus/index.js'),
    typewriter: () => import('./typewriter/index.js'),
    fullscreen: () => import('./fullscreen/index.js'),
    imageUpload: () => import('./image-upload/index.js'),
    divider: () => import('./divider/index.js'),
    mobile: () => import('./mobile/index.js'),
    import: () => import('./import/index.js')
};
