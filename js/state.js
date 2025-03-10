/**
 * Application State
 * 
 * Manages the global state of the application.
 */

window.appState = {
    // Canvas state
    canvas: null,
    webglEnabled: false,
    zoom: 1,
    canvasOffset: { x: 0, y: 0 },
    
    // Tool state
    currentTool: 'select',
    isPanning: false,
    isSpacePressed: false,
    
    // Selection state
    selectedObject: null,
    
    // Object management
    objects: [],
    layers: [],
    
    // History
    history: [],
    historyIndex: -1,
    
    // Mouse tracking
    lastX: 0,
    lastY: 0,
    
    // Performance metrics
    fps: 0,
    renderTime: 0
}; 