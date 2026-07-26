/**
 * Toolbar constants and configuration data
 * @module features/toolbar/constants
 */

export const TOOLBAR_STORAGE_KEY = 'markups_toolbar_prefs';

export const COLORS = [
    { label: 'Red', hex: '#ef4444' },
    { label: 'Orange', hex: '#f97316' },
    { label: 'Amber', hex: '#f59e0b' },
    { label: 'Yellow', hex: '#eab308' },
    { label: 'Lime', hex: '#84cc16' },
    { label: 'Green', hex: '#22c55e' },
    { label: 'Teal', hex: '#14b8a6' },
    { label: 'Cyan', hex: '#06b6d4' },
    { label: 'Blue', hex: '#3b82f6' },
    { label: 'Indigo', hex: '#6366f1' },
    { label: 'Purple', hex: '#a855f7' },
    { label: 'Pink', hex: '#ec4899' },
    { label: 'Rose', hex: '#f43f5e' },
    { label: 'Gray', hex: '#6b7280' },
    { label: 'White', hex: '#ffffff' },
    { label: 'Black', hex: '#000000' },
];

export const HIGHLIGHT_COLORS = [
    { label: 'Yellow', hex: '#fef08a' },
    { label: 'Green', hex: '#bbf7d0' },
    { label: 'Blue', hex: '#bfdbfe' },
    { label: 'Purple', hex: '#e9d5ff' },
    { label: 'Pink', hex: '#fbcfe8' },
    { label: 'Orange', hex: '#fed7aa' },
    { label: 'Red', hex: '#fecaca' },
    { label: 'Cyan', hex: '#a5f3fc' },
];

export const EMOJI_SETS = {
    'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😛', '🤔', '🤫', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😷', '🤒', '🤕'],
    'Hands': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '🙏', '✍️', '💪', '🦾', '🖕'],
    'Objects': ['⭐', '🔥', '💯', '❤️', '💔', '💡', '📌', '📎', '✏️', '📝', '📁', '📂', '🔒', '🔓', '🔑', '🔔', '📢', '💬', '💭', '🏷️', '📊', '📈', '📉', '⚡', '🎯', '🚀', '✅', '❌', '⚠️', 'ℹ️', '❓', '❗'],
    'Arrows': ['➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '🔄', '🔃', '🔀', '🔁', '🔂', '▶️', '◀️', '🔼', '🔽', '⏩', '⏪', '⏫', '⏬'],
};

export const CALLOUT_TYPES = [
    { type: 'note', icon: 'N', label: 'Note', color: '#3b82f6' },
    { type: 'tip', icon: 'T', label: 'Tip', color: '#22c55e' },
    { type: 'important', icon: '!', label: 'Important', color: '#a855f7' },
    { type: 'warning', icon: '!', label: 'Warning', color: '#f59e0b' },
    { type: 'caution', icon: '!', label: 'Caution', color: '#ef4444' },
    { type: 'info', icon: 'i', label: 'Info', color: '#06b6d4' },
    { type: 'success', icon: '✓', label: 'Success', color: '#22c55e' },
    { type: 'question', icon: '?', label: 'Question', color: '#6366f1' },
    { type: 'quote', icon: '"', label: 'Quote', color: '#6b7280' },
    { type: 'bug', icon: 'B', label: 'Bug', color: '#ef4444' },
    { type: 'example', icon: 'E', label: 'Example', color: '#14b8a6' },
];

export const CODE_LANGUAGES = [
    'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
    'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'html', 'css',
    'scss', 'sql', 'bash', 'shell', 'powershell', 'json', 'yaml',
    'xml', 'markdown', 'dockerfile', 'graphql', 'lua', 'r', 'dart',
    'plaintext',
];

export const SPECIAL_CHARS = [
    { ch: '©', name: 'Copyright' },
    { ch: '®', name: 'Registered' },
    { ch: '™', name: 'Trademark' },
    { ch: '°', name: 'Degree' },
    { ch: '±', name: 'Plus-minus' },
    { ch: '×', name: 'Multiply' },
    { ch: '÷', name: 'Divide' },
    { ch: '≠', name: 'Not equal' },
    { ch: '≈', name: 'Approx' },
    { ch: '≤', name: 'Less-equal' },
    { ch: '≥', name: 'Greater-equal' },
    { ch: '∞', name: 'Infinity' },
    { ch: '√', name: 'Sqrt' },
    { ch: 'π', name: 'Pi' },
    { ch: 'Δ', name: 'Delta' },
    { ch: 'Σ', name: 'Sigma' },
    { ch: '→', name: 'Arrow right' },
    { ch: '←', name: 'Arrow left' },
    { ch: '↑', name: 'Arrow up' },
    { ch: '↓', name: 'Arrow down' },
    { ch: '⇒', name: 'Double arrow' },
    { ch: '•', name: 'Bullet' },
    { ch: '…', name: 'Ellipsis' },
    { ch: '—', name: 'Em dash' },
    { ch: '–', name: 'En dash' },
    { ch: '¶', name: 'Paragraph' },
    { ch: '§', name: 'Section' },
    { ch: '†', name: 'Dagger' },
    { ch: '‡', name: 'Double dagger' },
    { ch: '★', name: 'Star' },
    { ch: '☆', name: 'Star outline' },
    { ch: '♠', name: 'Spade' },
    { ch: '♥', name: 'Heart' },
    { ch: '♦', name: 'Diamond' },
    { ch: '♣', name: 'Club' },
    { ch: '✓', name: 'Check' },
    { ch: '✗', name: 'Cross' },
];

export const TABLE_MAX = 10;
