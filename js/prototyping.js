/**
 * Prototyping System
 * 
 * Handles the creation and management of interactive prototypes.
 */

// Prototype interaction types
const interactionTypes = {
    CLICK: 'click',
    HOVER: 'hover',
    DRAG: 'drag'
};

// Prototype animation types
const animationTypes = {
    NONE: 'none',
    DISSOLVE: 'dissolve',
    SLIDE_RIGHT: 'slide-right',
    SLIDE_LEFT: 'slide-left',
    SLIDE_UP: 'slide-up',
    SLIDE_DOWN: 'slide-down'
};

// Store for prototype interactions
const prototypeStore = {
    interactions: [],
    isPrototypeModeActive: false,
    currentScreen: null,
    previousScreen: null
};

// Initialize prototyping system
function initPrototyping() {
    // Create prototyping panel
    createPrototypingPanel();
    
    // Set up event listeners
    setupPrototypingEvents();
}

// Create prototyping panel in the UI
function createPrototypingPanel() {
    // Create prototyping panel container
    const prototypingPanel = document.createElement('div');
    prototypingPanel.className = 'prototyping-panel bg-white border border-gray-200 rounded-md shadow-lg';
    prototypingPanel.style.position = 'absolute';
    prototypingPanel.style.top = '80px';
    prototypingPanel.style.right = '16px';
    prototypingPanel.style.width = '300px';
    prototypingPanel.style.maxHeight = '500px';
    prototypingPanel.style.overflow = 'auto';
    prototypingPanel.style.zIndex = '100';
    prototypingPanel.style.display = 'none';
    
    // Create panel header
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center p-3 border-b border-gray-200';
    
    const title = document.createElement('h3');
    title.className = 'text-sm font-medium text-gray-700';
    title.textContent = 'Prototyping';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'text-gray-500 hover:text-gray-700';
    closeButton.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px;">close</span>';
    closeButton.onclick = () => {
        prototypingPanel.style.display = 'none';
    };
    
    header.appendChild(title);
    header.appendChild(closeButton);
    prototypingPanel.appendChild(header);
    
    // Create interactions list container
    const interactionsContainer = document.createElement('div');
    interactionsContainer.className = 'p-3';
    
    const interactionsHeader = document.createElement('div');
    interactionsHeader.className = 'flex justify-between items-center mb-2';
    
    const interactionsTitle = document.createElement('h4');
    interactionsTitle.className = 'text-xs font-medium text-gray-600';
    interactionsTitle.textContent = 'Interactions';
    
    const addInteractionButton = document.createElement('button');
    addInteractionButton.className = 'text-xs text-blue-500 hover:text-blue-600';
    addInteractionButton.textContent = '+ Add Interaction';
    addInteractionButton.onclick = addInteraction;
    
    interactionsHeader.appendChild(interactionsTitle);
    interactionsHeader.appendChild(addInteractionButton);
    interactionsContainer.appendChild(interactionsHeader);
    
    // Create interactions list
    const interactionsList = document.createElement('div');
    interactionsList.id = 'interactions-list';
    interactionsList.className = 'space-y-2';
    interactionsContainer.appendChild(interactionsList);
    
    prototypingPanel.appendChild(interactionsContainer);
    
    // Create prototype mode controls
    const prototypeControls = document.createElement('div');
    prototypeControls.className = 'p-3 border-t border-gray-200';
    
    const startPrototypeButton = document.createElement('button');
    startPrototypeButton.id = 'start-prototype-btn';
    startPrototypeButton.className = 'w-full px-3 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600';
    startPrototypeButton.textContent = 'Start Prototype';
    startPrototypeButton.onclick = togglePrototypeMode;
    
    prototypeControls.appendChild(startPrototypeButton);
    prototypingPanel.appendChild(prototypeControls);
    
    // Add panel to the document
    document.body.appendChild(prototypingPanel);
    
    // Add button to menu bar to toggle prototyping panel
    const menuBar = document.querySelector('.menu-bar');
    const prototypingButton = document.createElement('button');
    prototypingButton.className = 'ml-2 px-3 py-1.5 rounded hover:bg-gray-100 flex items-center';
    prototypingButton.innerHTML = '<span class="material-symbols-outlined mr-1">play_arrow</span> Prototype';
    prototypingButton.onclick = () => {
        prototypingPanel.style.display = prototypingPanel.style.display === 'none' ? 'block' : 'none';
    };
    menuBar.appendChild(prototypingButton);
}

// Set up event listeners for prototyping
function setupPrototypingEvents() {
    // Listen for object selection to update prototyping panel
    appState.canvas.on('selection:created', updatePrototypingPanel);
    appState.canvas.on('selection:updated', updatePrototypingPanel);
    appState.canvas.on('selection:cleared', () => {
        // Hide prototyping panel when no object is selected
        document.querySelector('.prototyping-panel').style.display = 'none';
    });
    
    // Listen for keyboard shortcut to toggle prototype mode (Alt+P)
    Mousetrap.bind(['alt+p'], () => {
        togglePrototypeMode();
        return false;
    });
}

// Update the prototyping panel based on the selected object
function updatePrototypingPanel() {
    if (!appState.selectedObject) return;
    
    // Show prototyping panel
    const prototypingPanel = document.querySelector('.prototyping-panel');
    prototypingPanel.style.display = 'block';
    
    // Update interactions list
    updateInteractionsList();
}

// Add a new interaction to the selected object
function addInteraction() {
    if (!appState.selectedObject) {
        alert('Please select an object to add an interaction');
        return;
    }
    
    // Create interaction dialog
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    const dialogContent = document.createElement('div');
    dialogContent.className = 'bg-white rounded-lg shadow-xl w-96 max-w-full';
    
    // Dialog header
    const dialogHeader = document.createElement('div');
    dialogHeader.className = 'flex justify-between items-center p-4 border-b border-gray-200';
    
    const dialogTitle = document.createElement('h3');
    dialogTitle.className = 'text-lg font-medium text-gray-900';
    dialogTitle.textContent = 'Add Interaction';
    
    const closeDialogButton = document.createElement('button');
    closeDialogButton.className = 'text-gray-500 hover:text-gray-700';
    closeDialogButton.innerHTML = '<span class="material-symbols-outlined">close</span>';
    closeDialogButton.onclick = () => {
        document.body.removeChild(dialog);
    };
    
    dialogHeader.appendChild(dialogTitle);
    dialogHeader.appendChild(closeDialogButton);
    dialogContent.appendChild(dialogHeader);
    
    // Dialog body
    const dialogBody = document.createElement('div');
    dialogBody.className = 'p-4 space-y-4';
    
    // Trigger type
    const triggerSection = document.createElement('div');
    
    const triggerLabel = document.createElement('label');
    triggerLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    triggerLabel.textContent = 'Trigger';
    
    const triggerSelect = document.createElement('select');
    triggerSelect.className = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500';
    
    // Add options for each interaction type
    Object.values(interactionTypes).forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        triggerSelect.appendChild(option);
    });
    
    triggerSection.appendChild(triggerLabel);
    triggerSection.appendChild(triggerSelect);
    dialogBody.appendChild(triggerSection);
    
    // Target frame
    const targetSection = document.createElement('div');
    
    const targetLabel = document.createElement('label');
    targetLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    targetLabel.textContent = 'Target Frame';
    
    const targetSelect = document.createElement('select');
    targetSelect.className = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500';
    
    // Add option for each frame in the canvas
    const frames = appState.objects.filter(obj => obj.type === 'group');
    frames.forEach(frame => {
        const option = document.createElement('option');
        option.value = frame.id;
        option.textContent = frame.name || `Frame ${frames.indexOf(frame) + 1}`;
        targetSelect.appendChild(option);
    });
    
    targetSection.appendChild(targetLabel);
    targetSection.appendChild(targetSelect);
    dialogBody.appendChild(targetSection);
    
    // Animation type
    const animationSection = document.createElement('div');
    
    const animationLabel = document.createElement('label');
    animationLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    animationLabel.textContent = 'Animation';
    
    const animationSelect = document.createElement('select');
    animationSelect.className = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500';
    
    // Add options for each animation type
    Object.values(animationTypes).forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        animationSelect.appendChild(option);
    });
    
    animationSection.appendChild(animationLabel);
    animationSection.appendChild(animationSelect);
    dialogBody.appendChild(animationSection);
    
    dialogContent.appendChild(dialogBody);
    
    // Dialog footer
    const dialogFooter = document.createElement('div');
    dialogFooter.className = 'flex justify-end p-4 border-t border-gray-200';
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 mr-2';
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = () => {
        document.body.removeChild(dialog);
    };
    
    const saveButton = document.createElement('button');
    saveButton.className = 'px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md shadow-sm hover:bg-blue-600';
    saveButton.textContent = 'Save';
    saveButton.onclick = () => {
        // Create the interaction
        const interaction = {
            id: 'interaction_' + Date.now(),
            sourceId: appState.selectedObject.id,
            targetId: targetSelect.value,
            triggerType: triggerSelect.value,
            animationType: animationSelect.value
        };
        
        // Add to interactions store
        prototypeStore.interactions.push(interaction);
        
        // Update interactions list
        updateInteractionsList();
        
        // Close dialog
        document.body.removeChild(dialog);
    };
    
    dialogFooter.appendChild(cancelButton);
    dialogFooter.appendChild(saveButton);
    dialogContent.appendChild(dialogFooter);
    
    dialog.appendChild(dialogContent);
    document.body.appendChild(dialog);
}

// Update the interactions list in the UI
function updateInteractionsList() {
    const interactionsList = document.getElementById('interactions-list');
    if (!interactionsList) return;
    
    // Clear the list
    interactionsList.innerHTML = '';
    
    // Filter interactions for the selected object
    const objectInteractions = prototypeStore.interactions.filter(
        interaction => interaction.sourceId === appState.selectedObject.id
    );
    
    // Add interactions to the list
    if (objectInteractions.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'text-sm text-gray-500 text-center py-4';
        emptyMessage.textContent = 'No interactions yet. Click "+ Add Interaction" to create one.';
        interactionsList.appendChild(emptyMessage);
    } else {
        objectInteractions.forEach(interaction => {
            const interactionItem = document.createElement('div');
            interactionItem.className = 'interaction-item p-3 border border-gray-200 rounded-md';
            
            // Get target frame
            const targetFrame = appState.objects.find(obj => obj.id === interaction.targetId);
            const targetName = targetFrame ? (targetFrame.name || `Frame ${appState.objects.indexOf(targetFrame) + 1}`) : 'Unknown';
            
            // Interaction details
            const details = document.createElement('div');
            details.className = 'flex justify-between items-start mb-2';
            
            const info = document.createElement('div');
            
            const triggerType = document.createElement('div');
            triggerType.className = 'text-sm font-medium';
            triggerType.textContent = interaction.triggerType.charAt(0).toUpperCase() + interaction.triggerType.slice(1);
            
            const target = document.createElement('div');
            target.className = 'text-xs text-gray-500';
            target.textContent = `→ ${targetName}`;
            
            const animation = document.createElement('div');
            animation.className = 'text-xs text-gray-500';
            animation.textContent = `Animation: ${interaction.animationType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`;
            
            info.appendChild(triggerType);
            info.appendChild(target);
            info.appendChild(animation);
            
            // Actions
            const actions = document.createElement('div');
            actions.className = 'flex space-x-1';
            
            const editButton = document.createElement('button');
            editButton.className = 'p-1 text-gray-500 hover:text-gray-700';
            editButton.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">edit</span>';
            editButton.title = 'Edit';
            editButton.onclick = () => editInteraction(interaction.id);
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'p-1 text-gray-500 hover:text-gray-700';
            deleteButton.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">delete</span>';
            deleteButton.title = 'Delete';
            deleteButton.onclick = () => deleteInteraction(interaction.id);
            
            actions.appendChild(editButton);
            actions.appendChild(deleteButton);
            
            details.appendChild(info);
            details.appendChild(actions);
            
            interactionItem.appendChild(details);
            interactionsList.appendChild(interactionItem);
        });
    }
}

// Edit an existing interaction
function editInteraction(interactionId) {
    // Find the interaction
    const interaction = prototypeStore.interactions.find(i => i.id === interactionId);
    if (!interaction) return;
    
    // TODO: Implement edit interaction dialog
    alert('Edit interaction functionality would be implemented here');
}

// Delete an interaction
function deleteInteraction(interactionId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this interaction?')) return;
    
    // Remove the interaction
    const index = prototypeStore.interactions.findIndex(i => i.id === interactionId);
    if (index !== -1) {
        prototypeStore.interactions.splice(index, 1);
    }
    
    // Update interactions list
    updateInteractionsList();
}

// Toggle prototype mode
function togglePrototypeMode() {
    prototypeStore.isPrototypeModeActive = !prototypeStore.isPrototypeModeActive;
    
    // Update UI
    const startButton = document.getElementById('start-prototype-btn');
    if (startButton) {
        startButton.textContent = prototypeStore.isPrototypeModeActive ? 'Stop Prototype' : 'Start Prototype';
        startButton.classList.toggle('bg-blue-500', !prototypeStore.isPrototypeModeActive);
        startButton.classList.toggle('bg-red-500', prototypeStore.isPrototypeModeActive);
    }
    
    if (prototypeStore.isPrototypeModeActive) {
        // Enter prototype mode
        enterPrototypeMode();
    } else {
        // Exit prototype mode
        exitPrototypeMode();
    }
}

// Enter prototype mode
function enterPrototypeMode() {
    // Hide all UI panels
    document.querySelector('.prototyping-panel').style.display = 'none';
    document.querySelector('.layers-panel').style.display = 'none';
    
    // Disable selection and editing
    appState.canvas.selection = false;
    appState.canvas.forEachObject(obj => {
        obj.selectable = false;
        obj.evented = true;
    });
    
    // Add prototype mode overlay
    const overlay = document.createElement('div');
    overlay.id = 'prototype-overlay';
    overlay.className = 'fixed top-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 flex justify-between items-center z-50';
    
    const modeLabel = document.createElement('div');
    modeLabel.className = 'text-sm font-medium';
    modeLabel.textContent = 'Prototype Mode';
    
    const exitButton = document.createElement('button');
    exitButton.className = 'px-3 py-1 bg-red-500 text-white rounded text-sm';
    exitButton.textContent = 'Exit';
    exitButton.onclick = togglePrototypeMode;
    
    overlay.appendChild(modeLabel);
    overlay.appendChild(exitButton);
    document.body.appendChild(overlay);
    
    // Set up interaction handlers
    setupInteractionHandlers();
}

// Exit prototype mode
function exitPrototypeMode() {
    // Remove prototype mode overlay
    const overlay = document.getElementById('prototype-overlay');
    if (overlay) {
        document.body.removeChild(overlay);
    }
    
    // Re-enable selection and editing
    appState.canvas.selection = true;
    appState.canvas.forEachObject(obj => {
        obj.selectable = true;
    });
    
    // Remove interaction handlers
    removeInteractionHandlers();
    
    // Reset current screen
    prototypeStore.currentScreen = null;
    prototypeStore.previousScreen = null;
}

// Set up interaction handlers for prototype mode
function setupInteractionHandlers() {
    // Add click handler for click interactions
    appState.canvas.on('mouse:down', handlePrototypeInteraction);
}

// Remove interaction handlers
function removeInteractionHandlers() {
    // Remove click handler
    appState.canvas.off('mouse:down', handlePrototypeInteraction);
}

// Handle prototype interactions
function handlePrototypeInteraction(e) {
    if (!prototypeStore.isPrototypeModeActive) return;
    
    // Get the clicked object
    const clickedObject = e.target;
    if (!clickedObject) return;
    
    // Find interactions for this object
    const interactions = prototypeStore.interactions.filter(
        interaction => interaction.sourceId === clickedObject.id && interaction.triggerType === interactionTypes.CLICK
    );
    
    if (interactions.length > 0) {
        // Use the first interaction (in a real implementation, we might handle multiple interactions)
        const interaction = interactions[0];
        
        // Find the target frame
        const targetFrame = appState.objects.find(obj => obj.id === interaction.targetId);
        if (!targetFrame) return;
        
        // Navigate to the target frame
        navigateToFrame(targetFrame, interaction.animationType);
    }
}

// Navigate to a frame with animation
function navigateToFrame(frame, animationType) {
    // Store previous screen
    prototypeStore.previousScreen = prototypeStore.currentScreen;
    prototypeStore.currentScreen = frame;
    
    // Hide all frames except the target
    appState.objects.filter(obj => obj.type === 'group').forEach(obj => {
        obj.visible = (obj === frame);
    });
    
    // Apply animation based on type
    switch (animationType) {
        case animationTypes.DISSOLVE:
            // Fade in animation
            frame.opacity = 0;
            frame.visible = true;
            
            // Animate opacity
            const fadeIn = () => {
                if (frame.opacity < 1) {
                    frame.opacity += 0.1;
                    appState.canvas.renderAll();
                    requestAnimationFrame(fadeIn);
                }
            };
            
            fadeIn();
            break;
            
        case animationTypes.SLIDE_RIGHT:
            // Slide from left to right
            const originalLeft = frame.left;
            frame.left = -frame.width;
            frame.visible = true;
            
            // Animate position
            const slideRight = () => {
                if (frame.left < originalLeft) {
                    frame.left += 20;
                    appState.canvas.renderAll();
                    requestAnimationFrame(slideRight);
                } else {
                    frame.left = originalLeft;
                    appState.canvas.renderAll();
                }
            };
            
            slideRight();
            break;
            
        case animationTypes.SLIDE_LEFT:
            // Slide from right to left
            const canvasWidth = appState.canvas.width;
            const originalLeftPos = frame.left;
            frame.left = canvasWidth;
            frame.visible = true;
            
            // Animate position
            const slideLeft = () => {
                if (frame.left > originalLeftPos) {
                    frame.left -= 20;
                    appState.canvas.renderAll();
                    requestAnimationFrame(slideLeft);
                } else {
                    frame.left = originalLeftPos;
                    appState.canvas.renderAll();
                }
            };
            
            slideLeft();
            break;
            
        case animationTypes.SLIDE_UP:
            // Slide from bottom to top
            const canvasHeight = appState.canvas.height;
            const originalTop = frame.top;
            frame.top = canvasHeight;
            frame.visible = true;
            
            // Animate position
            const slideUp = () => {
                if (frame.top > originalTop) {
                    frame.top -= 20;
                    appState.canvas.renderAll();
                    requestAnimationFrame(slideUp);
                } else {
                    frame.top = originalTop;
                    appState.canvas.renderAll();
                }
            };
            
            slideUp();
            break;
            
        case animationTypes.SLIDE_DOWN:
            // Slide from top to bottom
            const originalTopPos = frame.top;
            frame.top = -frame.height;
            frame.visible = true;
            
            // Animate position
            const slideDown = () => {
                if (frame.top < originalTopPos) {
                    frame.top += 20;
                    appState.canvas.renderAll();
                    requestAnimationFrame(slideDown);
                } else {
                    frame.top = originalTopPos;
                    appState.canvas.renderAll();
                }
            };
            
            slideDown();
            break;
            
        default:
            // No animation, just show the frame
            appState.canvas.renderAll();
            break;
    }
}

// Export functions
window.prototypingSystem = {
    init: initPrototyping,
    addInteraction: addInteraction,
    toggleMode: togglePrototypeMode
}; 