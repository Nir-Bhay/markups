import { beforeEach, describe, expect, it } from 'vitest';
import { PopoverManager } from '../features/toolbar/popovers.js';

describe('toolbar popover foundation', () => {
    beforeEach(() => {
        document.body.innerHTML = '<button id="trigger">Open</button>';
    });

    it('closes with Escape semantics and restores trigger focus', () => {
        const trigger = document.getElementById('trigger');
        const content = document.createElement('div');
        content.innerHTML = '<button type="button">Option</button>';
        const manager = new PopoverManager();

        trigger.focus();
        manager.open(trigger, content, { label: 'Options' });
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(document.querySelector('[role="dialog"]')).not.toBeNull();

        manager.close();
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(trigger);
    });
});
