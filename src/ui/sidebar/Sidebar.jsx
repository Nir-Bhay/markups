import React, { useState } from 'react';
import { useWorkspace } from '../../features/workspace/WorkspaceContext.js';

/**
 * Sidebar Component - Main file explorer UI
 * @module ui/sidebar
 */

const Sidebar = () => {
    const { files, folders, activeFileId, setActiveFileId, createFile, createFolder, deleteFile } = useWorkspace();
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} style={{
            width: isCollapsed ? '40px' : '260px',
            height: '100%',
            backgroundColor: 'var(--sidebar-bg, #f5f5f5)',
            borderRight: '1px solid var(--border-color, #ddd)',
            transition: 'width 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Sidebar Header */}
            <div style={{
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #ddd'
            }}>
                {!isCollapsed && <span style={{ fontWeight: 'bold' }}>WORKSPACE</span>}
                <button onClick={() => setIsCollapsed(!isCollapsed)} style={{
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: '4px'
                }}>
                    {isCollapsed ? '➡️' : '⬅️'}
                </button>
            </div>

            {/* Actions (Only if not collapsed) */}
            {!isCollapsed && (
                <div style={{ padding: '8px', display: 'flex', gap: '8px' }}>
                    <button onClick={() => createFile()} style={{ flex: 1, cursor: 'pointer' }}>+ File</button>
                    <button onClick={() => createFolder()} style={{ flex: 1, cursor: 'pointer' }}>+ Folder</button>
                </div>
            )}

            {/* File List */}
            {!isCollapsed && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                    {folders.map(folder => (
                        <div key={folder.id} style={{ marginBottom: '8px' }}>
                            📁 <strong>{folder.name}</strong>
                        </div>
                    ))}
                    {files.map(file => (
                        <div 
                            key={file.id} 
                            onClick={() => setActiveFileId(file.id)}
                            style={{
                                padding: '6px 8px',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                backgroundColor: activeFileId === file.id ? '#e0e0e0' : 'transparent',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <span>📄 {file.title}</span>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                deleteFile(file.id);
                            }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Sidebar;
