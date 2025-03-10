/**
 * Hand Tool
 * 
 * Tool for panning the canvas view.
 * Supports smooth panning with momentum.
 */

class HandTool extends Tool {
    constructor(app) {
        super(app);
        this.momentum = { x: 0, y: 0 };
        this.lastTime = 0;
        this.animationFrame = null;
    }
    
    /**
     * Get the cursor for this tool
     */
    getCursor() {
        return this.dragging ? 'grabbing' : 'grab';
    }
    
    /**
     * Handle mouse down event
     */
    handleMouseDown(event) {
        super.handleMouseDown(event);
        document.body.style.cursor = 'grabbing';
        
        // Stop momentum
        this.stopMomentum();
    }
    
    /**
     * Handle mouse move event
     */
    handleMouseMove(event, dx, dy) {
        super.handleMouseMove(event, dx, dy);
        
        if (!this.dragging) return;
        
        // Pan the viewport
        this.app.pan(dx, dy);
        
        // Update momentum
        const now = performance.now();
        const dt = now - this.lastTime;
        
        if (dt > 0) {
            this.momentum.x = dx / dt * 16; // Scale to roughly 60fps
            this.momentum.y = dy / dt * 16;
        }
        
        this.lastTime = now;
    }
    
    /**
     * Handle mouse up event
     */
    handleMouseUp(event) {
        if (!this.dragging) return;
        
        document.body.style.cursor = 'grab';
        
        // Start momentum animation if moving fast enough
        const speed = Math.sqrt(
            this.momentum.x * this.momentum.x +
            this.momentum.y * this.momentum.y
        );
        
        if (speed > 1) {
            this.startMomentum();
        }
        
        super.handleMouseUp(event);
    }
    
    /**
     * Start momentum animation
     */
    startMomentum() {
        const friction = 0.95;
        
        const animate = () => {
            // Apply momentum
            if (Math.abs(this.momentum.x) > 0.1 || Math.abs(this.momentum.y) > 0.1) {
                this.app.pan(this.momentum.x, this.momentum.y);
                
                // Apply friction
                this.momentum.x *= friction;
                this.momentum.y *= friction;
                
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                this.stopMomentum();
            }
        };
        
        this.animationFrame = requestAnimationFrame(animate);
    }
    
    /**
     * Stop momentum animation
     */
    stopMomentum() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        this.momentum.x = 0;
        this.momentum.y = 0;
    }
    
    /**
     * Deactivate tool
     */
    deactivate() {
        this.stopMomentum();
        super.deactivate();
    }
}

// Export the HandTool class
window.HandTool = HandTool; 