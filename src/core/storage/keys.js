/**
 * Storage Keys - Constants for all localStorage keys
 * @module core/storage/keys
 */

/**
 * Namespace for all storage keys
 */
export const NAMESPACE = 'com.markdownlivepreview';

/**
 * Storage key constants
 */
export const STORAGE_KEYS = {
    // Document storage
    DOCUMENTS: 'docs',
    TABS: 'tabs',
    LAST_STATE: 'last_state',
    ACTIVE_TAB: 'active_tab',
    MIGRATION_STATUS: 'migration_status',

    // Settings
    SCROLL_SYNC: 'scroll_bar_settings',
    DARK_MODE: 'dark_mode_settings',
    THEME: 'theme_settings',
    VIEW_MODE: 'view_mode',

    // Goals
    WRITING_GOALS: 'writing_goals',

    // Editor preferences
    FONT_SIZE: 'font_size',
    WORD_WRAP: 'word_wrap',
    LINE_NUMBERS: 'line_numbers',

    // UI state
    SIDEBAR_COLLAPSED: 'sidebar_collapsed',
    TOC_VISIBLE: 'toc_visible',
    LINT_PANEL_VISIBLE: 'lint_panel_visible',

    // Feature flags
    TYPEWRITER_MODE: 'typewriter_mode',
    FOCUS_MODE: 'focus_mode',

    // Cache
    LAST_EXPORT_FORMAT: 'last_export_format',
    RECENT_TEMPLATES: 'recent_templates',

    // AI Writer
    AI_PROVIDER: 'ai_provider',
    AI_ENDPOINT: 'ai_endpoint',
    AI_MODEL: 'ai_model',
    AI_TEMPERATURE: 'ai_temperature',
    AI_MAX_TOKENS: 'ai_max_tokens',
    AI_PANEL_VISIBLE: 'ai_panel_visible'
};

/**
 * Default values for storage keys
 */
export const STORAGE_DEFAULTS = {
    [STORAGE_KEYS.SCROLL_SYNC]: false,
    [STORAGE_KEYS.DARK_MODE]: false,
    [STORAGE_KEYS.THEME]: 'vs',
    [STORAGE_KEYS.VIEW_MODE]: 'split',
    [STORAGE_KEYS.WRITING_GOALS]: {
        dailyTarget: 500,
        streak: 0,
        lastGoalDate: null,
        history: {}
    },
    [STORAGE_KEYS.FONT_SIZE]: 16,
    [STORAGE_KEYS.WORD_WRAP]: true,
    [STORAGE_KEYS.LINE_NUMBERS]: false,
    [STORAGE_KEYS.SIDEBAR_COLLAPSED]: false,
    [STORAGE_KEYS.TOC_VISIBLE]: false,
    [STORAGE_KEYS.LINT_PANEL_VISIBLE]: false,
    [STORAGE_KEYS.TYPEWRITER_MODE]: false,
    [STORAGE_KEYS.FOCUS_MODE]: false,

    // AI Writer
    [STORAGE_KEYS.AI_PROVIDER]: 'openai',
    [STORAGE_KEYS.AI_ENDPOINT]: 'https://api.openai.com/v1',
    [STORAGE_KEYS.AI_MODEL]: 'gpt-4o-mini',
    [STORAGE_KEYS.AI_TEMPERATURE]: 0.7,
    [STORAGE_KEYS.AI_MAX_TOKENS]: 2048,
    [STORAGE_KEYS.AI_PANEL_VISIBLE]: false
};

export default STORAGE_KEYS;
