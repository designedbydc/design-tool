/**
 * Ellipse Tool
 * 
 * Tool for drawing ellipses and circles in the scene.
 * Supports drawing from center with shift for perfect circles.
 */

class EllipseTool extends Tool {
    constructor(app) {
        super(app);
        this.preview = null;
        this.center = null;
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
        
        // Store center point
        this.center = { ...pos };
        
        // Create preview ellipse
        this.preview = new SceneNode('ellipse', {
            x: pos.x,
            y: pos.y,
            radiusX: 0,
            radiusY: 0,
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
        
        if (!this.dragging || !this.preview || !this.center) return;
        
        const pos = this.getViewportCoordinates(event.clientX, event.clientY);
        
        // Calculate radii
        let radiusX = Math.abs(pos.x - this.center.x);
        let radiusY = Math.abs(pos.y - this.center.y);
        
        // Hold shift for circle
        if (event.shiftKey) {
            const radius = Math.max(radiusX, radiusY);
            radiusX = radius;
            radiusY = radius;
        }
        
        // Update preview
        this.preview.x = this.center.x;
        this.preview.y = this.center.y;
        this.preview.radiusX = radiusX;
        this.preview.radiusY = radiusY;
        
        // Snap if enabled
        if (this.isSnappingEnabled()) {
            const snapped = this.snapToGrid(this.preview.x, this.preview.y);
            this.preview.x = snapped.x;
            this.preview.y = snapped.y;
            
            this.preview.radiusX = Math.round(this.preview.radiusX / this.app.state.gridSize) * this.app.state.gridSize;
            this.preview.radiusY = Math.round(this.preview.radiusY / this.app.state.gridSize) * this.app.state.gridSize;
        }
    }
    
    /**
     * Handle mouse up event
     */
    handleMouseUp(event) {
        if (!this.dragging || !this.preview) return;
        
        // Only create if has size
        if (this.preview.radiusX > 0 && this.preview.radiusY > 0) {
            // Create final ellipse
            const ellipse = new SceneNode('ellipse', {
                x: this.preview.x,
                y: this.preview.y,
                radiusX: this.preview.radiusX,
                radiusY: this.preview.radiusY,
                fill: this.preview.fill,
                stroke: this.preview.stroke,
                strokeWidth: this.preview.strokeWidth,
                opacity: this.preview.opacity
            });
            
            // Remove preview and add final
            this.app.scene.removeNode(this.preview);
            this.app.scene.addNode(ellipse);
            
            // Select new ellipse
            this.app.selection.selectNode(ellipse);
            
            // Add to history
            this.app.addToHistory();
        } else {
            // Remove zero-size preview
            this.app.scene.removeNode(this.preview);
        }
        
        this.preview = null;
        this.center = null;
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
            this.center = null;
            this.dragging = false;
        }
    }
}

// Export the EllipseTool class
window.EllipseTool = EllipseTool; 