/**
 * Slash Commands Registry
 * Notion-style / insertion markdown constructs for Monaco editor
 * @module features/slash-commands
 */

/**
 * @typedef {Object} SlashCommand
 * @property {string} id - Unique command identifier
 * @property {string} label - Display name
 * @property {string} desc - Optional description
 * @property {string} icon - Icon character/symbol
 * @property {string} insert - Markdown text to insert
 * @property {string[]} keywords - Search keywords for filtering
 */

/**
 * Registry of available slash commands
 */
export const SLASH_COMMANDS = [
    {
        id: 'h1',
        label: 'Heading 1',
        desc: 'Big section heading',
        icon: 'H1',
        insert: '# ',
        keywords: ['heading', 'h1', 'title', 'big']
    },
    {
        id: 'h2',
        label: 'Heading 2',
        desc: 'Medium section heading',
        icon: 'H2',
        insert: '## ',
        keywords: ['heading', 'h2', 'subtitle', 'medium']
    },
    {
        id: 'h3',
        label: 'Heading 3',
        desc: 'Small section heading',
        icon: 'H3',
        insert: '### ',
        keywords: ['heading', 'h3', 'small', 'subsection']
    },
    {
        id: 'bullet-list',
        label: 'Bullet List',
        desc: 'Unordered list item',
        icon: '•',
        insert: '\n- ',
        keywords: ['bullet', 'list', 'unordered', 'ul', 'dot']
    },
    {
        id: 'numbered-list',
        label: 'Numbered List',
        desc: 'Ordered list item',
        icon: '1.',
        insert: '\n1. ',
        keywords: ['numbered', 'list', 'ordered', 'ol', 'number']
    },
    {
        id: 'quote',
        label: 'Quote',
        desc: 'Block quote',
        icon: '"',
        insert: '\n> ',
        keywords: ['quote', 'blockquote', 'citation', 'quote']
    },
    {
        id: 'code-block',
        label: 'Code Block',
        desc: 'Fenced code block',
        icon: '```',
        insert: '\n```\n\n```\n',
        keywords: ['code', 'block', 'fenced', 'snippet', 'pre']
    },
    {
        id: 'divider',
        label: 'Divider',
        desc: 'Horizontal rule',
        icon: '—',
        insert: '\n---\n',
        keywords: ['divider', 'horizontal', 'rule', 'hr', 'line']
    },
    {
        id: 'image',
        label: 'Image',
        desc: 'Embed an image',
        icon: '🖼',
        insert: '![alt](url)',
        keywords: ['image', 'img', 'picture', 'photo', 'embed']
    },
    {
        id: 'link',
        label: 'Link',
        desc: 'Insert a hyperlink',
        icon: '🔗',
        insert: '[text](url)',
        keywords: ['link', 'url', 'hyperlink', 'href', 'anchor']
    },
    {
        id: 'table',
        label: 'Table',
        desc: 'Insert a simple table',
        icon: '▦',
        insert: '| col1 | col2 |\n|---|---|\n|  |  |\n',
        keywords: ['table', 'grid', 'columns', 'rows', 'data']
    },
    {
        id: 'task-list',
        label: 'Task List',
        desc: 'Checkbox list item',
        icon: '☐',
        insert: '\n- [ ] ',
        keywords: ['task', 'list', 'checkbox', 'todo', 'check']
    }
];

export default SLASH_COMMANDS;
