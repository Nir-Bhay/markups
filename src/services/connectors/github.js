import { ConnectorError, validateBranch, validateDirectory, validateMarkdown, validatePath, validateRepository } from './shared.js';

export class GitHubConnector {
    constructor({ request } = {}) { this.request = request; }

    async call(action, payload = {}, expectedUserId = null) {
        if (typeof this.request !== 'function') throw new ConnectorError('SETUP_REQUIRED', 'GitHub saving needs the configured authenticated connector service.');
        const result = expectedUserId
            ? await this.request(action, payload, { expectedUserId })
            : await this.request(action, payload);
        if (result?.ok === false) throw new ConnectorError(result.error?.code || 'PROVIDER_ERROR', result.error?.message || 'GitHub request failed.');
        return result?.data ?? result;
    }

    status(expectedUserId) { return this.call('github.status', {}, expectedUserId); }
    repositories(expectedUserId) { return this.call('github.repositories', {}, expectedUserId); }
    branches(repository, expectedUserId) { return this.call('github.branches', { repository: validateRepository(repository) }, expectedUserId); }
    files({ repository, branch, path = '', expectedUserId }) { return this.call('github.files', { repository: validateRepository(repository), branch: validateBranch(branch), path: validateDirectory(path) }, expectedUserId); }
    open({ repository, branch, path, expectedUserId }) { return this.call('github.open', { repository: validateRepository(repository), branch: validateBranch(branch), path: validatePath(path) }, expectedUserId); }

    save({ repository, branch, path, content, message, expectedSha = null, confirmed = false, expectedUserId }) {
        if (confirmed !== true) throw new ConnectorError('CONFIRM_REQUIRED', 'Review the destination and changes before committing.');
        if (typeof message !== 'string' || !message.trim() || message.length > 200 || /[\u0000-\u001f]/.test(message)) throw new ConnectorError('INVALID_MESSAGE', 'Enter a short commit message.');
        if (expectedSha !== null && !/^[a-f0-9]{40}$/i.test(expectedSha)) throw new ConnectorError('INVALID_REVISION', 'Open the remote file again before saving.');
        return this.call('github.save', { repository: validateRepository(repository), branch: validateBranch(branch), path: validatePath(path), content: validateMarkdown(content), message, expectedSha, confirmed: true }, expectedUserId);
    }

    uninstall({ installationId, confirmed = false, expectedUserId }) {
        if (confirmed !== true) throw new ConnectorError('CONFIRM_REQUIRED', 'Confirm removing this GitHub App installation.');
        return this.call('github.uninstall', { installationId: String(installationId), confirmed: true }, expectedUserId);
    }
}
