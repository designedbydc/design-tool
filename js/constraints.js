/**
 * Constraints System
 * 
 * Handles the creation and management of constraints for responsive design.
 */

// Constraint types
const constraintTypes = {
    HORIZONTAL: {
        LEFT: 'left',
        RIGHT: 'right',
        CENTER: 'center',
        SCALE: 'scale',
        LEFT_RIGHT: 'left-right'
    },
    VERTICAL: {
        TOP: 'top',
        BOTTOM: 'bottom',
        CENTER: 'center',
        SCALE: 'scale',
        TOP_BOTTOM: 'top-bottom'
    }
};

// Default constraints
const defaultConstraints = {
    horizontal: constraintTypes.HORIZONTAL.LEFT,
    vertical: constraintTypes.VERTICAL.TOP
};

// Initialize constraints system
function initConstraints() {
    // Add constraints controls to properties panel
    addConstraintsControls();
    
    // Set up event listeners for frame resizing
    setupFrameResizeEvents();
}

// Add constraints controls to the properties panel
function addConstraintsControls() {
    // Find the properties panel
    const propertiesPanel = document.querySelector('.properties-panel');
    if (!propertiesPanel) return;
    
    // Create constraints section
    const constraintsSection = document.createElement('div');
    constraintsSection.className = 'property-group constraints-section';
    constraintsSection.style.display = 'none'; // Hide initially
    
    // Create section header
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-2';
    
    const title = document.createElement('label');
    title.className = 'text-xs text-gray-600';
    title.textContent = 'Constraints';
    
    header.appendChild(title);
    constraintsSection.appendChild(header);
    
    // Horizontal constraints
    const horizontalConstraints = document.createElement('div');
    horizontalConstraints.className = 'mb-3';
    
    const horizontalLabel = document.createElement('span');
    horizontalLabel.className = 'text-xs text-gray-500 block mb-1';
    horizontalLabel.textContent = 'Horizontal';
    
    const horizontalButtons = document.createElement('div');
    horizontalButtons.className = 'grid grid-cols-5 gap-1';
    
    // Create buttons for each horizontal constraint type
    const horizontalConstraintTypes = [
        { type: constraintTypes.HORIZONTAL.LEFT, icon: 'align_horizontal_left' },
        { type: constraintTypes.HORIZONTAL.CENTER, icon: 'align_horizontal_center' },
        { type: constraintTypes.HORIZONTAL.RIGHT, icon: 'align_horizontal_right' },
        { type: constraintTypes.HORIZONTAL.SCALE, icon: 'width' },
        { type: constraintTypes.HORIZONTAL.LEFT_RIGHT, icon: 'horizontal_distribute' }
    ];
    
    horizontalConstraintTypes.forEach(constraint => {
        const button = document.createElement('button');
        button.className = 'h-constraint-btn p-1 border border-gray-300 rounded bg-white hover:bg-gray-100';
        button.dataset.constraint = constraint.type;
        button.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px;">${constraint.icon}</span>`;
        button.title = constraint.type.charAt(0).toUpperCase() + constraint.type.slice(1);
        button.onclick = () => setHorizontalConstraint(constraint.type);
        horizontalButtons.appendChild(button);
    });
    
    horizontalConstraints.appendChild(horizontalLabel);
    horizontalConstraints.appendChild(horizontalButtons);
    constraintsSection.appendChild(horizontalConstraints);
    
    // Vertical constraints
    const verticalConstraints = document.createElement('div');
    verticalConstraints.className = 'mb-2';
    
    const verticalLabel = document.createElement('span');
    verticalLabel.className = 'text-xs text-gray-500 block mb-1';
    verticalLabel.textContent = 'Vertical';
    
    const verticalButtons = document.createElement('div');
    verticalButtons.className = 'grid grid-cols-5 gap-1';
    
    // Create buttons for each vertical constraint type
    const verticalConstraintTypes = [
        { type: constraintTypes.VERTICAL.TOP, icon: 'align_vertical_top' },
        { type: constraintTypes.VERTICAL.CENTER, icon: 'align_vertical_center' },
        { type: constraintTypes.VERTICAL.BOTTOM, icon: 'align_vertical_bottom' },
        { type: constraintTypes.VERTICAL.SCALE, icon: 'height' },
        { type: constraintTypes.VERTICAL.TOP_BOTTOM, icon: 'vertical_distribute' }
    ];
    
    verticalConstraintTypes.forEach(constraint => {
        const button = document.createElement('button');
        button.className = 'v-constraint-btn p-1 border border-gray-300 rounded bg-white hover:bg-gray-100';
        button.dataset.constraint = constraint.type;
        button.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px;">${constraint.icon}</span>`;
        button.title = constraint.type.charAt(0).toUpperCase() + constraint.type.slice(1);
        button.onclick = () => setVerticalConstraint(constraint.type);
        verticalButtons.appendChild(button);
    });
    
    verticalConstraints.appendChild(verticalLabel);
    verticalConstraints.appendChild(verticalButtons);
    constraintsSection.appendChild(verticalConstraints);
    
    // Add the constraints section to the properties panel
    propertiesPanel.appendChild(constraintsSection);
}

// Set up event listeners for frame resizing
function setupFrameResizeEvents() {
    // Listen for object scaling events
    appState.canvas.on('object:scaling', handleFrameResize);
}

// Handle frame resize event
function handleFrameResize(e) {
    const frame = e.target;
    
    // Only apply constraints if the object is a frame (group)
    if (!isFrame(frame)) return;
    
    // Get the frame's children
    const children = frame._objects || [];
    if (children.length === 0) return;
    
    // Store original frame dimensions for calculations
    const originalWidth = frame.width / frame.scaleX;
    const originalHeight = frame.height / frame.scaleY;
    
    // Calculate new dimensions
    const newWidth = originalWidth * frame.scaleX;
    const newHeight = originalHeight * frame.scaleY;
    
    // Apply constraints to each child
    children.forEach(child => {
        if (!child.constraints) {
            // Set default constraints if none exist
            child.constraints = { ...defaultConstraints };
        }
        
        applyConstraints(child, frame, originalWidth, originalHeight, newWidth, newHeight);
    });
    
    // Update the frame's dimensions
    frame.set({
        width: newWidth,
        height: newHeight,
        scaleX: 1,
        scaleY: 1
    });
    
    // Update canvas
    appState.canvas.renderAll();
}

// Apply constraints to an object
function applyConstraints(obj, frame, originalWidth, originalHeight, newWidth, newHeight) {
    // Get the object's constraints
    const { horizontal, vertical } = obj.constraints;
    
    // Calculate original positions relative to frame
    const originalLeft = obj.left;
    const originalTop = obj.top;
    const originalRight = originalWidth - (originalLeft + obj.width * obj.scaleX);
    const originalBottom = originalHeight - (originalTop + obj.height * obj.scaleY);
    const originalCenterX = originalLeft + (obj.width * obj.scaleX) / 2;
    const originalCenterY = originalTop + (obj.height * obj.scaleY) / 2;
    
    // Apply horizontal constraint
    switch (horizontal) {
        case constraintTypes.HORIZONTAL.LEFT:
            // Keep left position fixed
            break;
        case constraintTypes.HORIZONTAL.RIGHT:
            // Keep right position fixed
            obj.left = newWidth - originalRight - obj.width * obj.scaleX;
            break;
        case constraintTypes.HORIZONTAL.CENTER:
            // Keep center position proportional
            obj.left = (originalCenterX / originalWidth) * newWidth - (obj.width * obj.scaleX) / 2;
            break;
        case constraintTypes.HORIZONTAL.SCALE:
            // Scale width proportionally
            const widthScale = newWidth / originalWidth;
            obj.scaleX = obj.scaleX * widthScale;
            break;
        case constraintTypes.HORIZONTAL.LEFT_RIGHT:
            // Stretch between left and right
            obj.left = originalLeft;
            obj.scaleX = (newWidth - originalLeft - originalRight) / obj.width;
            break;
    }
    
    // Apply vertical constraint
    switch (vertical) {
        case constraintTypes.VERTICAL.TOP:
            // Keep top position fixed
            break;
        case constraintTypes.VERTICAL.BOTTOM:
            // Keep bottom position fixed
            obj.top = newHeight - originalBottom - obj.height * obj.scaleY;
            break;
        case constraintTypes.VERTICAL.CENTER:
            // Keep center position proportional
            obj.top = (originalCenterY / originalHeight) * newHeight - (obj.height * obj.scaleY) / 2;
            break;
        case constraintTypes.VERTICAL.SCALE:
            // Scale height proportionally
            const heightScale = newHeight / originalHeight;
            obj.scaleY = obj.scaleY * heightScale;
            break;
        case constraintTypes.VERTICAL.TOP_BOTTOM:
            // Stretch between top and bottom
            obj.top = originalTop;
            obj.scaleY = (newHeight - originalTop - originalBottom) / obj.height;
            break;
    }
}

// Set horizontal constraint for the selected object
function setHorizontalConstraint(constraintType) {
    if (!appState.selectedObject) return;
    
    // Initialize constraints if they don't exist
    if (!appState.selectedObject.constraints) {
        appState.selectedObject.constraints = { ...defaultConstraints };
    }
    
    // Set the horizontal constraint
    appState.selectedObject.constraints.horizontal = constraintType;
    
    // Update UI
    updateConstraintButtons();
    
    // Save state for undo/redo
    saveState();
}

// Set vertical constraint for the selected object
function setVerticalConstraint(constraintType) {
    if (!appState.selectedObject) return;
    
    // Initialize constraints if they don't exist
    if (!appState.selectedObject.constraints) {
        appState.selectedObject.constraints = { ...defaultConstraints };
    }
    
    // Set the vertical constraint
    appState.selectedObject.constraints.vertical = constraintType;
    
    // Update UI
    updateConstraintButtons();
    
    // Save state for undo/redo
    saveState();
}

// Update constraint buttons based on selected object
function updateConstraintButtons() {
    if (!appState.selectedObject || !appState.selectedObject.constraints) return;
    
    // Update horizontal constraint buttons
    const hConstraintBtns = document.querySelectorAll('.h-constraint-btn');
    hConstraintBtns.forEach(btn => {
        if (btn.dataset.constraint === appState.selectedObject.constraints.horizontal) {
            btn.classList.add('bg-blue-100', 'text-blue-600');
        } else {
            btn.classList.remove('bg-blue-100', 'text-blue-600');
        }
    });
    
    // Update vertical constraint buttons
    const vConstraintBtns = document.querySelectorAll('.v-constraint-btn');
    vConstraintBtns.forEach(btn => {
        if (btn.dataset.constraint === appState.selectedObject.constraints.vertical) {
            btn.classList.add('bg-blue-100', 'text-blue-600');
        } else {
            btn.classList.remove('bg-blue-100', 'text-blue-600');
        }
    });
}

// Update the constraints UI based on the selected object
function updateConstraintsUI() {
    const constraintsSection = document.querySelector('.constraints-section');
    if (!constraintsSection) return;
    
    if (appState.selectedObject && !isFrame(appState.selectedObject)) {
        // Show constraints section for non-frame objects
        constraintsSection.style.display = 'block';
        
        // Initialize constraints if they don't exist
        if (!appState.selectedObject.constraints) {
            appState.selectedObject.constraints = { ...defaultConstraints };
        }
        
        // Update constraint buttons
        updateConstraintButtons();
    } else {
        // Hide constraints section
        constraintsSection.style.display = 'none';
    }
}

// Check if an object is a frame
function isFrame(obj) {
    return obj && obj.type === 'group';
}

// Export functions
window.constraintsSystem = {
    init: initConstraints,
    update: updateConstraintsUI,
    types: constraintTypes
}; 