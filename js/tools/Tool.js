/**
 * Base Tool Class
 * 
 * Abstract base class for all tools in the application.
 * Provides common functionality and interface that all tools must implement.
 */

class Tool {
    constructor(app) {
        this.app = app;
        this.active = false;
        this.dragging = false;
        this.startX = 0;
        this.startY = 0;
        this.lastX = 0;
        this.lastY = 0;
    }
    
    /**
     * Activate the tool
     */
    activate() {
        this.active = true;
        document.body.style.cursor = this.getCursor();
    }
    
    /**
     * Deactivate the tool
     */
    deactivate() {
        this.active = false;
        this.dragging = false;
        document.body.style.cursor = 'default';
    }
    
    /**
     * Get the cursor for this tool
     * @returns {string} - CSS cursor value
     */
    getCursor() {
        return 'default';
    }
    
    /**
     * Handle mouse down event
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseDown(event) {
        this.dragging = true;
        this.startX = this.lastX = event.clientX;
        this.startY = this.lastY = event.clientY;
    }
    
    /**
     * Handle mouse move event
     * @param {MouseEvent} event - Mouse event
     * @param {number} dx - X movement delta
     * @param {number} dy - Y movement delta
     */
    handleMouseMove(event, dx, dy) {
        this.lastX = event.clientX;
        this.lastY = event.clientY;
    }
    
    /**
     * Handle mouse up event
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseUp(event) {
        this.dragging = false;
    }
    
    /**
     * Handle key down event
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event) {
        // Base implementation does nothing
    }
    
    /**
     * Get the viewport coordinates from screen coordinates
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {Object} - Viewport coordinates
     */
    getViewportCoordinates(screenX, screenY) {
        const rect = this.app.engine.canvas.getBoundingClientRect();
        const x = (screenX - rect.left - this.app.engine.viewport.x) / this.app.state.zoom;
        const y = (screenY - rect.top - this.app.engine.viewport.y) / this.app.state.zoom;
        return { x, y };
    }
    
    /**
     * Get the screen coordinates from viewport coordinates
     * @param {number} viewportX - Viewport X coordinate
     * @param {number} viewportY - Viewport Y coordinate
     * @returns {Object} - Screen coordinates
     */
    getScreenCoordinates(viewportX, viewportY) {
        const rect = this.app.engine.canvas.getBoundingClientRect();
        const x = viewportX * this.app.state.zoom + this.app.engine.viewport.x + rect.left;
        const y = viewportY * this.app.state.zoom + this.app.engine.viewport.y + rect.top;
        return { x, y };
    }
    
    /**
     * Snap a point to the grid
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object} - Snapped coordinates
     */
    snapToGrid(x, y) {
        const gridSize = this.app.state.gridSize || 1;
        return {
            x: Math.round(x / gridSize) * gridSize,
            y: Math.round(y / gridSize) * gridSize
        };
    }
    
    /**
     * Check if snapping is enabled
     * @returns {boolean} - Whether snapping is enabled
     */
    isSnappingEnabled() {
        return this.app.state.snapToGrid && !this.app.state.snapDisabled;
    }
}

// Export the Tool class
window.Tool = Tool; 