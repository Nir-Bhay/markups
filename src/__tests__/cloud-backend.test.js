// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { createCloudService, DEFAULT_LIMITS, POLICY_VERSION, rowId } from '../../appwrite/functions/cloud-api/src/service.js';
import { createAppwriteRest, createAppwriteStore } from '../../appwrite/functions/cloud-api/src/appwrite-store.js';
import { createFunctionHandler } from '../../appwrite/functions/cloud-api/src/main.js';

const id = (n) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
function isolatedStore() {
    let tables = { control: { pilot: { $id: 'pilot', bytes: 0, users: 0, guard: 'initial' } }, users: {}, documents: {}, operations: {} };
    let tail = Promise.resolve();
    const view = (state) => ({
        async get(table, key) { return structuredClone(state[table][key] || null); },
        async list(table, owner, { limit = 25, expiresBefore } = {}) { return Object.values(state[table]).filter(r => r.ownerId === owner && (expiresBefore === undefined || r.expiresAt < expiresBefore)).slice(0, limit).map(r => structuredClone(r)); },
        async put(table, key, data, { create = false, owner } = {}) {
            if (create && state[table][key]) throw new Error('duplicate');
            state[table][key] = { ...state[table][key], ...structuredClone(data), $id: key, ...(create ? { $permissions: owner ? ['read("user:' + owner + '")'] : [] } : {}) };
        },
        async delete(table, key) { delete state[table][key]; }
    });
    return {
        get: (...args) => view(tables).get(...args), list: (...args) => view(tables).list(...args),
        async transaction(fn) {
            const previous = tail;
            let release;
            tail = new Promise(resolve => { release = resolve; });
            await previous;
            const draft = structuredClone(tables);
            try { const result = await fn(view(draft)); tables = draft; return result; } finally { release(); }
        },
        inspect: () => structuredClone(tables),
        seed(table, key, data) { tables[table][key] = { ...data, $id: key }; }
    };
}
function setup(extraLimits = {}) {
    const store = isolatedStore();
    let time = Date.UTC(2026, 9, 28);
    const service = createCloudService({ store, enabled: true, enrolled: ['alice', 'bob'], limits: { ...DEFAULT_LIMITS, ...extraLimits }, now: () => time });
    const grant = (documentId, owner = 'alice') => service.handle(owner, { action: 'consent.grant', documentId, policyVersion: POLICY_VERSION });
    const save = (documentId, content, expectedRevision = 0, operationId = id(900), owner = 'alice', title = '') => service.handle(owner, { action: 'documents.save', documentId, title, content, expectedRevision, operationId });
    return { store, service, grant, save, advance: (ms) => { time += ms; } };
}

describe('cloud backup data boundaries', () => {
    it('requires explicit document consent and rejects forged identity fields', async () => {
        const s = setup();
        await expect(s.save(id(1), 'private')).rejects.toMatchObject({ code: 'CONSENT_REQUIRED' });
        await expect(s.service.handle('alice', { action: 'consent.get', ownerId: 'bob' })).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
        await expect(s.service.handle('', { action: 'documents.list' })).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
        expect(s.store.inspect().documents).toEqual({});
    });
    it('keeps reads and mutations scoped to the verified user', async () => {
        const s = setup(); await s.grant(id(1)); await s.save(id(1), 'alice text');
        await expect(s.service.handle('bob', { action: 'documents.get', documentId: id(1) })).rejects.toMatchObject({ code: 'NOT_FOUND' });
        expect(await s.service.handle('bob', { action: 'documents.list' })).toEqual({ documents: [] });
        await expect(s.service.handle('bob', { action: 'documents.delete', documentId: id(1), expectedRevision: 1, operationId: id(901) })).rejects.toMatchObject({ code: 'REVISION_CONFLICT' });
        const row = Object.values(s.store.inspect().documents)[0];
        expect(row.$permissions).toEqual(['read("user:alice")']);
    });
    it('revocation stops saves but preserves owner export and deletion', async () => {
        const s = setup(); await s.grant(id(1)); await s.save(id(1), 'local still safe');
        await s.service.handle('alice', { action: 'consent.revoke', documentId: id(1) });
        await expect(s.save(id(1), 'changed', 1, id(901))).rejects.toMatchObject({ code: 'CONSENT_REQUIRED' });
        expect((await s.service.handle('alice', { action: 'documents.get', documentId: id(1) })).document.content).toBe('local still safe');
        await s.service.handle('alice', { action: 'documents.delete', documentId: id(1), expectedRevision: 1, operationId: id(902) });
        await s.grant(id(1));
        await expect(s.save(id(1), 'stale resurrection', 0, id(903))).rejects.toMatchObject({ code: 'DOCUMENT_DELETED' });
    });
    it('revokes document consent in the same transaction as cloud-copy deletion', async () => {
        const s = setup(); await s.grant(id(1)); await s.save(id(1), 'private cloud copy');
        await s.service.handle('alice', { action: 'documents.delete', documentId: id(1), expectedRevision: 1, operationId: id(904) });
        expect((await s.service.handle('alice', { action: 'consent.get' })).documentIds).not.toContain(id(1));
    });
    it('does not enroll random accounts through revoke or read actions', async () => {
        const s = setup();
        await s.service.handle('outsider', { action: 'consent.revoke', documentId: id(1) });
        await s.service.handle('outsider', { action: 'usage.get' });
        await expect(s.grant(id(1), 'outsider')).rejects.toMatchObject({ code: 'PILOT_NOT_ENROLLED' });
        expect(s.store.inspect().control.pilot.users).toBe(0);
    });
    it('rejects local-only image references and per-note UTF-8 oversize before writes', async () => {
        const s = setup({ noteBytes: 12 }); await s.grant(id(1));
        await expect(s.save(id(1), '🙂'.repeat(4))).rejects.toMatchObject({ code: 'CONTENT_TOO_LARGE' });
        const p = setup(); await p.grant(id(1));
        await expect(p.save(id(1), '![private](markups-img:img_123)')).rejects.toMatchObject({ code: 'MEDIA_NOT_PORTABLE' });
        expect(p.store.inspect().documents).toEqual({});
    });
});

describe('transactional cloud quota and revision behavior', () => {
    it('allows only one of two simultaneous near-limit creates and leaves exact accounting', async () => {
        const s = setup({ bytes: 10, noteBytes: 10 });
        await s.grant(id(1)); await s.grant(id(2));
        const results = await Promise.allSettled([s.save(id(1), '123456', 0, id(901)), s.save(id(2), 'abcdef', 0, id(902))]);
        expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
        expect(results.find(r => r.status === 'rejected').reason.code).toBe('QUOTA_EXCEEDED');
        const state = s.store.inspect();
        expect(state.users[rowId('u', 'alice')].usedBytes).toBe(6);
        expect(state.control.pilot.bytes).toBe(6);
        expect(Object.values(state.documents)).toHaveLength(1);
    });
    it('never retries a stale revision into overwriting a newer copy', async () => {
        const s = setup(); await s.grant(id(1)); await s.save(id(1), 'base');
        const results = await Promise.allSettled([s.save(id(1), 'one', 1, id(901)), s.save(id(1), 'two', 1, id(902))]);
        expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
        expect(results.find(r => r.status === 'rejected').reason).toMatchObject({ code: 'REVISION_CONFLICT', details: { currentRevision: 2 } });
        expect((await s.service.handle('alice', { action: 'documents.get', documentId: id(1) })).document.revision).toBe(2);
    });
    it('deduplicates identical retries and rejects changed-payload operation-ID reuse', async () => {
        const s = setup(); await s.grant(id(1));
        const first = await s.save(id(1), 'hello');
        const again = await s.save(id(1), 'hello');
        expect(again).toEqual(first);
        await expect(s.save(id(1), 'different')).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
        expect(s.store.inspect().users[rowId('u', 'alice')].usedBytes).toBe(5);
        expect(Object.values(s.store.inspect().operations)).toHaveLength(1);
        expect(Object.values(s.store.inspect().operations)[0].result).not.toContain('hello');
    });
    it('counts previous versions and prunes only expired bounded snapshots', async () => {
        const s = setup({ bytes: 25, versions: 2 }); await s.grant(id(1));
        await s.save(id(1), '1234567890');
        await s.save(id(1), 'abcdefghij', 1, id(901));
        await expect(s.save(id(1), 'ABCDEFGHIJ', 2, id(902))).rejects.toMatchObject({ code: 'QUOTA_EXCEEDED' });
        s.advance(8 * 86400000);
        expect((await s.service.handle('alice', { action: 'usage.get' })).bytes).toBe(10);
        expect((await s.service.handle('alice', { action: 'documents.get', documentId: id(1) })).document.versions).toHaveLength(0);
        await s.save(id(1), 'ABCDEFGHIJ', 2, id(902));
        expect(s.store.inspect().control.pilot.bytes).toBe(20);
    });
    it('enforces daily revision and document-count limits independently', async () => {
        const s = setup({ revisions: 1, documents: 1 }); await s.grant(id(1)); await s.save(id(1), 'a');
        await expect(s.save(id(1), 'b', 1, id(901))).rejects.toMatchObject({ code: 'RATE_LIMITED' });
        await expect(s.grant(id(2))).rejects.toMatchObject({ code: 'DOCUMENT_LIMIT' });
        s.advance(86400000); await expect(s.save(id(1), 'b', 1, id(901))).resolves.toMatchObject({ document: { revision: 2 } });
    });
    it('deletes cloud data in bounded resumable batches and releases quota', async () => {
        const s = setup(); await s.grant(id(1)); await s.save(id(1), 'content');
        for (let i = 0; i < 90; i++) s.store.seed('operations', 'extra' + i, { ownerId: 'alice', expiresAt: Date.now() + 100000 });
        expect(await s.service.handle('alice', { action: 'account.deleteData', confirmation: 'DELETE MY CLOUD DATA' })).toEqual({ complete: false });
        await expect(s.grant(id(2))).rejects.toMatchObject({ code: 'DELETION_IN_PROGRESS' });
        expect(await s.service.handle('alice', { action: 'account.deleteData', confirmation: 'DELETE MY CLOUD DATA' })).toEqual({ complete: true });
        expect(s.store.inspect().control.pilot).toMatchObject({ bytes: 0, users: 0 });
        expect(Object.values(s.store.inspect().documents)).toHaveLength(0);
        expect(Object.values(s.store.inspect().operations)).toHaveLength(0);
    });
});

describe('real Appwrite REST boundary', () => {
    it('stages a guard before business reads and retries only API transaction conflicts', async () => {
        const calls = [];
        let commits = 0;
        const request = vi.fn(async (method, path, data) => {
            calls.push({ method, path, data });
            if (path === '/tablesdb/transactions') return { $id: 'tx' + calls.length };
            if (data?.commit) { if (++commits === 1) throw Object.assign(new Error('conflict'), { appwrite: true, status: 409 }); return {}; }
            if (method === 'GET') return { $id: 'pilot', bytes: 0, users: 0 };
            return {};
        });
        const store = createAppwriteStore({ request, databaseId: 'markups_cloud' });
        await store.transaction(async tx => { await tx.get('control', 'pilot'); return 'done'; });
        expect(calls[1]).toMatchObject({ method: 'PATCH', path: '/tablesdb/markups_cloud/tables/control/rows/pilot' });
        expect(calls[1].data.transactionId).toBeTruthy();
        expect(calls[2].method).toBe('GET');
        expect(commits).toBe(2);
        expect(calls.some(c => c.data?.rollback)).toBe(true);
    });
    it('verifies JWT through Account without exposing the admin key to that call', async () => {
        const fetchFn = vi.fn(async () => new Response(JSON.stringify({ $id: 'alice', status: true }), { status: 200 }));
        const request = createAppwriteRest({ endpoint: 'https://sgp.cloud.appwrite.io/v1', projectId: 'markup', apiKey: 'admin-secret', fetchFn });
        await request('GET', '/account', undefined, { jwt: 'user-jwt', admin: false });
        expect(fetchFn.mock.calls[0][1].headers).toMatchObject({ 'x-appwrite-jwt': 'user-jwt' });
        expect(fetchFn.mock.calls[0][1].headers['x-appwrite-key']).toBeUndefined();
    });
    it('derives identity from verified Account, not spoofed user headers; uses no-store', async () => {
        const handle = vi.fn(async () => ({ documentIds: [] }));
        const handler = createFunctionHandler({ env: { APPWRITE_FUNCTION_API_ENDPOINT: 'https://sgp.cloud.appwrite.io/v1', APPWRITE_FUNCTION_PROJECT_ID: 'markup', APPWRITE_API_KEY: 'key', MARKUPS_DATABASE_ID: 'markups_cloud' }, fetchFn: async () => new Response(JSON.stringify({ $id: 'alice', status: true })), serviceFactory: () => ({ handle }) });
        const json = vi.fn((data, status, headers) => ({ data, status, headers }));
        const result = await handler({ req: { method: 'POST', headers: { 'x-markups-user-jwt': 'signed-alice', 'x-appwrite-user-id': 'victim' }, bodyText: '{"action":"consent.get"}' }, res: { json } });
        expect(handle).toHaveBeenCalledWith('alice', { action: 'consent.get' });
        expect(result.status).toBe(200);
        expect(result.headers['cache-control']).toBe('private, no-store');
    });
    it('fails closed on missing config and sanitizes unexpected upstream errors', async () => {
        const json = (data, status) => ({ data, status });
        const result = await createFunctionHandler({ env: {} })({ req: { method: 'POST', bodyText: '{}' }, res: { json } });
        expect(result.status).toBe(503);
        expect(result.data.error.code).toBe('CLOUD_NOT_CONFIGURED');
    });
});
