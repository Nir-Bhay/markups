import { randomUUID } from 'node:crypto';
import { CloudError } from './service.js';

// REST reference: https://appwrite.io/docs/references/cloud/server-rest/tablesDB
// Transactions: https://appwrite.io/docs/products/databases/tablesdb/transactions
export class AppwriteRestError extends Error {
    constructor(status, type) { super('Appwrite request failed.'); this.status = status; this.type = type; this.appwrite = true; }
}
const clean = (row) => Object.fromEntries(Object.entries(row).filter(([key]) => !key.startsWith('$')));
export function createAppwriteRest({ endpoint, projectId, apiKey, fetchFn = fetch }) {
    const base = String(endpoint || '').replace(/\/$/, '');
    if (!/^https:\/\/[a-z0-9-]+\.cloud\.appwrite\.io\/v1$/.test(base) || !projectId || !apiKey) throw new CloudError('CLOUD_NOT_CONFIGURED', 'Cloud storage is not configured.', 503);
    return async function request(method, path, data, { jwt, admin = true } = {}) {
        const headers = { 'content-type': 'application/json', 'x-appwrite-project': projectId, 'x-appwrite-response-format': '2.6.2' };
        if (admin) headers['x-appwrite-key'] = apiKey;
        if (jwt) headers['x-appwrite-jwt'] = jwt;
        const response = await fetchFn(base + path, { method, headers, body: data === undefined ? undefined : JSON.stringify(data), signal: AbortSignal.timeout(10000), redirect: 'error', cache: 'no-store' });
        const body = response.status === 204 ? null : await response.json();
        if (!response.ok) throw new AppwriteRestError(response.status, body?.type || 'request_failed');
        return body;
    };
}

/** All mutations first stage a global guard, then read and mutate within that transaction. */
export function createAppwriteStore({ request, databaseId }) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,35}$/.test(databaseId || '')) throw new CloudError('CLOUD_NOT_CONFIGURED', 'Cloud storage is not configured.', 503);
    const path = (table, id) => '/tablesdb/' + encodeURIComponent(databaseId) + '/tables/' + encodeURIComponent(table) + '/rows' + (id ? '/' + encodeURIComponent(id) : '');
    function context(transactionId) {
        const params = (extra = {}) => ({ ...extra, ...(transactionId ? { transactionId } : {}) });
        const query = (obj) => { const p = new URLSearchParams(); for (const [k, v] of Object.entries(obj)) { if (Array.isArray(v)) v.forEach(x => p.append(k + '[]', x)); else p.set(k, String(v)); } return '?' + p.toString(); };
        return {
            async get(table, id) {
                try { return await request('GET', path(table, id) + (transactionId ? query({ transactionId }) : '')); }
                catch (error) { if (error.appwrite && error.status === 404) return null; throw error; }
            },
            async list(table, owner, { limit = 25, fields, expiresBefore } = {}) {
                const queries = [JSON.stringify({ method: 'equal', attribute: 'ownerId', values: [owner] }), JSON.stringify({ method: 'limit', values: [Math.min(limit, 100)] })];
                if (fields) queries.push(JSON.stringify({ method: 'select', values: ['$id', ...fields] }));
                if (expiresBefore !== undefined) queries.push(JSON.stringify({ method: 'lessThan', attribute: 'expiresAt', values: [expiresBefore] }));
                const response = await request('GET', path(table) + query(params({ queries, total: false, ttl: 0 })));
                return response.rows;
            },
            async put(table, id, data, { create = false, owner } = {}) {
                const payload = params({ data: clean(data) });
                if (create) { payload.rowId = id; payload.permissions = owner ? ['read("user:' + owner + '")'] : []; }
                return request(create ? 'POST' : 'PATCH', path(table, create ? null : id), payload);
            },
            async delete(table, id) { return request('DELETE', path(table, id) + (transactionId ? query({ transactionId }) : '')); }
        };
    }
    const read = context();
    return {
        get: read.get, list: read.list,
        async transaction(fn) {
            for (let attempt = 0; attempt < 4; attempt++) {
                const transaction = await request('POST', '/tablesdb/transactions', { ttl: 60 });
                const transactionPath = '/tablesdb/transactions/' + encodeURIComponent(transaction.$id);
                try {
                    const tx = context(transaction.$id);
                    // Establish the affected-row conflict anchor before reading revision/quota state.
                    // A deployed concurrency POC must validate the current Cloud transaction semantics.
                    await tx.put('control', 'pilot', { guard: randomUUID() });
                    const result = await fn(tx);
                    await request('PATCH', transactionPath, { commit: true });
                    return result;
                } catch (error) {
                    try { await request('PATCH', transactionPath, { rollback: true }); } catch { /* TTL also clears abandoned transactions. */ }
                    if (error.appwrite && error.status === 409 && attempt < 3) continue;
                    if (error.appwrite && error.status === 404) throw new CloudError('CLOUD_NOT_READY', 'Cloud schema has not been provisioned.', 503);
                    if (error.appwrite && error.status === 409) throw new CloudError('RETRY_LATER', 'Cloud storage is busy. Retry with the same operation ID.', 409);
                    throw error;
                }
            }
        }
    };
}
