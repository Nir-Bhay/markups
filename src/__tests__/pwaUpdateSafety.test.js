import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { pwaService } from '../services/pwa/index.js';

describe('safe app updates', () => {
    it('does not activate an update while the editor has unconfirmed changes', async () => {
        document.body.innerHTML = '<div id="save-status" data-state="error"></div>';
        const postMessage = vi.fn();
        pwaService.registration = { waiting: { postMessage } };
        const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
        expect(await pwaService.activateUpdate()).toBe(false);
        expect(postMessage).not.toHaveBeenCalled();
        expect(alert).toHaveBeenCalledWith(expect.stringContaining('Save or export'));
        alert.mockRestore();
        pwaService.registration = null;
        document.body.innerHTML = '';
    });

    it('waits during worker installation and only skips waiting on explicit request', async () => {
        const listeners = {};
        const skipWaiting = vi.fn();
        const self = { location: { origin: 'https://markups.dev' }, addEventListener: (name, callback) => { listeners[name] = callback; }, skipWaiting };
        const addAll = vi.fn(async () => {});
        runInNewContext(readFileSync(resolve('public/sw.js'), 'utf8'), {
            self, console, URL, Response,
            fetch: async () => ({ ok: true, json: async () => ['/assets/lazy.js', 'https://external.example/private.js'] }),
            caches: { open: async () => ({ addAll, match: async () => ({ text: async () => '<script src="/assets/main.js"></script><link href="https://external.example/font.css">' }) }) }
        });
        let installation;
        listeners.install({ waitUntil: promise => { installation = promise; } });
        await installation;
        expect(skipWaiting).not.toHaveBeenCalled();
        expect(addAll).toHaveBeenCalledWith(['https://markups.dev/assets/main.js']);
        expect(addAll).toHaveBeenLastCalledWith(['/assets/lazy.js']);
        listeners.message({ data: { type: 'SKIP_WAITING' } });
        expect(skipWaiting).toHaveBeenCalledOnce();
    });
});
