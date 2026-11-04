export const CONNECTOR_MAX_BYTES = 5 * 1024 * 1024;

export class ConnectorError extends Error {
    constructor(code, message, status = 0) {
        super(message);
        this.name = 'ConnectorError';
        this.code = code;
        this.status = status;
    }
}

export function validateMarkdown(content, maxBytes = CONNECTOR_MAX_BYTES) {
    if (typeof content !== 'string') throw new ConnectorError('INVALID_CONTENT', 'Document text is required.');
    if (new TextEncoder().encode(content).length > maxBytes) {
        throw new ConnectorError('DOCUMENT_TOO_LARGE', 'This document exceeds the provider save limit.');
    }
    if (/markups-img:img_[\w]+/.test(content)) {
        throw new ConnectorError('LOCAL_MEDIA', 'Export a portable copy or include the local images before saving to another device.');
    }
    return content;
}

export function validateRepository(repository) {
    if (typeof repository !== 'string' || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) || repository.length > 220 || repository.split('/').some(p => p === '.' || p === '..')) {
        throw new ConnectorError('INVALID_REPOSITORY', 'Choose a repository from the connected installation.');
    }
    return repository;
}

export function validatePath(path) {
    if (typeof path !== 'string' || path.length > 512 || /[\\\u0000-\u001f\u007f?#%]/.test(path) || path.startsWith('/') || path.split('/').some(p => !p || p === '.' || p === '..') || !/\.(?:md|markdown|txt)$/i.test(path)) {
        throw new ConnectorError('INVALID_PATH', 'Choose a relative .md, .markdown or .txt file path.');
    }
    return path;
}

export function validateDirectory(path = '') {
    if (typeof path !== 'string' || path.length > 512 || /[\\\u0000-\u001f\u007f?#%]/.test(path) || path.startsWith('/') || (path && path.split('/').some(p => !p || p === '.' || p === '..'))) {
        throw new ConnectorError('INVALID_PATH', 'Choose a relative repository folder.');
    }
    return path;
}

export function validateBranch(branch) {
    if (typeof branch !== 'string' || !branch || branch.length > 200 || /[\u0000-\u0020\u007f~^:?*\[\\]/.test(branch) || branch.includes('..') || branch.includes('@{') || branch.startsWith('/') || branch.endsWith('/') || branch.endsWith('.') || branch.split('/').some(p => !p || p.startsWith('.') || p.endsWith('.lock'))) {
        throw new ConnectorError('INVALID_BRANCH', 'Choose a valid branch.');
    }
    return branch;
}

export function providerError(status) {
    if (status === 401) return new ConnectorError('AUTH_EXPIRED', 'Reconnect this provider to continue.', status);
    if (status === 403) return new ConnectorError('ACCESS_DENIED', 'The provider denied access. Check selected files, repositories and permissions.', status);
    if (status === 404) return new ConnectorError('NOT_FOUND', 'The selected file or repository is unavailable.', status);
    if (status === 409 || status === 412) return new ConnectorError('CONFLICT', 'The remote file changed. Open the latest copy or save a separate copy.', status);
    if (status === 429) return new ConnectorError('RATE_LIMITED', 'The provider is busy. Please retry later.', status);
    return new ConnectorError('PROVIDER_ERROR', 'The provider request failed. Your local document is unchanged.', status);
}

export async function readBoundedText(response, maxBytes = CONNECTOR_MAX_BYTES) {
    const length = Number(response.headers?.get?.('content-length'));
    if (length > maxBytes) throw new ConnectorError('DOCUMENT_TOO_LARGE', 'The remote file exceeds the import limit.');
    if (!response.body?.getReader) {
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.length > maxBytes) throw new ConnectorError('DOCUMENT_TOO_LARGE', 'The remote file exceeds the import limit.');
        return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let text = '';
    let bytes = 0;
    try {
        while (true) {
            const chunk = await reader.read();
            if (chunk.done) break;
            bytes += chunk.value.byteLength;
            if (bytes > maxBytes) throw new ConnectorError('DOCUMENT_TOO_LARGE', 'The remote file exceeds the import limit.');
            text += decoder.decode(chunk.value, { stream: true });
        }
        return text + decoder.decode();
    } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
    }
}
