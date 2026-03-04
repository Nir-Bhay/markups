/**
 * Default Content
 * Welcome content shown when app is first loaded
 * Auto-cleared when user starts typing
 * @module config/default-content
 */

export const DEFAULT_CONTENT = `# Welcome to Markups ✨

> **Your free, powerful Markdown editor** — write, preview, and export beautiful documents right in your browser.

Start typing here to begin — this welcome content will disappear automatically.

---

## What You Can Do

| Feature | How |
|---------|-----|
| **Bold**, *Italic*, ~~Strikethrough~~ | Toolbar buttons or Markdown syntax |
| Headings (H1–H6) | \`# Heading\` or toolbar |
| Bullet & numbered lists | \`- item\` or \`1. item\` |
| Code blocks with syntax highlighting | Triple backticks \\\`\\\`\\\` |
| Tables | Pipe \`|\` syntax |
| Images & links | Drag-drop or \`![alt](url)\` |
| Math equations (LaTeX) | \`$E=mc^2$\` |
| Diagrams (Mermaid) | Fenced \`mermaid\` blocks |
| Export to PDF, HTML, DOCX, PNG | Click **Export** ↗ |
| Multiple tabs | Click **+** in the tab bar |

## Quick Examples

### Code Block

\\\`\\\`\\\`javascript
function greet(name) {
  return \\\`Hello, \\\${name}! 👋\\\`;
}
\\\`\\\`\\\`

### Math

Inline: $E = mc^2$ · Block:

$$\\\\sum_{i=1}^{n} i = \\\\frac{n(n+1)}{2}$$

### Diagram

\\\`\\\`\\\`mermaid
graph LR
    A[Write Markdown] --> B[Live Preview]
    B --> C{Export}
    C --> D[PDF]
    C --> E[HTML]
    C --> F[Image]
\\\`\\\`\\\`

### Blockquote

> "The best way to predict the future is to create it." — Abraham Lincoln

---

**Keyboard shortcuts:** \`Ctrl+B\` Bold · \`Ctrl+I\` Italic · \`Ctrl+S\` Save · \`Ctrl+Shift+E\` Export

Happy writing! 🚀
`;

export default DEFAULT_CONTENT;
