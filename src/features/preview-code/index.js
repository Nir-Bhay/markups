import { copyToClipboard } from '../../utils/clipboard.js';

/** Enhance code fences without changing their source or Document Mode output. */
export function enhancePreviewCode(root) {
    root.querySelectorAll('pre').forEach((pre) => {
        const code = pre.querySelector('code');
        if (!code || pre.querySelector('.code-block-header')) return;
        const header = document.createElement('div');
        header.className = 'code-block-header';
        const badge = document.createElement('span');
        badge.className = 'code-lang-badge';
        badge.textContent = code.className.match(/language-([\w#+-]+)/i)?.[1] || 'text';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'code-copy-btn';
        button.textContent = 'Copy';
        button.setAttribute('aria-label', 'Copy code to clipboard');
        button.addEventListener('click', async () => {
            const copied = await copyToClipboard(code.textContent || '');
            button.textContent = copied ? 'Copied!' : 'Copy failed';
            button.setAttribute('aria-label', button.textContent);
            setTimeout(() => {
                button.textContent = 'Copy';
                button.setAttribute('aria-label', 'Copy code to clipboard');
            }, 1800);
        });
        header.append(badge, button);
        pre.prepend(header);
    });
}
