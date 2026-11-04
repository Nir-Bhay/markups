// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { generateKeyPairSync, createVerify, createHmac } from 'node:crypto';
import { GoogleDriveConnector, DRIVE_SCOPE } from '../services/connectors/google-drive.js';
import { GitHubConnector } from '../services/connectors/github.js';
import { readBoundedText, validatePath } from '../services/connectors/shared.js';
import { createConnectorHandler, createGitHubAppJwt, verifyGitHubWebhook } from '../../appwrite/functions/connector-api/index.js';

const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
const keyPair = generateKeyPairSync('rsa', { modulusLength: 2048 });
const privateKey = keyPair.privateKey.export({ format: 'pem', type: 'pkcs8' });
const sha = 'a'.repeat(40);
const env = { APPWRITE_ENDPOINT: 'https://sgp.cloud.appwrite.io/v1', APPWRITE_PROJECT_ID: 'markup', GITHUB_APP_ID: '123', GITHUB_APP_PRIVATE_KEY: privateKey, GITHUB_APP_SLUG: 'markups' };

function googleFixture(fetchFn = vi.fn(), options = {}) {
    const state = {};
    const google = { picker: {}, accounts: { oauth2: {
        initTokenClient: options => ({ requestAccessToken: () => { state.options = options; options.callback({ access_token: 'private-token', expires_in: 3600, scope: DRIVE_SCOPE }); } }),
        hasGrantedAllScopes: () => true,
        revoke: (_token, callback) => callback({})
    } } };
    return { connector: new GoogleDriveConnector({ clientId: 'client', apiKey: 'restricted-key', appId: '123', google, fetchFn, ...options }), google, state };
}

function backendFixture({ userId = 'user-a', providerUid = '42', remoteSha = sha, putStatus = 200, configured = true, blobBody = null } = {}) {
    const fetchFn = vi.fn(async (url, options = {}) => {
        if (url.endsWith('/account')) return json({ $id: userId, status: true });
        if (url.endsWith('/account/identities')) return json({ identities: [{ userId, provider: 'github', providerUid, providerAccessToken: 'must-never-be-returned' }] });
        if (url.includes('/app/installations?')) return json([{ id: 7, account: { id: 42, type: 'User' }, repository_selection: 'selected' }, { id: 8, account: { id: 99, type: 'User' }, repository_selection: 'selected' }]);
        if (url.endsWith('/access_tokens')) return json({ token: 'installation-secret' });
        if (url.includes('/installation/repositories?')) return json({ repositories: [{ id: 15, full_name: 'owner/notes', default_branch: 'main', private: true }] });
        if (url.includes('/branches?')) return json([{ name: 'main', protected: true }]);
        if (url.includes('/git/blobs/')) return json({ sha: remoteSha, encoding: 'base64', content: Buffer.from(blobBody).toString('base64') });
        if (url.includes('/contents/')) {
            if (options.method === 'PUT') return putStatus === 200 ? json({ content: { sha: 'b'.repeat(40) }, commit: { sha: 'c'.repeat(40) } }) : json({}, putStatus);
            return remoteSha ? json({ type: 'file', sha: remoteSha, size: blobBody ? Buffer.byteLength(blobBody) : 7, encoding: blobBody ? 'none' : 'base64', content: blobBody ? '' : Buffer.from('# Hello').toString('base64') }) : json({}, 404);
        }
        if (url.endsWith('/app/installations/7') && options.method === 'DELETE') return new Response(null, { status: 204 });
        throw new Error('Unexpected test URL: ' + url);
    });
    const handler = createConnectorHandler({ env: configured ? env : { APPWRITE_ENDPOINT: env.APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID: env.APPWRITE_PROJECT_ID }, fetchFn });
    async function call(body, headers = { 'x-markups-user-jwt': 'one.two.three' }) {
        return handler({ req: { method: 'POST', headers, bodyText: JSON.stringify(body) }, res: { json: (data, status, responseHeaders) => ({ data, status, headers: responseHeaders }) } });
    }
    return { handler, call, fetchFn };
}

describe('foreground Google Drive connector', () => {
    it('authenticates with the bearer token without cookies or document referrers', async () => {
        const fetchFn = vi.fn(async () => json({ id: 'file1' }));
        const { connector } = googleFixture(fetchFn);
        await connector.connect();
        await connector.request('https://www.googleapis.com/drive/v3/files/file1', {
            credentials: 'include', referrerPolicy: 'unsafe-url', redirect: 'follow'
        });
        expect(fetchFn).toHaveBeenCalledWith('https://www.googleapis.com/drive/v3/files/file1', expect.objectContaining({
            credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error',
            headers: expect.objectContaining({ Authorization: 'Bearer private-token' })
        }));
    });
    it('does no work without public provider setup and keeps the token only in memory', async () => {
        const fetchFn = vi.fn();
        await expect(new GoogleDriveConnector({ fetchFn }).connect()).rejects.toMatchObject({ code: 'SETUP_REQUIRED' });
        expect(fetchFn).not.toHaveBeenCalled();
        const { connector, state } = googleFixture(fetchFn);
        await connector.connect();
        expect(state.options.scope).toBe(DRIVE_SCOPE);
        expect(state.options.include_granted_scopes).toBe(false);
        expect(connector.connected).toBe(true);
        expect(await connector.disconnect()).toEqual({ revoked: true });
        expect(connector.connected).toBe(false);
    });

    it('rejects arbitrary URLs/file paths and refuses overwrite without a strong ETag', async () => {
        const { connector } = googleFixture(undefined, { conditionalUpdateVerified: true });
        await expect(connector.open('https://evil.test/file')).rejects.toMatchObject({ code: 'INVALID_FILE' });
        await expect(connector.save({ name: 'a.md', content: 'draft', fileId: 'file1' })).rejects.toMatchObject({ code: 'CONDITIONAL_UPDATE_UNAVAILABLE' });
        await expect(connector.save({ name: 'a.md', content: 'draft', fileId: 'file1', expectedETag: 'W/"weak"' })).rejects.toMatchObject({ code: 'CONDITIONAL_UPDATE_UNAVAILABLE' });
    });

    it('blocks Drive overwrites by default until conditional-write behavior is verified', async () => {
        const fetchFn = vi.fn();
        const { connector } = googleFixture(fetchFn);
        await connector.connect();
        await expect(connector.save({ name: 'note.md', content: '# Local', fileId: 'file1', expectedETag: '"revision-1"' })).rejects.toMatchObject({ code: 'CONDITIONAL_UPDATE_UNVERIFIED' });
        expect(fetchFn).not.toHaveBeenCalled();
    });

    it('sends a conditional update and preserves local content on 412', async () => {
        const fetchFn = vi.fn(async () => json({}, 412));
        const { connector } = googleFixture(fetchFn, { conditionalUpdateVerified: true });
        await connector.connect();
        await expect(connector.save({ name: 'note.md', content: '# Local', fileId: 'file1', expectedETag: '"revision-1"' })).rejects.toMatchObject({ code: 'CONFLICT' });
        const [url, request] = fetchFn.mock.calls[0];
        expect(url).toContain('/upload/drive/v3/files/file1?');
        expect(url).not.toContain('private-token');
        expect(request.headers['If-Match']).toBe('"revision-1"');
        expect(request.headers.Authorization).toBe('Bearer private-token');
        expect(request.body).toContain('# Local');
        expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('clears expired/revoked tokens and rejects nonportable local media before networking', async () => {
        const fetchFn = vi.fn(async () => json({}, 401));
        const { connector } = googleFixture(fetchFn);
        await connector.connect();
        await expect(connector.save({ name: 'a.md', content: '![image](markups-img:img_123)' })).rejects.toMatchObject({ code: 'LOCAL_MEDIA' });
        expect(fetchFn).not.toHaveBeenCalled();
        await expect(connector.open('file1')).rejects.toMatchObject({ code: 'AUTH_EXPIRED' });
        expect(connector.connected).toBe(false);
        await expect(connector.open('file1')).rejects.toMatchObject({ code: 'AUTH_EXPIRED' });
        expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('returns the saved strong ETag for the next conditional save and drops weak tokens', async () => {
        const fetchFn = vi.fn()
            .mockResolvedValueOnce(json({ id: 'file1', name: 'note.md', version: '1' }, 200, { ETag: '"revision-1"' }))
            .mockResolvedValueOnce(json({ id: 'file1', name: 'note.md', version: '2' }, 200, { ETag: '"revision-2"' }))
            .mockResolvedValueOnce(json({ id: 'file1', name: 'note.md', version: '3' }, 200, { ETag: 'W/"weak"' }));
        const { connector } = googleFixture(fetchFn, { conditionalUpdateVerified: true });
        await connector.connect();
        const first = await connector.save({ name: 'note.md', content: '# First' });
        expect(first).toMatchObject({ id: 'file1', version: '1', etag: '"revision-1"' });
        const second = await connector.save({ name: first.name, content: '# Second', fileId: first.id, expectedETag: first.etag });
        expect(fetchFn.mock.calls[1][1].headers['If-Match']).toBe('"revision-1"');
        expect(second.etag).toBe('"revision-2"');
        const third = await connector.save({ name: second.name, content: '# Third', fileId: second.id, expectedETag: second.etag });
        expect(third.etag).toBeNull();
        await expect(connector.save({ name: third.name, content: '# Fourth', fileId: third.id, expectedETag: third.etag })).rejects.toMatchObject({ code: 'CONDITIONAL_UPDATE_UNAVAILABLE' });
        expect(fetchFn).toHaveBeenCalledTimes(3);
    });

    it('enforces streamed remote-size limits without trusting Content-Length', async () => {
        await expect(readBoundedText(new Response('0123456789'), 5)).rejects.toMatchObject({ code: 'DOCUMENT_TOO_LARGE' });
    });

    it('does not deliver a stale result after sign-out while a request is running', async () => {
        let finish;
        const fetchFn = vi.fn(() => new Promise(resolve => { finish = resolve; }));
        const { connector } = googleFixture(fetchFn);
        await connector.connect();
        const pending = connector.open('file1');
        connector.clearSession();
        finish(json({ id: 'file1', name: 'note.md', mimeType: 'text/markdown' }));
        await expect(pending).rejects.toMatchObject({ code: 'CANCELLED' });
        expect(fetchFn.mock.calls[0][1].signal.aborted).toBe(true);
    });
});

describe('GitHub browser adapter', () => {
    it('browses root and relative folders without accepting traversal or URLs', async () => {
        const request = vi.fn(async () => ({ files: [] }));
        const connector = new GitHubConnector({ request });
        await connector.files({ repository: 'owner/notes', branch: 'main', expectedUserId: 'alice' });
        expect(request).toHaveBeenCalledWith('github.files', { repository: 'owner/notes', branch: 'main', path: '' }, { expectedUserId: 'alice' });
        await connector.files({ repository: 'owner/notes', branch: 'main', path: 'docs/guides' });
        expect(() => connector.files({ repository: 'owner/notes', branch: 'main', path: '../private' })).toThrow();
        expect(() => connector.files({ repository: 'owner/notes', branch: 'main', path: 'https://evil.test' })).toThrow();
    });
    it('requires review and validates destinations before invoking the service', async () => {
        const request = vi.fn();
        const connector = new GitHubConnector({ request });
        expect(() => connector.save({})).toThrow(/Review/);
        for (const path of ['../secret.md', '/README.md', '.github/workflows/run.yml', 'a%2fb.md', 'a\\b.md']) expect(() => validatePath(path)).toThrow();
        expect(() => connector.save({ repository: 'https://evil/repo', branch: 'main', path: 'README.md', content: 'x', message: 'save', confirmed: true })).toThrow();
        expect(request).not.toHaveBeenCalled();
    });

    it('passes an explicit expected SHA and surfaces a server conflict', async () => {
        const request = vi.fn(async () => ({ ok: false, error: { code: 'CONFLICT', message: 'remote changed' } }));
        const connector = new GitHubConnector({ request });
        await expect(connector.save({ repository: 'owner/notes', branch: 'draft/note', path: 'README.md', content: '# local', message: 'Save note', expectedSha: sha, confirmed: true })).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(request).toHaveBeenCalledWith('github.save', expect.objectContaining({ expectedSha: sha, confirmed: true }));
    });

    it('binds each GitHub action to the Markups account that initiated it', async () => {
        const request = vi.fn(async () => ({ repositories: [] }));
        const connector = new GitHubConnector({ request });
        await connector.repositories('alice');
        expect(request).toHaveBeenCalledWith('github.repositories', {}, { expectedUserId: 'alice' });
    });
});

describe('authenticated GitHub App connector service', () => {
    it('signs a bounded RS256 app JWT and verifies webhook signatures', () => {
        const jwt = createGitHubAppJwt({ appId: '123', privateKey, now: 1_000_000 });
        const [header, payload, signature] = jwt.split('.');
        const verify = createVerify('RSA-SHA256'); verify.update(header + '.' + payload);
        expect(verify.verify(keyPair.publicKey, signature, 'base64url')).toBe(true);
        expect(JSON.parse(Buffer.from(payload, 'base64url').toString())).toEqual({ iss: '123', iat: 940, exp: 1540 });
        const raw = '{"action":"deleted"}';
        const signed = 'sha256=' + createHmac('sha256', 'secret').update(raw).digest('hex');
        expect(verifyGitHubWebhook(raw, signed, 'secret')).toBe(true);
        expect(verifyGitHubWebhook(raw + ' ', signed, 'secret')).toBe(false);
        expect(verifyGitHubWebhook(raw, 'sha256=bad', 'secret')).toBe(false);
    });

    it('requires a verifiable user JWT and reports absent provider setup honestly', async () => {
        const { call, fetchFn } = backendFixture({ configured: false });
        expect((await call({ action: 'github.repositories' }, {})).status).toBe(401);
        expect(fetchFn).not.toHaveBeenCalled();
        expect((await call({ action: 'github.status' })).data.data.configured).toBe(false);
        expect((await call({ action: 'github.repositories' })).data.error.code).toBe('SETUP_REQUIRED');
    });

    it('derives personal installation access from verified Appwrite identities', async () => {
        const { call } = backendFixture({ providerUid: '1000' });
        expect((await call({ action: 'github.open', repository: 'owner/notes', branch: 'main', path: 'README.md', installationId: '7' })).status).toBe(403);
        expect((await call({ action: 'github.uninstall', installationId: '7', confirmed: true })).status).toBe(403);
    });

    it('does not return provider credentials and uses only selected installations', async () => {
        const { call, fetchFn } = backendFixture();
        const result = await call({ action: 'github.repositories' });
        expect(result.data.data.repositories).toHaveLength(1);
        expect(JSON.stringify(result)).not.toMatch(/installation-secret|must-never-be-returned/);
        expect(fetchFn.mock.calls.some(([url]) => url.includes('/installations/8/'))).toBe(false);
        const accountRequest = fetchFn.mock.calls.find(([url]) => url.endsWith('/account'))[1];
        expect(accountRequest.headers['X-Appwrite-JWT']).toBe('one.two.three');
    });

    it('refuses stale or missing SHA without submitting a write', async () => {
        const { call, fetchFn } = backendFixture();
        const result = await call({ action: 'github.save', repository: 'owner/notes', branch: 'main', path: 'README.md', content: '# Local', message: 'save', expectedSha: null, confirmed: true });
        expect(result.status).toBe(409);
        expect(result.data.error.code).toBe('CONFLICT');
        expect(fetchFn.mock.calls.some(([, options]) => options.method === 'PUT')).toBe(false);
    });

    it('writes the reviewed SHA and converts a race/protected-branch rejection to a conflict', async () => {
        const { call, fetchFn } = backendFixture({ putStatus: 409 });
        const result = await call({ action: 'github.save', repository: 'owner/notes', branch: 'main', path: 'README.md', content: '# Local', message: 'save', expectedSha: sha, confirmed: true });
        expect(result.status).toBe(409);
        const put = fetchFn.mock.calls.find(([, options]) => options.method === 'PUT')[1];
        expect(JSON.parse(put.body)).toMatchObject({ sha, branch: 'main', content: Buffer.from('# Local').toString('base64') });
        const minted = fetchFn.mock.calls.filter(([url]) => url.endsWith('/access_tokens')).at(-1)[1];
        expect(JSON.parse(minted.body)).toMatchObject({ repository_ids: [15], permissions: { contents: 'write' } });
    });

    it('reads a large file through its immutable blob SHA instead of a mutable raw URL', async () => {
        const body = '# Large\n' + 'x'.repeat(1024 * 1024);
        const { call, fetchFn } = backendFixture({ blobBody: body });
        const result = await call({ action: 'github.open', repository: 'owner/notes', branch: 'main', path: 'README.md' });
        expect(result.status).toBe(200);
        expect(result.data.data.content).toBe(body);
        expect(fetchFn.mock.calls.some(([url]) => url === 'https://api.github.com/repos/owner/notes/git/blobs/' + sha)).toBe(true);
    });

    it('creates a genuinely new file without a SHA and rejects malformed paths server-side', async () => {
        const { call, fetchFn } = backendFixture({ remoteSha: null });
        const bad = await call({ action: 'github.open', repository: 'owner/notes', branch: 'main', path: '../secret.md' });
        expect(bad.data.error.code).toBe('INVALID_PATH');
        const result = await call({ action: 'github.save', repository: 'owner/notes', branch: 'draft/new', path: 'new.md', content: '# New', message: 'save new', expectedSha: null, confirmed: true });
        expect(result.status).toBe(200);
        const put = fetchFn.mock.calls.find(([, options]) => options.method === 'PUT')[1];
        expect(JSON.parse(put.body)).not.toHaveProperty('sha');
    });

    it('rejects an unselected repository and unsigned webhooks', async () => {
        const { call, handler, fetchFn } = backendFixture();
        expect((await call({ action: 'github.open', repository: 'someone/secret', branch: 'main', path: 'README.md' })).status).toBe(403);
        const before = fetchFn.mock.calls.length;
        const result = await handler({ req: { method: 'POST', path: '/webhooks/github', bodyText: '{}', headers: {} }, res: { json: (data, status) => ({ data, status }) } });
        expect(result.status).toBe(403);
        expect(fetchFn.mock.calls.length).toBe(before);
    });
});
