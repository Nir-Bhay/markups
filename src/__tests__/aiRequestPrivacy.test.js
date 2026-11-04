import { describe, it, expect, vi, afterEach } from 'vitest';
import { AIService, isAllowedEndpoint } from '../features/ai-writer/service.js';

afterEach(() => vi.unstubAllGlobals());

describe('AI transport privacy boundary', () => {
    it('never treats an Ollama label as permission for cleartext remote transport', () => {
        expect(isAllowedEndpoint('http://remote.example:11434/v1', 'ollama')).toBe(false);
        expect(isAllowedEndpoint('http://localhost.evil.test:11434/v1', 'ollama')).toBe(false);
        expect(isAllowedEndpoint('http://127.0.0.1:11434/v1', 'ollama')).toBe(true);
        expect(isAllowedEndpoint('http://[::1]:11434/v1', 'ollama')).toBe(true);
        for (const endpoint of ['https://user:pass@provider.test/v1', 'https://provider.test/v1?key=secret', 'https://provider.test/v1#secret']) {
            expect(isAllowedEndpoint(endpoint)).toBe(false);
        }
    });

    it.each([
        ['_fetchOpenAI', 'https://provider.test/v1'],
        ['_fetchAnthropic', 'https://provider.test'],
        ['_fetchGemini', 'https://provider.test/v1beta']
    ])('%s refuses redirects and omits browser credentials/referrers', async (method, endpoint) => {
        const fetch = vi.fn().mockResolvedValue({ ok: true });
        vi.stubGlobal('fetch', fetch);
        const service = new AIService();
        service.abortController = new AbortController();
        const config = service.getConfig({ provider: 'custom', endpoint, model: 'test', apiKey: 'secret' });
        await service[method]([{ role: 'user', content: 'chosen text' }], config, false);
        expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            redirect: 'error', credentials: 'omit', referrerPolicy: 'no-referrer'
        }));
        expect(fetch.mock.calls[0][0]).not.toContain('secret');
    });
});
