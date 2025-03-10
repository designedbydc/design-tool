/**
 * Components System
 * 
 * Handles the creation, management, and usage of reusable components.
 */

// Store for all components
const componentStore = {
    components: [],
    activeComponent: null
};

// Initialize components system
function initComponents() {
    // Create components panel
    createComponentsPanel();
    
    // Set up event listeners
    setupComponentEvents();
    
    // Load components from localStorage if available
    loadComponentsFromStorage();
}

// Create components panel in the UI
function createComponentsPanel() {
    // Create components panel container
    const componentsPanel = document.createElement('div');
    componentsPanel.className = 'components-panel bg-white border border-gray-200 rounded-md shadow-lg';
    componentsPanel.style.position = 'absolute';
    componentsPanel.style.top = '80px';
    componentsPanel.style.right = '16px';
    componentsPanel.style.width = '240px';
    componentsPanel.style.maxHeight = '300px';
    componentsPanel.style.overflow = 'auto';
    componentsPanel.style.zIndex = '100';
    componentsPanel.style.display = 'none';
    
    // Create panel header
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center p-3 border-b border-gray-200';
    
    const title = document.createElement('h3');
    title.className = 'text-sm font-medium text-gray-700';
    title.textContent = 'Components';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'text-gray-500 hover:text-gray-700';
    closeButton.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px;">close</span>';
    closeButton.onclick = () => {
        componentsPanel.style.display = 'none';
    };
    
    header.appendChild(title);
    header.appendChild(closeButton);
    componentsPanel.appendChild(header);
    
    // Create components list container
    const componentsList = document.createElement('div');
    componentsList.id = 'components-list';
    componentsList.className = 'p-3';
    componentsPanel.appendChild(componentsList);
    
    // Create "Create Component" button
    const createButton = document.createElement('button');
    createButton.className = 'w-full mt-2 px-3 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600';
    createButton.textContent = 'Create Component';
    createButton.onclick = createComponent;
    componentsPanel.appendChild(createButton);
    
    // Add panel to the document
    document.body.appendChild(componentsPanel);
    
    // Add button to menu bar to toggle components panel
    const menuBar = document.querySelector('.menu-bar');
    const componentsButton = document.createElement('button');
    componentsButton.className = 'ml-auto px-3 py-1.5 rounded hover:bg-gray-100 flex items-center';
    componentsButton.innerHTML = '<span class="material-symbols-outlined mr-1">widgets</span> Components';
    componentsButton.onclick = () => {
        componentsPanel.style.display = componentsPanel.style.display === 'none' ? 'block' : 'none';
    };
    menuBar.appendChild(componentsButton);
}

// Set up event listeners for component-related actions
function setupComponentEvents() {
    // Listen for keyboard shortcut to create component (Alt+C)
    Mousetrap.bind(['alt+c'], () => {
        createComponent();
        return false;
    });
}

// Create a new component from the selected object
function createComponent() {
    if (!appState.selectedObject) {
        alert('Please select an object to create a component');
        return;
    }
    
    // Prompt for component name
    const componentName = prompt('Enter a name for this component:', 'Component ' + (componentStore.components.length + 1));
    if (!componentName) return;
    
    // Clone the selected object
    appState.selectedObject.clone((cloned) => {
        // Create component object
        const component = {
            id: 'component_' + Date.now(),
            name: componentName,
            object: cloned,
            instances: []
        };
        
        // Add to component store
        componentStore.components.push(component);
        
        // Update components list
        updateComponentsList();
        
        // Save to localStorage
        saveComponentsToStorage();
        
        // Show components panel
        document.querySelector('.components-panel').style.display = 'block';
    });
}

// Create an instance of a component
function createComponentInstance(componentId) {
    // Find the component
    const component = componentStore.components.find(comp => comp.id === componentId);
    if (!component) return;
    
    // Clone the component object
    component.object.clone((cloned) => {
        // Add metadata to mark as component instance
        cloned.componentId = componentId;
        cloned.isComponentInstance = true;
        
        // Position in the center of the viewport
        const canvasCenter = {
            x: appState.canvas.width / 2 / appState.zoom,
            y: appState.canvas.height / 2 / appState.zoom
        };
        
        cloned.set({
            left: canvasCenter.x - cloned.width / 2,
            top: canvasCenter.y - cloned.height / 2
        });
        
        // Add to canvas
        appState.canvas.add(cloned);
        appState.objects.push(cloned);
        
        // Select the new instance
        appState.canvas.setActiveObject(cloned);
        appState.selectedObject = cloned;
        
        // Add to component instances
        component.instances.push(cloned);
        
        // Update properties panel
        updatePropertiesPanel();
        
        // Update layers panel
        updateLayers();
        
        // Save state for undo/redo
        saveState();
    });
}

// Update a component and all its instances
function updateComponent(componentId) {
    if (!appState.selectedObject) {
        alert('Please select an object to update the component');
        return;
    }
    
    // Find the component
    const component = componentStore.components.find(comp => comp.id === componentId);
    if (!component) return;
    
    // Confirm update
    if (!confirm(`Update component "${component.name}" and all its instances?`)) return;
    
    // Clone the selected object
    appState.selectedObject.clone((cloned) => {
        // Update the component object
        appState.canvas.remove(component.object);
        component.object = cloned;
        
        // Update all instances
        component.instances.forEach(instance => {
            // Get instance position
            const left = instance.left;
            const top = instance.top;
            
            // Clone the updated component
            component.object.clone((newInstance) => {
                // Preserve instance metadata
                newInstance.componentId = componentId;
                newInstance.isComponentInstance = true;
                
                // Preserve position
                newInstance.set({
                    left: left,
                    top: top
                });
                
                // Replace the old instance
                appState.canvas.remove(instance);
                appState.canvas.add(newInstance);
                
                // Update in objects array
                const index = appState.objects.indexOf(instance);
                if (index !== -1) {
                    appState.objects[index] = newInstance;
                }
                
                // Update in instances array
                const instanceIndex = component.instances.indexOf(instance);
                if (instanceIndex !== -1) {
                    component.instances[instanceIndex] = newInstance;
                }
            });
        });
        
        // Update canvas
        appState.canvas.renderAll();
        
        // Save to localStorage
        saveComponentsToStorage();
        
        // Save state for undo/redo
        saveState();
    });
}

// Delete a component and optionally its instances
function deleteComponent(componentId) {
    // Find the component
    const component = componentStore.components.find(comp => comp.id === componentId);
    if (!component) return;
    
    // Confirm deletion
    const deleteInstances = confirm(`Delete component "${component.name}"?\nClick OK to also delete all instances, or Cancel to keep instances.`);
    
    // Remove component object from canvas
    appState.canvas.remove(component.object);
    
    // Remove instances if requested
    if (deleteInstances) {
        component.instances.forEach(instance => {
            appState.canvas.remove(instance);
            
            // Remove from objects array
            const index = appState.objects.indexOf(instance);
            if (index !== -1) {
                appState.objects.splice(index, 1);
            }
        });
    }
    
    // Remove from component store
    const index = componentStore.components.findIndex(comp => comp.id === componentId);
    if (index !== -1) {
        componentStore.components.splice(index, 1);
    }
    
    // Update components list
    updateComponentsList();
    
    // Update layers panel
    updateLayers();
    
    // Save to localStorage
    saveComponentsToStorage();
    
    // Save state for undo/redo
    saveState();
}

// Update the components list in the UI
function updateComponentsList() {
    const componentsList = document.getElementById('components-list');
    if (!componentsList) return;
    
    // Clear the list
    componentsList.innerHTML = '';
    
    // Add components to the list
    if (componentStore.components.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'text-sm text-gray-500 text-center py-4';
        emptyMessage.textContent = 'No components yet. Select an object and click "Create Component".';
        componentsList.appendChild(emptyMessage);
    } else {
        componentStore.components.forEach(component => {
            const componentItem = document.createElement('div');
            componentItem.className = 'component-item flex items-center justify-between p-2 mb-2 border border-gray-200 rounded hover:bg-gray-50';
            
            // Component name and icon
            const nameContainer = document.createElement('div');
            nameContainer.className = 'flex items-center';
            nameContainer.innerHTML = `
                <span class="material-symbols-outlined mr-2 text-gray-500">widgets</span>
                <span class="text-sm">${component.name}</span>
            `;
            
            // Actions container
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'flex gap-1';
            
            // Create instance button
            const createInstanceBtn = document.createElement('button');
            createInstanceBtn.className = 'p-1 rounded hover:bg-gray-200 text-gray-500';
            createInstanceBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">add</span>';
            createInstanceBtn.title = 'Create Instance';
            createInstanceBtn.onclick = (e) => {
                e.stopPropagation();
                createComponentInstance(component.id);
            };
            
            // Update component button
            const updateBtn = document.createElement('button');
            updateBtn.className = 'p-1 rounded hover:bg-gray-200 text-gray-500';
            updateBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">refresh</span>';
            updateBtn.title = 'Update Component';
            updateBtn.onclick = (e) => {
                e.stopPropagation();
                updateComponent(component.id);
            };
            
            // Delete component button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'p-1 rounded hover:bg-gray-200 text-gray-500';
            deleteBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">delete</span>';
            deleteBtn.title = 'Delete Component';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteComponent(component.id);
            };
            
            actionsContainer.appendChild(createInstanceBtn);
            actionsContainer.appendChild(updateBtn);
            actionsContainer.appendChild(deleteBtn);
            
            componentItem.appendChild(nameContainer);
            componentItem.appendChild(actionsContainer);
            
            componentsList.appendChild(componentItem);
        });
    }
}

// Save components to localStorage
function saveComponentsToStorage() {
    try {
        // We can't directly stringify Fabric.js objects, so we'll save component IDs and names
        const componentsData = componentStore.components.map(component => ({
            id: component.id,
            name: component.name
        }));
        
        localStorage.setItem('figmaCloneComponents', JSON.stringify(componentsData));
    } catch (error) {
        console.error('Error saving components to localStorage:', error);
    }
}

// Load components from localStorage
function loadComponentsFromStorage() {
    try {
        const componentsData = localStorage.getItem('figmaCloneComponents');
        if (componentsData) {
            const parsedData = JSON.parse(componentsData);
            
            // We only stored IDs and names, so we need to recreate the components
            // This is a placeholder - in a real implementation, we would need to store and load
            // the actual component objects and instances
            componentStore.components = parsedData.map(data => ({
                id: data.id,
                name: data.name,
                object: null,
                instances: []
            }));
            
            updateComponentsList();
        }
    } catch (error) {
        console.error('Error loading components from localStorage:', error);
    }
}

// Check if an object is a component instance
function isComponentInstance(obj) {
    return obj && obj.isComponentInstance === true;
}

// Get the component for an instance
function getComponentForInstance(instance) {
    if (!instance || !instance.componentId) return null;
    return componentStore.components.find(comp => comp.id === instance.componentId);
}

// Export functions
window.componentSystem = {
    init: initComponents,
    create: createComponent,
    createInstance: createComponentInstance,
    update: updateComponent,
    delete: deleteComponent,
    isInstance: isComponentInstance,
    getComponent: getComponentForInstance
}; 