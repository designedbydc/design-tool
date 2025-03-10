/**
 * Layers Module
 * 
 * Handles the layers panel functionality and layer management.
 */

// Initialize the layers panel
function initLayers() {
    // Initial update
    updateLayers();
}

// Update the layers panel with current objects
function updateLayers() {
    const layersList = document.getElementById('layers-list');
    
    // Clear the current layers list
    layersList.innerHTML = '';
    
    // Get all objects from the canvas
    const objects = appState.canvas.getObjects();
    
    // Create layer items in reverse order (top to bottom)
    for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        const layerItem = createLayerItem(obj, i);
        layersList.appendChild(layerItem);
    }
}

// Create a layer item element
function createLayerItem(obj, index) {
    const layerItem = document.createElement('div');
    layerItem.className = 'layer-item flex items-center p-2 rounded hover:bg-gray-100 text-sm';
    
    // Add active class if this is the selected object
    if (appState.selectedObject && obj.id === appState.selectedObject.id) {
        layerItem.classList.add('active', 'bg-blue-50', 'text-blue-600');
    }
    
    // Create visibility toggle
    const visibility = document.createElement('div');
    visibility.className = 'visibility mr-2 text-gray-500';
    visibility.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px;">visibility</span>';
    
    // Create layer name
    const name = document.createElement('div');
    name.className = 'name flex-1';
    
    // Create layer icon based on object type
    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined mr-2';
    icon.style.fontSize = '18px';
    
    // Set layer name and icon based on object type
    if (obj.objectType === 'rectangle') {
        icon.textContent = 'rectangle';
        name.textContent = `Rectangle ${index + 1}`;
    } else if (obj.objectType === 'circle') {
        icon.textContent = 'circle';
        name.textContent = `Circle ${index + 1}`;
    } else if (obj.objectType === 'line') {
        icon.textContent = 'horizontal_rule';
        name.textContent = `Line ${index + 1}`;
    } else if (obj.type === 'i-text') {
        icon.textContent = 'text_fields';
        name.textContent = `Text ${index + 1}`;
    } else {
        icon.textContent = 'layers';
        name.textContent = `Layer ${index + 1}`;
    }
    
    // Create layer name container with icon
    const nameContainer = document.createElement('div');
    nameContainer.className = 'flex items-center';
    nameContainer.appendChild(icon);
    nameContainer.appendChild(document.createTextNode(name.textContent));
    
    // Add elements to layer item
    layerItem.appendChild(visibility);
    layerItem.appendChild(nameContainer);
    
    // Add actions container
    const actions = document.createElement('div');
    actions.className = 'actions flex gap-1';
    
    // Add move up button
    const moveUp = document.createElement('button');
    moveUp.className = 'p-1 rounded hover:bg-gray-200 text-gray-500';
    moveUp.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">arrow_upward</span>';
    moveUp.title = 'Bring Forward';
    moveUp.addEventListener('click', (e) => {
        e.stopPropagation();
        appState.canvas.setActiveObject(obj);
        appState.selectedObject = obj;
        bringForward();
    });
    
    // Add move down button
    const moveDown = document.createElement('button');
    moveDown.className = 'p-1 rounded hover:bg-gray-200 text-gray-500';
    moveDown.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">arrow_downward</span>';
    moveDown.title = 'Send Backward';
    moveDown.addEventListener('click', (e) => {
        e.stopPropagation();
        appState.canvas.setActiveObject(obj);
        appState.selectedObject = obj;
        sendBackward();
    });
    
    actions.appendChild(moveUp);
    actions.appendChild(moveDown);
    layerItem.appendChild(actions);
    
    // Add click event to select the object
    layerItem.addEventListener('click', () => {
        // Select the object on the canvas
        appState.canvas.setActiveObject(obj);
        appState.selectedObject = obj;
        
        // Update properties panel
        updatePropertiesPanel();
        
        // Update active state in layers panel
        const allLayerItems = document.querySelectorAll('.layer-item');
        allLayerItems.forEach(item => {
            item.classList.remove('active', 'bg-blue-50', 'text-blue-600');
        });
        layerItem.classList.add('active', 'bg-blue-50', 'text-blue-600');
    });
    
    // Add visibility toggle functionality
    visibility.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent selecting the object
        
        // Toggle visibility
        obj.visible = !obj.visible;
        
        // Update visibility icon
        if (!obj.visible) {
            visibility.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px;">visibility_off</span>';
            layerItem.style.opacity = 0.5;
        } else {
            visibility.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px;">visibility</span>';
            layerItem.style.opacity = 1;
        }
        
        // Render the canvas
        appState.canvas.renderAll();
        
        // Save state for undo/redo
        saveState();
    });
    
    return layerItem;
}

// Add a context menu for layer items
document.addEventListener('contextmenu', (e) => {
    // Check if the click is on a layer item
    const layerItem = e.target.closest('.layer-item');
    
    if (layerItem) {
        e.preventDefault();
        
        // Get the index of the layer
        const layerItems = Array.from(document.querySelectorAll('.layer-item'));
        const index = layerItems.indexOf(layerItem);
        
        // Get the object
        const objects = appState.canvas.getObjects();
        const obj = objects[objects.length - 1 - index];
        
        // Create a simple context menu
        const options = ['Bring Forward', 'Send Backward', 'Bring to Front', 'Send to Back', 'Delete'];
        const option = prompt(`Choose an option for ${layerItem.querySelector('.name').textContent}: ${options.join(', ')}`);
        
        if (option) {
            // Select the object
            appState.canvas.setActiveObject(obj);
            appState.selectedObject = obj;
            
            // Perform the action
            switch(option.toLowerCase()) {
                case 'bring forward':
                    bringForward();
                    break;
                case 'send backward':
                    sendBackward();
                    break;
                case 'bring to front':
                    bringToFront();
                    break;
                case 'send to back':
                    sendToBack();
                    break;
                case 'delete':
                    deleteSelectedObject();
                    break;
            }
        }
    }
}); 