import { describe, it, expect } from 'vitest';
import { emojiMarkedOptions } from '../utils/emoji-shortcodes.js';

const { renderer } = emojiMarkedOptions;

describe('emoji accessibility (a11y L2)', () => {
    it('wraps known shortcodes in a span with role="img" and aria-label', () => {
        const html = renderer({ emoji: '😄', name: 'smile' });
        expect(html).toContain('role="img"');
        expect(html).toContain('aria-label="smile"');
        expect(html).toContain('😄');
    });

    it('preserves the visible emoji character inside the span', () => {
        const html = renderer({ emoji: '🔥', name: 'fire' });
        expect(html).toContain('🔥');
    });

    it('handles alias shortcodes like +1 with the alias name as label', () => {
        const html = renderer({ emoji: '👍', name: '+1' });
        expect(html).toContain('aria-label="+1"');
        expect(html).toContain('👍');
    });

    it('falls back to raw emoji when token has no name (defensive)', () => {
        const html = renderer({ emoji: '😄', name: '' });
        expect(html).toBe('😄');
    });

    it('escapes special HTML chars in the aria-label defensively', () => {
        // Real emoji names from gemoji don't contain HTML metachars, but the
        // renderer stays safe under any future gemoji expansion / hostile input.
        const html = renderer({ emoji: '😄', name: 'a"b<c>&' });
        expect(html).toContain('aria-label="a&quot;b&lt;c&gt;&amp;"');
    });
});
