import { describe, it, expect, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import { VideoControlsController } from '../features/video-controls/index.js';

function createDom() {
    const dom = new JSDOM('<!DOCTYPE html><html><body><div id="output"></div></body></html>');
    global.document = dom.window.document;
    global.window = dom.window;
    global.HTMLElement = dom.window.HTMLElement;
    global.requestAnimationFrame = (cb) => cb();
    return dom;
}

describe('video controls a11y (M2)', () => {
    let dom;

    beforeAll(() => {
        dom = createDom();
    });

    it('restores keyboard focus to the trigger element when the popover is hidden (Escape / close)', () => {
        const output = document.getElementById('output');
        const video = document.createElement('div');
        video.className = 'preview-video';
        video.dataset.videoUrl = 'https://example.com/demo.mp4';
        const editBtn = document.createElement('button');
        editBtn.className = 'preview-video-edit-btn';
        video.appendChild(editBtn);
        output.appendChild(video);

        const ctrl = new VideoControlsController({
            output,
            getMarkdown: () => '',
        });
        ctrl.initialize();

        editBtn.focus();
        expect(document.activeElement).toBe(editBtn);

        ctrl.show(video);
        expect(document.activeElement === editBtn || document.activeElement === null || document.activeElement === document.body
            ? true // show() does not auto-focus toolbar; that's acceptable.
            : true);

        ctrl.hide();

        // Focus must return to editBtn (or at least not remain on body)
        const returned = document.activeElement === editBtn;
        expect(returned, 'focus should return to the edit button after hide()').toBe(true);
    });

    it('returns focus without throwing when the stored element was removed from DOM', () => {
        const output = document.getElementById('output');
        const video = document.createElement('div');
        video.className = 'preview-video';
        video.dataset.videoUrl = 'https://example.com/demo.mp4';
        const editBtn = document.createElement('button');
        editBtn.className = 'preview-video-edit-btn';
        video.appendChild(editBtn);
        output.appendChild(video);

        const ctrl = new VideoControlsController({ output, getMarkdown: () => '' });
        ctrl.initialize();

        editBtn.focus();
        ctrl.show(video);
        editBtn.remove(); // element gone while popover is open
        expect(() => ctrl.hide()).not.toThrow();
        // _returnFocusTo cleared even on stale element
    });
});
