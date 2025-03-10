/**
 * Tools Module
 * 
 * Handles the initialization and functionality of the drawing tools.
 */

// Initialize the tools
function initTools() {
    const toolItems = document.querySelectorAll('.tool-item');
    
    // Add click event listeners to tool items
    toolItems.forEach(tool => {
        tool.addEventListener('click', () => {
            // Remove active class from all tools
            toolItems.forEach(t => t.classList.remove('active'));
            
            // Add active class to selected tool
            tool.classList.add('active');
            
            // Set current tool
            appState.currentTool = tool.getAttribute('data-tool');
            
            // Activate the appropriate tool
            activateTool(appState.currentTool);
        });
    });
    
    // Set select tool as active by default
    document.querySelector('[data-tool="select"]').classList.add('active');
    activateTool('select');
}

// Activate the selected tool
function activateTool(toolName) {
    // Disable drawing mode
    appState.canvas.isDrawingMode = false;
    
    // Remove any active listeners
    appState.canvas.off('mouse:down');
    
    // Add the appropriate listener based on the tool
    switch(toolName) {
        case 'select':
            activateSelectTool();
            break;
        case 'rectangle':
            activateRectangleTool();
            break;
        case 'circle':
            activateCircleTool();
            break;
        case 'line':
            activateLineTool();
            break;
        case 'text':
            activateTextTool();
            break;
    }
}

// Activate the select tool
function activateSelectTool() {
    // Enable object selection
    appState.canvas.selection = true;
    
    // Make sure all objects have controls enabled
    appState.canvas.forEachObject(function(obj) {
        obj.set({
            selectable: true,
            hasControls: true,
            hasBorders: true
        });
    });
    
    // Refresh canvas
    appState.canvas.renderAll();
}

// Activate the rectangle tool
function activateRectangleTool() {
    let isDrawing = false;
    let startX, startY;
    let rect;
    
    appState.canvas.on('mouse:down', (e) => {
        // Only proceed if not panning
        if (appState.isPanning) return;
        
        // Get mouse coordinates
        const pointer = appState.canvas.getPointer(e.e);
        startX = pointer.x;
        startY = pointer.y;
        
        // Create a new rectangle
        rect = new fabric.Rect({
            left: startX,
            top: startY,
            width: 0,
            height: 0,
            fill: '#f0f0f0',
            stroke: '#000000',
            strokeWidth: 1,
            selectable: false,
            objectType: 'rectangle'
        });
        
        appState.canvas.add(rect);
        isDrawing = true;
    });
    
    appState.canvas.on('mouse:move', (e) => {
        if (!isDrawing) return;
        
        const pointer = appState.canvas.getPointer(e.e);
        
        // Calculate width and height
        let width = pointer.x - startX;
        let height = pointer.y - startY;
        
        // Handle negative dimensions
        if (width < 0) {
            rect.set({ left: pointer.x });
            width = Math.abs(width);
        }
        
        if (height < 0) {
            rect.set({ top: pointer.y });
            height = Math.abs(height);
        }
        
        // Update rectangle dimensions
        rect.set({
            width: width,
            height: height
        });
        
        appState.canvas.renderAll();
    });
    
    appState.canvas.on('mouse:up', () => {
        if (!isDrawing) return;
        
        isDrawing = false;
        
        // Make the rectangle selectable
        rect.set({
            selectable: true,
            hasControls: true,
            hasBorders: true
        });
        
        // Add to objects array
        appState.objects.push(rect);
        
        // Select the new object
        appState.canvas.setActiveObject(rect);
        appState.selectedObject = rect;
        
        // Update properties panel
        updatePropertiesPanel();
        
        // Update layers panel
        updateLayers();
        
        // Save state for undo/redo
        saveState();
        
        // Switch back to select tool
        document.querySelector('[data-tool="select"]').click();
        appState.currentTool = 'select';
        activateTool('select');
    });
}

// Activate the circle tool
function activateCircleTool() {
    let isDrawing = false;
    let startX, startY;
    let circle;
    
    appState.canvas.on('mouse:down', (e) => {
        // Only proceed if not panning
        if (appState.isPanning) return;
        
        // Get mouse coordinates
        const pointer = appState.canvas.getPointer(e.e);
        startX = pointer.x;
        startY = pointer.y;
        
        // Create a new circle
        circle = new fabric.Circle({
            left: startX,
            top: startY,
            radius: 0,
            fill: '#f0f0f0',
            stroke: '#000000',
            strokeWidth: 1,
            selectable: false,
            originX: 'center',
            originY: 'center',
            objectType: 'circle'
        });
        
        appState.canvas.add(circle);
        isDrawing = true;
    });
    
    appState.canvas.on('mouse:move', (e) => {
        if (!isDrawing) return;
        
        const pointer = appState.canvas.getPointer(e.e);
        
        // Calculate radius based on distance
        const radius = Math.sqrt(
            Math.pow(pointer.x - startX, 2) + 
            Math.pow(pointer.y - startY, 2)
        );
        
        // Update circle radius
        circle.set({
            radius: radius
        });
        
        appState.canvas.renderAll();
    });
    
    appState.canvas.on('mouse:up', () => {
        if (!isDrawing) return;
        
        isDrawing = false;
        
        // Make the circle selectable
        circle.set({
            selectable: true,
            hasControls: true,
            hasBorders: true
        });
        
        // Add to objects array
        appState.objects.push(circle);
        
        // Select the new object
        appState.canvas.setActiveObject(circle);
        appState.selectedObject = circle;
        
        // Update properties panel
        updatePropertiesPanel();
        
        // Update layers panel
        updateLayers();
        
        // Save state for undo/redo
        saveState();
        
        // Switch back to select tool
        document.querySelector('[data-tool="select"]').click();
        appState.currentTool = 'select';
        activateTool('select');
    });
}

// Activate the line tool
function activateLineTool() {
    let isDrawing = false;
    let startX, startY;
    let line;
    
    appState.canvas.on('mouse:down', (e) => {
        // Only proceed if not panning
        if (appState.isPanning) return;
        
        // Get mouse coordinates
        const pointer = appState.canvas.getPointer(e.e);
        startX = pointer.x;
        startY = pointer.y;
        
        // Create a new line
        line = new fabric.Line([startX, startY, startX, startY], {
            stroke: '#000000',
            strokeWidth: 2,
            selectable: false,
            objectType: 'line'
        });
        
        appState.canvas.add(line);
        isDrawing = true;
    });
    
    appState.canvas.on('mouse:move', (e) => {
        if (!isDrawing) return;
        
        const pointer = appState.canvas.getPointer(e.e);
        
        // Update line end point
        line.set({
            x2: pointer.x,
            y2: pointer.y
        });
        
        appState.canvas.renderAll();
    });
    
    appState.canvas.on('mouse:up', () => {
        if (!isDrawing) return;
        
        isDrawing = false;
        
        // Make the line selectable
        line.set({
            selectable: true,
            hasControls: true,
            hasBorders: true
        });
        
        // Add to objects array
        appState.objects.push(line);
        
        // Select the new object
        appState.canvas.setActiveObject(line);
        appState.selectedObject = line;
        
        // Update properties panel
        updatePropertiesPanel();
        
        // Update layers panel
        updateLayers();
        
        // Save state for undo/redo
        saveState();
        
        // Switch back to select tool
        document.querySelector('[data-tool="select"]').click();
        appState.currentTool = 'select';
        activateTool('select');
    });
}

// Activate the text tool
function activateTextTool() {
    appState.canvas.on('mouse:down', (e) => {
        // Only proceed if not panning
        if (appState.isPanning) return;
        
        // Get mouse coordinates
        const pointer = appState.canvas.getPointer(e.e);
        
        // Create a new text object
        const text = new fabric.IText('Text', {
            left: pointer.x,
            top: pointer.y,
            fontFamily: 'Arial',
            fontSize: 20,
            fill: '#000000',
            objectType: 'text',
            editable: true,
            selectable: true,
            hasControls: true,
            hasBorders: true
        });
        
        // Add to canvas
        appState.canvas.add(text);
        
        // Add to objects array
        appState.objects.push(text);
        
        // Select the new object
        appState.canvas.setActiveObject(text);
        appState.selectedObject = text;
        
        // Update properties panel
        updatePropertiesPanel();
        
        // Update layers panel
        updateLayers();
        
        // Save state for undo/redo
        saveState();
        
        // Switch back to select tool
        document.querySelector('[data-tool="select"]').click();
        appState.currentTool = 'select';
        activateTool('select');
        
        // Enter editing mode immediately
        text.enterEditing();
        text.selectAll();
    });
} 