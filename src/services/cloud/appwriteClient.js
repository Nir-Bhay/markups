const DEFAULT_ENV = {};

export function readAppwriteConfig(env = import.meta.env || DEFAULT_ENV) {
    const endpoint = String(env.VITE_APPWRITE_ENDPOINT || '').trim().replace(/\/$/, '');
    const projectId = String(env.VITE_APPWRITE_PROJECT_ID || '').trim();
    const cloudFunctionId = String(env.VITE_APPWRITE_CLOUD_FUNCTION_ID || '').trim();
    const connectorFunctionId = String(env.VITE_APPWRITE_CONNECTOR_FUNCTION_ID || '').trim();
    let endpointValid = false;
    try {
        const parsed = new URL(endpoint);
        endpointValid = parsed.protocol === 'https:' ||
            (parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname));
        endpointValid &&= !parsed.username && !parsed.password && !parsed.search && !parsed.hash;
    } catch { /* invalid or unconfigured */ }
    return {
        endpoint: endpointValid ? endpoint : '',
        projectId,
        cloudFunctionId,
        connectorFunctionId,
        authConfigured: endpointValid && Boolean(projectId),
        cloudConfigured: endpointValid && Boolean(projectId && cloudFunctionId),
        connectorsConfigured: endpointValid && Boolean(projectId && connectorFunctionId)
    };
}

export class CloudActionError extends Error {
    constructor(message, { code = 'CLOUD_REQUEST_FAILED', status = 0, details = null } = {}) {
        super(message);
        this.name = 'CloudActionError';
        this.code = code;
        this.status = status;
        this.details = details;
    }
}

/**
 * Lazy Appwrite browser SDK boundary. No request runs until a caller explicitly
 * invokes an auth/cloud method; editor startup and local autosave stay offline.
 */
export class AppwriteClient {
    constructor({ config = readAppwriteConfig(), loadSdk = () => import('appwrite'), fetchFn = globalThis.fetch } = {}) {
        this.config = config;
        this.loadSdk = loadSdk;
        this.fetchFn = fetchFn;
        this.servicesPromise = null;
    }

    async services() {
        if (!this.config.authConfigured) {
            throw new CloudActionError('Cloud account is not configured for this build.', { code: 'SETUP_REQUIRED' });
        }
        if (!this.servicesPromise) {
            this.servicesPromise = this.loadSdk().then(({ Client, Account, Functions }) => {
                const client = new Client().setEndpoint(this.config.endpoint).setProject(this.config.projectId);
                return { account: new Account(client), functions: new Functions(client) };
            }).catch((error) => {
                this.servicesPromise = null;
                throw error;
            });
        }
        return this.servicesPromise;
    }

    async register({ email, password, name = '' }) {
        const sdk = await this.loadSdk();
        const { account } = await this.services();
        const cleanEmail = String(email || '').trim().toLowerCase();
        if (!cleanEmail || String(password || '').length < 8) {
            throw new CloudActionError('Enter a valid email and a password with at least 8 characters.', { code: 'INVALID_CREDENTIALS' });
        }
        await account.create({ userId: sdk.ID.unique(), email: cleanEmail, password, name: String(name || '').trim().slice(0, 128) });
        return account.createEmailPasswordSession({ email: cleanEmail, password });
    }

    async login({ email, password }) {
        const { account } = await this.services();
        return account.createEmailPasswordSession({ email: String(email || '').trim().toLowerCase(), password: String(password || '') });
    }

    async getCurrentUser() {
        const { account } = await this.services();
        try {
            return await account.get();
        } catch (error) {
            if (error?.code === 401 || error?.code === 404) return null;
            throw error;
        }
    }

    async logout() {
        const { account } = await this.services();
        return account.deleteSession({ sessionId: 'current' });
    }

    async sendPasswordRecovery(email) {
        const { account } = await this.services();
        const callback = new URL(window.location.pathname, window.location.origin).toString();
        return account.createRecovery({ email: String(email || '').trim().toLowerCase(), url: callback });
    }

    async linkIdentity(provider, { expectedUserId = null } = {}) {
        if (!['github', 'google'].includes(provider)) {
            throw new CloudActionError('That sign-in provider is not supported.', { code: 'INVALID_PROVIDER' });
        }
        const { account } = await this.services();
        const jwt = await account.createJWT();
        await this.verifyJwtIdentity(jwt.jwt, expectedUserId);
        const callback = new URL(window.location.pathname + window.location.search, window.location.origin).toString();
        const state = globalThis.crypto.randomUUID();
        sessionStorage.setItem('markups_oauth_state', state);
        try { account.createOAuth2Token({ provider, success: callback, failure: callback, state }); }
        catch (error) { sessionStorage.removeItem('markups_oauth_state'); throw error; }
    }

    async verifyJwtIdentity(jwt, expectedUserId = null) {
        let response;
        try {
            response = await this.fetchFn(`${this.config.endpoint}/account`, {
                method: 'GET',
                credentials: 'omit',
                headers: {
                    'X-Appwrite-Project': this.config.projectId,
                    'X-Appwrite-JWT': jwt
                }
            });
        } catch {
            throw new CloudActionError('Could not verify the current account session. Retry the action.', { code: 'SESSION_VERIFY_FAILED' });
        }
        if (!response?.ok) {
            const expired = response?.status === 401 || response?.status === 403;
            throw new CloudActionError(
                expired ? 'Your account session expired. Sign in again.' : 'Could not verify the current account session. Retry the action.',
                { code: expired ? 'SESSION_EXPIRED' : 'SESSION_VERIFY_FAILED', status: Number(response?.status) || 0 }
            );
        }
        let principal;
        try { principal = await response.json(); }
        catch { throw new CloudActionError('Could not verify the current account session. Retry the action.', { code: 'SESSION_VERIFY_FAILED' }); }
        if (!principal?.$id) throw new CloudActionError('Could not verify the current account session. Retry the action.', { code: 'SESSION_VERIFY_FAILED' });
        if (expectedUserId && principal.$id !== expectedUserId) {
            throw new CloudActionError('Your account changed in another tab. Close and reopen Cloud & connections before retrying.', { code: 'ACCOUNT_CHANGED' });
        }
        return principal;
    }

    async completeOAuthCallback() {
        const url = new URL(window.location.href);
        const userId = url.searchParams.get('userId');
        const secret = url.searchParams.get('secret');
        const providerError = url.searchParams.get('error') || url.searchParams.get('error_description');
        if (!userId && !secret && !providerError) return null;
        // Remove the one-time token from the address bar before network work.
        const state = url.searchParams.get('state');
        url.searchParams.delete('userId');
        url.searchParams.delete('secret');
        url.searchParams.delete('state');
        url.searchParams.delete('error');
        url.searchParams.delete('error_description');
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
        const expectedState = sessionStorage.getItem('markups_oauth_state');
        sessionStorage.removeItem('markups_oauth_state');
        if (!userId || !secret || !expectedState || !state || state !== expectedState) {
            throw new CloudActionError('The provider sign-in could not be verified. Start the connection again.', { code: 'OAUTH_STATE_MISMATCH' });
        }
        if (providerError) throw new CloudActionError('The provider did not approve this identity connection.', { code: 'OAUTH_DENIED' });
        const { account } = await this.services();
        return account.createSession({ userId, secret });
    }

    async call(action, payload = {}, { connector = false, expectedUserId = null } = {}) {
        const functionId = connector ? this.config.connectorFunctionId : this.config.cloudFunctionId;
        if (!functionId || (!connector && !this.config.cloudConfigured) || (connector && !this.config.connectorsConfigured)) {
            throw new CloudActionError(connector ? 'Cloud connections are not configured for this build.' : 'Cloud storage is not configured for this build.', { code: 'SETUP_REQUIRED' });
        }
        if (!expectedUserId) {
            throw new CloudActionError('Sign in again to use cloud services.', { code: 'EXPECTED_ACCOUNT_REQUIRED' });
        }
        const { account, functions } = await this.services();
        const jwt = await account.createJWT();
        // Verify the identity represented by this exact, immutable JWT. The
        // SDK's cookie session can change in another tab between UI rendering
        // and a cloud action; never send cached account A's data with account
        // B's newly-created JWT.
        await this.verifyJwtIdentity(jwt.jwt, expectedUserId);
        const execution = await functions.createExecution({
            functionId,
            async: false,
            body: JSON.stringify({ action, ...payload }),
            headers: { 'x-markups-user-jwt': jwt.jwt }
        });
        const status = Number(execution.responseStatusCode || 0);
        let response;
        try { response = JSON.parse(execution.responseBody || '{}'); }
        catch { response = null; }
        if (execution.status === 'failed' || (status && (status < 200 || status >= 300)) || !response || response.ok !== true) {
            const error = response?.error || {};
            throw new CloudActionError(error.message || 'The cloud request failed.', {
                code: error.code || 'CLOUD_REQUEST_FAILED',
                status,
                details: error.details || null
            });
        }
        return response.data;
    }
}

export const appwriteClient = new AppwriteClient();
