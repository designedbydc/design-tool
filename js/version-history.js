/**
 * Version History System
 * 
 * Handles the creation and management of version history for the design.
 */

// Store for version history
const versionHistoryStore = {
    versions: [],
    currentVersionIndex: -1,
    autoSaveInterval: null,
    maxVersions: 50
};

// Initialize version history system
function initVersionHistory() {
    // Create version history panel
    createVersionHistoryPanel();
    
    // Set up auto-save
    setupAutoSave();
    
    // Create initial version
    createVersion('Initial Version');
}

// Create version history panel in the UI
function createVersionHistoryPanel() {
    // Create version history panel container
    const versionHistoryPanel = document.createElement('div');
    versionHistoryPanel.className = 'version-history-panel bg-white border border-gray-200 rounded-md shadow-lg';
    versionHistoryPanel.style.position = 'absolute';
    versionHistoryPanel.style.top = '80px';
    versionHistoryPanel.style.right = '16px';
    versionHistoryPanel.style.width = '300px';
    versionHistoryPanel.style.maxHeight = '500px';
    versionHistoryPanel.style.overflow = 'auto';
    versionHistoryPanel.style.zIndex = '100';
    versionHistoryPanel.style.display = 'none';
    
    // Create panel header
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center p-3 border-b border-gray-200';
    
    const title = document.createElement('h3');
    title.className = 'text-sm font-medium text-gray-700';
    title.textContent = 'Version History';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'text-gray-500 hover:text-gray-700';
    closeButton.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px;">close</span>';
    closeButton.onclick = () => {
        versionHistoryPanel.style.display = 'none';
    };
    
    header.appendChild(title);
    header.appendChild(closeButton);
    versionHistoryPanel.appendChild(header);
    
    // Create versions list container
    const versionsContainer = document.createElement('div');
    versionsContainer.className = 'p-3';
    
    const versionsHeader = document.createElement('div');
    versionsHeader.className = 'flex justify-between items-center mb-2';
    
    const versionsTitle = document.createElement('h4');
    versionsTitle.className = 'text-xs font-medium text-gray-600';
    versionsTitle.textContent = 'Versions';
    
    const createVersionButton = document.createElement('button');
    createVersionButton.className = 'text-xs text-blue-500 hover:text-blue-600';
    createVersionButton.textContent = '+ Save Version';
    createVersionButton.onclick = () => {
        const name = prompt('Enter a name for this version:', `Version ${versionHistoryStore.versions.length + 1}`);
        if (name) {
            createVersion(name);
        }
    };
    
    versionsHeader.appendChild(versionsTitle);
    versionsHeader.appendChild(createVersionButton);
    versionsContainer.appendChild(versionsHeader);
    
    // Create versions list
    const versionsList = document.createElement('div');
    versionsList.id = 'versions-list';
    versionsList.className = 'space-y-2';
    versionsContainer.appendChild(versionsList);
    
    versionHistoryPanel.appendChild(versionsContainer);
    
    // Add panel to the document
    document.body.appendChild(versionHistoryPanel);
    
    // Add button to menu bar to toggle version history panel
    const menuBar = document.querySelector('.menu-bar');
    const versionHistoryButton = document.createElement('button');
    versionHistoryButton.className = 'ml-2 px-3 py-1.5 rounded hover:bg-gray-100 flex items-center';
    versionHistoryButton.innerHTML = '<span class="material-symbols-outlined mr-1">history</span> History';
    versionHistoryButton.onclick = () => {
        versionHistoryPanel.style.display = versionHistoryPanel.style.display === 'none' ? 'block' : 'none';
        if (versionHistoryPanel.style.display === 'block') {
            updateVersionsList();
        }
    };
    menuBar.appendChild(versionHistoryButton);
}

// Set up auto-save functionality
function setupAutoSave() {
    // Auto-save every 5 minutes
    versionHistoryStore.autoSaveInterval = setInterval(() => {
        createVersion('Auto-save', true);
    }, 5 * 60 * 1000);
}

// Create a new version
function createVersion(name, isAutoSave = false) {
    if (!appState.canvas) return;
    
    try {
        // Get canvas JSON
        const canvasJSON = appState.canvas.toJSON();
        
        // Create version object
        const version = {
            id: 'version_' + Date.now(),
            name: name,
            timestamp: Date.now(),
            data: canvasJSON,
            isAutoSave: isAutoSave
        };
        
        // If we're not at the end of the history, remove everything after current index
        if (versionHistoryStore.currentVersionIndex < versionHistoryStore.versions.length - 1) {
            versionHistoryStore.versions = versionHistoryStore.versions.slice(0, versionHistoryStore.currentVersionIndex + 1);
        }
        
        // Add to versions array
        versionHistoryStore.versions.push(version);
        versionHistoryStore.currentVersionIndex = versionHistoryStore.versions.length - 1;
        
        // Limit the number of versions
        if (versionHistoryStore.versions.length > versionHistoryStore.maxVersions) {
            // Keep the first version (initial) and remove the oldest auto-saves
            const autoSaveVersions = versionHistoryStore.versions.slice(1).filter(v => v.isAutoSave);
            if (autoSaveVersions.length > 0) {
                const oldestAutoSave = autoSaveVersions[0];
                const index = versionHistoryStore.versions.indexOf(oldestAutoSave);
                if (index !== -1) {
                    versionHistoryStore.versions.splice(index, 1);
                    versionHistoryStore.currentVersionIndex--;
                }
            }
        }
        
        // Update versions list
        updateVersionsList();
        
        // Save to localStorage
        saveVersionsToStorage();
        
        return version;
    } catch (error) {
        console.error('Error creating version:', error);
        return null;
    }
}

// Restore a specific version
function restoreVersion(versionId) {
    // Find the version
    const versionIndex = versionHistoryStore.versions.findIndex(v => v.id === versionId);
    if (versionIndex === -1) return;
    
    const version = versionHistoryStore.versions[versionIndex];
    
    // Confirm restore
    if (!confirm(`Restore to version "${version.name}"? Any unsaved changes will be lost.`)) return;
    
    // Load the version data
    appState.canvas.loadFromJSON(version.data, () => {
        // Update objects array
        appState.objects = appState.canvas.getObjects();
        
        // Clear selection
        appState.canvas.discardActiveObject();
        appState.selectedObject = null;
        
        // Update UI
        updatePropertiesPanel();
        updateLayers();
        
        // Update current version index
        versionHistoryStore.currentVersionIndex = versionIndex;
        
        // Update versions list
        updateVersionsList();
        
        // Render canvas
        appState.canvas.renderAll();
    });
}

// Delete a version
function deleteVersion(versionId) {
    // Find the version
    const versionIndex = versionHistoryStore.versions.findIndex(v => v.id === versionId);
    if (versionIndex === -1) return;
    
    // Don't allow deleting the current version
    if (versionIndex === versionHistoryStore.currentVersionIndex) {
        alert('Cannot delete the current version.');
        return;
    }
    
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this version?')) return;
    
    // Remove the version
    versionHistoryStore.versions.splice(versionIndex, 1);
    
    // Update current version index if needed
    if (versionIndex < versionHistoryStore.currentVersionIndex) {
        versionHistoryStore.currentVersionIndex--;
    }
    
    // Update versions list
    updateVersionsList();
    
    // Save to localStorage
    saveVersionsToStorage();
}

// Update the versions list in the UI
function updateVersionsList() {
    const versionsList = document.getElementById('versions-list');
    if (!versionsList) return;
    
    // Clear the list
    versionsList.innerHTML = '';
    
    // Add versions to the list
    if (versionHistoryStore.versions.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'text-sm text-gray-500 text-center py-4';
        emptyMessage.textContent = 'No versions yet.';
        versionsList.appendChild(emptyMessage);
    } else {
        versionHistoryStore.versions.forEach((version, index) => {
            const versionItem = document.createElement('div');
            versionItem.className = 'version-item p-3 border border-gray-200 rounded-md ' + 
                (index === versionHistoryStore.currentVersionIndex ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50');
            
            // Version details
            const details = document.createElement('div');
            details.className = 'flex justify-between items-start mb-2';
            
            const info = document.createElement('div');
            
            const nameElement = document.createElement('div');
            nameElement.className = 'text-sm font-medium';
            nameElement.textContent = version.name;
            
            const timestamp = document.createElement('div');
            timestamp.className = 'text-xs text-gray-500';
            timestamp.textContent = new Date(version.timestamp).toLocaleString();
            
            info.appendChild(nameElement);
            info.appendChild(timestamp);
            
            // Actions
            const actions = document.createElement('div');
            actions.className = 'flex space-x-1';
            
            // Only show restore button if not the current version
            if (index !== versionHistoryStore.currentVersionIndex) {
                const restoreButton = document.createElement('button');
                restoreButton.className = 'p-1 text-gray-500 hover:text-gray-700';
                restoreButton.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">restore</span>';
                restoreButton.title = 'Restore';
                restoreButton.onclick = (e) => {
                    e.stopPropagation();
                    restoreVersion(version.id);
                };
                actions.appendChild(restoreButton);
            }
            
            // Don't allow deleting the current version
            if (index !== versionHistoryStore.currentVersionIndex) {
                const deleteButton = document.createElement('button');
                deleteButton.className = 'p-1 text-gray-500 hover:text-gray-700';
                deleteButton.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">delete</span>';
                deleteButton.title = 'Delete';
                deleteButton.onclick = (e) => {
                    e.stopPropagation();
                    deleteVersion(version.id);
                };
                actions.appendChild(deleteButton);
            }
            
            details.appendChild(info);
            details.appendChild(actions);
            
            versionItem.appendChild(details);
            
            // Add click event to restore version
            if (index !== versionHistoryStore.currentVersionIndex) {
                versionItem.style.cursor = 'pointer';
                versionItem.onclick = () => restoreVersion(version.id);
            }
            
            versionsList.appendChild(versionItem);
        });
    }
}

// Save versions to localStorage
function saveVersionsToStorage() {
    try {
        // We can't directly stringify the full versions with canvas data
        // So we'll just save the metadata
        const versionsMetadata = versionHistoryStore.versions.map(version => ({
            id: version.id,
            name: version.name,
            timestamp: version.timestamp,
            isAutoSave: version.isAutoSave
        }));
        
        const data = {
            versions: versionsMetadata,
            currentVersionIndex: versionHistoryStore.currentVersionIndex
        };
        
        localStorage.setItem('figmaCloneVersionHistory', JSON.stringify(data));
    } catch (error) {
        console.error('Error saving versions to localStorage:', error);
    }
}

// Load versions from localStorage
function loadVersionsFromStorage() {
    try {
        const data = localStorage.getItem('figmaCloneVersionHistory');
        if (data) {
            const parsedData = JSON.parse(data);
            
            // We only stored metadata, so we need to recreate the versions
            // This is a placeholder - in a real implementation, we would need to store and load
            // the actual version data
            versionHistoryStore.versions = parsedData.versions.map(metadata => ({
                ...metadata,
                data: null // We don't have the actual data
            }));
            
            versionHistoryStore.currentVersionIndex = parsedData.currentVersionIndex;
            
            // Update versions list
            updateVersionsList();
        }
    } catch (error) {
        console.error('Error loading versions from localStorage:', error);
    }
}

// Export functions
window.versionHistorySystem = {
    init: initVersionHistory,
    createVersion: createVersion,
    restoreVersion: restoreVersion
}; 