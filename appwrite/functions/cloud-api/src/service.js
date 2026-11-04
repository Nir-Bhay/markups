import { createHash } from 'node:crypto';

export const POLICY_VERSION = '2026-10-27';
export const DEFAULT_LIMITS = Object.freeze({ bytes: 5 * 1024 * 1024, noteBytes: 512 * 1024, documents: 25, versions: 3, versionDays: 7, revisions: 50, ledgerOperations: 50, mutations: 100, users: 25, globalBytes: 125 * 1024 * 1024 });
const DAY = 86400000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class CloudError extends Error {
    constructor(code, message, status = 400, details = {}) { super(message); this.code = code; this.status = status; this.details = details; }
}
const fail = (code, message, status, details) => { throw new CloudError(code, message, status, details); };
export const digest = (text) => createHash('sha256').update(text).digest('hex');
export const rowId = (type, owner, value = '') => type + '_' + digest(owner + ':' + value).slice(0, 32);
const bytes = (title, content) => Buffer.byteLength(title, 'utf8') + Buffer.byteLength(content, 'utf8');
const parse = (value, fallback) => { try { return JSON.parse(value); } catch { return fallback; } };
const metadata = (d) => ({ documentId: d.documentId, title: d.title, revision: d.revision, updatedAt: d.updatedAt, bytes: d.bytes, hash: d.hash });
const fields = {
    'consent.get': [], 'usage.get': [], 'documents.list': [],
    'consent.grant': ['documentId', 'policyVersion'], 'consent.revoke': ['documentId'],
    'documents.get': ['documentId'],
    'documents.save': ['documentId', 'title', 'content', 'expectedRevision', 'operationId'],
    'documents.delete': ['documentId', 'expectedRevision', 'operationId'],
    'account.deleteData': ['confirmation']
};

/** Appwrite-backed business logic; store.transaction must stage a global guard before reads. */
export function createCloudService({ store, now = () => Date.now(), limits = DEFAULT_LIMITS, enabled = false, enrolled = [] }) {
    const enrolledSet = new Set(enrolled);
    const usage = (u) => ({ bytes: u?.usedBytes || 0, maxBytes: limits.bytes, documentCount: u?.documentCount || 0, maxDocuments: limits.documents, revisionsToday: u?.day === new Date(now()).toISOString().slice(0, 10) ? u.revisionsToday : 0, maxRevisionsPerDay: limits.revisions });
    const emptyUser = (owner) => ({ ownerId: owner, usedBytes: 0, documentCount: 0, grants: '[]', tombstones: '[]', day: '', revisionsToday: 0, ledgerToday: 0, mutationsToday: 0, deleting: false, nextExpiry: 0 });
    const ownerCheck = (row, owner) => { if (row && row.ownerId !== owner) fail('FORBIDDEN', 'This resource is unavailable.', 403); return row; };
    const checkWrite = () => { if (!enabled) fail('CLOUD_PAUSED', 'New cloud saves are paused. Local editing remains available.', 503); };
    const persistUser = async (tx, owner, user, existed) => tx.put('users', rowId('u', owner), user, { create: !existed, owner });
    const pruneDocument = (doc, time) => {
        const versions = parse(doc.versions, []).filter(v => v.expiresAt > time).slice(0, limits.versions);
        return { ...doc, versions: JSON.stringify(versions), bytes: bytes(doc.title, doc.content) + versions.reduce((sum, v) => sum + bytes(v.title, v.content), 0) };
    };
    async function compact(tx, owner, user, global) {
        if (!user.nextExpiry || user.nextExpiry > now()) return;
        const docs = await tx.list('documents', owner, { limit: limits.documents + 1 });
        let next = 0;
        for (const original of docs) {
            ownerCheck(original, owner);
            const doc = pruneDocument(original, now());
            const delta = doc.bytes - original.bytes;
            if (delta) { await tx.put('documents', original.$id, doc, { owner }); user.usedBytes += delta; global.bytes += delta; }
            for (const v of parse(doc.versions, [])) next = next ? Math.min(next, v.expiresAt) : v.expiresAt;
        }
        user.nextExpiry = next;
    }
    async function mutation(owner, body, fn) {
        return store.transaction(async (tx) => {
            const global = await tx.get('control', 'pilot');
            if (!global) fail('CLOUD_NOT_READY', 'Cloud storage has not been provisioned.', 503);
            const oldUser = ownerCheck(await tx.get('users', rowId('u', owner)), owner);
            const user = oldUser || emptyUser(owner);
            if (!oldUser && body.action === 'consent.revoke') return { documentIds: [], policyVersion: POLICY_VERSION };
            if (user.deleting && body.action !== 'account.deleteData') fail('DELETION_IN_PROGRESS', 'Finish deleting cloud data before using cloud storage.', 409);
            const hasOperation = typeof body.operationId === 'string';
            const fingerprint = digest(JSON.stringify(Object.fromEntries(Object.keys(body).sort().map(key => [key, body[key]]))));
            const opId = hasOperation ? rowId('o', owner, body.operationId) : null;
            if (opId) {
                const existing = ownerCheck(await tx.get('operations', opId), owner);
                if (existing) {
                    if (existing.fingerprint !== fingerprint) fail('IDEMPOTENCY_CONFLICT', 'This operation ID was already used for different data.', 409);
                    return parse(existing.result, {});
                }
            }
            const day = new Date(now()).toISOString().slice(0, 10);
            if (user.day !== day) {
                user.day = day; user.revisionsToday = 0; user.ledgerToday = 0; user.mutationsToday = 0;
                if (body.action !== 'account.deleteData') {
                    const expired = await tx.list('operations', owner, { limit: 50, expiresBefore: now() });
                    for (const op of expired) await tx.delete('operations', op.$id);
                }
            }
            if (body.action !== 'account.deleteData' && user.mutationsToday >= limits.mutations) fail('RATE_LIMITED', 'The daily cloud action limit has been reached.', 429);
            if (hasOperation && user.ledgerToday >= limits.ledgerOperations) fail('RATE_LIMITED', 'The daily cloud save/delete limit has been reached.', 429);
            if (body.action !== 'account.deleteData') await compact(tx, owner, user, global);
            const result = await fn(tx, user, global, Boolean(oldUser));
            if (result.userDeleted) return { complete: true };
            if (!oldUser) {
                if (global.users >= limits.users) fail('PILOT_FULL', 'The cloud pilot is full.', 403);
                global.users++;
            }
            user.mutationsToday++;
            if (hasOperation) {
                user.ledgerToday++;
                await tx.put('operations', opId, { ownerId: owner, fingerprint, result: JSON.stringify(result), expiresAt: now() + 2 * DAY }, { create: true, owner });
            }
            await persistUser(tx, owner, user, Boolean(oldUser));
            await tx.put('control', 'pilot', global);
            return result;
        });
    }
    async function handle(owner, body) {
        if (typeof owner !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,35}$/.test(owner)) fail('UNAUTHENTICATED', 'Sign in to use cloud storage.', 401);
        if (!body || typeof body !== 'object' || Array.isArray(body) || !Object.hasOwn(fields, body.action)) fail('INVALID_ACTION', 'Unsupported cloud action.');
        if (Object.keys(body).some(k => k !== 'action' && !fields[body.action].includes(k))) fail('INVALID_ARGUMENT', 'Unexpected cloud request field.');
        if (fields[body.action].includes('documentId')) {
            if (typeof body.documentId !== 'string' || !UUID.test(body.documentId)) fail('INVALID_DOCUMENT_ID', 'A stable document UUID is required.');
            body = { ...body, documentId: body.documentId.toLowerCase() };
        }
        if (fields[body.action].includes('operationId') && (typeof body.operationId !== 'string' || !UUID.test(body.operationId))) fail('INVALID_OPERATION_ID', 'A unique operation UUID is required.');
        if (fields[body.action].includes('expectedRevision') && (!Number.isSafeInteger(body.expectedRevision) || body.expectedRevision < 0)) fail('INVALID_REVISION', 'The expected revision is required.');
        const id = rowId('d', owner, body.documentId);
        const currentUser = async () => ownerCheck(await store.get('users', rowId('u', owner)), owner);
        if (body.action === 'consent.get') return { documentIds: parse((await currentUser())?.grants, []), policyVersion: POLICY_VERSION };
        if (body.action === 'usage.get') {
            const user = await currentUser();
            if (!user || !user.nextExpiry || user.nextExpiry > now()) return usage(user);
            return mutation(owner, body, async (_tx, state) => usage(state));
        }
        if (body.action === 'documents.list') {
            const documents = await store.list('documents', owner, { limit: limits.documents + 1, fields: ['ownerId', 'documentId', 'title', 'revision', 'updatedAt', 'bytes', 'hash'] });
            return { documents: documents.map(d => metadata(ownerCheck(d, owner))) };
        }
        if (body.action === 'documents.get') {
            const doc = ownerCheck(await store.get('documents', id), owner);
            if (!doc) fail('NOT_FOUND', 'Cloud document not found.', 404);
            return { document: { ...metadata(doc), content: doc.content, versions: parse(doc.versions, []).filter(v => v.expiresAt > now()) } };
        }
        if (body.action === 'consent.grant') {
            checkWrite();
            if (!enrolledSet.has(owner)) fail('PILOT_NOT_ENROLLED', 'This account is not enrolled in the cloud pilot.', 403);
            if (body.policyVersion !== POLICY_VERSION) fail('CONSENT_VERSION_REQUIRED', 'Review the current cloud storage notice.');
            return mutation(owner, body, async (_tx, user) => {
                const grants = parse(user.grants, []);
                if (!grants.includes(body.documentId)) {
                    if (grants.length >= limits.documents) fail('DOCUMENT_LIMIT', 'The selected document limit has been reached.', 409);
                    grants.push(body.documentId);
                }
                user.grants = JSON.stringify(grants);
                return { documentIds: grants, policyVersion: POLICY_VERSION };
            });
        }
        if (body.action === 'consent.revoke') return mutation(owner, body, async (_tx, user) => {
            const grants = parse(user.grants, []).filter(d => d !== body.documentId);
            user.grants = JSON.stringify(grants);
            return { documentIds: grants, policyVersion: POLICY_VERSION };
        });
        if (body.action === 'documents.save') {
            checkWrite();
            if (!enrolledSet.has(owner)) fail('PILOT_NOT_ENROLLED', 'This account is not enrolled in the cloud pilot.', 403);
            if (typeof body.title !== 'string' || typeof body.content !== 'string' || body.title.length > 200) fail('INVALID_DOCUMENT', 'Provide a document title and text.');
            if (bytes(body.title, body.content) > limits.noteBytes) fail('CONTENT_TOO_LARGE', 'This cloud document exceeds the per-note size limit.', 413);
            if (/markups-img:|data:image\//i.test(body.content)) fail('MEDIA_NOT_PORTABLE', 'Local images need a portable attachment export before cloud backup.', 409);
            return mutation(owner, body, async (tx, user, global) => {
                if (!parse(user.grants, []).includes(body.documentId)) fail('CONSENT_REQUIRED', 'Enable cloud backup for this selected document first.', 403);
                const tombstones = parse(user.tombstones, []).filter(t => t.deletedAt > now() - 30 * DAY);
                if (tombstones.some(t => t.documentId === body.documentId)) fail('DOCUMENT_DELETED', 'This cloud document was deleted. Save a new local copy under a new ID.', 409);
                user.tombstones = JSON.stringify(tombstones);
                const current = ownerCheck(await tx.get('documents', id), owner);
                const revision = current?.revision || 0;
                if (revision !== body.expectedRevision) fail('REVISION_CONFLICT', 'The cloud copy changed. Keep your local text and review both copies.', 409, { currentRevision: revision });
                if (current?.title === body.title && current?.content === body.content) return { document: metadata(current), usage: usage(user) };
                if (user.revisionsToday >= limits.revisions) fail('RATE_LIMITED', 'The daily cloud revision limit has been reached.', 429);
                if (!current && user.documentCount >= limits.documents) fail('DOCUMENT_LIMIT', 'The cloud document limit has been reached.', 409);
                if (!current && tombstones.length >= 100) fail('RATE_LIMITED', 'Too many recently deleted document IDs. Try again later.', 429);
                const versions = current ? [{ title: current.title, content: current.content, revision: current.revision, createdAt: now(), expiresAt: now() + limits.versionDays * DAY }, ...parse(current.versions, [])].filter(v => v.expiresAt > now()).slice(0, limits.versions) : [];
                const doc = { ownerId: owner, documentId: body.documentId, title: body.title, content: body.content, revision: revision + 1, updatedAt: now(), hash: digest(body.title + '\0' + body.content), versions: JSON.stringify(versions), bytes: bytes(body.title, body.content) + versions.reduce((n, v) => n + bytes(v.title, v.content), 0) };
                const delta = doc.bytes - (current?.bytes || 0);
                if (user.usedBytes + delta > limits.bytes || global.bytes + delta > limits.globalBytes) fail('QUOTA_EXCEEDED', 'Cloud storage is full. Your local document is still available.', 413);
                await tx.put('documents', id, doc, { create: !current, owner });
                user.usedBytes += delta; global.bytes += delta;
                if (!current) user.documentCount++;
                user.revisionsToday++;
                for (const v of versions) user.nextExpiry = user.nextExpiry ? Math.min(user.nextExpiry, v.expiresAt) : v.expiresAt;
                return { document: metadata(doc), usage: usage(user) };
            });
        }
        if (body.action === 'documents.delete') return mutation(owner, body, async (tx, user, global) => {
            const doc = ownerCheck(await tx.get('documents', id), owner);
            if (!doc || doc.revision !== body.expectedRevision) fail('REVISION_CONFLICT', 'The cloud copy changed or was already deleted.', 409, { currentRevision: doc?.revision || 0 });
            await tx.delete('documents', id);
            user.usedBytes -= doc.bytes; global.bytes -= doc.bytes; user.documentCount--;
            user.grants = JSON.stringify(parse(user.grants, []).filter(d => d !== body.documentId));
            user.tombstones = JSON.stringify([...parse(user.tombstones, []).filter(t => t.deletedAt > now() - 30 * DAY), { documentId: body.documentId, revision: doc.revision + 1, deletedAt: now() }]);
            return { deleted: true, documentId: body.documentId, usage: usage(user) };
        });
        if (body.action === 'account.deleteData') {
            if (body.confirmation !== 'DELETE MY CLOUD DATA') fail('CONFIRMATION_REQUIRED', 'Confirm deletion of all cloud data.');
            return mutation(owner, body, async (tx, user, global, existed) => {
                user.deleting = true;
                const docs = await tx.list('documents', owner, { limit: 25 });
                for (const doc of docs) { ownerCheck(doc, owner); await tx.delete('documents', doc.$id); user.usedBytes -= doc.bytes; global.bytes -= doc.bytes; user.documentCount--; }
                const ops = await tx.list('operations', owner, { limit: 50 });
                for (const op of ops) await tx.delete('operations', op.$id);
                if ((await tx.list('documents', owner, { limit: 1 })).length || (await tx.list('operations', owner, { limit: 1 })).length) return { complete: false };
                if (existed) { await tx.delete('users', rowId('u', owner)); global.users--; }
                await tx.put('control', 'pilot', global);
                return { userDeleted: true };
            });
        }
        fail('INVALID_ACTION', 'Unsupported cloud action.');
    }
    return { handle };
}
