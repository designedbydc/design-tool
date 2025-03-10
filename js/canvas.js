/**
 * Canvas Module
 * 
 * Handles the initialization and management of the canvas element.
 * Uses Fabric.js for canvas manipulation with WebGL optimization for performance.
 */

// Initialize the canvas
function initCanvas() {
    const canvasElement = document.getElementById('canvas');
    
    // Create a Fabric.js canvas instance
    appState.canvas = new fabric.Canvas('canvas', {
        width: window.innerWidth - 300, // Adjust for sidebars
        height: window.innerHeight - 100, // Adjust for menu and status bar
        selection: true, // Allow selection of multiple objects
        preserveObjectStacking: true // Maintain object stacking order
    });
    
    // Set default object properties for all new objects
    fabric.Object.prototype.set({
        hasControls: true,
        hasBorders: true,
        selectable: true
    });
    
    // Initialize WebGL renderer
    if (window.webglRenderer) {
        appState.webglEnabled = window.webglRenderer.init(canvasElement);
        console.log("WebGL Renderer initialized:", appState.webglEnabled);
        
        // Create main layer for WebGL rendering
        if (appState.webglEnabled) {
            window.webglRenderer.createLayer('main', window.innerWidth - 300, window.innerHeight - 100);
            window.webglRenderer.setCurrentLayer('main');
        }
    }
    
    // Resize canvas on window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Set up event listeners for canvas interactions
    setupCanvasEvents();
    
    // Initialize with a center offset
    appState.canvasOffset.x = (window.innerWidth - 300) / 2;
    appState.canvasOffset.y = (window.innerHeight - 100) / 2;
    
    // Apply initial transform
    updateCanvas();
    
    // Save initial state
    saveState();
}

// Resize canvas when window is resized
function resizeCanvas() {
    const newWidth = window.innerWidth - 300;
    const newHeight = window.innerHeight - 100;
    
    appState.canvas.setWidth(newWidth);
    appState.canvas.setHeight(newHeight);
    
    // Update WebGL renderer dimensions
    if (appState.webglEnabled) {
        // Recreate main layer with new dimensions
        window.webglRenderer.createLayer('main', newWidth, newHeight);
        window.webglRenderer.setCurrentLayer('main');
    }
    
    appState.canvas.renderAll();
}

// Set up event listeners for canvas interactions
function setupCanvasEvents() {
    // Object selection
    appState.canvas.on('selection:created', handleObjectSelection);
    appState.canvas.on('selection:updated', handleObjectSelection);
    appState.canvas.on('selection:cleared', handleSelectionCleared);
    
    // Object modification
    appState.canvas.on('object:modified', handleObjectModified);
    
    // Mouse events for panning
    appState.canvas.on('mouse:down', handleMouseDown);
    appState.canvas.on('mouse:move', handleMouseMove);
    appState.canvas.on('mouse:up', handleMouseUp);
    
    // Mouse wheel for zooming
    appState.canvas.on('mouse:wheel', handleMouseWheel);
    
    // Track mouse coordinates for status bar
    appState.canvas.on('mouse:move', (e) => {
        const pointer = e.pointer;
        updateStatusBar(pointer.x, pointer.y);
    });

    // Set up keyboard events
    setupKeyboardEvents();
}

// Handle object selection
function handleObjectSelection(e) {
    const selectedObject = e.selected[0];
    appState.selectedObject = selectedObject;
    
    // Ensure the selected object has controls enabled
    if (selectedObject) {
        selectedObject.set({
            hasControls: true,
            hasBorders: true,
            selectable: true
        });
        appState.canvas.renderAll();
    }
    
    // Update properties panel with selected object properties
    updatePropertiesPanel();
}

// Handle selection cleared
function handleSelectionCleared() {
    appState.selectedObject = null;
    
    // Reset properties panel
    updatePropertiesPanel();
}

// Handle object modified
function handleObjectModified() {
    // Save state for undo/redo
    saveState();
    
    // Update properties panel
    updatePropertiesPanel();
}

// Handle mouse down event
function handleMouseDown(e) {
    // Check if space key is pressed or middle mouse button for panning
    if (appState.isSpacePressed || e.e.which === 2) {
        appState.isPanning = true;
        appState.canvas.selection = false;
        appState.lastX = e.e.clientX;
        appState.lastY = e.e.clientY;
        appState.canvas.defaultCursor = 'grabbing';
    } else {
        appState.isPanning = false;
        appState.canvas.selection = true;
    }
}

// Handle mouse move event
function handleMouseMove(e) {
    if (appState.isPanning) {
        // Calculate how much the mouse has moved
        const deltaX = e.e.clientX - appState.lastX;
        const deltaY = e.e.clientY - appState.lastY;
        
        // Update the last position
        appState.lastX = e.e.clientX;
        appState.lastY = e.e.clientY;
        
        // Update canvas offset with smooth damping
        appState.canvasOffset.x += deltaX;
        appState.canvasOffset.y += deltaY;
        
        // Apply the new transform
        updateCanvas();
        
        // Prevent default to avoid text selection
        e.e.preventDefault();
        return false;
    }
}

// Handle mouse up event
function handleMouseUp() {
    appState.isPanning = false;
    appState.canvas.selection = true;
    appState.canvas.defaultCursor = 'default';
}

// Handle mouse wheel event for zooming
function handleMouseWheel(e) {
    const delta = e.e.deltaY;
    let zoom = appState.zoom;
    
    // Zoom in or out depending on wheel direction
    zoom = delta > 0 ? zoom * 0.9 : zoom * 1.1;
    
    // Limit zoom level
    if (zoom > 0.1 && zoom < 5) {
        // Calculate zoom point
        const point = new fabric.Point(e.pointer.x, e.pointer.y);
        
        // Set the zoom level
        appState.zoom = zoom;
        
        // Apply the new transform
        updateCanvas();
        
        // Prevent default behavior (page scrolling)
        e.e.preventDefault();
        e.e.stopPropagation();
    }
}

// Set up keyboard events for panning
function setupKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !appState.isSpacePressed) {
            appState.isSpacePressed = true;
            appState.canvas.defaultCursor = 'grab';
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            appState.isSpacePressed = false;
            if (!appState.isPanning) {
                appState.canvas.defaultCursor = 'default';
            }
        }
    });
}

// Create a rectangle on the canvas
function createRectangle(left, top, width, height) {
    // Use WebGL for rendering if available and appropriate
    if (appState.webglEnabled && width > 50 && height > 50) {
        // Create a fabric.js object for selection and manipulation
        const rect = new fabric.Rect({
            left: left,
            top: top,
            width: width,
            height: height,
            fill: '#f0f0f0',
            stroke: '#000000',
            strokeWidth: 1,
            rx: 0,
            ry: 0,
            objectType: 'rectangle',
            webglRendered: true // Flag for WebGL rendering
        });
        
        // Custom render method that uses WebGL
        rect.render = function(ctx) {
            // Only use the original render for non-WebGL contexts
            if (!appState.webglEnabled || ctx !== appState.canvas.getContext()) {
                fabric.Rect.prototype.render.call(this, ctx);
                return;
            }
            
            // Use WebGL renderer for this object
            window.webglRenderer.drawRectangle(
                this.left, 
                this.top, 
                this.width, 
                this.height, 
                this.fill,
                this.angle
            );
        };
        
        addObjectToCanvas(rect);
        return rect;
    } else {
        // Fall back to standard Fabric.js rendering for smaller objects
        const rect = new fabric.Rect({
            left: left,
            top: top,
            width: width,
            height: height,
            fill: '#f0f0f0',
            stroke: '#000000',
            strokeWidth: 1,
            rx: 0,
            ry: 0,
            objectType: 'rectangle'
        });
        
        addObjectToCanvas(rect);
        return rect;
    }
}

// Create a circle on the canvas
function createCircle(left, top, radius) {
    // Use WebGL for rendering if available and appropriate
    if (appState.webglEnabled && radius > 25) {
        // Create a fabric.js object for selection and manipulation
        const circle = new fabric.Circle({
            left: left,
            top: top,
            radius: radius,
            fill: '#f0f0f0',
            stroke: '#000000',
            strokeWidth: 1,
            objectType: 'circle',
            webglRendered: true // Flag for WebGL rendering
        });
        
        // Custom render method that uses WebGL
        circle.render = function(ctx) {
            // Only use the original render for non-WebGL contexts
            if (!appState.webglEnabled || ctx !== appState.canvas.getContext()) {
                fabric.Circle.prototype.render.call(this, ctx);
                return;
            }
            
            // Use WebGL renderer for this object
            window.webglRenderer.drawCircle(
                this.left, 
                this.top, 
                this.radius, 
                this.fill
            );
        };
        
        addObjectToCanvas(circle);
        return circle;
    } else {
        // Fall back to standard Fabric.js rendering for smaller objects
        const circle = new fabric.Circle({
            left: left,
            top: top,
            radius: radius,
            fill: '#f0f0f0',
            stroke: '#000000',
            strokeWidth: 1,
            objectType: 'circle'
        });
        
        addObjectToCanvas(circle);
        return circle;
    }
}

// Create a line on the canvas
function createLine(points) {
    const line = new fabric.Line(points, {
        stroke: '#000000',
        strokeWidth: 2,
        selectable: true,
        objectType: 'line'
    });
    
    addObjectToCanvas(line);
    return line;
}

// Create text on the canvas
function createText(left, top, text) {
    const textObj = new fabric.IText(text || 'Text', {
        left: left,
        top: top,
        fontFamily: 'Arial',
        fontSize: 20,
        fill: '#000000',
        objectType: 'text'
    });
    
    addObjectToCanvas(textObj);
    return textObj;
}

// Add object to canvas and track it
function addObjectToCanvas(obj) {
    appState.canvas.add(obj);
    appState.objects.push(obj);
    
    // Update layers panel
    updateLayersPanel();
    
    // Save state for undo/redo
    saveState();
}

// Update canvas transform based on current state
function updateCanvas() {
    // Measure render time if debug mode is enabled
    if (appState.debugMode) {
        measureRenderTime(() => {
            // Apply zoom and pan transformations
            appState.canvas.setZoom(appState.zoom);
            appState.canvas.absolutePan(new fabric.Point(
                -appState.canvasOffset.x * appState.zoom,
                -appState.canvasOffset.y * appState.zoom
            ));
            
            // Batch render WebGL objects if needed
            if (appState.webglEnabled) {
                batchRenderWebGLObjects();
            }
        });
    } else {
        // Apply zoom and pan transformations
        appState.canvas.setZoom(appState.zoom);
        appState.canvas.absolutePan(new fabric.Point(
            -appState.canvasOffset.x * appState.zoom,
            -appState.canvasOffset.y * appState.zoom
        ));
        
        // Batch render WebGL objects if needed
        if (appState.webglEnabled) {
            batchRenderWebGLObjects();
        }
    }
    
    // Update zoom level display
    document.getElementById('zoom-level').textContent = Math.round(appState.zoom * 100) + '%';
}

// Batch render all WebGL-enabled objects for performance
function batchRenderWebGLObjects() {
    if (!appState.webglEnabled) return;
    
    // Collect all rectangle objects for batch rendering
    const rectangles = appState.objects
        .filter(obj => obj.webglRendered && obj.objectType === 'rectangle')
        .map(obj => ({
            x: obj.left,
            y: obj.top,
            width: obj.width,
            height: obj.height,
            color: obj.fill,
            rotation: obj.angle
        }));
    
    // Batch render rectangles if there are any
    if (rectangles.length > 0) {
        window.webglRenderer.batchRenderRectangles(rectangles);
    }
}

// Update status bar with current coordinates
function updateStatusBar(x, y) {
    if (x !== undefined && y !== undefined) {
        // Convert canvas coordinates to design coordinates
        const designX = Math.round((x - appState.canvasOffset.x) / appState.zoom);
        const designY = Math.round((y - appState.canvasOffset.y) / appState.zoom);
        
        document.querySelector('.coordinates').textContent = `X: ${designX} Y: ${designY}`;
    }
}

// Zoom in function
function zoomIn() {
    if (appState.zoom < 5) {
        appState.zoom *= 1.2;
        updateCanvas();
    }
}

// Zoom out function
function zoomOut() {
    if (appState.zoom > 0.1) {
        appState.zoom *= 0.8;
        updateCanvas();
    }
}

// Fit canvas to screen
function fitToScreen() {
    // Reset zoom and pan
    appState.zoom = 1;
    appState.canvasOffset.x = (window.innerWidth - 300) / 2;
    appState.canvasOffset.y = (window.innerHeight - 100) / 2;
    
    updateCanvas();
}

// Clean up resources when unloading
window.addEventListener('beforeunload', () => {
    if (appState.webglEnabled) {
        window.webglRenderer.cleanup();
    }
}); 