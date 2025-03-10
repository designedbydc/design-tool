/**
 * Rectangle Tool
 * 
 * Tool for drawing rectangles in the scene.
 * Supports drawing from corner with shift for squares.
 */

class RectangleTool extends Tool {
    constructor(app) {
        super(app);
        this.preview = null;
    }
    
    /**
     * Get the cursor for this tool
     */
    getCursor() {
        return 'crosshair';
    }
    
    /**
     * Handle mouse down event
     */
    handleMouseDown(event) {
        super.handleMouseDown(event);
        
        const pos = this.getViewportCoordinates(event.clientX, event.clientY);
        
        // Create preview rectangle
        this.preview = new SceneNode('rectangle', {
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
            fill: this.app.state.fillColor || '#000000',
            stroke: this.app.state.strokeColor,
            strokeWidth: this.app.state.strokeWidth,
            opacity: this.app.state.opacity
        });
        
        // Add to scene temporarily
        this.app.scene.addNode(this.preview);
    }
    
    /**
     * Handle mouse move event
     */
    handleMouseMove(event, dx, dy) {
        super.handleMouseMove(event, dx, dy);
        
        if (!this.dragging || !this.preview) return;
        
        const pos = this.getViewportCoordinates(event.clientX, event.clientY);
        const startPos = this.getViewportCoordinates(this.startX, this.startY);
        
        let width = pos.x - startPos.x;
        let height = pos.y - startPos.y;
        
        // Hold shift for square
        if (event.shiftKey) {
            const size = Math.max(Math.abs(width), Math.abs(height));
            width = width < 0 ? -size : size;
            height = height < 0 ? -size : size;
        }
        
        // Update preview
        if (width < 0) {
            this.preview.x = startPos.x + width;
            this.preview.width = -width;
        } else {
            this.preview.x = startPos.x;
            this.preview.width = width;
        }
        
        if (height < 0) {
            this.preview.y = startPos.y + height;
            this.preview.height = -height;
        } else {
            this.preview.y = startPos.y;
            this.preview.height = height;
        }
        
        // Snap if enabled
        if (this.isSnappingEnabled()) {
            const snapped = this.snapToGrid(this.preview.x, this.preview.y);
            this.preview.x = snapped.x;
            this.preview.y = snapped.y;
            
            this.preview.width = Math.round(this.preview.width / this.app.state.gridSize) * this.app.state.gridSize;
            this.preview.height = Math.round(this.preview.height / this.app.state.gridSize) * this.app.state.gridSize;
        }
    }
    
    /**
     * Handle mouse up event
     */
    handleMouseUp(event) {
        if (!this.dragging || !this.preview) return;
        
        // Only create if has size
        if (this.preview.width > 0 && this.preview.height > 0) {
            // Create final rectangle
            const rectangle = new SceneNode('rectangle', {
                x: this.preview.x,
                y: this.preview.y,
                width: this.preview.width,
                height: this.preview.height,
                fill: this.preview.fill,
                stroke: this.preview.stroke,
                strokeWidth: this.preview.strokeWidth,
                opacity: this.preview.opacity
            });
            
            // Remove preview and add final
            this.app.scene.removeNode(this.preview);
            this.app.scene.addNode(rectangle);
            
            // Select new rectangle
            this.app.selection.selectNode(rectangle);
            
            // Add to history
            this.app.addToHistory();
        } else {
            // Remove zero-size preview
            this.app.scene.removeNode(this.preview);
        }
        
        this.preview = null;
        super.handleMouseUp(event);
    }
    
    /**
     * Handle key down event
     */
    handleKeyDown(event) {
        // Cancel on escape
        if (event.key === 'Escape' && this.preview) {
            this.app.scene.removeNode(this.preview);
            this.preview = null;
            this.dragging = false;
        }
    }
}

// Export the RectangleTool class
window.RectangleTool = RectangleTool; 