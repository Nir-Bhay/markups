/**
 * Features Index
 * Re-exports all feature modules
 * @module features
 */


export default {
    'ai-writer': () => import('./ai-writer/index.js'),
    'app-context-menu': () => import('./app-context-menu/index.js'),
    backlinks: () => import('./backlinks/index.js'),
    explorer: () => import('./explorer/index.js'),
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
    'image-controls': () => import('./image-controls/index.js'),
    'image-resize': () => import('./image-resize/index.js'),
    imageUpload: () => import('./image-upload/index.js'),
    divider: () => import('./divider/index.js'),
    'live-preview-edit': () => import('./live-preview-edit/index.js'),
    mobile: () => import('./mobile/index.js'),
    import: () => import('./import/index.js'),
    'slash-commands': () => import('./slash-commands/index.js'),
    'version-history': () => import('./version-history/index.js'),
    'video-controls': () => import('./video-controls/index.js'),
    'video-discoverability': () => import('./video-discoverability/index.js')
};
