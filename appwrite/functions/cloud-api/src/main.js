import { CloudError, createCloudService } from './service.js';
import { createAppwriteRest, createAppwriteStore } from './appwrite-store.js';

export function createFunctionHandler({ env = process.env, fetchFn = fetch, serviceFactory = createCloudService } = {}) {
    return async ({ req, res }) => {
        const headers = Object.fromEntries(Object.entries(req.headers || {}).map(([key, value]) => [key.toLowerCase(), value]));
        const responseHeaders = { 'cache-control': 'private, no-store', 'content-type': 'application/json', 'x-content-type-options': 'nosniff' };
        try {
            if (req.method !== 'POST') throw new CloudError('METHOD_NOT_ALLOWED', 'Use POST for cloud actions.', 405);
            const endpoint = env.APPWRITE_FUNCTION_API_ENDPOINT;
            const projectId = env.APPWRITE_FUNCTION_PROJECT_ID;
            const apiKey = env.APPWRITE_API_KEY || headers['x-appwrite-key'];
            const request = createAppwriteRest({ endpoint, projectId, apiKey, fetchFn });
            const jwt = headers['x-markups-user-jwt'] || headers['x-appwrite-user-jwt'];
            if (typeof jwt !== 'string' || jwt.length > 8192 || !jwt) throw new CloudError('UNAUTHENTICATED', 'Sign in to use cloud storage.', 401);
            let user;
            try { user = await request('GET', '/account', undefined, { jwt, admin: false }); }
            catch (error) { if (error.appwrite && (error.status === 401 || error.status === 403)) throw new CloudError('UNAUTHENTICATED', 'Your session expired. Sign in again.', 401); throw error; }
            if (!user?.$id || user.status === false) throw new CloudError('UNAUTHENTICATED', 'Sign in to use cloud storage.', 401);
            // Never trust x-appwrite-user-id or a userId/ownerId supplied in request data.
            const raw = typeof req.bodyText === 'string' ? req.bodyText : typeof req.body === 'string' ? req.body : JSON.stringify(req.bodyJson || req.body || {});
            if (Buffer.byteLength(raw, 'utf8') > 4 * 1024 * 1024) throw new CloudError('REQUEST_TOO_LARGE', 'Cloud request is too large.', 413);
            let body;
            try { body = JSON.parse(raw); } catch { throw new CloudError('INVALID_JSON', 'Cloud request must be JSON.'); }
            const enrolled = String(env.MARKUPS_CLOUD_USER_IDS || '').split(',').map(x => x.trim()).filter(Boolean);
            if (enrolled.length > 25 || enrolled.some(x => !/^[A-Za-z0-9][A-Za-z0-9._-]{0,35}$/.test(x))) throw new CloudError('CLOUD_NOT_CONFIGURED', 'Cloud pilot configuration needs attention.', 503);
            const store = createAppwriteStore({ request, databaseId: env.MARKUPS_DATABASE_ID });
            const service = serviceFactory({ store, enabled: env.MARKUPS_CLOUD_ENABLED === 'true', enrolled });
            const data = await service.handle(user.$id, body);
            return res.json({ ok: true, data }, 200, responseHeaders);
        } catch (error) {
            const known = error instanceof CloudError;
            return res.json({ ok: false, error: { code: known ? error.code : 'CLOUD_UNAVAILABLE', message: known ? error.message : 'Cloud storage is unavailable. Your local work remains available.', ...(known ? error.details : {}) } }, known ? error.status : 503, responseHeaders);
        }
    };
}

export default createFunctionHandler();
