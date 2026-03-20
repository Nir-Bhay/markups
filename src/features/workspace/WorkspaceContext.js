import React, { createContext, useContext, useState, useEffect } from 'react';
import storage, { STORAGE_KEYS } from '../../core/storage/index.js';

/**
 * WorkspaceContext - Manages the file/folder hierarchy and active document.
 * @module features/workspace/context
 */

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [activeFileId, setActiveFileId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial load from storage
    useEffect(() => {
        const loadWorkspace = async () => {
            const storedFiles = await storage.get(STORAGE_KEYS.DOCUMENTS) || [];
            const storedFolders = await storage.get('workspace_folders') || [];
            const lastActive = await storage.get(STORAGE_KEYS.ACTIVE_TAB);

            setFiles(storedFiles);
            setFolders(storedFolders);
            setActiveFileId(lastActive);
            setLoading(false);
        };
        loadWorkspace();
    }, []);

    // Auto-save workspace structure
    useEffect(() => {
        if (!loading) {
            storage.set(STORAGE_KEYS.DOCUMENTS, files);
            storage.set('workspace_folders', folders);
            storage.set(STORAGE_KEYS.ACTIVE_TAB, activeFileId);
        }
    }, [files, folders, activeFileId, loading]);

    /**
     * Create a new file
     */
    const createFile = (title = 'Untitled.md', parentId = null) => {
        const newFile = {
            id: crypto.randomUUID(),
            title,
            parentId,
            content: '',
            updatedAt: Date.now(),
            createdAt: Date.now()
        };
        setFiles(prev => [...prev, newFile]);
        setActiveFileId(newFile.id);
        return newFile;
    };

    /**
     * Delete a file
     */
    const deleteFile = (id) => {
        setFiles(prev => prev.filter(f => f.id !== id));
        if (activeFileId === id) setActiveFileId(null);
    };

    /**
     * Rename a file
     */
    const renameFile = (id, newTitle) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, title: newTitle } : f));
    };

    /**
     * Update file content
     */
    const updateFileContent = (id, content) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, content, updatedAt: Date.now() } : f));
    };

    /**
     * Create a folder
     */
    const createFolder = (name = 'New Folder', parentId = null) => {
        const newFolder = {
            id: crypto.randomUUID(),
            name,
            parentId,
            createdAt: Date.now()
        };
        setFolders(prev => [...prev, newFolder]);
        return newFolder;
    };

    const value = {
        files,
        folders,
        activeFileId,
        setActiveFileId,
        createFile,
        deleteFile,
        renameFile,
        updateFileContent,
        createFolder,
        loading
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
};

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (!context) throw new Error('useWorkspace must be used within a WorkspaceProvider');
    return context;
};
