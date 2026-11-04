// @vitest-environment node
import { generateKeyPairSync } from 'node:crypto';
import { describe, it, expect, vi } from 'vitest';
import { createConnectorHandler } from '../../appwrite/functions/connector-api/index.js';

const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const privateKey = keys.privateKey.export({ format: 'pem', type: 'pkcs8' });
const json = data => new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
function fixture(entries) {
    const fetchFn = vi.fn(async (url) => {
        if (url.endsWith('/account')) return json({ $id: 'alice', status: true });
        if (url.endsWith('/identities')) return json({ identities: [{ provider: 'github', userId: 'alice', providerUid: '42' }] });
        if (url.includes('/app/installations?')) return json([{ id: 7, account: { type: 'User', id: 42 }, repository_selection: 'selected' }]);
        if (url.endsWith('/access_tokens')) return json({ token: 'private-token' });
        if (url.includes('/installation/repositories?')) return json({ repositories: [{ id: 15, full_name: 'owner/notes' }] });
        if (url.includes('/contents/')) return json(entries);
        throw new Error('Unexpected URL');
    });
    const handler = createConnectorHandler({ env: { APPWRITE_ENDPOINT: 'https://sgp.cloud.appwrite.io/v1', APPWRITE_PROJECT_ID: 'markup', GITHUB_APP_ID: '123', GITHUB_APP_PRIVATE_KEY: privateKey, GITHUB_APP_SLUG: 'markups' }, fetchFn });
    const call = (input = {}) => handler({ req: { method: 'POST', headers: { 'x-markups-user-jwt': 'a.b.c' }, bodyText: JSON.stringify({ action: 'github.files', repository: 'owner/notes', branch: 'main', path: '', ...input }) }, res: { json: (data, status) => ({ data, status }) } });
    return { call, fetchFn };
}
describe('authenticated bounded GitHub directory browsing', () => {
    it('returns only direct Markdown/text files and directories without token/provider URLs', async () => {
        const { call, fetchFn } = fixture([
            { type: 'dir', name: 'notes', path: 'notes', url: 'https://api.github.com/private' },
            { type: 'file', name: 'README.md', path: 'README.md' },
            { type: 'file', name: 'app.js', path: 'app.js' },
            { type: 'symlink', name: 'link.md', path: 'link.md', target: '/secret' },
            { type: 'file', name: 'escape.md', path: '../escape.md' }
        ]);
        const result = await call();
        expect(result.status).toBe(200);
        expect(result.data.data.files).toEqual([{ type: 'dir', name: 'notes', path: 'notes' }, { type: 'file', name: 'README.md', path: 'README.md' }]);
        expect(JSON.stringify(result)).not.toMatch(/private-token|api.github.com/);
        const mint = fetchFn.mock.calls.filter(([url]) => url.endsWith('/access_tokens')).at(-1)[1];
        expect(JSON.parse(mint.body)).toMatchObject({ repository_ids: [15], permissions: { contents: 'read' } });
    });
    it('rejects traversal, arbitrary URLs and repositories outside selected installation', async () => {
        const { call, fetchFn } = fixture([]);
        for (const path of ['../secret', '/root', 'notes/../secret', 'notes%2Fsecret', 'https://evil.test', 'notes\\secret']) {
            expect((await call({ path })).data.error.code).toBe('INVALID_PATH');
        }
        expect((await call({ repository: 'other/secret' })).status).toBe(403);
        expect(fetchFn.mock.calls.some(([url]) => url.includes('/contents/'))).toBe(false);
    });
    it('bounds output and flags incomplete folders rather than silently claiming all files', async () => {
        const { call } = fixture(Array.from({ length: 201 }, (_, i) => ({ type: 'file', name: `${i}.md`, path: `notes/${i}.md` })));
        const result = await call({ path: 'notes' });
        expect(result.data.data.files).toHaveLength(200);
        expect(result.data.data.truncated).toBe(true);
    });
});
