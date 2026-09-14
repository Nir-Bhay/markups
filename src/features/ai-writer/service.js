/**
 * AI Service - Multi-provider API client with streaming support
 * Handles communication with OpenAI, Anthropic, Ollama, and custom endpoints
 * @module features/ai-writer/service
 */

import { storageService } from '../../core/storage/index.js';
import { STORAGE_KEYS } from '../../core/storage/keys.js';
import { APP_CONFIG } from '../../config/app.config.js';
import { SYSTEM_PROMPT } from './system-prompt.js';

/**
 * Provider configurations with defaults
 */
export const PROVIDERS = {
    openai: {
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        defaultModel: 'gpt-4o-mini',
        format: 'openai',
        contextWindow: 128000
    },
    anthropic: {
        name: 'Anthropic',
        baseUrl: 'https://api.anthropic.com',
        models: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'],
        defaultModel: 'claude-sonnet-4-20250514',
        format: 'anthropic',
        contextWindow: 200000
    },
    gemini: {
        name: 'Google Gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        models: ['gemini-2.5-flash', 'gemini-2.5-pro'],
        defaultModel: 'gemini-2.5-flash',
        format: 'gemini',
        contextWindow: 1000000
    },
    ollama: {
        name: 'Ollama (Local)',
        baseUrl: 'http://localhost:11434/v1',
        models: [],
        defaultModel: 'llama3.2',
        format: 'openai',
        contextWindow: 32768
    },
    kilo: {
        name: 'Kilo Gateway',
        baseUrl: 'https://api.kilo.ai/api/gateway',
        models: [
            'inclusionai/ling-3.0-flash-fin:free',
            'openrouter/free',
            'stepfun/step-3.7-flash:free'
        ],
        defaultModel: 'inclusionai/ling-3.0-flash-fin:free',
        format: 'openai',
        contextWindow: 32768
    },
    custom: {
        name: 'Custom Endpoint',
        baseUrl: '',
        models: [],
        defaultModel: '',
        format: 'openai',
        contextWindow: 32768
    }
};

export const AI_LIMITS = {
    maxContextChars: APP_CONFIG.AI_MAX_CONTEXT_CHARS || 8000,
    maxPromptChars: APP_CONFIG.AI_MAX_PROMPT_CHARS || 12000,
    minOutputTokens: APP_CONFIG.AI_MIN_OUTPUT_TOKENS || 128,
    maxOutputTokens: APP_CONFIG.AI_MAX_OUTPUT_TOKENS || 8192,
    defaultOutputTokens: APP_CONFIG.AI_DEFAULT_OUTPUT_TOKENS || 2048
};

/**
 * A conservative client-side estimate. Providers tokenize differently, so
 * this is deliberately an upper-bound guard rather than a billing value.
 */
export function estimateTokens(text) {
    return Math.ceil(String(text || '').length / 4);
}

export function clampOutputTokens(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return AI_LIMITS.defaultOutputTokens;
    return Math.min(AI_LIMITS.maxOutputTokens, Math.max(AI_LIMITS.minOutputTokens, parsed));
}

/**
 * AIService class
 * Handles all AI API communication with streaming support
 */
class AIService {
    constructor() {
        this.abortController = null;
        this.isStreaming = false;
        // Phase 4.2: memory-only key (session mode) — never persisted.
        this._sessionApiKey = '';
    }

    /**
     * Get current AI configuration from storage
     * @returns {Object} AI configuration
     */
    getConfig(overrides = {}) {
        const storedProvider = storageService.get(STORAGE_KEYS.AI_PROVIDER) || 'openai';
        const provider = overrides.provider || storedProvider;
        const providerConfig = PROVIDERS[provider] || PROVIDERS.openai;
        const providerChanged = provider !== storedProvider;
        const model = overrides.model
            ?? (providerChanged ? providerConfig.defaultModel : storageService.get(STORAGE_KEYS.AI_MODEL))
            ?? providerConfig.defaultModel;

        return {
            provider,
            apiKey: overrides.apiKey ?? this._getApiKey(),
            endpoint: overrides.endpoint
                ?? (providerChanged ? providerConfig.baseUrl : storageService.get(STORAGE_KEYS.AI_ENDPOINT))
                ?? providerConfig.baseUrl,
            model,
            temperature: this._normalizeTemperature(
                overrides.temperature ?? storageService.get(STORAGE_KEYS.AI_TEMPERATURE) ?? 0.7
            ),
            maxTokens: clampOutputTokens(
                overrides.maxTokens ?? storageService.get(STORAGE_KEYS.AI_MAX_TOKENS) ?? AI_LIMITS.defaultOutputTokens
            ),
            contextChars: this._normalizeContextChars(
                overrides.contextChars ?? storageService.get(STORAGE_KEYS.AI_CONTEXT_CHARS) ?? AI_LIMITS.maxContextChars
            ),
            customInstructions: overrides.customInstructions
                ?? storageService.get(STORAGE_KEYS.AI_CUSTOM_INSTRUCTIONS)
                ?? '',
            rememberKey: overrides.rememberKey
                ?? storageService.get(STORAGE_KEYS.AI_REMEMBER_KEY)
                ?? false,
            contextWindow: providerConfig.contextWindow || 32768,
            capabilities: this._getModelCapabilities(provider, model),
            format: providerConfig.format
        };
    }

    /**
     * Save AI configuration to storage
     * @param {Object} config - Configuration to save
     */
    setConfig(config) {
        if (config.provider !== undefined) {
            storageService.set(STORAGE_KEYS.AI_PROVIDER, config.provider);
        }
        if (config.apiKey !== undefined) {
            this._setApiKey(config.apiKey);
        }
        if (config.endpoint !== undefined) {
            const endpoint = String(config.endpoint || '').trim();
            if (endpoint === '' || isAllowedEndpoint(endpoint, config.provider)) {
                storageService.set(STORAGE_KEYS.AI_ENDPOINT, endpoint);
            } else {
                console.warn('AI: rejected unsafe endpoint, keeping previous value');
            }
        }
        if (config.model !== undefined) {
            storageService.set(STORAGE_KEYS.AI_MODEL, config.model);
        }
        if (config.temperature !== undefined) {
            storageService.set(STORAGE_KEYS.AI_TEMPERATURE, config.temperature);
        }
        if (config.maxTokens !== undefined) {
            storageService.set(STORAGE_KEYS.AI_MAX_TOKENS, clampOutputTokens(config.maxTokens));
        }
        if (config.contextChars !== undefined) {
            storageService.set(STORAGE_KEYS.AI_CONTEXT_CHARS, this._normalizeContextChars(config.contextChars));
        }
        if (config.customInstructions !== undefined) {
            storageService.set(STORAGE_KEYS.AI_CUSTOM_INSTRUCTIONS, String(config.customInstructions).slice(0, 2000));
        }
        if (config.rememberKey !== undefined) {
            storageService.set(STORAGE_KEYS.AI_REMEMBER_KEY, Boolean(config.rememberKey));
        }
    }

    /**
     * Check if AI is configured (has API key)
     * @returns {boolean}
     */
    isConfigured() {
        return !!this._getApiKey();
    }

    /**
     * Send a message and get streamed response
     * @param {string} userMessage - The user's prompt
     * @param {Object} [options] - Additional options
     * @param {Function} [options.onChunk] - Callback for each text chunk
     * @param {Function} [options.onComplete] - Callback when streaming is done
     * @param {Function} [options.onError] - Callback on error
     * @returns {Promise<string>} Full response text
     */
    async streamMessage(userMessage, options = {}) {
        const prompt = String(userMessage || '').trim();
        if (!prompt) throw new Error('Please enter a prompt.');
        if (prompt.length > AI_LIMITS.maxPromptChars) {
            throw new Error(`Prompt is too long. Keep it under ${AI_LIMITS.maxPromptChars.toLocaleString()} characters.`);
        }

        const config = this.getConfig(options.config || {});

        if (!config.apiKey) {
            const error = new Error('No API key configured. Please add your API key in AI Settings.');
            if (options.onError) options.onError(error);
            throw error;
        }
        if (!isAllowedEndpoint(config.endpoint, config.provider)) {
            throw new Error('Use an HTTPS endpoint, or a localhost endpoint for local models.');
        }
        const estimatedInputTokens = estimateTokens(
            `${SYSTEM_PROMPT}\n${config.customInstructions}\n${prompt}`
        );
        if (estimatedInputTokens + config.maxTokens > config.contextWindow) {
            throw new Error('This request exceeds the safe context budget. Select less content or reduce the output limit.');
        }

        // Create abort controller for cancellation
        this.abortController = new AbortController();
        this.isStreaming = true;

        try {
            const messages = [{ role: 'user', content: prompt }];

            let response;
            if (config.format === 'anthropic') {
                response = await this._fetchAnthropic(messages, config);
            } else if (config.format === 'gemini') {
                response = await this._fetchGemini(messages, config);
            } else {
                response = await this._fetchOpenAI(messages, config);
            }

            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                throw this._createApiError(response.status, errorText);
            }

            // Parse streaming response
            let fullText = '';
            if (config.format === 'anthropic') {
                fullText = await this._parseAnthropicStream(
                    response,
                    options.onChunk,
                    options.onError,
                    options.onUsage
                );
            } else if (config.format === 'gemini') {
                fullText = await this._parseGeminiStream(response, options.onChunk, options.onUsage);
            } else {
                fullText = await this._parseOpenAIStream(response, options.onChunk, options.onUsage);
            }

            this.isStreaming = false;
            if (options.onComplete) options.onComplete(fullText);
            return fullText;

        } catch (error) {
            this.isStreaming = false;

            if (error.name === 'AbortError') {
                const abortError = new Error('Generation cancelled.');
                abortError.cancelled = true;
                if (options.onError) options.onError(abortError);
                throw abortError;
            }

            if (options.onError) options.onError(error);
            throw error;
        } finally {
            this.abortController = null;
        }
    }

    /**
     * Send a non-streaming message
     * @param {string} userMessage - The user's prompt
     * @returns {Promise<string>} Full response text
     */
    async sendMessage(userMessage) {
        const config = this.getConfig();

        if (!config.apiKey) {
            throw new Error('No API key configured. Please add your API key in AI Settings.');
        }

        this.abortController = new AbortController();

        try {
            const messages = [
                { role: 'user', content: userMessage }
            ];

            let response;
            if (config.format === 'anthropic') {
                response = await this._fetchAnthropic(messages, config, false);
            } else if (config.format === 'gemini') {
                response = await this._fetchGemini(messages, config, false);
            } else {
                response = await this._fetchOpenAI(messages, config, false);
            }

            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                throw this._createApiError(response.status, errorText);
            }

            const data = await response.json();

            if (config.format === 'anthropic') {
                return data.content?.[0]?.text || '';
            } else if (config.format === 'gemini') {
                return data.candidates?.[0]?.content?.parts
                    ?.map((part) => part.text || '')
                    .join('') || '';
            } else {
                return data.choices?.[0]?.message?.content || '';
            }

        } catch (error) {
            // Convert transport/network failures (and any other thrown error)
            // into a structured, user-friendly result instead of letting the
            // promise reject as an unhandled rejection. Callers receive
            // { error } and decide how to surface it.
            const raw = error?.message || '';
            const isNetwork = /fetch|network|Failed to fetch|load failed|AbortError|ECONN|ENOTFOUND/i.test(raw);
            const message = isNetwork
                ? 'Network error: unable to reach the AI service. Check your internet connection, endpoint URL, and API key.'
                : (raw || 'The AI service returned an unexpected error.');
            return { error: message };
        } finally {
            this.abortController = null;
        }
    }

    /**
     * Test API connection
     * @returns {Promise<{success: boolean, message: string, model: string}>}
     */
    async testConnection(configOverride = {}) {
        const config = this.getConfig(configOverride);

        if (!config.apiKey) {
            return { success: false, message: 'No API key provided.', model: '' };
        }
        if (!isAllowedEndpoint(config.endpoint, config.provider)) {
            return {
                success: false,
                message: 'Use an HTTPS endpoint, or a localhost endpoint for local models.',
                model: config.model
            };
        }

        try {
            this.abortController = new AbortController();

            const messages = [
                { role: 'user', content: 'Reply with exactly: "MarkupsAI connected successfully."' }
            ];

            let response;
            if (config.format === 'anthropic') {
                response = await this._fetchAnthropic(messages, {
                    ...config,
                    maxTokens: 50
                }, false);
            } else if (config.format === 'gemini') {
                response = await this._fetchGemini(messages, {
                    ...config,
                    maxTokens: 50
                }, false);
            } else {
                response = await this._fetchOpenAI(messages, {
                    ...config,
                    maxTokens: 50
                }, false);
            }

            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                const error = this._createApiError(response.status, errorText);
                return { success: false, message: error.message, model: config.model };
            }

            const _data = await response.json();
            return {
                success: true,
                message: 'Connection successful!',
                model: config.model
            };

        } catch (error) {
            return {
                success: false,
                message: error.message || 'Connection failed.',
                model: config.model
            };
        } finally {
            this.abortController = null;
        }
    }

    /**
     * Abort current request
     */
    abort() {
        if (this.abortController) {
            this.abortController.abort();
            this.isStreaming = false;
        }
    }

    // ==================== Private Methods ====================

    _normalizeTemperature(value) {
        const parsed = Number.parseFloat(value);
        if (!Number.isFinite(parsed)) return 0.7;
        return Math.min(1, Math.max(0, parsed));
    }

    _normalizeContextChars(value) {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isFinite(parsed)) return AI_LIMITS.maxContextChars;
        return Math.min(AI_LIMITS.maxContextChars, Math.max(1000, parsed));
    }

    _buildSystemPrompt(config) {
        const instructions = String(config.customInstructions || '').trim();
        return instructions
            ? `${SYSTEM_PROMPT}\n\n## USER WRITING PREFERENCES\n${instructions}`
            : SYSTEM_PROMPT;
    }

    _getModelCapabilities(provider, model) {
        const normalized = String(model || '').toLowerCase();
        const reasoning = provider === 'openai'
            && /^(o[1-9]|gpt-5)/i.test(normalized);
        return {
            reasoning,
            supportsTemperature: !reasoning,
            tokenParameter: reasoning ? 'max_completion_tokens' : 'max_tokens'
        };
    }

    /**
     * Fetch from OpenAI-compatible API
     * @private
     */
    async _fetchOpenAI(messages, config, stream = true) {
        const timeout = APP_CONFIG.AI_REQUEST_TIMEOUT_MS || 30000;

        const timeoutId = setTimeout(() => {
            if (this.abortController) this.abortController.abort();
        }, stream ? timeout * 4 : timeout);

        try {
            return await fetch(resolveAiFetchUrl(config.endpoint, '/chat/completions'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    model: config.model,
                    messages: [
                        { role: 'system', content: this._buildSystemPrompt(config) },
                        ...messages
                    ],
                    ...(config.capabilities.supportsTemperature
                        ? { temperature: config.temperature }
                        : {}),
                    [config.capabilities.tokenParameter]: config.maxTokens,
                    stream
                }),
                signal: this.abortController.signal
            });
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Fetch from Anthropic API
     * @private
     */
    async _fetchAnthropic(messages, config, stream = true) {
        const url = `${config.endpoint.replace(/\/$/, '')}/v1/messages`;
        const timeout = APP_CONFIG.AI_REQUEST_TIMEOUT_MS || 30000;

        const timeoutId = setTimeout(() => {
            if (this.abortController) this.abortController.abort();
        }, stream ? timeout * 4 : timeout);

        try {
            return await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': config.apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: config.model,
                    system: this._buildSystemPrompt(config),
                    messages: messages,
                    max_tokens: config.maxTokens,
                    temperature: config.temperature,
                    stream
                }),
                signal: this.abortController.signal
            });
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Fetch from the Gemini generateContent API using its native request shape.
     * @private
     */
    async _fetchGemini(messages, config, stream = true) {
        const base = config.endpoint.replace(/\/$/, '');
        const action = stream ? 'streamGenerateContent?alt=sse' : 'generateContent';
        const url = `${base}/models/${encodeURIComponent(config.model)}:${action}`;
        const timeout = APP_CONFIG.AI_REQUEST_TIMEOUT_MS || 30000;
        const timeoutId = setTimeout(() => {
            if (this.abortController) this.abortController.abort();
        }, stream ? timeout * 4 : timeout);

        try {
            return await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': config.apiKey
                },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: this._buildSystemPrompt(config) }] },
                    contents: messages.map((message) => ({
                        role: message.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: message.content }]
                    })),
                    generationConfig: {
                        temperature: config.temperature,
                        maxOutputTokens: config.maxTokens
                    }
                }),
                signal: this.abortController.signal
            });
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Parse OpenAI SSE stream
     * @private
     * @param {Response} response - Fetch response
     * @param {Function} [onChunk] - Callback per chunk
     * @returns {Promise<string>} Full text
     */
    async _parseOpenAIStream(response, onChunk, onUsage) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';
        let finished = false;

        try {
            while (!finished) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Process complete SSE lines
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data: ')) continue;

                    const data = trimmed.slice(6);
                    if (data === '[DONE]') {
                        finished = true;
                        break;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.usage && onUsage) onUsage(parsed.usage);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            fullText += content;
                            if (onChunk) onChunk(content, fullText);
                        }
                    } catch {
                        // Skip malformed JSON chunks
                    }
                }
            }

            buffer += decoder.decode();
            if (!finished && buffer.trim().startsWith('data: ')) {
                const data = buffer.trim().slice(6);
                if (data !== '[DONE]') {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.usage && onUsage) onUsage(parsed.usage);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            fullText += content;
                            if (onChunk) onChunk(content, fullText);
                        }
                    } catch {
                        // Ignore an incomplete final SSE record.
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }

        return fullText;
    }

    /**
     * Parse Anthropic SSE stream
     * @private
     * @param {Response} response - Fetch response
     * @param {Function} [onChunk] - Callback per chunk
     * @param {Function} [onError] - Callback to surface non-fatal stream errors
     * @returns {Promise<string>} Full text
     */
    async _parseAnthropicStream(response, onChunk, onError, onUsage) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';
        let finished = false;

        try {
            while (!finished) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Process complete SSE lines
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data: ')) continue;

                    try {
                        const parsed = JSON.parse(trimmed.slice(6));

                        if (parsed.type === 'content_block_delta') {
                            const content = parsed.delta?.text;
                            if (content) {
                                fullText += content;
                                if (onChunk) onChunk(content, fullText);
                            }
                        } else if (parsed.type === 'message_delta' && parsed.usage && onUsage) {
                            onUsage(parsed.usage);
                        } else if (parsed.type === 'message_stop') {
                            finished = true;
                            break;
                        } else if (parsed.type === 'error') {
                            // Surface the stream error without aborting the stream:
                            // log a warning, notify via onError (if provided), and
                            // continue consuming remaining chunks. Previously this
                            // re-threw and killed the whole stream.
                            const msg = parsed.error?.message || 'Anthropic streaming error';
                            console.warn('[ai-writer] Anthropic stream error event (continuing):', msg);
                            if (onError) onError(new Error(msg));
                            continue;
                        }
                    } catch (e) {
                        // Skip malformed JSON chunks; never re-throw so the stream
                        // is not aborted by a transient parse failure.
                        if (e && e.message && !e.message.includes('JSON')) {
                            console.warn('[ai-writer] Non-JSON stream line skipped (continuing):', e.message);
                        }
                    }
                }
            }

            buffer += decoder.decode();
            if (!finished && buffer.trim().startsWith('data: ')) {
                try {
                    const parsed = JSON.parse(buffer.trim().slice(6));
                    if (parsed.usage && onUsage) onUsage(parsed.usage);
                    const content = parsed.delta?.text;
                    if (content) {
                        fullText += content;
                        if (onChunk) onChunk(content, fullText);
                    }
                } catch {
                    // Ignore an incomplete final SSE record.
                }
            }
        } finally {
            reader.releaseLock();
        }

        return fullText;
    }

    /**
     * Parse Gemini's SSE stream.
     * @private
     */
    async _parseGeminiStream(response, onChunk, onUsage) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data: ')) continue;

                    try {
                        const parsed = JSON.parse(trimmed.slice(6));
                        if (parsed.usageMetadata && onUsage) onUsage(parsed.usageMetadata);
                        const content = parsed.candidates?.[0]?.content?.parts
                            ?.map((part) => part.text || '')
                            .join('') || '';
                        if (content) {
                            fullText += content;
                            if (onChunk) onChunk(content, fullText);
                        }
                    } catch {
                        // Skip malformed provider records.
                    }
                }
            }

            buffer += decoder.decode();
            if (buffer.trim().startsWith('data: ')) {
                try {
                    const parsed = JSON.parse(buffer.trim().slice(6));
                    if (parsed.usageMetadata && onUsage) onUsage(parsed.usageMetadata);
                    const content = parsed.candidates?.[0]?.content?.parts
                        ?.map((part) => part.text || '')
                        .join('') || '';
                    if (content) {
                        fullText += content;
                        if (onChunk) onChunk(content, fullText);
                    }
                } catch {
                    // Ignore an incomplete final SSE record.
                }
            }
        } finally {
            reader.releaseLock();
        }

        return fullText;
    }

    /**
     * Create a user-friendly API error
     * @private
     */
    _createApiError(status, responseText) {
        let message;
        let parsed;

        try {
            parsed = JSON.parse(responseText);
        } catch {
            parsed = null;
        }

        switch (status) {
            case 401:
                message = 'Invalid API key. Please check your key in AI Settings.';
                break;
            case 403:
                message = 'Access denied. Your API key may not have permission for this model.';
                break;
            case 404:
                message = 'API endpoint or model not found. Check your endpoint URL and model name.';
                break;
            case 429:
                message = 'Rate limited. Please wait a moment and try again.';
                break;
            case 500:
            case 502:
            case 503:
                message = 'AI service temporarily unavailable. Please try again later.';
                break;
            default:
                message = parsed?.error?.message
                    || parsed?.message
                    || `API error (${status}). Check your AI settings.`;
        }

        const error = new Error(message);
        error.status = status;
        error.apiError = true;
        return error;
    }

    /**
     * Get API key from storage (namespaced, with legacy fallback)
     * @private
     */
    _getApiKey() {
        // Phase 4.2: a session key takes precedence and is never persisted.
        if (this._sessionApiKey) return this._sessionApiKey;
        try {
            // First try namespaced key, then legacy key for migration
            return storageService.getString(STORAGE_KEYS.AI_API_KEY) ||
                localStorage.getItem('markups_ai_api_key') || '';
        } catch {
            return this._sessionApiKey || '';
        }
    }

    /**
     * Keep an API key in memory only for this session (Phase 4.2).
     * Removes any persisted key so nothing survives reload.
     * @param {string} key - API key (empty clears the session key)
     */
    setSessionApiKey(key) {
        this._sessionApiKey = String(key || '').trim();
        if (this._sessionApiKey) {
            try {
                storageService.remove(STORAGE_KEYS.AI_API_KEY);
                localStorage.removeItem('markups_ai_api_key');
            } catch {
                // Storage already unavailable — memory key still works.
            }
        }
    }

    /**
     * Clear the in-memory session key.
     */
    clearSessionApiKey() {
        this._sessionApiKey = '';
    }

    clearStoredApiKey() {
        this._setApiKey('');
        this.clearSessionApiKey();
    }

    /**
     * True when the key lives only in memory (Phase 4.2).
     * @returns {boolean}
     */
    isSessionKey() {
        return this._sessionApiKey !== '';
    }

    /**
     * Set API key through StorageService (namespaced)
     * @private
     */
    _setApiKey(key) {
        try {
            if (key) {
                storageService.set(STORAGE_KEYS.AI_API_KEY, key);
            } else {
                storageService.remove(STORAGE_KEYS.AI_API_KEY);
                localStorage.removeItem('markups_ai_api_key');
            }
        } catch (e) {
            console.error('Failed to store API key:', e);
        }
    }
}

// Export singleton
export const aiService = new AIService();

export { AIService };

/**
 * Same-origin proxy prefixes for gateways that block browser CORS.
 * Only these hosts are rewritten; arbitrary custom endpoints stay direct.
 */
export const BROWSER_AI_PROXIES = {
    'https://api.kilo.ai/api/gateway': '/api/ai-proxy/kilo',
    'https://api.tokenrouter.com/v1': '/api/ai-proxy/tokenrouter'
};

/**
 * Resolve the URL used for an OpenAI-compatible request.
 * In the browser, allowlisted gateways go through `/api/ai-proxy/*`.
 * @param {string} endpoint
 * @param {string} [suffix]
 * @returns {string}
 */
export function resolveAiFetchUrl(endpoint, suffix = '/chat/completions') {
    const normalized = String(endpoint || '').trim().replace(/\/+$/, '');
    const path = suffix.startsWith('/') ? suffix : `/${suffix}`;
    const proxyBase = BROWSER_AI_PROXIES[normalized];
    if (proxyBase && typeof window !== 'undefined') {
        return `${proxyBase}${path}`;
    }
    return `${normalized}${path}`;
}

/**
 * Browser-safe endpoint policy for BYOK mode.
 * HTTPS is required for remote providers; plain HTTP is reserved for local
 * Ollama-style endpoints so keys cannot be sent over the network in cleartext.
 */
export function isAllowedEndpoint(url, provider = 'custom') {
    const value = String(url || '').trim();
    if (!value) return true;

    try {
        const parsed = new URL(value);
        if (parsed.protocol === 'https:') return true;
        if (parsed.protocol !== 'http:') return false;
        return provider === 'ollama'
            || ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
    } catch {
        return false;
    }
}

/**
 * True when a URL is not one of the known provider base URLs (Phase 4.2).
 * Used to warn before an API key follows a user-typed endpoint.
 * @param {string} url - Endpoint URL
 * @returns {boolean}
 */
export function isCustomEndpoint(url) {
    const normalized = String(url || '').trim().replace(/\/+$/, '');
    if (!normalized) return false;
    return !Object.values(PROVIDERS).some(
        (p) => p.baseUrl && normalized === p.baseUrl.replace(/\/+$/, '')
    );
}

export default aiService;
