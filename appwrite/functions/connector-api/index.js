import { createHmac, createSign, timingSafeEqual } from 'node:crypto';

const MAX_BYTES = 5 * 1024 * 1024;
const GITHUB = 'https://api.github.com';
const NO_STORE = { 'Cache-Control': 'private, no-store' };

class ApiError extends Error {
    constructor(code, message, status = 400) { super(message); this.code = code; this.status = status; }
}

function requireValue(condition, code, message, status = 400) {
    if (!condition) throw new ApiError(code, message, status);
}

function repository(value) {
    requireValue(typeof value === 'string' && value.length <= 220 && /^[\w.-]+\/[\w.-]+$/.test(value) && !value.split('/').some(p => p === '.' || p === '..'), 'INVALID_REPOSITORY', 'Choose a connected repository.');
    return value;
}

function branch(value) {
    requireValue(typeof value === 'string' && value && value.length <= 200 && !/[\u0000-\u0020\u007f~^:?*\[\\]/.test(value) && !value.includes('..') && !value.includes('@{') && !value.endsWith('.') && !value.split('/').some(p => !p || p.startsWith('.') || p.endsWith('.lock')), 'INVALID_BRANCH', 'Choose a valid branch.');
    return value;
}

function filePath(value) {
    requireValue(typeof value === 'string' && value.length <= 512 && !/[\\\u0000-\u001f\u007f?#%]/.test(value) && !value.startsWith('/') && !value.split('/').some(p => !p || p === '.' || p === '..') && /\.(?:md|markdown|txt)$/i.test(value), 'INVALID_PATH', 'Choose a relative Markdown or text file.');
    return value.split('/').map(encodeURIComponent).join('/');
}

function directoryPath(value) {
    requireValue(typeof value === 'string' && value.length <= 512 && !/[\\\u0000-\u001f\u007f?#%]/.test(value) && !value.startsWith('/') && (value === '' || !value.split('/').some(p => !p || p === '.' || p === '..')), 'INVALID_PATH', 'Choose a relative repository folder.');
    return value.split('/').map(encodeURIComponent).join('/');
}

async function boundedJson(response, max = 1024 * 1024) {
    const size = Number(response.headers?.get?.('content-length'));
    requireValue(!(size > max), 'RESPONSE_TOO_LARGE', 'The provider response is too large.', 502);
    const chunks = [];
    let count = 0;
    if (response.body?.getReader) {
        const reader = response.body.getReader();
        try {
            while (true) {
                const part = await reader.read();
                if (part.done) break;
                count += part.value.byteLength;
                requireValue(count <= max, 'RESPONSE_TOO_LARGE', 'The provider response is too large.', 502);
                chunks.push(Buffer.from(part.value));
            }
        } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    } else {
        const bytes = Buffer.from(await response.arrayBuffer());
        requireValue(bytes.length <= max, 'RESPONSE_TOO_LARGE', 'The provider response is too large.', 502);
        chunks.push(bytes);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function mapProviderError(response) {
    const status = response.status;
    if (status === 401) return new ApiError('AUTH_EXPIRED', 'Reconnect the provider.', 401);
    if (status === 403 && response.headers?.get?.('x-ratelimit-remaining') === '0') return new ApiError('RATE_LIMITED', 'GitHub request limit reached. Retry later.', 429);
    if (status === 403) return new ApiError('ACCESS_DENIED', 'GitHub denied this action. Check installation permissions or branch protection.', 403);
    if (status === 404) return new ApiError('NOT_FOUND', 'The file or repository is unavailable.', 404);
    if (status === 409 || status === 412 || status === 422) return new ApiError('CONFLICT', 'The remote file changed or the branch rejected this write. Open the latest copy or save separately.', 409);
    if (status === 429) return new ApiError('RATE_LIMITED', 'Retry this provider request later.', 429);
    return new ApiError('PROVIDER_ERROR', 'Provider request failed. Local content is unchanged.', 502);
}

export function createGitHubAppJwt({ appId, privateKey, now = Date.now() }) {
    const timestamp = Math.floor(now / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ iat: timestamp - 60, exp: timestamp + 540, iss: String(appId) })).toString('base64url');
    const content = header + '.' + payload;
    const signer = createSign('RSA-SHA256');
    signer.update(content);
    return content + '.' + signer.sign(privateKey.replace(/\\n/g, '\n'), 'base64url');
}

export function verifyGitHubWebhook(raw, signature, secret) {
    if (!secret || typeof signature !== 'string' || !/^sha256=[0-9a-f]{64}$/.test(signature)) return false;
    const actual = Buffer.from(signature.slice(7), 'hex');
    const expected = createHmac('sha256', secret).update(raw).digest();
    return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** No provider token or note is retained. Each operation revalidates the installation. */
export function createConnectorHandler({ env = process.env, fetchFn = globalThis.fetch, now = Date.now } = {}) {
    async function request(url, { token, ...options } = {}, maxBytes) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetchFn(url, { ...options, redirect: 'error', signal: controller.signal, headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'Markups-Connector', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...options.headers } });
            if (!response.ok) throw mapProviderError(response);
            return response.status === 204 ? null : await boundedJson(response, maxBytes);
        } finally { clearTimeout(timer); }
    }

    async function identity(headers) {
        const endpoint = env.APPWRITE_ENDPOINT || env.APPWRITE_FUNCTION_API_ENDPOINT;
        const project = env.APPWRITE_PROJECT_ID || env.APPWRITE_FUNCTION_PROJECT_ID;
        requireValue(endpoint && /^https:\/\/[a-z0-9.-]+\.cloud\.appwrite\.io\/v1\/?$/.test(endpoint) && project, 'SETUP_REQUIRED', 'Configure the Appwrite project endpoint and ID.', 503);
        const jwt = headers['x-markups-user-jwt'] || headers['x-appwrite-user-jwt'] || (headers.authorization || '').replace(/^Bearer /, '');
        requireValue(typeof jwt === 'string' && jwt.length <= 8192 && /^[\w-]+\.[\w-]+\.[\w-]+$/.test(jwt), 'AUTH_REQUIRED', 'Sign in before connecting GitHub.', 401);
        const options = { headers: { 'X-Appwrite-Project': project, 'X-Appwrite-JWT': jwt } };
        const account = await request(endpoint.replace(/\/$/, '') + '/account', options, 65536);
        requireValue(account?.$id && account.status !== false, 'AUTH_REQUIRED', 'The account is unavailable.', 401);
        const result = await request(endpoint.replace(/\/$/, '') + '/account/identities', options, 1024 * 1024);
        const uids = new Set((result?.identities || []).filter(i => i.provider === 'github' && i.userId === account.$id && /^\d+$/.test(String(i.providerUid))).map(i => String(i.providerUid)));
        return { userId: account.$id, githubIds: uids };
    }

    function appConfig() {
        requireValue(env.GITHUB_APP_ID && env.GITHUB_APP_PRIVATE_KEY && /^[\w-]+$/.test(env.GITHUB_APP_SLUG || ''), 'SETUP_REQUIRED', 'The Markups GitHub App is not configured.', 503);
        return { jwt: createGitHubAppJwt({ appId: env.GITHUB_APP_ID, privateKey: env.GITHUB_APP_PRIVATE_KEY, now: now() }), installationUrl: 'https://github.com/apps/' + env.GITHUB_APP_SLUG + '/installations/new' };
    }

    async function installations(user, jwt) {
        requireValue(user.githubIds.size, 'GITHUB_IDENTITY_REQUIRED', 'Sign in with GitHub or link a verified GitHub identity first.', 403);
        const matches = [];
        for (let page = 1; page <= 5; page++) {
            const items = await request(GITHUB + '/app/installations?per_page=100&page=' + page, { token: jwt });
            requireValue(Array.isArray(items), 'PROVIDER_ERROR', 'Invalid installation response.', 502);
            matches.push(...items.filter(i => i.account?.type === 'User' && user.githubIds.has(String(i.account?.id)) && i.repository_selection === 'selected' && !i.suspended_at));
            if (items.length < 100) return matches;
        }
        throw new ApiError('INSTALLATION_LIMIT', 'Installation discovery exceeded the pilot limit.', 503);
    }

    async function installationToken(id, jwt, repoId = null, write = false) {
        const result = await request(GITHUB + '/app/installations/' + id + '/access_tokens', { token: jwt, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ permissions: { contents: write ? 'write' : 'read', metadata: 'read' }, ...(repoId ? { repository_ids: [repoId] } : {}) }) });
        requireValue(result?.token, 'PROVIDER_ERROR', 'GitHub did not issue an installation token.', 502);
        return result.token;
    }

    async function selectedRepositories(installationsList, jwt) {
        const repos = [];
        for (const install of installationsList) {
            const token = await installationToken(install.id, jwt);
            for (let page = 1; page <= 5; page++) {
                const result = await request(GITHUB + '/installation/repositories?per_page=100&page=' + page, { token });
                requireValue(Array.isArray(result?.repositories), 'PROVIDER_ERROR', 'Invalid repository response.', 502);
                for (const repo of result.repositories) repos.push({ id: repo.id, fullName: repo.full_name, defaultBranch: repo.default_branch, private: repo.private, installationId: String(install.id) });
                if (result.repositories.length < 100) break;
                if (page === 5) throw new ApiError('REPOSITORY_LIMIT', 'Too many repositories for this pilot connection.', 503);
            }
        }
        return repos;
    }

    return async ({ req, res }) => {
        const reply = (data, status = 200) => res.json(data, status, NO_STORE);
        try {
            requireValue(req.method === 'POST', 'METHOD_NOT_ALLOWED', 'Use POST.', 405);
            const headers = Object.fromEntries(Object.entries(req.headers || {}).map(([key, value]) => [key.toLowerCase(), value]));
            const raw = typeof req.bodyText === 'string' ? req.bodyText : typeof req.body === 'string' ? req.body : JSON.stringify(req.bodyJson || {});
            requireValue(Buffer.byteLength(raw) <= MAX_BYTES + 1024 * 1024, 'DOCUMENT_TOO_LARGE', 'The request exceeds the import limit.', 413);
            if (req.path === '/webhooks/github') {
                requireValue(Buffer.byteLength(raw) <= 131072 && verifyGitHubWebhook(raw, headers['x-hub-signature-256'], env.GITHUB_WEBHOOK_SECRET), 'INVALID_SIGNATURE', 'Invalid webhook signature.', 403);
                // No cached user token/binding exists: future calls inspect live installation access.
                return reply({ ok: true, data: { accepted: true } }, 202);
            }
            const input = JSON.parse(raw);
            requireValue(input && typeof input === 'object' && !Array.isArray(input), 'INVALID_REQUEST', 'Invalid connector request.');
            const action = input.action;
            requireValue(['github.status', 'github.repositories', 'github.branches', 'github.files', 'github.open', 'github.save', 'github.uninstall'].includes(action), 'INVALID_ACTION', 'Unsupported connector action.');
            const user = await identity(headers);
            if (action === 'github.status') {
                const configured = Boolean(env.GITHUB_APP_ID && env.GITHUB_APP_PRIVATE_KEY && /^[\w-]+$/.test(env.GITHUB_APP_SLUG || ''));
                return reply({ ok: true, data: { configured, personalAccountsOnly: true, requiresGithubIdentity: !user.githubIds.size, installationUrl: configured ? 'https://github.com/apps/' + env.GITHUB_APP_SLUG + '/installations/new' : null } });
            }
            const app = appConfig();
            const allowedInstallations = await installations(user, app.jwt);
            if (action === 'github.uninstall') {
                requireValue(input.confirmed === true, 'CONFIRM_REQUIRED', 'Confirm removing this installation.');
                const install = allowedInstallations.find(i => String(i.id) === String(input.installationId));
                requireValue(install, 'ACCESS_DENIED', 'This installation is not connected to your identity.', 403);
                await request(GITHUB + '/app/installations/' + install.id, { token: app.jwt, method: 'DELETE' });
                return reply({ ok: true, data: { disconnected: true } });
            }
            const repos = await selectedRepositories(allowedInstallations, app.jwt);
            if (action === 'github.repositories') return reply({ ok: true, data: { repositories: repos, personalAccountsOnly: true } });
            const selected = repos.find(r => r.fullName.toLowerCase() === repository(input.repository).toLowerCase());
            requireValue(selected, 'ACCESS_DENIED', 'Select a repository granted to your personal GitHub App installation.', 403);
            const write = action === 'github.save';
            const token = await installationToken(selected.installationId, app.jwt, selected.id, write);
            const repoUrl = GITHUB + '/repos/' + selected.fullName;
            if (action === 'github.branches') {
                const list = await request(repoUrl + '/branches?per_page=100', { token });
                requireValue(Array.isArray(list), 'PROVIDER_ERROR', 'Invalid branches response.', 502);
                return reply({ ok: true, data: { branches: list.map(b => ({ name: b.name, protected: b.protected })), truncated: list.length === 100 } });
            }
            const chosenBranch = branch(input.branch);
            if (action === 'github.files') {
                const path = input.path ?? '';
                const encodedDirectory = directoryPath(path);
                const list = await request(repoUrl + '/contents/' + encodedDirectory + '?ref=' + encodeURIComponent(chosenBranch), { token }, 2 * 1024 * 1024);
                requireValue(Array.isArray(list), 'INVALID_DIRECTORY', 'Choose a repository folder.');
                // GitHub's Contents API returns at most 1,000 entries. Treat that
                // boundary as incomplete rather than promising the full folder.
                const files = list.filter(item => {
                    if (!item || typeof item.name !== 'string' || typeof item.path !== 'string' || item.target || item.submodule_git_url) return false;
                    if (item.path !== (path ? path + '/' : '') + item.name || /[\/\\\u0000-\u001f\u007f?#%]/.test(item.name) || ['.', '..', ''].includes(item.name)) return false;
                    return item.type === 'dir' || (item.type === 'file' && /\.(md|markdown|txt)$/i.test(item.name));
                }).slice(0, 200).map(item => ({ name: item.name, path: item.path, type: item.type }));
                return reply({ ok: true, data: { files, path, truncated: list.length >= 1000 || list.filter(item => item?.type === 'dir' || /\.(md|markdown|txt)$/i.test(item?.name || '')).length > 200 } });
            }
            const encodedPath = filePath(input.path);
            const contentUrl = repoUrl + '/contents/' + encodedPath;
            let remote;
            try { remote = await request(contentUrl + '?ref=' + encodeURIComponent(chosenBranch), { token }, 8 * 1024 * 1024); }
            catch (error) { if (error.code === 'NOT_FOUND' && write && input.expectedSha === null) remote = null; else throw error; }
            if (remote) requireValue(remote.type === 'file' && !remote.target && !remote.submodule_git_url && /^[a-f0-9]{40}$/i.test(remote.sha || '') && remote.size <= MAX_BYTES, 'INVALID_FILE', 'Choose a bounded Markdown text file.');
            if (!write) {
                // Contents API omits bodies above 1 MB. Read the immutable blob SHA,
                // rather than a raw branch URL that could race with metadata lookup.
                const body = remote.encoding === 'base64' ? remote : await request(repoUrl + '/git/blobs/' + remote.sha, { token }, 8 * 1024 * 1024);
                requireValue(body.encoding === 'base64' && typeof body.content === 'string' && /^[A-Za-z0-9+/=\r\n]*$/.test(body.content), 'INVALID_FILE', 'GitHub did not return a supported file body.');
                const bytes = Buffer.from(body.content, 'base64');
                requireValue(bytes.length <= MAX_BYTES, 'DOCUMENT_TOO_LARGE', 'This file exceeds the import limit.', 413);
                return reply({ ok: true, data: { repository: selected.fullName, branch: chosenBranch, path: input.path, sha: remote.sha, content: new TextDecoder('utf-8', { fatal: true }).decode(bytes) } });
            }
            requireValue(input.confirmed === true, 'CONFIRM_REQUIRED', 'Review the changes before committing.');
            requireValue(typeof input.content === 'string' && Buffer.byteLength(input.content) <= MAX_BYTES, 'DOCUMENT_TOO_LARGE', 'The document exceeds the provider save limit.', 413);
            requireValue(!/markups-img:img_\w+/.test(input.content), 'LOCAL_MEDIA', 'Include the local images before saving a portable document.');
            requireValue(typeof input.message === 'string' && input.message.trim() && input.message.length <= 200 && !/[\u0000-\u001f]/.test(input.message), 'INVALID_MESSAGE', 'Enter a short commit message.');
            requireValue(input.expectedSha === null || /^[a-f0-9]{40}$/i.test(input.expectedSha || ''), 'INVALID_REVISION', 'Open the latest remote file before saving.');
            requireValue((remote?.sha || null) === input.expectedSha, 'CONFLICT', 'The remote file changed. Preserve your local copy and open the latest revision.', 409);
            const result = await request(contentUrl, { token, method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: input.message, branch: chosenBranch, content: Buffer.from(input.content).toString('base64'), ...(remote ? { sha: input.expectedSha } : {}) }) });
            return reply({ ok: true, data: { repository: selected.fullName, branch: chosenBranch, path: input.path, sha: result.content?.sha, commitSha: result.commit?.sha } });
        } catch (error) {
            const known = error instanceof ApiError;
            return reply({ ok: false, error: { code: known ? error.code : 'CONNECTOR_ERROR', message: known ? error.message : 'The connector could not complete this request. Your local content is unchanged.' } }, known ? error.status : 500);
        }
    };
}

export default async function handler(context) { return createConnectorHandler()(context); }
