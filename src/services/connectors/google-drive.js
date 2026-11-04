import { CONNECTOR_MAX_BYTES, ConnectorError, providerError, validateMarkdown, readBoundedText } from './shared.js';

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const scripts = new Map();

function loadScript(src) {
    if (scripts.has(src)) return scripts.get(src);
    const promise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const timer = setTimeout(() => { script.remove(); reject(new ConnectorError('SDK_LOAD_FAILED', 'Google did not load. Retry the connection.')); }, 15000);
        script.src = src;
        script.async = true;
        script.onload = () => { clearTimeout(timer); resolve(); };
        script.onerror = () => { clearTimeout(timer); script.remove(); reject(new ConnectorError('SDK_LOAD_FAILED', 'Google did not load. Check your connection.')); };
        document.head.appendChild(script);
    }).catch(error => { scripts.delete(src); throw error; });
    scripts.set(src, promise);
    return promise;
}

function fileId(value) {
    if (typeof value !== 'string' || !/^[\w-]{1,200}$/.test(value)) throw new ConnectorError('INVALID_FILE', 'Choose a Google Drive file.');
    return encodeURIComponent(value);
}

function fileName(value) {
    if (typeof value !== 'string' || !value.trim() || value.length > 200 || /[\/\\\u0000-\u001f]/.test(value)) throw new ConnectorError('INVALID_NAME', 'Enter a Markdown file name.');
    return /\.(?:md|markdown|txt)$/i.test(value) ? value : value + '.md';
}

export class GoogleDriveConnector {
    constructor({ clientId = '', apiKey = '', appId = '', fetchFn = globalThis.fetch, google = null, gapi = null, origin = globalThis.location?.origin, conditionalUpdateVerified = false } = {}) {
        this.config = { clientId, apiKey, appId, origin };
        // Keep overwrites disabled until a live Drive v3 concurrent-edit POC confirms If-Match.
        this.conditionalUpdateVerified = conditionalUpdateVerified === true;
        this.fetchFn = fetchFn;
        this.google = google;
        this.gapi = gapi;
        this.token = null;
        this.generation = 0;
        this.controllers = new Set();
        this.activePicker = null;
        this.cancelPicker = null;
    }

    get connected() { return Boolean(this.token && this.token.expiresAt > Date.now()); }

    async prepare() {
        if (!this.config.clientId || !this.config.apiKey || !this.config.appId) throw new ConnectorError('SETUP_REQUIRED', 'Google Drive needs an OAuth client ID, restricted Picker API key and Google Cloud project number.');
        if (!this.google?.accounts?.oauth2) await loadScript('https://accounts.google.com/gsi/client');
        this.google ||= globalThis.google;
        if (!this.google?.picker) {
            if (!this.gapi) await loadScript('https://apis.google.com/js/api.js');
            this.gapi ||= globalThis.gapi;
            await new Promise((resolve, reject) => this.gapi.load('picker', { callback: resolve, onerror: () => reject(new ConnectorError('SDK_LOAD_FAILED', 'Google Picker did not load.')), timeout: 15000, ontimeout: () => reject(new ConnectorError('SDK_LOAD_FAILED', 'Google Picker timed out.')) }));
        }
        this.google ||= globalThis.google;
    }

    async connect() {
        const generation = ++this.generation;
        this.token = null;
        await this.prepare();
        if (generation !== this.generation) throw new ConnectorError('CANCELLED', 'The connection was cancelled.');
        return new Promise((resolve, reject) => {
            const client = this.google.accounts.oauth2.initTokenClient({
                client_id: this.config.clientId,
                scope: DRIVE_SCOPE,
                include_granted_scopes: false,
                callback: response => {
                    if (generation !== this.generation) return reject(new ConnectorError('CANCELLED', 'The connection was cancelled.'));
                    if (response.error || typeof response.access_token !== 'string' || !response.access_token || response.access_token.length > 8192 || /[\r\n]/.test(response.access_token) || !this.google.accounts.oauth2.hasGrantedAllScopes(response, DRIVE_SCOPE)) return reject(new ConnectorError('ACCESS_DENIED', 'Google Drive authorization was not granted.'));
                    const lifetime = Number(response.expires_in);
                    if (!Number.isFinite(lifetime) || lifetime <= 30) return reject(new ConnectorError('AUTH_EXPIRED', 'Google returned an expired token. Reconnect to continue.'));
                    this.token = { value: response.access_token, expiresAt: Date.now() + (lifetime - 30) * 1000 };
                    resolve({ connected: true });
                },
                error_callback: () => reject(new ConnectorError('AUTH_CANCELLED', 'Google connection was cancelled or its popup was blocked. Retry from the Connect button.'))
            });
            client.requestAccessToken({ prompt: 'consent' });
        });
    }

    async disconnect() {
        const token = this.token?.value;
        this.clearSession();
        if (!token || !this.google?.accounts?.oauth2) return { revoked: true };
        return new Promise(resolve => {
            const timer = setTimeout(() => resolve({ revoked: false }), 15000);
            this.google.accounts.oauth2.revoke(token, response => { clearTimeout(timer); resolve({ revoked: !response?.error }); });
        });
    }

    clearSession() {
        this.token = null;
        ++this.generation;
        for (const controller of this.controllers) controller.abort();
        this.activePicker?.setVisible(false);
        this.activePicker = null;
        this.cancelPicker?.();
        this.cancelPicker = null;
    }

    requireToken() {
        if (!this.connected) { this.token = null; throw new ConnectorError('AUTH_EXPIRED', 'Connect Google Drive to continue. Tokens are kept only for this session.'); }
        return this.token.value;
    }

    async request(url, options = {}, consume = response => response) {
        const generation = this.generation;
        const token = this.requireToken();
        const controller = new AbortController();
        this.controllers.add(controller);
        const timer = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await this.fetchFn(url, { ...options, credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error', signal: controller.signal, headers: { ...options.headers, Authorization: 'Bearer ' + token } });
            if (generation !== this.generation) throw new ConnectorError('CANCELLED', 'The connection changed during this request.');
            if (!response.ok) { if (response.status === 401) this.token = null; throw providerError(response.status); }
            const result = await consume(response);
            if (generation !== this.generation) throw new ConnectorError('CANCELLED', 'The connection changed during this request.');
            return result;
        } catch (error) {
            if (generation !== this.generation) throw new ConnectorError('CANCELLED', 'The connection changed during this request.');
            if (controller.signal.aborted) throw new ConnectorError('REQUEST_TIMEOUT', 'Google Drive did not respond in time. Retry when connected.');
            throw error;
        } finally { clearTimeout(timer); this.controllers.delete(controller); }
    }

    async pick() {
        const generation = this.generation;
        await this.prepare();
        if (generation !== this.generation) throw new ConnectorError('CANCELLED', 'The connection changed.');
        const token = this.requireToken();
        return new Promise((resolve, reject) => {
            this.cancelPicker = () => reject(new ConnectorError('CANCELLED', 'The file selection was cancelled.'));
            const pickerApi = this.google.picker;
            const view = new pickerApi.DocsView(pickerApi.ViewId.DOCS).setIncludeFolders(false).setMimeTypes('text/markdown,text/plain,text/x-markdown,application/octet-stream');
            const picker = new pickerApi.PickerBuilder().addView(view).setOAuthToken(token).setDeveloperKey(this.config.apiKey).setAppId(this.config.appId).setOrigin(this.config.origin).setCallback(data => {
                if (generation !== this.generation) return reject(new ConnectorError('CANCELLED', 'The connection changed.'));
                if (data.action === pickerApi.Action.CANCEL) { this.cancelPicker = null; this.activePicker = null; return resolve(null); }
                if (data.action === pickerApi.Action.PICKED) {
                    this.cancelPicker = null;
                    this.activePicker = null;
                    const selected = data.docs?.[0];
                    try { fileId(selected?.id); resolve({ id: selected.id, name: selected.name || '' }); } catch (error) { reject(error); }
                }
            }).build();
            this.activePicker = picker;
            picker.setVisible(true);
        });
    }

    async open(id) {
        const encoded = fileId(id);
        const { metadata, etag } = await this.request(API + '/' + encoded + '?fields=id,name,mimeType,size,version,trashed', {}, async response => ({ metadata: JSON.parse(await readBoundedText(response, 65536)), etag: response.headers.get('etag') }));
        if (metadata.id !== id || metadata.trashed || !/\.(?:md|markdown|txt)$/i.test(metadata.name || '') || !['text/markdown', 'text/plain', 'text/x-markdown', 'application/octet-stream'].includes(metadata.mimeType)) throw new ConnectorError('INVALID_FILE', 'Choose a Markdown or plain text file.');
        if (Number(metadata.size) > CONNECTOR_MAX_BYTES) throw new ConnectorError('DOCUMENT_TOO_LARGE', 'The remote file exceeds the import limit.');
        const strongETag = typeof etag === 'string' && /^"[^"\r\n]+"$/.test(etag) ? etag : null;
        const content = await this.request(API + '/' + encoded + '?alt=media', { headers: strongETag ? { 'If-Match': strongETag } : {} }, response => readBoundedText(response));
        return { id: metadata.id, name: metadata.name, content, etag: strongETag, version: metadata.version };
    }

    async save({ name, content, fileId: id = null, expectedETag = null }) {
        validateMarkdown(content);
        const safeName = fileName(name);
        if (id && !this.conditionalUpdateVerified) throw new ConnectorError('CONDITIONAL_UPDATE_UNVERIFIED', 'Updating existing Drive files is paused until Google Drive conditional writes are verified. Save a new copy to preserve remote edits.');
        if (id && (typeof expectedETag !== 'string' || !/^"[^"\r\n]+"$/.test(expectedETag))) throw new ConnectorError('CONDITIONAL_UPDATE_UNAVAILABLE', 'This file has no strong revision token. Save a new copy to avoid overwriting remote edits.');
        const boundary = 'markups-' + globalThis.crypto.randomUUID();
        const body = '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify({ name: safeName, mimeType: 'text/markdown' }) + '\r\n--' + boundary + '\r\nContent-Type: text/markdown; charset=UTF-8\r\n\r\n' + content + '\r\n--' + boundary + '--';
        return this.request(UPLOAD + (id ? '/' + fileId(id) : '') + '?uploadType=multipart&fields=id,name,version', { method: id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + boundary, ...(id ? { 'If-Match': expectedETag } : {}) }, body }, async response => {
            const metadata = JSON.parse(await readBoundedText(response, 65536));
            const etag = response.headers.get('etag');
            return { ...metadata, etag: typeof etag === 'string' && /^"[^"\r\n]+"$/.test(etag) ? etag : null };
        });
    }
}
