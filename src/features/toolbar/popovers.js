/**
 * Toolbar popover / dropdown positioning manager
 * @module features/toolbar/popovers
 */

export class PopoverManager {
    constructor() {
        this._active = null;
        this._id = 0;
        this._onOutsideClick = (e) => {
            if (this._active && !this._active.el.contains(e.target) &&
                !this._active.trigger?.contains(e.target)) {
                this.close();
            }
        };
        this._onKeydown = (e) => {
            if (e.key === 'Escape' && this._active) this.close();
        };
        document.addEventListener('mousedown', this._onOutsideClick);
        document.addEventListener('keydown', this._onKeydown);
    }

    open(triggerEl, contentEl, options = {}) {
        this.close();

        const wrapper = document.createElement('div');
        wrapper.className = 'tb-popover';
        wrapper.id = `toolbar-popover-${++this._id}`;
        wrapper.setAttribute('role', options.role || 'dialog');
        wrapper.setAttribute('aria-label', options.label || 'Toolbar options');

        // Position
        const rect = triggerEl.getBoundingClientRect();
        const pos = options.position || 'below';

        wrapper.style.cssText = `
      position: fixed;
      z-index: 15000;
      ${pos === 'below' ? `top: ${rect.bottom + 4}px;` : `bottom: ${window.innerHeight - rect.top + 4}px;`}
      left: ${rect.left}px;
    `;

        wrapper.appendChild(contentEl);
        document.body.appendChild(wrapper);

        // Adjust if off-screen
        requestAnimationFrame(() => {
            const wRect = wrapper.getBoundingClientRect();
            if (wRect.right > window.innerWidth - 8) {
                wrapper.style.left = `${window.innerWidth - wRect.width - 8}px`;
            }
            if (wRect.left < 8) {
                wrapper.style.left = '8px';
            }
            if (pos === 'below' && wRect.bottom > window.innerHeight - 8) {
                wrapper.style.top = '';
                wrapper.style.bottom = `${window.innerHeight - rect.top + 4}px`;
            }
        });

        triggerEl.setAttribute('aria-expanded', 'true');
        triggerEl.setAttribute('aria-controls', wrapper.id);
        this._active = {
            el: wrapper,
            trigger: triggerEl,
            restoreFocus: options.restoreFocus !== false,
        };
        requestAnimationFrame(() => {
            wrapper.querySelector('button, input, [tabindex="0"]')?.focus();
        });
    }

    close() {
        if (this._active) {
            const { el, trigger, restoreFocus } = this._active;
            el.remove();
            trigger?.setAttribute('aria-expanded', 'false');
            if (restoreFocus && trigger && document.contains(trigger)) {
                trigger.focus({ preventScroll: true });
            }
            this._active = null;
        }
    }

    /** Remove document listeners (call from toolbar dispose) */
    dispose() {
        this.close();
        if (this._onOutsideClick) {
            document.removeEventListener('mousedown', this._onOutsideClick);
        }
        if (this._onKeydown) {
            document.removeEventListener('keydown', this._onKeydown);
        }
    }

    get isOpen() { return !!this._active; }
}

export const popover = new PopoverManager();
