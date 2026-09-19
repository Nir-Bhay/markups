/**
 * Tests for AI service security controls (Phase 4.2):
 * custom-endpoint detection, endpoint scheme validation, session-only keys.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    AIService,
    AI_LIMITS,
    estimateTokens,
    isAllowedEndpoint,
    isCustomEndpoint,
    resolveAiFetchUrl
} from '../features/ai-writer/service.js';
import { storageService } from '../core/storage/index.js';
import { STORAGE_KEYS } from '../core/storage/keys.js';

describe('isCustomEndpoint', () => {
    it('returns false for known provider URLs', () => {
        expect(isCustomEndpoint('https://api.openai.com/v1')).toBe(false);
        expect(isCustomEndpoint('https://api.anthropic.com')).toBe(false);
        expect(isCustomEndpoint('http://localhost:11434/v1')).toBe(false);
        expect(isCustomEndpoint('https://api.kilo.ai/api/gateway')).toBe(false);
    });

    it('normalizes trailing slashes', () => {
        expect(isCustomEndpoint('https://api.openai.com/v1/')).toBe(false);
    });

    it('returns true for user-typed hosts and false for empty', () => {
        expect(isCustomEndpoint('https://my-proxy.example.com/v1')).toBe(true);
        expect(isCustomEndpoint('')).toBe(false);
    });
});

describe('resolveAiFetchUrl', () => {
    it('proxies allowlisted gateways in the browser to avoid CORS', () => {
        expect(resolveAiFetchUrl('https://api.kilo.ai/api/gateway', '/chat/completions'))
            .toBe('/api/ai-proxy/kilo/chat/completions');
        expect(resolveAiFetchUrl('https://api.tokenrouter.com/v1/', '/chat/completions'))
            .toBe('/api/ai-proxy/tokenrouter/chat/completions');
    });

    it('does not proxy arbitrary custom endpoints', () => {
        expect(resolveAiFetchUrl('https://evil.example/v1', '/chat/completions'))
            .toBe('https://evil.example/v1/chat/completions');
    });
});

describe('AI service request guards', () => {
    it('requires HTTPS for remote endpoints but allows local HTTP', () => {
        expect(isAllowedEndpoint('https://proxy.example.com/v1', 'custom')).toBe(true);
        expect(isAllowedEndpoint('http://proxy.example.com/v1', 'custom')).toBe(false);
        expect(isAllowedEndpoint('http://localhost:11434/v1', 'ollama')).toBe(true);
        expect(isAllowedEndpoint('javascript:alert(1)', 'custom')).toBe(false);
    });

    it('estimates tokens conservatively and clamps output limits', () => {
        expect(estimateTokens('12345678')).toBe(2);
        const service = new AIService();
        expect(service.getConfig({ maxTokens: 1 }).maxTokens).toBe(AI_LIMITS.minOutputTokens);
        expect(service.getConfig({ maxTokens: 999999 }).maxTokens).toBe(AI_LIMITS.maxOutputTokens);
    });

    it('marks reasoning-style OpenAI models as temperature-incompatible', () => {
        const service = new AIService();
        expect(service.getConfig({ provider: 'openai', model: 'gpt-5-mini' }).capabilities).toEqual({
            reasoning: true,
            supportsTemperature: false,
            tokenParameter: 'max_completion_tokens'
        });
    });
});

describe('AIService endpoint validation (Phase 4.2)', () => {
    let service;

    beforeEach(() => {
        service = new AIService();
        storageService.remove(STORAGE_KEYS.AI_ENDPOINT);
    });

    it('stores http(s) endpoints', () => {
        service.setConfig({ endpoint: 'https://my-proxy.example.com/v1' });
        expect(service.getConfig().endpoint).toBe('https://my-proxy.example.com/v1');
    });

    it('rejects non-http(s) endpoints and keeps the previous value', () => {
        service.setConfig({ endpoint: 'https://good.example.com' });
        service.setConfig({ endpoint: 'javascript:alert(1)' });
        expect(service.getConfig().endpoint).toBe('https://good.example.com');
    });
});

describe('AIService session-only keys (Phase 4.2)', () => {
    let service;

    beforeEach(() => {
        service = new AIService();
        service.clearSessionApiKey();
        storageService.remove(STORAGE_KEYS.AI_API_KEY);
        localStorage.removeItem('markups_ai_api_key');
    });

    it('prefers the session key and never persists it', () => {
        service.setSessionApiKey('sk-session');
        expect(service.isSessionKey()).toBe(true);
        expect(service.getConfig().apiKey).toBe('sk-session');
        expect(storageService.get(STORAGE_KEYS.AI_API_KEY)).toBeNull();
        expect(localStorage.getItem('markups_ai_api_key')).toBeNull();
    });

    it('removes any persisted key when a session key is set', () => {
        service.setConfig({ apiKey: 'sk-stored' });
        expect(service.getConfig().apiKey).toBe('sk-stored');
        service.setSessionApiKey('sk-session');
        expect(service.getConfig().apiKey).toBe('sk-session');
        expect(storageService.get(STORAGE_KEYS.AI_API_KEY)).toBeNull();
    });

    it('clearSessionApiKey drops back to stored (or empty)', () => {
        service.setSessionApiKey('sk-session');
        service.clearSessionApiKey();
        expect(service.isSessionKey()).toBe(false);
        expect(service.getConfig().apiKey).toBe('');
    });
});

describe('AIService test connection isolation', () => {
    let service;

    beforeEach(() => {
        service = new AIService();
        service.clearStoredApiKey();
        storageService.set(STORAGE_KEYS.AI_ENDPOINT, 'https://api.openai.com/v1');
    });

    afterEach(() => {
        vi.restoreAllMocks();
        storageService.remove(STORAGE_KEYS.AI_ENDPOINT);
    });

    it('tests an override without persisting its endpoint or key', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
            text: async () => ''
        }));

        const result = await service.testConnection({
            provider: 'openai',
            apiKey: 'sk-temporary',
            endpoint: 'https://temporary.example.com/v1',
            model: 'custom-model'
        });

        expect(result.success).toBe(true);
        expect(storageService.get(STORAGE_KEYS.AI_ENDPOINT)).toBe('https://api.openai.com/v1');
        expect(storageService.get(STORAGE_KEYS.AI_API_KEY)).toBeNull();
    });
});
