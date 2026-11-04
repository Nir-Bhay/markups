import { describe, expect, it, vi } from 'vitest';
import { AppwriteClient, readAppwriteConfig } from '../services/cloud/appwriteClient.js';

function fakeSdk({ execution = {}, account = {} } = {}) {
    const client = { setEndpoint: vi.fn().mockReturnThis(), setProject: vi.fn().mockReturnThis() };
    const accountApi = { createJWT: vi.fn().mockResolvedValue({ jwt: 'user.jwt.token' }), ...account };
    const functions = { createExecution: vi.fn().mockResolvedValue({ status: 'completed', responseStatusCode: 200, responseBody: JSON.stringify({ ok: true, data: { saved: true } }), ...execution }) };
    return {
        sdk: {
            Client: vi.fn(function Client() { return client; }),
            Account: vi.fn(function Account() { return accountApi; }),
            Functions: vi.fn(function Functions() { return functions; }),
            ID: { unique: () => 'generated-user-id' }
        },
        client, accountApi, functions
    };
}

function accountFetch(userId = 'alice', overrides = {}) {
    return vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ $id: userId }), ...overrides });
}

const config = readAppwriteConfig({
    VITE_APPWRITE_ENDPOINT: 'https://cloud.appwrite.io/v1',
    VITE_APPWRITE_PROJECT_ID: 'project',
    VITE_APPWRITE_CLOUD_FUNCTION_ID: 'cloud-api',
    VITE_APPWRITE_CONNECTOR_FUNCTION_ID: 'connector-api'
});

describe('Appwrite client boundary', () => {
    it('requires a safe endpoint and keeps project IDs public-only', () => {
        expect(readAppwriteConfig({ VITE_APPWRITE_ENDPOINT: 'http://example.com', VITE_APPWRITE_PROJECT_ID: 'p' }).authConfigured).toBe(false);
        expect(readAppwriteConfig({ VITE_APPWRITE_ENDPOINT: 'https://user:secret@example.com/v1', VITE_APPWRITE_PROJECT_ID: 'p' }).authConfigured).toBe(false);
        expect(readAppwriteConfig({ VITE_APPWRITE_ENDPOINT: 'http://localhost/v1', VITE_APPWRITE_PROJECT_ID: 'p' }).authConfigured).toBe(true);
    });

    it('does no SDK/network work until an explicit method is called', () => {
        const loadSdk = vi.fn();
        new AppwriteClient({ config, loadSdk });
        expect(loadSdk).not.toHaveBeenCalled();
    });

    it('sends only the user JWT and requested action to the configured function', async () => {
        const { sdk, client, functions, accountApi } = fakeSdk();
        const fetchFn = accountFetch();
        const api = new AppwriteClient({ config, loadSdk: async () => sdk, fetchFn });
        await expect(api.call('documents.list', {}, { expectedUserId: 'alice' })).resolves.toEqual({ saved: true });
        expect(client.setEndpoint).toHaveBeenCalledWith('https://cloud.appwrite.io/v1');
        expect(accountApi.createJWT).toHaveBeenCalledOnce();
        expect(fetchFn).toHaveBeenCalledWith('https://cloud.appwrite.io/v1/account', expect.objectContaining({
            credentials: 'omit',
            headers: { 'X-Appwrite-Project': 'project', 'X-Appwrite-JWT': 'user.jwt.token' }
        }));
        const [request] = functions.createExecution.mock.calls[0];
        expect(request).toMatchObject({ functionId: 'cloud-api', async: false, headers: { 'x-markups-user-jwt': 'user.jwt.token' } });
        expect(JSON.parse(request.body)).toEqual({ action: 'documents.list' });
        expect(JSON.stringify(request)).not.toContain('secret');
    });

    it('blocks cloud calls when the exact JWT belongs to a different account than the UI', async () => {
        const { sdk, functions } = fakeSdk();
        const api = new AppwriteClient({ config, loadSdk: async () => sdk, fetchFn: accountFetch('bob') });
        await expect(api.call('documents.save', { content: 'Alice text' }, { expectedUserId: 'alice' }))
            .rejects.toMatchObject({ code: 'ACCOUNT_CHANGED' });
        expect(functions.createExecution).not.toHaveBeenCalled();
    });

    it('fails closed when a caller does not supply the account it is acting for', async () => {
        const { sdk, accountApi, functions } = fakeSdk();
        const api = new AppwriteClient({ config, loadSdk: async () => sdk, fetchFn: accountFetch() });
        await expect(api.call('documents.list')).rejects.toMatchObject({ code: 'EXPECTED_ACCOUNT_REQUIRED' });
        expect(accountApi.createJWT).not.toHaveBeenCalled();
        expect(functions.createExecution).not.toHaveBeenCalled();
    });

    it('does not begin OAuth identity linking after an account switch', async () => {
        const createOAuth2Token = vi.fn();
        const { sdk } = fakeSdk({ account: { createOAuth2Token } });
        const api = new AppwriteClient({ config, loadSdk: async () => sdk, fetchFn: accountFetch('bob') });
        await expect(api.linkIdentity('github', { expectedUserId: 'alice' })).rejects.toMatchObject({ code: 'ACCOUNT_CHANGED' });
        expect(createOAuth2Token).not.toHaveBeenCalled();
    });

    it('fails closed when storage or connector function configuration is absent', async () => {
        const api = new AppwriteClient({ config: { ...config, cloudConfigured: false, cloudFunctionId: '', connectorsConfigured: false, connectorFunctionId: '' }, loadSdk: vi.fn() });
        await expect(api.call('documents.list')).rejects.toMatchObject({ code: 'SETUP_REQUIRED' });
        await expect(api.call('github.status', {}, { connector: true })).rejects.toMatchObject({ code: 'SETUP_REQUIRED' });
    });

    it('surfaces typed backend errors without treating failed execution as success', async () => {
        const { sdk } = fakeSdk({ execution: {
            status: 'completed', responseStatusCode: 409,
            responseBody: JSON.stringify({ ok: false, error: { code: 'CONFLICT', message: 'Open the latest copy.' } })
        } });
        const api = new AppwriteClient({ config, loadSdk: async () => sdk, fetchFn: accountFetch() });
        await expect(api.call('documents.save', {}, { expectedUserId: 'alice' })).rejects.toMatchObject({ code: 'CONFLICT', status: 409, message: 'Open the latest copy.' });
    });
});
