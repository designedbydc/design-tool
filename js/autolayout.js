/**
 * Auto Layout System
 * 
 * Handles the creation and management of auto layout frames.
 */

// Auto layout properties
const autoLayoutDefaults = {
    direction: 'horizontal', // 'horizontal' or 'vertical'
    spacing: 10,             // Space between items
    padding: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
    },
    alignment: 'center',     // 'start', 'center', 'end'
    distribution: 'start'    // 'start', 'center', 'end', 'space-between'
};

// Initialize auto layout system
function initAutoLayout() {
    // Add auto layout button to properties panel
    addAutoLayoutControls();
}

// Add auto layout controls to the properties panel
function addAutoLayoutControls() {
    // Find the properties panel
    const propertiesPanel = document.querySelector('.properties-panel');
    if (!propertiesPanel) return;
    
    // Create auto layout section
    const autoLayoutSection = document.createElement('div');
    autoLayoutSection.className = 'property-group auto-layout-section';
    autoLayoutSection.style.display = 'none'; // Hide initially
    
    // Create section header
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-2';
    
    const title = document.createElement('label');
    title.className = 'text-xs text-gray-600';
    title.textContent = 'Auto Layout';
    
    const toggleButton = document.createElement('button');
    toggleButton.className = 'text-xs text-blue-500 hover:text-blue-600';
    toggleButton.textContent = 'Remove';
    toggleButton.onclick = removeAutoLayout;
    
    header.appendChild(title);
    header.appendChild(toggleButton);
    autoLayoutSection.appendChild(header);
    
    // Direction control
    const directionControl = document.createElement('div');
    directionControl.className = 'mb-2';
    
    const directionLabel = document.createElement('span');
    directionLabel.className = 'text-xs text-gray-500 block mb-1';
    directionLabel.textContent = 'Direction';
    
    const directionButtons = document.createElement('div');
    directionButtons.className = 'flex border border-gray-300 rounded overflow-hidden';
    
    const horizontalBtn = document.createElement('button');
    horizontalBtn.className = 'flex-1 py-1 text-xs bg-white hover:bg-gray-100 direction-btn';
    horizontalBtn.dataset.direction = 'horizontal';
    horizontalBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">horizontal_distribute</span>';
    horizontalBtn.onclick = () => setAutoLayoutDirection('horizontal');
    
    const verticalBtn = document.createElement('button');
    verticalBtn.className = 'flex-1 py-1 text-xs bg-white hover:bg-gray-100 direction-btn';
    verticalBtn.dataset.direction = 'vertical';
    verticalBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">vertical_distribute</span>';
    verticalBtn.onclick = () => setAutoLayoutDirection('vertical');
    
    directionButtons.appendChild(horizontalBtn);
    directionButtons.appendChild(verticalBtn);
    
    directionControl.appendChild(directionLabel);
    directionControl.appendChild(directionButtons);
    autoLayoutSection.appendChild(directionControl);
    
    // Spacing control
    const spacingControl = document.createElement('div');
    spacingControl.className = 'mb-2';
    
    const spacingLabel = document.createElement('span');
    spacingLabel.className = 'text-xs text-gray-500 block mb-1';
    spacingLabel.textContent = 'Spacing';
    
    const spacingInput = document.createElement('input');
    spacingInput.type = 'number';
    spacingInput.id = 'auto-layout-spacing';
    spacingInput.className = 'w-full px-2 py-1 text-sm border border-gray-300 rounded';
    spacingInput.value = autoLayoutDefaults.spacing;
    spacingInput.min = 0;
    spacingInput.onchange = () => setAutoLayoutSpacing(parseInt(spacingInput.value));
    
    spacingControl.appendChild(spacingLabel);
    spacingControl.appendChild(spacingInput);
    autoLayoutSection.appendChild(spacingControl);
    
    // Padding controls
    const paddingControl = document.createElement('div');
    paddingControl.className = 'mb-2';
    
    const paddingLabel = document.createElement('span');
    paddingLabel.className = 'text-xs text-gray-500 block mb-1';
    paddingLabel.textContent = 'Padding';
    
    const paddingInputs = document.createElement('div');
    paddingInputs.className = 'grid grid-cols-2 gap-2';
    
    // Top padding
    const topPaddingContainer = document.createElement('div');
    topPaddingContainer.className = 'flex flex-col';
    
    const topPaddingLabel = document.createElement('span');
    topPaddingLabel.className = 'text-xs text-gray-500';
    topPaddingLabel.textContent = 'Top';
    
    const topPaddingInput = document.createElement('input');
    topPaddingInput.type = 'number';
    topPaddingInput.id = 'auto-layout-padding-top';
    topPaddingInput.className = 'w-full px-2 py-1 text-sm border border-gray-300 rounded';
    topPaddingInput.value = autoLayoutDefaults.padding.top;
    topPaddingInput.min = 0;
    topPaddingInput.onchange = () => setAutoLayoutPadding('top', parseInt(topPaddingInput.value));
    
    topPaddingContainer.appendChild(topPaddingLabel);
    topPaddingContainer.appendChild(topPaddingInput);
    
    // Right padding
    const rightPaddingContainer = document.createElement('div');
    rightPaddingContainer.className = 'flex flex-col';
    
    const rightPaddingLabel = document.createElement('span');
    rightPaddingLabel.className = 'text-xs text-gray-500';
    rightPaddingLabel.textContent = 'Right';
    
    const rightPaddingInput = document.createElement('input');
    rightPaddingInput.type = 'number';
    rightPaddingInput.id = 'auto-layout-padding-right';
    rightPaddingInput.className = 'w-full px-2 py-1 text-sm border border-gray-300 rounded';
    rightPaddingInput.value = autoLayoutDefaults.padding.right;
    rightPaddingInput.min = 0;
    rightPaddingInput.onchange = () => setAutoLayoutPadding('right', parseInt(rightPaddingInput.value));
    
    rightPaddingContainer.appendChild(rightPaddingLabel);
    rightPaddingContainer.appendChild(rightPaddingInput);
    
    // Bottom padding
    const bottomPaddingContainer = document.createElement('div');
    bottomPaddingContainer.className = 'flex flex-col';
    
    const bottomPaddingLabel = document.createElement('span');
    bottomPaddingLabel.className = 'text-xs text-gray-500';
    bottomPaddingLabel.textContent = 'Bottom';
    
    const bottomPaddingInput = document.createElement('input');
    bottomPaddingInput.type = 'number';
    bottomPaddingInput.id = 'auto-layout-padding-bottom';
    bottomPaddingInput.className = 'w-full px-2 py-1 text-sm border border-gray-300 rounded';
    bottomPaddingInput.value = autoLayoutDefaults.padding.bottom;
    bottomPaddingInput.min = 0;
    bottomPaddingInput.onchange = () => setAutoLayoutPadding('bottom', parseInt(bottomPaddingInput.value));
    
    bottomPaddingContainer.appendChild(bottomPaddingLabel);
    bottomPaddingContainer.appendChild(bottomPaddingInput);
    
    // Left padding
    const leftPaddingContainer = document.createElement('div');
    leftPaddingContainer.className = 'flex flex-col';
    
    const leftPaddingLabel = document.createElement('span');
    leftPaddingLabel.className = 'text-xs text-gray-500';
    leftPaddingLabel.textContent = 'Left';
    
    const leftPaddingInput = document.createElement('input');
    leftPaddingInput.type = 'number';
    leftPaddingInput.id = 'auto-layout-padding-left';
    leftPaddingInput.className = 'w-full px-2 py-1 text-sm border border-gray-300 rounded';
    leftPaddingInput.value = autoLayoutDefaults.padding.left;
    leftPaddingInput.min = 0;
    leftPaddingInput.onchange = () => setAutoLayoutPadding('left', parseInt(leftPaddingInput.value));
    
    leftPaddingContainer.appendChild(leftPaddingLabel);
    leftPaddingContainer.appendChild(leftPaddingInput);
    
    paddingInputs.appendChild(topPaddingContainer);
    paddingInputs.appendChild(rightPaddingContainer);
    paddingInputs.appendChild(bottomPaddingContainer);
    paddingInputs.appendChild(leftPaddingContainer);
    
    paddingControl.appendChild(paddingLabel);
    paddingControl.appendChild(paddingInputs);
    autoLayoutSection.appendChild(paddingControl);
    
    // Alignment control
    const alignmentControl = document.createElement('div');
    alignmentControl.className = 'mb-2';
    
    const alignmentLabel = document.createElement('span');
    alignmentLabel.className = 'text-xs text-gray-500 block mb-1';
    alignmentLabel.textContent = 'Alignment';
    
    const alignmentButtons = document.createElement('div');
    alignmentButtons.className = 'flex border border-gray-300 rounded overflow-hidden';
    
    const startAlignBtn = document.createElement('button');
    startAlignBtn.className = 'flex-1 py-1 text-xs bg-white hover:bg-gray-100 alignment-btn';
    startAlignBtn.dataset.alignment = 'start';
    startAlignBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">align_horizontal_left</span>';
    startAlignBtn.onclick = () => setAutoLayoutAlignment('start');
    
    const centerAlignBtn = document.createElement('button');
    centerAlignBtn.className = 'flex-1 py-1 text-xs bg-white hover:bg-gray-100 alignment-btn';
    centerAlignBtn.dataset.alignment = 'center';
    centerAlignBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">align_horizontal_center</span>';
    centerAlignBtn.onclick = () => setAutoLayoutAlignment('center');
    
    const endAlignBtn = document.createElement('button');
    endAlignBtn.className = 'flex-1 py-1 text-xs bg-white hover:bg-gray-100 alignment-btn';
    endAlignBtn.dataset.alignment = 'end';
    endAlignBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">align_horizontal_right</span>';
    endAlignBtn.onclick = () => setAutoLayoutAlignment('end');
    
    alignmentButtons.appendChild(startAlignBtn);
    alignmentButtons.appendChild(centerAlignBtn);
    alignmentButtons.appendChild(endAlignBtn);
    
    alignmentControl.appendChild(alignmentLabel);
    alignmentControl.appendChild(alignmentButtons);
    autoLayoutSection.appendChild(alignmentControl);
    
    // Add the auto layout section to the properties panel
    propertiesPanel.appendChild(autoLayoutSection);
    
    // Add "Add Auto Layout" button to properties panel
    const addAutoLayoutBtn = document.createElement('button');
    addAutoLayoutBtn.id = 'add-auto-layout-btn';
    addAutoLayoutBtn.className = 'w-full mt-4 px-3 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600';
    addAutoLayoutBtn.textContent = 'Add Auto Layout';
    addAutoLayoutBtn.onclick = addAutoLayout;
    addAutoLayoutBtn.style.display = 'none'; // Hide initially
    
    propertiesPanel.appendChild(addAutoLayoutBtn);
    
    // Add keyboard shortcut for auto layout (Shift+A)
    Mousetrap.bind('shift+a', () => {
        if (appState.selectedObject && isFrame(appState.selectedObject)) {
            addAutoLayout();
        }
        return false;
    });
}

// Check if an object is a frame
function isFrame(obj) {
    return obj && obj.type === 'group';
}

// Add auto layout to the selected object
function addAutoLayout() {
    if (!appState.selectedObject) {
        alert('Please select a frame to add auto layout');
        return;
    }
    
    if (!isFrame(appState.selectedObject)) {
        // Convert to frame if not already
        convertToFrame();
    }
    
    // Add auto layout properties to the object
    appState.selectedObject.autoLayout = {
        enabled: true,
        direction: autoLayoutDefaults.direction,
        spacing: autoLayoutDefaults.spacing,
        padding: { ...autoLayoutDefaults.padding },
        alignment: autoLayoutDefaults.alignment,
        distribution: autoLayoutDefaults.distribution
    };
    
    // Apply auto layout
    applyAutoLayout();
    
    // Update UI
    updateAutoLayoutUI();
    
    // Save state for undo/redo
    saveState();
}

// Convert the selected object to a frame
function convertToFrame() {
    if (!appState.selectedObject) return;
    
    // Create a new frame
    const frame = new fabric.Group([appState.selectedObject], {
        left: appState.selectedObject.left,
        top: appState.selectedObject.top,
        width: appState.selectedObject.width,
        height: appState.selectedObject.height
    });
    
    // Replace the selected object with the frame
    appState.canvas.remove(appState.selectedObject);
    appState.canvas.add(frame);
    
    // Update objects array
    const index = appState.objects.indexOf(appState.selectedObject);
    if (index !== -1) {
        appState.objects[index] = frame;
    } else {
        appState.objects.push(frame);
    }
    
    // Select the new frame
    appState.canvas.setActiveObject(frame);
    appState.selectedObject = frame;
    
    // Update properties panel
    updatePropertiesPanel();
}

// Remove auto layout from the selected object
function removeAutoLayout() {
    if (!appState.selectedObject || !appState.selectedObject.autoLayout) return;
    
    // Remove auto layout properties
    delete appState.selectedObject.autoLayout;
    
    // Update UI
    updateAutoLayoutUI();
    
    // Save state for undo/redo
    saveState();
}

// Set auto layout direction
function setAutoLayoutDirection(direction) {
    if (!appState.selectedObject || !appState.selectedObject.autoLayout) return;
    
    appState.selectedObject.autoLayout.direction = direction;
    
    // Update UI
    updateDirectionButtons();
    
    // Apply auto layout
    applyAutoLayout();
    
    // Save state for undo/redo
    saveState();
}

// Set auto layout spacing
function setAutoLayoutSpacing(spacing) {
    if (!appState.selectedObject || !appState.selectedObject.autoLayout) return;
    
    appState.selectedObject.autoLayout.spacing = spacing;
    
    // Apply auto layout
    applyAutoLayout();
    
    // Save state for undo/redo
    saveState();
}

// Set auto layout padding
function setAutoLayoutPadding(side, value) {
    if (!appState.selectedObject || !appState.selectedObject.autoLayout) return;
    
    appState.selectedObject.autoLayout.padding[side] = value;
    
    // Apply auto layout
    applyAutoLayout();
    
    // Save state for undo/redo
    saveState();
}

// Set auto layout alignment
function setAutoLayoutAlignment(alignment) {
    if (!appState.selectedObject || !appState.selectedObject.autoLayout) return;
    
    appState.selectedObject.autoLayout.alignment = alignment;
    
    // Update UI
    updateAlignmentButtons();
    
    // Apply auto layout
    applyAutoLayout();
    
    // Save state for undo/redo
    saveState();
}

// Apply auto layout to the selected object
function applyAutoLayout() {
    if (!appState.selectedObject || !appState.selectedObject.autoLayout) return;
    
    const frame = appState.selectedObject;
    const autoLayout = frame.autoLayout;
    
    // Get child objects
    const children = frame._objects || [];
    if (children.length === 0) return;
    
    // Calculate positions based on auto layout properties
    const { direction, spacing, padding, alignment } = autoLayout;
    
    let currentPosition = direction === 'horizontal' ? padding.left : padding.top;
    
    children.forEach((child, index) => {
        // Calculate position based on direction
        if (direction === 'horizontal') {
            child.left = currentPosition;
            
            // Calculate vertical position based on alignment
            switch (alignment) {
                case 'start':
                    child.top = padding.top;
                    break;
                case 'center':
                    child.top = padding.top + (frame.height - padding.top - padding.bottom - child.height) / 2;
                    break;
                case 'end':
                    child.top = frame.height - padding.bottom - child.height;
                    break;
            }
            
            // Update current position for next child
            currentPosition += child.width + spacing;
        } else { // vertical
            child.top = currentPosition;
            
            // Calculate horizontal position based on alignment
            switch (alignment) {
                case 'start':
                    child.left = padding.left;
                    break;
                case 'center':
                    child.left = padding.left + (frame.width - padding.left - padding.right - child.width) / 2;
                    break;
                case 'end':
                    child.left = frame.width - padding.right - child.width;
                    break;
            }
            
            // Update current position for next child
            currentPosition += child.height + spacing;
        }
    });
    
    // Calculate new frame size based on content
    let newWidth = frame.width;
    let newHeight = frame.height;
    
    if (direction === 'horizontal') {
        // Calculate width based on children
        const lastChild = children[children.length - 1];
        const contentWidth = lastChild.left + lastChild.width - children[0].left;
        newWidth = contentWidth + padding.left + padding.right;
    } else { // vertical
        // Calculate height based on children
        const lastChild = children[children.length - 1];
        const contentHeight = lastChild.top + lastChild.height - children[0].top;
        newHeight = contentHeight + padding.top + padding.bottom;
    }
    
    // Update frame size
    frame.set({
        width: newWidth,
        height: newHeight
    });
    
    // Update canvas
    appState.canvas.renderAll();
}

// Update the auto layout UI based on the selected object
function updateAutoLayoutUI() {
    const autoLayoutSection = document.querySelector('.auto-layout-section');
    const addAutoLayoutBtn = document.getElementById('add-auto-layout-btn');
    
    if (!autoLayoutSection || !addAutoLayoutBtn) return;
    
    if (appState.selectedObject && isFrame(appState.selectedObject)) {
        // Show/hide appropriate controls
        if (appState.selectedObject.autoLayout) {
            autoLayoutSection.style.display = 'block';
            addAutoLayoutBtn.style.display = 'none';
            
            // Update input values
            document.getElementById('auto-layout-spacing').value = appState.selectedObject.autoLayout.spacing;
            document.getElementById('auto-layout-padding-top').value = appState.selectedObject.autoLayout.padding.top;
            document.getElementById('auto-layout-padding-right').value = appState.selectedObject.autoLayout.padding.right;
            document.getElementById('auto-layout-padding-bottom').value = appState.selectedObject.autoLayout.padding.bottom;
            document.getElementById('auto-layout-padding-left').value = appState.selectedObject.autoLayout.padding.left;
            
            // Update direction and alignment buttons
            updateDirectionButtons();
            updateAlignmentButtons();
        } else {
            autoLayoutSection.style.display = 'none';
            addAutoLayoutBtn.style.display = 'block';
        }
    } else {
        autoLayoutSection.style.display = 'none';
        addAutoLayoutBtn.style.display = 'none';
    }
}

// Update direction buttons based on selected object
function updateDirectionButtons() {
    if (!appState.selectedObject || !appState.selectedObject.autoLayout) return;
    
    const directionBtns = document.querySelectorAll('.direction-btn');
    directionBtns.forEach(btn => {
        if (btn.dataset.direction === appState.selectedObject.autoLayout.direction) {
            btn.classList.add('bg-blue-100', 'text-blue-600');
        } else {
            btn.classList.remove('bg-blue-100', 'text-blue-600');
        }
    });
}

// Update alignment buttons based on selected object
function updateAlignmentButtons() {
    if (!appState.selectedObject || !appState.selectedObject.autoLayout) return;
    
    const alignmentBtns = document.querySelectorAll('.alignment-btn');
    alignmentBtns.forEach(btn => {
        if (btn.dataset.alignment === appState.selectedObject.autoLayout.alignment) {
            btn.classList.add('bg-blue-100', 'text-blue-600');
        } else {
            btn.classList.remove('bg-blue-100', 'text-blue-600');
        }
    });
}

// Export functions
window.autoLayoutSystem = {
    init: initAutoLayout,
    add: addAutoLayout,
    remove: removeAutoLayout,
    apply: applyAutoLayout,
    updateUI: updateAutoLayoutUI
}; 