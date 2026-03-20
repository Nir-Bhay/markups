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
        format: 'openai'
    },
    anthropic: {
        name: 'Anthropic',
        baseUrl: 'https://api.anthropic.com',
        models: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'],
        defaultModel: 'claude-sonnet-4-20250514',
        format: 'anthropic'
    },
    ollama: {
        name: 'Ollama (Local)',
        baseUrl: 'http://localhost:11434/v1',
        models: [],
        defaultModel: 'llama3.2',
        format: 'openai'
    },
    custom: {
        name: 'Custom Endpoint',
        baseUrl: '',
        models: [],
        defaultModel: '',
        format: 'openai'
    }
};

/**
 * AIService class
 * Handles all AI API communication with streaming support
 */
class AIService {
    constructor() {
        this.abortController = null;
        this.isStreaming = false;
    }

    /**
     * Get current AI configuration from storage
     * @returns {Object} AI configuration
     */
    getConfig() {
        const provider = storageService.get(STORAGE_KEYS.AI_PROVIDER) || 'openai';
        const providerConfig = PROVIDERS[provider] || PROVIDERS.openai;

        return {
            provider,
            apiKey: this._getApiKey(),
            endpoint: storageService.get(STORAGE_KEYS.AI_ENDPOINT) || providerConfig.baseUrl,
            model: storageService.get(STORAGE_KEYS.AI_MODEL) || providerConfig.defaultModel,
            temperature: storageService.get(STORAGE_KEYS.AI_TEMPERATURE) ?? 0.7,
            maxTokens: storageService.get(STORAGE_KEYS.AI_MAX_TOKENS) || 2048,
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
            storageService.set(STORAGE_KEYS.AI_ENDPOINT, config.endpoint);
        }
        if (config.model !== undefined) {
            storageService.set(STORAGE_KEYS.AI_MODEL, config.model);
        }
        if (config.temperature !== undefined) {
            storageService.set(STORAGE_KEYS.AI_TEMPERATURE, config.temperature);
        }
        if (config.maxTokens !== undefined) {
            storageService.set(STORAGE_KEYS.AI_MAX_TOKENS, config.maxTokens);
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
        const config = this.getConfig();

        if (!config.apiKey) {
            const error = new Error('No API key configured. Please add your API key in AI Settings.');
            if (options.onError) options.onError(error);
            throw error;
        }

        // Create abort controller for cancellation
        this.abortController = new AbortController();
        this.isStreaming = true;

        try {
            const messages = [
                { role: 'user', content: userMessage }
            ];

            let response;
            if (config.format === 'anthropic') {
                response = await this._fetchAnthropic(messages, config);
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
                fullText = await this._parseAnthropicStream(response, options.onChunk);
            } else {
                fullText = await this._parseOpenAIStream(response, options.onChunk);
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
            } else {
                return data.choices?.[0]?.message?.content || '';
            }

        } finally {
            this.abortController = null;
        }
    }

    /**
     * Test API connection
     * @returns {Promise<{success: boolean, message: string, model: string}>}
     */
    async testConnection() {
        const config = this.getConfig();

        if (!config.apiKey) {
            return { success: false, message: 'No API key provided.', model: '' };
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

            const data = await response.json();
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

    /**
     * Fetch from OpenAI-compatible API
     * @private
     */
    async _fetchOpenAI(messages, config, stream = true) {
        const url = `${config.endpoint.replace(/\/$/, '')}/chat/completions`;
        const timeout = APP_CONFIG.AI_REQUEST_TIMEOUT_MS || 30000;

        const timeoutId = setTimeout(() => {
            if (this.abortController) this.abortController.abort();
        }, stream ? timeout * 4 : timeout);

        try {
            return await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    model: config.model,
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        ...messages
                    ],
                    temperature: config.temperature,
                    max_tokens: config.maxTokens,
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
                    system: SYSTEM_PROMPT,
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
     * Parse OpenAI SSE stream
     * @private
     * @param {Response} response - Fetch response
     * @param {Function} [onChunk] - Callback per chunk
     * @returns {Promise<string>} Full text
     */
    async _parseOpenAIStream(response, onChunk) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        try {
            while (true) {
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
                    if (data === '[DONE]') break;

                    try {
                        const parsed = JSON.parse(data);
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
     * @returns {Promise<string>} Full text
     */
    async _parseAnthropicStream(response, onChunk) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        try {
            while (true) {
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
                        } else if (parsed.type === 'message_stop') {
                            break;
                        } else if (parsed.type === 'error') {
                            throw new Error(parsed.error?.message || 'Anthropic streaming error');
                        }
                    } catch (e) {
                        if (e.message && !e.message.includes('JSON')) throw e;
                        // Skip malformed JSON chunks
                    }
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
     * Get API key from localStorage (direct, not through StorageService namespace)
     * @private
     */
    _getApiKey() {
        try {
            return localStorage.getItem('markups_ai_api_key') || '';
        } catch {
            return '';
        }
    }

    /**
     * Set API key directly in localStorage
     * @private
     */
    _setApiKey(key) {
        try {
            if (key) {
                localStorage.setItem('markups_ai_api_key', key);
            } else {
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

export default aiService;
