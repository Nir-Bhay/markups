import { describe, it, expect } from 'vitest';
import { emojiMarkedOptions } from '../utils/emoji-shortcodes.js';

describe('emoji shortcodes (Issue #45)', () => {
    it('maps common GitHub shortcodes to their exact Unicode emoji', () => {
        const m = emojiMarkedOptions.emojis;
        expect(m).toBeTypeOf('object');
        expect(Object.keys(m).length).toBeGreaterThan(1000);
        expect(m.smile).toBe('😄');
        expect(m.heart).toBe('❤️');
        expect(m.tada).toBe('🎉');
        expect(m.rocket).toBe('🚀');
        expect(m.fire).toBe('🔥');
        expect(m['+1']).toBe('👍');
        expect(m['-1']).toBe('👎');
        expect(m.wink).toBe('😉');
        expect(m.skull).toBe('💀');
    });

    it('renderer returns the raw emoji for a token', () => {
        expect(emojiMarkedOptions.renderer({ emoji: '😄', name: 'smile' })).toBe('😄');
    });
});
