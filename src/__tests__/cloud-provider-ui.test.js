import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({ drive: null, github: null }));
vi.mock('../services/connectors/index.js', () => ({
    GoogleDriveConnector: class {
        constructor() {
            this.connected = false;
            this.prepare = vi.fn(async () => {});
            this.connect = vi.fn(async () => { this.connected = true; });
            this.pick = vi.fn(async () => ({ id: 'file1', name: 'note.md' }));
            this.save = vi.fn(async () => ({ id: 'created', name: 'Draft.md' }));
            this.open = vi.fn(async () => ({ id: 'file1', name: 'note.md', content: '# remote' }));
            this.disconnect = vi.fn(async () => { this.connected = false; return { revoked: true }; });
            this.clearSession = vi.fn(() => { this.connected = false; });
            fixture.drive = this;
        }
    },
    GitHubConnector: class {
        constructor() {
            this.status = vi.fn(async () => ({ configured: true }));
            this.repositories = vi.fn(async () => ({ repositories: [{ fullName: 'owner/notes' }] }));
            this.branches = vi.fn(async () => ({ branches: [{ name: 'main' }] }));
            this.files = vi.fn(async ({ path }) => ({ files: path ? [{ type: 'file', path: 'docs/note.md', name: 'note.md' }] : [{ type: 'dir', path: 'docs', name: 'docs' }] }));
            this.open = vi.fn(async target => ({ ...target, content: '# remote', sha: 'a'.repeat(40) }));
            this.save = vi.fn(async target => ({ ...target, sha: 'b'.repeat(40) }));
            fixture.github = this;
        }
    }
}));
import { initializeCloudAccount } from '../features/cloud/index.js';

describe('optional provider UI', () => {
    let dispose;
    const client = { config: { authConfigured: false, cloudConfigured: false } };
    const settle = async () => { await vi.waitFor(() => expect(document.querySelector('#cloud-account-status')).not.toBeNull()); await new Promise(resolve => setTimeout(resolve, 0)); };
    const start = (activeClient = client, options = {}) => {
        document.body.innerHTML = '<button id="cloud-account-btn">Connections</button>';
        dispose = initializeCloudAccount({ client: activeClient, getCurrentDocument: () => ({ noteId: 1, title: 'Draft', content: '# local' }), ...options });
        document.querySelector('#cloud-account-btn').click();
    };
    const connect = async () => {
        document.querySelector('#drive-prepare').click(); await settle();
        document.querySelector('#drive-connect').click(); await settle();
    };
    const signedInClient = { config: { authConfigured: true, cloudConfigured: false }, getCurrentUser: async () => ({ $id: 'alice' }) };
    const selectGitHub = async () => {
        await settle();
        document.querySelector('#github-load-repositories').click(); await settle();
        const repository = document.querySelector('#github-repository');
        repository.value = 'owner/notes'; repository.dispatchEvent(new Event('change')); await settle();
        const branch = document.querySelector('#github-branch');
        branch.value = 'main'; branch.dispatchEvent(new Event('change')); await settle();
        const path = document.querySelector('#github-path');
        path.value = 'docs/note.md'; path.dispatchEvent(new Event('input'));
    };
    beforeEach(() => { vi.stubEnv('VITE_GOOGLE_DRIVE_CLIENT_ID', 'client'); vi.stubEnv('VITE_GOOGLE_DRIVE_API_KEY', 'key'); vi.stubEnv('VITE_GOOGLE_DRIVE_APP_ID', '123'); });
    afterEach(() => { dispose?.(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

    it('hides unavailable actions and explains setup without contacting Google', () => {
        vi.stubEnv('VITE_GOOGLE_DRIVE_CLIENT_ID', ''); start();
        expect(document.querySelector('#drive-actions').hidden).toBe(true);
        expect(document.querySelector('#drive-selected').textContent).toContain('No Google account access');
        expect(fixture.drive.prepare).not.toHaveBeenCalled();
    });
    it('saves a new file after consent without selecting an existing Drive file', async () => {
        start(); await connect();
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        document.querySelector('#drive-save').click(); await settle();
        expect(fixture.drive.pick).not.toHaveBeenCalled();
        expect(fixture.drive.save).toHaveBeenCalledWith({ name: 'Draft', content: '# local' });
        expect(document.querySelector('#drive-connect').disabled).toBe(true);
    });
    it('does not send a document when save confirmation is declined', async () => {
        start(); await connect(); vi.spyOn(window, 'confirm').mockReturnValue(false);
        document.querySelector('#drive-save').click(); await settle();
        expect(fixture.drive.save).not.toHaveBeenCalled();
        expect(document.querySelector('#cloud-account-status').textContent).not.toContain('save completed');
    });
    it('does not leave import/save enabled after disconnecting', async () => {
        start(); await connect(); document.querySelector('#drive-pick').click(); await settle();
        expect(document.querySelector('#drive-open').disabled).toBe(false);
        document.querySelector('#drive-disconnect').click(); await settle();
        expect(document.querySelector('#drive-open').disabled).toBe(true);
        expect(document.querySelector('#drive-save').disabled).toBe(true);
    });
    it('restores focus to the actual header trigger on close', () => {
        start(); document.querySelector('[data-close-cloud]').click();
        expect(document.activeElement).toBe(document.querySelector('#cloud-account-btn'));
    });
    it('browses a selected repository and folder before choosing a file path', async () => {
        start({ config: { authConfigured: true, cloudConfigured: false }, getCurrentUser: async () => ({ $id: 'alice' }) });
        await settle();
        document.querySelector('#github-load-repositories').click(); await settle();
        const repository = document.querySelector('#github-repository');
        repository.value = 'owner/notes'; repository.dispatchEvent(new Event('change')); await settle();
        const branch = document.querySelector('#github-branch');
        branch.value = 'main'; branch.dispatchEvent(new Event('change')); await settle();
        document.querySelector('#github-browse').click(); await settle();
        expect(fixture.github.files).toHaveBeenCalledWith({ repository: 'owner/notes', branch: 'main', path: '', expectedUserId: 'alice' });
        document.querySelector('#github-files button').click(); await settle();
        expect(document.querySelector('#github-folder').textContent).toBe('Folder: docs');
        document.querySelector('#github-files button').click();
        expect(document.querySelector('#github-path').value).toBe('docs/note.md');
        expect(document.querySelector('#github-open').disabled).toBe(false);
        expect(document.querySelector('#github-save').disabled).toBe(false);
    });

    it.each(['drive', 'github'])('%s does not send an old snapshot after the panel closes', async provider => {
        let release;
        const portable = new Promise(resolve => { release = resolve; });
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
        start(provider === 'github' ? signedInClient : client, { getPortableMarkdown: () => portable });
        if (provider === 'github') await selectGitHub(); else await connect();
        document.querySelector(`#${provider}-save`).click(); await settle();
        document.querySelector('[data-close-cloud]').click();
        release('# local'); await settle();
        expect(fixture[provider].save).not.toHaveBeenCalled();
        expect(confirm).not.toHaveBeenCalled();
        expect(document.querySelector('#cloud-account-status').textContent).toContain('panel was closed');
    });

    it.each([['drive', 'identity'], ['drive', 'content'], ['github', 'identity'], ['github', 'content']])('%s does not send a stale note after its %s changes', async (provider, change) => {
        let release;
        let active = { noteId: 1, title: 'Private draft', content: '# private' };
        const portable = new Promise(resolve => { release = resolve; });
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
        start(provider === 'github' ? signedInClient : client, { getCurrentDocument: () => active, getPortableMarkdown: () => portable });
        if (provider === 'github') await selectGitHub(); else await connect();
        document.querySelector(`#${provider}-save`).click(); await settle();
        active = change === 'identity'
            ? { noteId: 2, title: 'Public draft', content: '# public' }
            : { ...active, content: '# latest edit' };
        release('# private'); await settle();
        expect(fixture[provider].save).not.toHaveBeenCalled();
        expect(confirm).not.toHaveBeenCalled();
        expect(document.querySelector('#cloud-account-status').textContent).toContain('active document changed');
    });

    it.each(['drive', 'github'])('%s checks the source again after confirmation', async provider => {
        let active = { noteId: 1, title: 'Draft', content: '# local' };
        vi.spyOn(window, 'confirm').mockImplementation(() => { active = { ...active, content: '# newer edit' }; return true; });
        start(provider === 'github' ? signedInClient : client, { getCurrentDocument: () => active });
        if (provider === 'github') await selectGitHub(); else await connect();
        document.querySelector(`#${provider}-save`).click(); await settle();
        expect(fixture[provider].save).not.toHaveBeenCalled();
    });

    it.each(['drive', 'github'])('%s does not claim an import succeeded when local storage refuses it', async provider => {
        start(provider === 'github' ? signedInClient : client, { openCloudDocument: async () => null });
        if (provider === 'github') await selectGitHub();
        else { await connect(); document.querySelector('#drive-pick').click(); await settle(); }
        document.querySelector(`#${provider}-open`).click(); await settle();
        expect(document.querySelector('#cloud-account-status').textContent).toContain('could not be saved as a local document');
        if (provider === 'github') {
            expect(document.querySelector('#github-path').value).toBe('');
            expect(document.querySelector('#github-save').disabled).toBe(true);
            vi.spyOn(window, 'confirm').mockReturnValue(true);
            document.querySelector('#github-save').click(); await settle();
            expect(fixture.github.save).not.toHaveBeenCalled();
        }
    });

    it('binds GitHub save-back to the successfully imported local note', async () => {
        let active = { noteId: 1, title: 'Original', content: '# original' };
        start(signedInClient, { getCurrentDocument: () => active, openCloudDocument: async ({ title, content }) => {
            active = { noteId: 7, title, content }; return { noteId: 7 };
        } });
        await selectGitHub();
        document.querySelector('#github-open').click(); await settle();
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        document.querySelector('#github-save').click(); await settle();
        expect(fixture.github.save).toHaveBeenCalledWith(expect.objectContaining({ expectedSha: 'a'.repeat(40), content: '# remote' }));
        fixture.github.save.mockClear();
        active = { noteId: 8, title: 'Unrelated', content: '# unrelated' };
        document.querySelector('#github-save').click(); await settle();
        expect(fixture.github.save).not.toHaveBeenCalled();
        expect(document.querySelector('#cloud-account-status').textContent).toContain('different local document');
    });
});
