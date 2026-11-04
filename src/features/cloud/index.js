import { db } from '../../core/storage/database.js';
import { createFocusTrap } from '../../utils/dom.js';
import { appwriteClient } from '../../services/cloud/appwriteClient.js';
import { GitHubConnector, GoogleDriveConnector } from '../../services/connectors/index.js';
import './cloud.css';

const POLICY_VERSION = '2026-10-27';
const CLOUD_DOCUMENT_LIMIT = 25;
const CLOUD_DOCUMENT_BYTES = 512 * 1024;
const CLOUD_CONFIRM_DELETE = 'DELETE MY CLOUD DATA';
const message = (error, fallback) => error?.message || fallback;
const bytes = (value) => new TextEncoder().encode(String(value ?? '')).byteLength;
const uuid = () => globalThis.crypto.randomUUID();

function ensurePanel() {
    let overlay = document.getElementById('cloud-account-overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'cloud-account-overlay';
    overlay.className = 'cloud-account-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <section id="cloud-account-panel" class="cloud-account-panel" role="dialog" aria-modal="true" aria-labelledby="cloud-account-title" tabindex="-1">
        <header class="cloud-account-header"><div><h2 id="cloud-account-title">Cloud &amp; connections</h2><p>Your drafts autosave in this browser. Choose a connection only when you want to open or save a separate online copy.</p></div><button type="button" data-close-cloud aria-label="Close">×</button></header>
        <p id="cloud-account-status" class="cloud-account-status" role="status" aria-live="polite"></p>
        <section id="cloud-config-state" class="cloud-card" hidden><h3>Markups Cloud · Not available in this build</h3><p>Account sign-in and optional cloud backup still need setup by the project owner. No Markups Cloud backup is active. You can keep editing locally and export a backup file.</p><p>GitHub connections also need this account service. Google Drive is separate and does not require a Markups account.</p></section>
        <section id="cloud-auth-state" hidden>
          <div class="cloud-auth-tabs" role="group" aria-label="Account action"><button type="button" data-auth-mode="login" aria-pressed="true">Sign in</button><button type="button" data-auth-mode="register" aria-pressed="false">Create account</button></div>
          <form id="cloud-auth-form" class="cloud-auth-form">
            <label data-auth-name hidden>Name<input name="name" type="text" autocomplete="name" maxlength="128"></label>
            <label>Email<input name="email" type="email" autocomplete="email" required maxlength="320"></label>
            <label>Password<input name="password" type="password" autocomplete="current-password" required minlength="8" maxlength="256"></label>
            <button class="cloud-primary" type="submit" id="cloud-auth-submit">Sign in</button>
          </form>
          <button class="cloud-text-button" id="cloud-recovery" type="button">Send password reset link</button>
        </section>
        <section class="cloud-card" id="cloud-drive-section">
          <h3>Google Drive</h3><p>Connect only when you choose. Access is limited to files you select; the token stays in memory for this browser session.</p>
          <p>Open: connect → choose a Markdown/text file → open a new local tab. Save: connect → save the current document as a new Drive file. Existing Drive files are never replaced in this build.</p>
          <div class="cloud-actions" id="drive-actions"><button type="button" id="drive-prepare">1. Load Google Drive tools</button><button type="button" id="drive-connect" disabled>2. Connect Google Drive</button><button type="button" id="drive-pick" disabled>Choose a file to open</button><button type="button" id="drive-open" disabled>Open as a new local document</button><button type="button" id="drive-save" disabled>Save current document as a new Drive file</button><button type="button" id="drive-disconnect" hidden>Disconnect</button></div>
          <p id="drive-selected" class="cloud-provider-status"></p>
        </section>
        <section id="cloud-workspace" hidden>
          <div class="cloud-user-row"><span>Signed in as <strong id="cloud-user-email"></strong></span><button type="button" id="cloud-logout">Sign out</button></div>
          <section id="cloud-storage-section" class="cloud-card" hidden>
            <h3>Markups Cloud</h3>
            <p>Cloud backup is manual and requires consent for this document. Pilot limit: 512 KiB per document, 5 MiB per account, 25 documents, and up to 3 previous versions retained for 7 days. Images are not accepted in cloud documents.</p>
            <p id="cloud-current-label" class="cloud-current-label"></p>
            <label class="cloud-consent"><input id="cloud-consent" type="checkbox"><span>I agree to store this document and its limited version history in Markups Cloud. I can delete this cloud copy later. This does not change local autosave.</span></label>
            <div class="cloud-actions"><button type="button" class="cloud-primary" id="cloud-save-current">Save this document to Cloud</button><button type="button" id="cloud-delete-current" hidden>Delete its cloud copy</button></div>
            <div id="cloud-usage" class="cloud-usage"></div>
            <div class="cloud-list-head"><h4>Your cloud documents</h4><button type="button" id="cloud-refresh-list">Refresh</button></div>
            <ul id="cloud-document-list" class="cloud-document-list"></ul>
            <details class="cloud-danger"><summary>Delete all cloud document data</summary><p>This leaves your Markups account and local browser documents intact.</p><button type="button" id="cloud-delete-all">Delete all cloud copies</button></details>
          </section>
          <section class="cloud-card" id="cloud-github-section">
            <h3>GitHub</h3><p>Link GitHub → allow selected repositories → choose repository and branch → open a Markdown/text file. Edit locally, then review and commit when you choose. Nothing is pushed automatically.</p>
            <p id="github-status" class="cloud-provider-status">Use the button to check GitHub connection setup.</p>
            <div class="cloud-actions"><button type="button" id="github-link-identity" hidden>Link GitHub identity</button><a id="github-install" class="cloud-button" hidden target="_blank" rel="noopener noreferrer">Install Markups GitHub App</a><button type="button" id="github-load-repositories">Load repositories</button></div>
            <label>Repository<select id="github-repository" disabled><option value="">Choose a repository</option></select></label>
            <label>Branch<select id="github-branch" disabled><option value="">Choose a branch</option></select></label>
            <div class="cloud-actions"><button type="button" id="github-browse" disabled>Browse files</button><button type="button" id="github-folder-up" hidden>Parent folder</button></div>
            <p id="github-folder" class="cloud-provider-status"></p><ul id="github-files" class="cloud-file-list" aria-label="Repository folders and Markdown files"></ul>
            <label>Markdown file path<input id="github-path" type="text" value="notes/document.md" maxlength="512" autocomplete="off"></label>
            <div class="cloud-actions"><button type="button" id="github-open" disabled>Open as a new local document</button><button type="button" id="github-save" disabled>Commit current document</button></div>
          </section>
        </section>
      </section>`;
    document.body.appendChild(overlay);
    return overlay;
}

export function initializeCloudAccount({
    getCurrentDocument = () => null,
    getPortableMarkdown = (markdown) => Promise.resolve(markdown),
    openCloudDocument = async () => null,
    client = appwriteClient
} = {}) {
    const trigger = document.getElementById('cloud-account-btn');
    if (!trigger || trigger.dataset.cloudBound === 'true') return () => {};
    trigger.dataset.cloudBound = 'true';
    const overlay = ensurePanel();
    const panel = overlay.querySelector('#cloud-account-panel');
    const status = overlay.querySelector('#cloud-account-status');
    const authSection = overlay.querySelector('#cloud-auth-state');
    const setupSection = overlay.querySelector('#cloud-config-state');
    const workspace = overlay.querySelector('#cloud-workspace');
    const storageSection = overlay.querySelector('#cloud-storage-section');
    const authForm = overlay.querySelector('#cloud-auth-form');
    const nameField = overlay.querySelector('[data-auth-name]');
    const authSubmit = overlay.querySelector('#cloud-auth-submit');
    const documentList = overlay.querySelector('#cloud-document-list');
    const env = import.meta.env || {};
    const drive = new GoogleDriveConnector({
        clientId: env.VITE_GOOGLE_DRIVE_CLIENT_ID || '',
        apiKey: env.VITE_GOOGLE_DRIVE_API_KEY || '',
        appId: env.VITE_GOOGLE_DRIVE_APP_ID || ''
    });
    let user = null;
    let mode = 'login';
    let driveFile = null;
    let githubFile = null;
    let githubStatus = null;
    let busy = false;
    let drivePrepared = false;
    let generation = 0;
    let focusTrap = null;
    let focusReturn = trigger;
    let syncDriveControls = () => {};
    let syncGitHubControls = () => {};

    const callForUser = (accountId, action, payload = {}, options = {}) => {
        if (!accountId) throw new Error('Sign in again to use cloud services.');
        return client.call(action, payload, { ...options, expectedUserId: accountId });
    };
    const github = new GitHubConnector({
        request: (action, payload, options = {}) => callForUser(options.expectedUserId || user?.$id, action, payload, { connector: true })
    });
    const resetAccountScopedState = () => {
        drive.clearSession();
        driveFile = null;
        githubFile = null;
        githubStatus = null;
        documentList.replaceChildren();
        overlay.querySelector('#cloud-usage').textContent = '';
        overlay.querySelector('#github-repository').replaceChildren(new window.Option('Choose a repository', ''));
        overlay.querySelector('#github-branch').replaceChildren(new window.Option('Choose a branch', ''));
        overlay.querySelector('#github-repository').disabled = true;
        overlay.querySelector('#github-branch').disabled = true;
        overlay.querySelector('#github-open').disabled = true;
        overlay.querySelector('#github-save').disabled = true;
        overlay.querySelector('#github-files').replaceChildren();
        overlay.querySelector('#github-folder').textContent = '';
        overlay.querySelector('#github-status').textContent = 'Check GitHub connection setup.';
        overlay.querySelector('#github-install').hidden = true;
        overlay.querySelector('#github-install').removeAttribute('href');
        overlay.querySelector('#github-link-identity').hidden = true;
        overlay.querySelector('#drive-selected').textContent = '';
        overlay.querySelector('#drive-pick').disabled = true;
        overlay.querySelector('#drive-open').disabled = true;
        overlay.querySelector('#drive-save').disabled = true;
        overlay.querySelector('#drive-connect').disabled = !drivePrepared;
        overlay.querySelector('#drive-disconnect').hidden = true;
    };
    const setCurrentUser = (nextUser) => {
        const previousId = user?.$id || null;
        const nextId = nextUser?.$id || null;
        if (previousId && previousId !== nextId) resetAccountScopedState();
        user = nextUser;
    };

    const setStatus = (text, kind = 'info') => {
        status.textContent = text;
        status.dataset.kind = kind;
    };
    const withBusy = async (button, work, successText = '') => {
        if (busy) return;
        busy = true;
        if (button) button.disabled = true;
        try {
            const result = await work();
            if (successText) setStatus(successText, 'success');
            return result;
        } catch (error) {
            setStatus(message(error, 'The request failed. Your local document is unchanged.'), 'error');
            return null;
        } finally {
            busy = false;
            if (button?.isConnected) button.disabled = false;
            syncDriveControls();
            syncGitHubControls();
        }
    };
    const close = () => {
        ++generation;
        focusTrap?.deactivate();
        focusTrap = null;
        overlay.hidden = true;
        if (focusReturn?.isConnected) focusReturn.focus({ preventScroll: true });
    };
    const localDocument = () => {
        try {
            const doc = getCurrentDocument();
            return doc && typeof doc === 'object' ? { ...doc, title: String(doc.title || 'Untitled').slice(0, 160), content: String(doc.content || '') } : null;
        } catch { return null; }
    };
    const activeLink = async (accountId = user?.$id) => {
        if (!accountId) return null;
        const doc = localDocument();
        if (!doc || doc.noteId == null) return null;
        return db.cloud_links.get([accountId, doc.noteId]);
    };
    const updateDocumentLabel = async (accountId = user?.$id) => {
        const doc = localDocument();
        const link = await activeLink(accountId);
        if (accountId && user?.$id !== accountId) return;
        overlay.querySelector('#cloud-current-label').textContent = doc
            ? `${doc.title}${doc.noteId == null ? ' · save locally before linking cloud copies' : ''}${link ? ' · linked to a cloud copy for this account' : ''}`
            : 'No active local document.';
        overlay.querySelector('#cloud-save-current').disabled = !doc || doc.noteId == null || !client.config.cloudConfigured;
        overlay.querySelector('#cloud-delete-current').hidden = !link;
    };
    const renderDocuments = (items, accountId) => {
        documentList.replaceChildren();
        const documents = Array.isArray(items) ? items : [];
        if (!documents.length) {
            const empty = document.createElement('li');
            empty.className = 'cloud-empty';
            empty.textContent = 'No cloud documents yet.';
            documentList.appendChild(empty);
            return;
        }
        for (const item of documents.slice(0, CLOUD_DOCUMENT_LIMIT)) {
            const documentId = String(item.documentId || item.$id || '');
            if (!documentId) continue;
            const row = document.createElement('li');
            const title = document.createElement('span');
            title.textContent = String(item.title || 'Untitled').slice(0, 160);
            const meta = document.createElement('small');
            meta.textContent = `Revision ${Number(item.revision) || 0} · ${Number(item.bytes) || 0} bytes`;
            const open = document.createElement('button');
            open.type = 'button';
            open.textContent = 'Open';
            open.addEventListener('click', () => void withBusy(open, async () => {
                const result = await callForUser(accountId, 'documents.get', { documentId });
                const remote = result?.document || result;
                if (typeof remote?.content !== 'string') throw new Error('The cloud service returned no document content.');
                const created = await openCloudDocument({ title: remote.title || title.textContent, content: remote.content });
                if (!created || created.noteId == null) throw new Error('The document opened but could not be linked to a local note.');
                await db.cloud_links.put({ accountId, noteId: created.noteId, documentId, revision: Number(remote.revision) || Number(item.revision) || 0 });
                await updateDocumentLabel(accountId);
                if (user?.$id === accountId) setStatus('Opened a new local copy. It is not synced until you save it to Cloud.', 'success');
            }));
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.textContent = 'Delete';
            remove.addEventListener('click', () => void deleteCloudDocument({ documentId, expectedRevision: Number(item.revision) || 0 }, remove, accountId));
            row.append(title, meta, open, remove);
            documentList.appendChild(row);
        }
    };
    const refreshDocuments = async (accountId = user?.$id) => {
        if (!client.config.cloudConfigured || !accountId) return;
        const result = await callForUser(accountId, 'documents.list');
        if (user?.$id !== accountId) return;
        renderDocuments(result?.documents || result?.items || result, accountId);
        const usage = await callForUser(accountId, 'usage.get');
        if (user?.$id !== accountId) return;
        overlay.querySelector('#cloud-usage').textContent = `Cloud usage: ${Number(usage?.bytes) || 0} / ${Number(usage?.maxBytes) || 0} bytes · ${Number(usage?.documentCount) || 0} / ${Number(usage?.maxDocuments) || 0} documents · ${Number(usage?.revisionsToday) || 0} revisions today`;
    };
    const deleteCloudDocument = async (target, button = null, accountId = user?.$id) => {
        if (!accountId) return;
        if (!window.confirm('Delete this Markups Cloud copy? Your local browser document will remain.')) return;
        await withBusy(button, async () => {
            await callForUser(accountId, 'documents.delete', { ...target, operationId: uuid() });
            await db.cloud_links.where('accountId').equals(accountId).filter(row => row.documentId === target.documentId).delete();
            if (user?.$id !== accountId) return;
            await refreshDocuments(accountId);
            await updateDocumentLabel(accountId);
        }, 'Cloud copy deleted and document consent revoked.');
    };
    const showAuth = (authenticated) => {
        authSection.hidden = authenticated || !client.config.authConfigured;
        setupSection.hidden = client.config.authConfigured;
        workspace.hidden = !authenticated;
        storageSection.hidden = !authenticated || !client.config.cloudConfigured;
        if (authenticated) overlay.querySelector('#cloud-user-email').textContent = String(user?.email || user?.name || 'Account');
    };
    const updateAuthMode = (next) => {
        mode = next === 'register' ? 'register' : 'login';
        for (const button of overlay.querySelectorAll('[data-auth-mode]')) {
            button.setAttribute('aria-pressed', String(button.dataset.authMode === mode));
        }
        nameField.hidden = mode !== 'register';
        authForm.querySelector('[name="password"]').autocomplete = mode === 'register' ? 'new-password' : 'current-password';
        authSubmit.textContent = mode === 'register' ? 'Create account' : 'Sign in';
    };
    const renderCurrentUser = async (token = generation) => {
        setCurrentUser(await client.getCurrentUser());
        if (token !== generation || overlay.hidden) return;
        showAuth(Boolean(user));
        if (user && client.config.cloudConfigured) {
            const accountId = user.$id;
            await updateDocumentLabel(accountId);
            await refreshDocuments(accountId);
        }
        if (user) await updateGitHubStatus(user.$id);
    };
    const cloudSnapshot = async () => {
        const doc = localDocument();
        if (!doc || doc.noteId == null) throw new Error('Save this document locally before creating a cloud link.');
        if (/markups-img:|data:image\//i.test(doc.content)) throw new Error('Images are not included in this Cloud pilot. Keep this document local or use Google Drive/GitHub for a portable image export.');
        if (bytes(doc.content) > CLOUD_DOCUMENT_BYTES) throw new Error('This pilot cloud service accepts documents up to 512 KiB each. Download or split this document to continue.');
        return doc;
    };
    const portableSnapshot = async () => {
        const doc = localDocument();
        if (!doc) throw new Error('There is no active local document.');
        const panelGeneration = generation;
        const assertCurrent = () => {
            if (overlay.hidden || generation !== panelGeneration) throw new Error('The connections panel was closed or reopened. No document was sent. Review the document and try again.');
            const current = localDocument();
            if (!current || current.noteId !== doc.noteId || current.title !== doc.title || current.content !== doc.content) {
                throw new Error('The active document changed while preparing the save. No document was sent. Review the current document and try again.');
            }
        };
        const content = await getPortableMarkdown(doc.content);
        assertCurrent();
        if (bytes(content) > 5 * 1024 * 1024) throw new Error('Portable Markdown exceeds the 5 MiB provider limit. Remove some images or split the document.');
        return { ...doc, content, assertCurrent };
    };
    const saveCloudDocument = async (button) => {
        const accountId = user?.$id;
        if (!accountId) { setStatus('Sign in again to save to Markups Cloud.', 'error'); return; }
        if (!overlay.querySelector('#cloud-consent').checked) {
            setStatus('Check the consent box for this document before saving.', 'error');
            return;
        }
        await withBusy(button, async () => {
            const doc = await cloudSnapshot();
            const existing = await db.cloud_links.get([accountId, doc.noteId]);
            const documentId = existing?.documentId || uuid();
            await callForUser(accountId, 'consent.grant', { documentId, policyVersion: POLICY_VERSION });
            const result = await callForUser(accountId, 'documents.save', {
                documentId,
                title: doc.title,
                content: doc.content,
                expectedRevision: Number(existing?.revision) || 0,
                operationId: uuid()
            });
            const savedDocument = result?.document || result;
            await db.cloud_links.put({ accountId, noteId: doc.noteId, documentId, revision: Number(savedDocument?.revision) || Number(existing?.revision) + 1 || 1 });
            if (user?.$id === accountId) {
                await refreshDocuments(accountId);
                await updateDocumentLabel(accountId);
            }
        }, 'This document was saved to Markups Cloud.');
    };
    async function updateGitHubStatus(accountId = user?.$id) {
        const statusEl = overlay.querySelector('#github-status');
        const installLink = overlay.querySelector('#github-install');
        if (!accountId) return;
        try {
            const nextStatus = await github.status(accountId);
            if (user?.$id !== accountId) return;
            githubStatus = nextStatus;
            if (!githubStatus.configured) {
                statusEl.textContent = 'GitHub App setup is not configured for this build.';
            } else if (githubStatus.requiresGithubIdentity) {
                statusEl.textContent = 'Link a verified GitHub identity to this Markups account before installing the repository app.';
                overlay.querySelector('#github-link-identity').hidden = false;
            } else {
                statusEl.textContent = 'GitHub identity verified. Install the app for selected repositories in your personal account, then reopen this panel and load repositories. Organization repositories are not supported in this pilot.';
                overlay.querySelector('#github-link-identity').hidden = true;
            }
            if (githubStatus.installationUrl) {
                installLink.href = githubStatus.installationUrl;
                installLink.hidden = false;
            } else installLink.hidden = true;
        } catch (error) {
            if (user?.$id !== accountId) return;
            githubStatus = null;
            statusEl.textContent = error?.message || 'GitHub connection service is not configured.';
            installLink.hidden = true;
            overlay.querySelector('#github-link-identity').hidden = true;
        } finally {
            syncGitHubControls();
        }
    }
    const bindDrive = () => {
        const selected = overlay.querySelector('#drive-selected');
        const pick = overlay.querySelector('#drive-pick');
        const open = overlay.querySelector('#drive-open');
        const save = overlay.querySelector('#drive-save');
        const disconnect = overlay.querySelector('#drive-disconnect');
        const connect = overlay.querySelector('#drive-connect');
        const prepare = overlay.querySelector('#drive-prepare');
        const driveConfigured = Boolean(env.VITE_GOOGLE_DRIVE_CLIENT_ID && env.VITE_GOOGLE_DRIVE_API_KEY && env.VITE_GOOGLE_DRIVE_APP_ID);
        const setDriveConnected = () => {
            const connected = drive.connected;
            pick.disabled = !connected;
            open.disabled = !connected || !driveFile;
            disconnect.hidden = !connected;
            save.disabled = !connected || !localDocument();
            connect.disabled = connected || !drivePrepared;
        };
        syncDriveControls = setDriveConnected;
        overlay.querySelector('#drive-actions').hidden = !driveConfigured;
        prepare.disabled = !driveConfigured;
        if (!driveConfigured) {
            prepare.title = 'Google OAuth client ID, restricted Picker API key, and project number are required.';
            selected.textContent = 'Not available in this build. The project owner must configure Google Drive before you can connect. No Google account access has been requested.';
        }
        prepare.addEventListener('click', () => void withBusy(prepare, async () => {
            await drive.prepare();
            drivePrepared = true;
            setDriveConnected();
            setStatus('Google Drive tools are ready. Connect in a separate step to approve the requested file access.', 'success');
        }));
        connect.addEventListener('click', () => void withBusy(connect, async () => {
            await drive.connect();
            setDriveConnected();
            setStatus('Google Drive is connected for this browser session. Choose a file to continue.', 'success');
        }));
        pick.addEventListener('click', () => void withBusy(pick, async () => {
            driveFile = await drive.pick();
            if (!driveFile) return;
            selected.textContent = `Selected: ${driveFile.name}`;
            open.disabled = false;
            save.disabled = !localDocument();
        }));
        open.addEventListener('click', () => void withBusy(open, async () => {
            const remote = await drive.open(driveFile.id);
            driveFile = { ...remote };
            const created = await openCloudDocument({ title: remote.name.replace(/\.(?:md|markdown|txt)$/i, ''), content: remote.content });
            if (!created || created.noteId == null) throw new Error('The Drive file could not be saved as a local document. Your existing document is unchanged.');
            selected.textContent = `Opened ${remote.name} into a new local document.`;
            setStatus('Drive content opened locally. Saving back is a separate action.', 'success');
        }));
        save.addEventListener('click', () => void withBusy(save, async () => {
            const doc = await portableSnapshot();
            doc.assertCurrent();
            if (!window.confirm(`Save “${doc.title}” as a new Markdown file in Google Drive? This sends the document and its portable images to Google. Existing files will not be replaced.`)) return;
            doc.assertCurrent();
            await drive.save({ name: doc.title, content: doc.content });
            selected.textContent = 'Saved a new Drive file. Your local document and any previously selected Drive file are unchanged.';
            setStatus('Google Drive save completed.', 'success');
        }));
        disconnect.addEventListener('click', () => void withBusy(disconnect, async () => {
            const result = await drive.disconnect();
            driveFile = null;
            selected.textContent = result.revoked ? 'Disconnected. Google access token cleared from memory.' : 'Disconnected locally. Google could not confirm access revocation; you can remove app access in your Google account.';
            open.disabled = true;
            setDriveConnected();
        }, 'Google Drive disconnected.'));
        setDriveConnected();
        connect.title = 'Load Google Drive tools first, then approve file access in Google’s popup.';
    };
    const bindGitHub = () => {
        const repoSelect = overlay.querySelector('#github-repository');
        const branchSelect = overlay.querySelector('#github-branch');
        const loadRepos = overlay.querySelector('#github-load-repositories');
        const linkIdentity = overlay.querySelector('#github-link-identity');
        const pathInput = overlay.querySelector('#github-path');
        const browse = overlay.querySelector('#github-browse');
        const up = overlay.querySelector('#github-folder-up');
        const fileList = overlay.querySelector('#github-files');
        let currentFolder = '';
        const selection = () => ({ repository: repoSelect.value, branch: branchSelect.value });
        const isSelection = (target) => target.repository === repoSelect.value && target.branch === branchSelect.value;
        const clearFiles = () => {
            githubFile = null;
            currentFolder = '';
            fileList.replaceChildren();
            overlay.querySelector('#github-folder').textContent = '';
            up.hidden = true;
        };
        const updateButtons = () => {
            const enabled = Boolean(repoSelect.value && branchSelect.value && overlay.querySelector('#github-path').value.trim());
            overlay.querySelector('#github-open').disabled = !enabled;
            overlay.querySelector('#github-save').disabled = !enabled || !localDocument();
            browse.disabled = !repoSelect.value || !branchSelect.value;
            loadRepos.disabled = !user || !githubStatus?.configured || githubStatus.requiresGithubIdentity;
        };
        syncGitHubControls = updateButtons;
        const browseFolder = async (path = '') => {
            const accountId = user?.$id;
            const target = selection();
            const result = await github.files({ ...target, path, expectedUserId: accountId });
            if (user?.$id !== accountId || !isSelection(target)) return;
            currentFolder = path;
            overlay.querySelector('#github-folder').textContent = path ? `Folder: ${path}` : 'Repository root';
            up.hidden = !path;
            fileList.replaceChildren();
            for (const entry of (result?.files || []).slice(0, 200)) {
                if (!entry || !['file', 'dir'].includes(entry.type) || typeof entry.path !== 'string') continue;
                const row = document.createElement('li');
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = `${entry.type === 'dir' ? 'Folder: ' : ''}${entry.name || entry.path}`;
                button.addEventListener('click', () => {
                    if (entry.type === 'dir') void withBusy(button, () => browseFolder(entry.path));
                    else { pathInput.value = entry.path; githubFile = null; updateButtons(); setStatus('File selected. Open a local copy before editing, or review the destination before saving.'); }
                });
                row.appendChild(button);
                fileList.appendChild(row);
            }
            if (!fileList.children.length) {
                const empty = document.createElement('li');
                empty.textContent = 'No Markdown/text files or folders here. You can enter a new .md file path below.';
                fileList.appendChild(empty);
            }
            if (result?.truncated) setStatus('This folder is too large to list completely. Enter a known relative file path below.');
        };
        browse.addEventListener('click', () => void withBusy(browse, () => browseFolder('')));
        up.addEventListener('click', () => void withBusy(up, () => browseFolder(currentFolder.split('/').slice(0, -1).join('/'))));
        linkIdentity.addEventListener('click', () => {
            const accountId = user?.$id;
            void withBusy(linkIdentity, () => accountId
                ? client.linkIdentity('github', { expectedUserId: accountId })
                : Promise.reject(new Error('Sign in again before linking GitHub.')));
        });
        loadRepos.addEventListener('click', () => void withBusy(loadRepos, async () => {
            const accountId = user?.$id;
            const result = await github.repositories(accountId);
            if (user?.$id !== accountId) return;
            clearFiles();
            branchSelect.replaceChildren(new window.Option('Choose a branch', ''));
            branchSelect.disabled = true;
            repoSelect.replaceChildren(new window.Option('Choose a repository', ''));
            for (const repo of result?.repositories || []) repoSelect.add(new window.Option(`${repo.fullName}${repo.private ? ' · private' : ''}`, repo.fullName));
            repoSelect.disabled = false;
            updateButtons();
        }, 'Repositories loaded.'));
        repoSelect.addEventListener('change', () => void withBusy(null, async () => {
            const accountId = user?.$id;
            const repository = repoSelect.value;
            clearFiles();
            branchSelect.replaceChildren(new window.Option('Choose a branch', ''));
            branchSelect.disabled = true;
            if (!repoSelect.value) { updateButtons(); return; }
            const result = await github.branches(repository, accountId);
            if (user?.$id !== accountId || repoSelect.value !== repository) return;
            for (const branch of result?.branches || []) branchSelect.add(new window.Option(branch.name, branch.name));
            branchSelect.disabled = false;
            updateButtons();
        }));
        branchSelect.addEventListener('change', () => { clearFiles(); updateButtons(); });
        pathInput.addEventListener('input', () => { githubFile = null; updateButtons(); });
        overlay.querySelector('#github-open').addEventListener('click', () => void withBusy(overlay.querySelector('#github-open'), async () => {
            const accountId = user?.$id;
            const target = { ...selection(), path: pathInput.value.trim() };
            githubFile = null;
            const remote = await github.open({ ...target, expectedUserId: accountId });
            if (user?.$id !== accountId) throw new Error('Your account changed in another tab. Reopen Cloud & connections before retrying.');
            if (!isSelection(target) || pathInput.value.trim() !== target.path) throw new Error('The selected destination changed. Open the selected file again.');
            const created = await openCloudDocument({ title: remote.path.split('/').pop().replace(/\.(?:md|markdown|txt)$/i, ''), content: remote.content });
            if (!created || created.noteId == null) {
                // Do not leave a failed import's existing remote path looking like a writable destination.
                if (isSelection(target) && pathInput.value.trim() === target.path) pathInput.value = '';
                githubFile = null;
                updateButtons();
                throw new Error('The GitHub file could not be saved as a local document. Open it successfully before saving back.');
            }
            if (user?.$id !== accountId || !isSelection(target) || pathInput.value.trim() !== target.path) throw new Error('The selected account or destination changed. Open the selected file again before saving back.');
            githubFile = { ...remote, noteId: created.noteId };
            setStatus('GitHub file opened in a new local document. Save back is a separate action.', 'success');
        }));
        overlay.querySelector('#github-save').addEventListener('click', () => void withBusy(overlay.querySelector('#github-save'), async () => {
            const accountId = user?.$id;
            const target = { ...selection(), path: pathInput.value.trim() };
            const doc = await portableSnapshot();
            if (!isSelection(target) || pathInput.value.trim() !== target.path) throw new Error('The selected destination changed. Review it before saving again.');
            const path = target.path;
            const destination = `${target.repository} · ${target.branch} · ${path}`;
            if (githubFile && githubFile.noteId !== doc.noteId) throw new Error('This GitHub file belongs to a different local document. Switch to that document or choose a new file path.');
            doc.assertCurrent();
            if (!window.confirm(`Commit “${doc.title}” to:\n\n${destination}\n\nYour local document will remain unchanged if GitHub rejects the update.`)) return;
            doc.assertCurrent();
            const result = await github.save({ ...target, content: doc.content, message: `Update ${path.split('/').pop()}`, expectedSha: githubFile?.repository === target.repository && githubFile?.branch === target.branch && githubFile?.path === path ? githubFile.sha : null, confirmed: true, expectedUserId: accountId });
            if (user?.$id !== accountId) throw new Error('Your account changed in another tab. Reopen Cloud & connections before retrying.');
            if (isSelection(target) && pathInput.value.trim() === target.path) githubFile = { ...result, noteId: doc.noteId };
            setStatus(`Committed ${path} to ${target.repository} (${target.branch}).`, 'success');
        }));
        updateButtons();
    };

    authForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const form = new window.FormData(authForm);
        void withBusy(authSubmit, async () => {
            await (mode === 'register'
                ? await client.register({ email: form.get('email'), password: form.get('password'), name: form.get('name') })
                : await client.login({ email: form.get('email'), password: form.get('password') }));
            setCurrentUser(await client.getCurrentUser());
            showAuth(Boolean(user));
            if (user && client.config.cloudConfigured) { await updateDocumentLabel(user.$id); await refreshDocuments(user.$id); }
            if (user) await updateGitHubStatus(user.$id);
        }, mode === 'register' ? 'Account created and signed in.' : 'Signed in. Your local documents have not been uploaded.');
    });
    for (const button of overlay.querySelectorAll('[data-auth-mode]')) button.addEventListener('click', () => updateAuthMode(button.dataset.authMode));
    overlay.querySelector('#cloud-recovery').addEventListener('click', () => void withBusy(overlay.querySelector('#cloud-recovery'), async () => {
        const email = new window.FormData(authForm).get('email');
        if (!email) throw new Error('Enter your account email first.');
        await client.sendPasswordRecovery(email);
    }, 'If that account exists, Appwrite has sent a password reset link.'));
    overlay.querySelector('#cloud-save-current').addEventListener('click', (event) => void saveCloudDocument(event.currentTarget));
    overlay.querySelector('#cloud-refresh-list').addEventListener('click', (event) => void withBusy(event.currentTarget, refreshDocuments, 'Cloud list refreshed.'));
    overlay.querySelector('#cloud-delete-current').addEventListener('click', async (event) => {
        const accountId = user?.$id;
        const link = await activeLink(accountId);
        if (link) await deleteCloudDocument({ documentId: link.documentId, expectedRevision: link.revision }, event.currentTarget, accountId);
    });
    overlay.querySelector('#cloud-delete-all').addEventListener('click', () => void withBusy(overlay.querySelector('#cloud-delete-all'), async () => {
        const accountId = user?.$id;
        if (!accountId) throw new Error('Sign in again to delete cloud data.');
        const confirmation = window.prompt(`To permanently delete all Markups Cloud copies, type: ${CLOUD_CONFIRM_DELETE}`);
        if (confirmation !== CLOUD_CONFIRM_DELETE) return;
        let deletion;
        for (let attempt = 0; attempt < 50; attempt++) {
            deletion = await callForUser(accountId, 'account.deleteData', { confirmation: CLOUD_CONFIRM_DELETE });
            if (deletion?.complete !== false) break;
        }
        if (deletion?.complete === false) throw new Error('Cloud deletion is still in progress. Reopen this panel and retry to finish.');
        await db.cloud_links.where('accountId').equals(accountId).delete();
        if (user?.$id === accountId) {
            await refreshDocuments(accountId);
            await updateDocumentLabel(accountId);
        }
    }, 'All Markups Cloud documents were deleted. Your local browser notes remain.'));
    overlay.querySelector('#cloud-logout').addEventListener('click', () => void withBusy(overlay.querySelector('#cloud-logout'), async () => {
        ++generation;
        await client.logout();
        setCurrentUser(null);
        showAuth(false);
        setStatus('Signed out. Local documents remain on this device.', 'success');
    }));
    bindDrive();
    bindGitHub();
    overlay.querySelectorAll('[data-close-cloud]').forEach(button => button.addEventListener('click', close));
    overlay.addEventListener('click', (event) => { if (event.target === overlay) close(); });
    overlay.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') { event.preventDefault(); close(); }
    });
    overlay.querySelector('#github-install').addEventListener('click', () => {
        setStatus('GitHub App installation opened in a new tab. Review the repository selection on GitHub.', 'info');
    });
    const openPanel = (source = trigger) => {
        focusReturn = source;
        overlay.hidden = false;
        generation++;
        focusTrap?.deactivate();
        focusTrap = createFocusTrap(panel, { onEscape: close });
        focusTrap.activate();
        setStatus(client.config.authConfigured ? 'Checking the account session…' : '');
        if (!client.config.authConfigured) {
            showAuth(false);
            return;
        }
        void (async () => {
            const token = generation;
            try {
                const url = new URL(window.location.href);
                if (url.searchParams.has('userId') || url.searchParams.has('secret')) await client.completeOAuthCallback();
                await renderCurrentUser(token);
            } catch (error) {
                if (token === generation) { showAuth(false); setStatus(message(error, 'Could not load the account session.'), 'error'); }
            }
        })();
    };
    const openFromTrigger = () => openPanel(trigger);
    trigger.addEventListener('click', openFromTrigger);
    const mobileTrigger = document.getElementById('mobile-cloud-account-btn');
    const openFromMobile = (event) => {
        document.getElementById('mobile-nav-drawer')?.classList.remove('open');
        document.getElementById('mobile-nav-overlay')?.classList.remove('active');
        openPanel(event.currentTarget);
    };
    mobileTrigger?.addEventListener('click', openFromMobile);

    return () => {
        ++generation;
        focusTrap?.deactivate();
        drive.clearSession();
        trigger.removeEventListener('click', openFromTrigger);
        mobileTrigger?.removeEventListener('click', openFromMobile);
        overlay.remove();
        trigger.dataset.cloudBound = 'false';
    };
}

export default initializeCloudAccount;
