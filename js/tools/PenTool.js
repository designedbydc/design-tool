/**
 * Pen Tool
 * 
 * Tool for drawing paths with Bezier curves.
 * Supports creating straight lines and curves with control points.
 */

class PenTool extends Tool {
    constructor(app) {
        super(app);
        this.path = null;
        this.points = [];
        this.currentPoint = null;
        this.controlPoint1 = null;
        this.controlPoint2 = null;
        this.previewLine = null;
        this.isDrawing = false;
    }
    
    /**
     * Get the cursor for this tool
     */
    getCursor() {
        return this.isDrawing ? 'crosshair' : 'pen';
    }
    
    /**
     * Handle mouse down event
     */
    handleMouseDown(event) {
        super.handleMouseDown(event);
        
        const pos = this.getViewportCoordinates(event.clientX, event.clientY);
        
        if (!this.isDrawing) {
            // Start new path
            this.startPath(pos);
        } else {
            // Add point to path
            this.addPoint(pos, event);
        }
    }
    
    /**
     * Handle mouse move event
     */
    handleMouseMove(event, dx, dy) {
        super.handleMouseMove(event, dx, dy);
        
        if (!this.isDrawing) return;
        
        const pos = this.getViewportCoordinates(event.clientX, event.clientY);
        
        // Update control points if dragging
        if (this.dragging && this.currentPoint) {
            this.updateControlPoints(pos, event);
        }
        
        // Update preview line
        this.updatePreview(pos);
    }
    
    /**
     * Handle mouse up event
     */
    handleMouseUp(event) {
        if (this.dragging) {
            const pos = this.getViewportCoordinates(event.clientX, event.clientY);
            
            if (this.currentPoint) {
                // Finalize control points
                this.finalizeControlPoints(pos, event);
            }
        }
        
        super.handleMouseUp(event);
    }
    
    /**
     * Handle double click event
     */
    handleDoubleClick(event) {
        if (this.isDrawing) {
            this.finishPath();
        }
    }
    
    /**
     * Handle key down event
     */
    handleKeyDown(event) {
        if (event.key === 'Escape') {
            if (this.isDrawing) {
                if (this.points.length > 1) {
                    this.finishPath();
                } else {
                    this.cancelPath();
                }
            }
        } else if (event.key === 'Enter') {
            if (this.isDrawing) {
                this.finishPath();
            }
        }
    }
    
    /**
     * Start a new path
     */
    startPath(pos) {
        // Create new path
        this.path = new SceneNode('path', {
            points: [],
            fill: 'none',
            stroke: this.app.state.strokeColor || '#000000',
            strokeWidth: this.app.state.strokeWidth || 1
        });
        
        // Add first point
        this.addPoint(pos);
        
        // Add to scene
        this.app.scene.addNode(this.path);
        
        this.isDrawing = true;
    }
    
    /**
     * Add a point to the path
     */
    addPoint(pos, event = null) {
        const point = {
            x: pos.x,
            y: pos.y,
            controlPoint1: null,
            controlPoint2: null
        };
        
        if (this.isSnappingEnabled()) {
            const snapped = this.snapToGrid(point.x, point.y);
            point.x = snapped.x;
            point.y = snapped.y;
        }
        
        this.points.push(point);
        this.currentPoint = point;
        
        // Update path data
        this.updatePathData();
        
        // Start control point drag if alt key is pressed
        if (event && event.altKey) {
            this.dragging = true;
            this.controlPoint1 = { x: pos.x, y: pos.y };
            this.controlPoint2 = { x: pos.x, y: pos.y };
        }
    }
    
    /**
     * Update control points during drag
     */
    updateControlPoints(pos, event) {
        if (!this.controlPoint1 || !this.controlPoint2) return;
        
        // Update control point positions
        this.controlPoint1.x = this.currentPoint.x - (pos.x - this.currentPoint.x);
        this.controlPoint1.y = this.currentPoint.y - (pos.y - this.currentPoint.y);
        this.controlPoint2.x = pos.x;
        this.controlPoint2.y = pos.y;
        
        // Hold shift for 45-degree angles
        if (event.shiftKey) {
            const angle1 = Math.atan2(
                this.controlPoint1.y - this.currentPoint.y,
                this.controlPoint1.x - this.currentPoint.x
            );
            const angle2 = Math.atan2(
                this.controlPoint2.y - this.currentPoint.y,
                this.controlPoint2.x - this.currentPoint.x
            );
            
            const snapAngle = Math.PI / 4; // 45 degrees
            const snappedAngle1 = Math.round(angle1 / snapAngle) * snapAngle;
            const snappedAngle2 = Math.round(angle2 / snapAngle) * snapAngle;
            
            const distance1 = Math.sqrt(
                Math.pow(this.controlPoint1.x - this.currentPoint.x, 2) +
                Math.pow(this.controlPoint1.y - this.currentPoint.y, 2)
            );
            const distance2 = Math.sqrt(
                Math.pow(this.controlPoint2.x - this.currentPoint.x, 2) +
                Math.pow(this.controlPoint2.y - this.currentPoint.y, 2)
            );
            
            this.controlPoint1.x = this.currentPoint.x + Math.cos(snappedAngle1) * distance1;
            this.controlPoint1.y = this.currentPoint.y + Math.sin(snappedAngle1) * distance1;
            this.controlPoint2.x = this.currentPoint.x + Math.cos(snappedAngle2) * distance2;
            this.controlPoint2.y = this.currentPoint.y + Math.sin(snappedAngle2) * distance2;
        }
        
        // Update path data
        this.updatePathData();
    }
    
    /**
     * Finalize control points after drag
     */
    finalizeControlPoints(pos, event) {
        if (!this.controlPoint1 || !this.controlPoint2) return;
        
        this.currentPoint.controlPoint1 = { ...this.controlPoint1 };
        this.currentPoint.controlPoint2 = { ...this.controlPoint2 };
        
        this.controlPoint1 = null;
        this.controlPoint2 = null;
        
        // Update path data
        this.updatePathData();
    }
    
    /**
     * Update the preview line
     */
    updatePreview(pos) {
        if (!this.currentPoint) return;
        
        // Update preview line
        if (!this.previewLine) {
            this.previewLine = new SceneNode('line', {
                x1: this.currentPoint.x,
                y1: this.currentPoint.y,
                x2: pos.x,
                y2: pos.y,
                stroke: this.path.stroke,
                strokeWidth: 1,
                opacity: 0.5
            });
            this.app.scene.addNode(this.previewLine);
        } else {
            this.previewLine.x1 = this.currentPoint.x;
            this.previewLine.y1 = this.currentPoint.y;
            this.previewLine.x2 = pos.x;
            this.previewLine.y2 = pos.y;
        }
    }
    
    /**
     * Update the path data
     */
    updatePathData() {
        if (!this.path || this.points.length === 0) return;
        
        let data = `M ${this.points[0].x} ${this.points[0].y}`;
        
        for (let i = 1; i < this.points.length; i++) {
            const prev = this.points[i - 1];
            const curr = this.points[i];
            
            if (prev.controlPoint2 && curr.controlPoint1) {
                // Cubic bezier
                data += ` C ${prev.controlPoint2.x} ${prev.controlPoint2.y}, ${curr.controlPoint1.x} ${curr.controlPoint1.y}, ${curr.x} ${curr.y}`;
            } else if (prev.controlPoint2) {
                // Quadratic bezier from prev
                data += ` Q ${prev.controlPoint2.x} ${prev.controlPoint2.y}, ${curr.x} ${curr.y}`;
            } else if (curr.controlPoint1) {
                // Quadratic bezier to curr
                data += ` Q ${curr.controlPoint1.x} ${curr.controlPoint1.y}, ${curr.x} ${curr.y}`;
            } else {
                // Straight line
                data += ` L ${curr.x} ${curr.y}`;
            }
        }
        
        this.path.data = data;
    }
    
    /**
     * Finish the current path
     */
    finishPath() {
        if (!this.isDrawing) return;
        
        // Remove preview line
        if (this.previewLine) {
            this.app.scene.removeNode(this.previewLine);
            this.previewLine = null;
        }
        
        // Close path if near start
        const start = this.points[0];
        const last = this.points[this.points.length - 1];
        const distance = Math.sqrt(
            Math.pow(last.x - start.x, 2) +
            Math.pow(last.y - start.y, 2)
        );
        
        if (distance < 10 / this.app.state.zoom) {
            this.path.data += ' Z';
        }
        
        // Select the path
        this.app.selection.selectNode(this.path);
        
        // Add to history
        this.app.addToHistory();
        
        // Reset state
        this.path = null;
        this.points = [];
        this.currentPoint = null;
        this.isDrawing = false;
    }
    
    /**
     * Cancel the current path
     */
    cancelPath() {
        if (!this.isDrawing) return;
        
        // Remove preview line
        if (this.previewLine) {
            this.app.scene.removeNode(this.previewLine);
            this.previewLine = null;
        }
        
        // Remove path
        if (this.path) {
            this.app.scene.removeNode(this.path);
            this.path = null;
        }
        
        // Reset state
        this.points = [];
        this.currentPoint = null;
        this.isDrawing = false;
    }
}

// Export the PenTool class
window.PenTool = PenTool; 