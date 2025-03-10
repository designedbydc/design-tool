/**
 * Select Tool
 * 
 * Tool for selecting and manipulating objects in the scene.
 * Handles selection box, dragging, resizing, and rotating objects.
 */

class SelectTool extends Tool {
    constructor(app) {
        super(app);
        
        this.mode = 'none'; // none, selecting, dragging, resizing, rotating
        this.selectionBox = null;
        this.resizeHandle = null;
        this.rotateHandle = null;
        this.transformStart = null;
        
        // Bind methods
        this.onSelectionChanged = this.onSelectionChanged.bind(this);
    }
    
    /**
     * Activate the tool
     */
    activate() {
        super.activate();
        this.app.selection.on('changed', this.onSelectionChanged);
    }
    
    /**
     * Deactivate the tool
     */
    deactivate() {
        super.deactivate();
        this.app.selection.off('changed', this.onSelectionChanged);
        this.clearSelectionBox();
    }
    
    /**
     * Get the cursor for this tool
     */
    getCursor() {
        switch (this.mode) {
            case 'dragging':
                return 'move';
            case 'resizing':
                return this.getResizeCursor();
            case 'rotating':
                return 'crosshair';
            default:
                return 'default';
        }
    }
    
    /**
     * Handle mouse down event
     */
    handleMouseDown(event) {
        super.handleMouseDown(event);
        
        const pos = this.getViewportCoordinates(event.clientX, event.clientY);
        
        // Check for handle interaction
        if (this.checkHandles(pos.x, pos.y)) {
            return;
        }
        
        // Check for object selection
        const node = this.app.scene.queryPoint(pos.x, pos.y);
        
        if (node) {
            if (event.shiftKey) {
                // Toggle selection
                if (this.app.selection.isSelected(node)) {
                    this.app.selection.deselectNode(node);
                } else {
                    this.app.selection.addToSelection(node);
                }
            } else if (!this.app.selection.isSelected(node)) {
                // Select single node
                this.app.selection.selectNode(node);
            }
            
            // Start dragging
            this.startDragging(pos.x, pos.y);
        } else {
            // Start selection box
            if (!event.shiftKey) {
                this.app.selection.clearSelection();
            }
            this.startSelectionBox(pos.x, pos.y);
        }
    }
    
    /**
     * Handle mouse move event
     */
    handleMouseMove(event, dx, dy) {
        super.handleMouseMove(event, dx, dy);
        
        if (!this.dragging) return;
        
        const pos = this.getViewportCoordinates(event.clientX, event.clientY);
        
        switch (this.mode) {
            case 'selecting':
                this.updateSelectionBox(pos.x, pos.y);
                break;
                
            case 'dragging':
                this.updateDragging(pos.x, pos.y);
                break;
                
            case 'resizing':
                this.updateResizing(pos.x, pos.y);
                break;
                
            case 'rotating':
                this.updateRotating(pos.x, pos.y);
                break;
        }
    }
    
    /**
     * Handle mouse up event
     */
    handleMouseUp(event) {
        if (!this.dragging) return;
        
        const pos = this.getViewportCoordinates(event.clientX, event.clientY);
        
        switch (this.mode) {
            case 'selecting':
                this.finishSelectionBox(pos.x, pos.y);
                break;
                
            case 'dragging':
                this.finishDragging();
                break;
                
            case 'resizing':
                this.finishResizing();
                break;
                
            case 'rotating':
                this.finishRotating();
                break;
        }
        
        this.mode = 'none';
        super.handleMouseUp(event);
    }
    
    /**
     * Handle selection box
     */
    startSelectionBox(x, y) {
        this.mode = 'selecting';
        this.selectionBox = {
            x1: x,
            y1: y,
            x2: x,
            y2: y
        };
    }
    
    updateSelectionBox(x, y) {
        if (!this.selectionBox) return;
        
        this.selectionBox.x2 = x;
        this.selectionBox.y2 = y;
        
        // Convert to bounds
        const bounds = {
            minX: Math.min(this.selectionBox.x1, this.selectionBox.x2),
            minY: Math.min(this.selectionBox.y1, this.selectionBox.y2),
            maxX: Math.max(this.selectionBox.x1, this.selectionBox.x2),
            maxY: Math.max(this.selectionBox.y1, this.selectionBox.y2)
        };
        
        // Query nodes in bounds
        const nodes = this.app.scene.queryRegion(bounds);
        
        // Update selection
        this.app.selection.selectNodes(nodes, true);
    }
    
    finishSelectionBox() {
        this.selectionBox = null;
    }
    
    /**
     * Handle dragging
     */
    startDragging(x, y) {
        this.mode = 'dragging';
        this.transformStart = {
            x,
            y,
            nodes: this.app.selection.getSelectedNodes().map(node => ({
                node,
                startX: node.x,
                startY: node.y
            }))
        };
    }
    
    updateDragging(x, y) {
        if (!this.transformStart) return;
        
        const dx = x - this.transformStart.x;
        const dy = y - this.transformStart.y;
        
        // Update node positions
        for (const { node, startX, startY } of this.transformStart.nodes) {
            node.x = startX + dx;
            node.y = startY + dy;
            
            if (this.isSnappingEnabled()) {
                const snapped = this.snapToGrid(node.x, node.y);
                node.x = snapped.x;
                node.y = snapped.y;
            }
        }
    }
    
    finishDragging() {
        if (this.transformStart) {
            this.app.addToHistory();
            this.transformStart = null;
        }
    }
    
    /**
     * Handle resizing
     */
    startResizing(handle, x, y) {
        this.mode = 'resizing';
        this.resizeHandle = handle;
        this.transformStart = {
            x,
            y,
            nodes: this.app.selection.getSelectedNodes().map(node => ({
                node,
                startBounds: node.getBounds()
            }))
        };
    }
    
    updateResizing(x, y) {
        if (!this.transformStart) return;
        
        const dx = x - this.transformStart.x;
        const dy = y - this.transformStart.y;
        
        for (const { node, startBounds } of this.transformStart.nodes) {
            const bounds = { ...startBounds };
            
            // Update bounds based on handle
            switch (this.resizeHandle) {
                case 'n':
                    bounds.minY = startBounds.minY + dy;
                    break;
                case 's':
                    bounds.maxY = startBounds.maxY + dy;
                    break;
                case 'e':
                    bounds.maxX = startBounds.maxX + dx;
                    break;
                case 'w':
                    bounds.minX = startBounds.minX + dx;
                    break;
                case 'nw':
                    bounds.minX = startBounds.minX + dx;
                    bounds.minY = startBounds.minY + dy;
                    break;
                case 'ne':
                    bounds.maxX = startBounds.maxX + dx;
                    bounds.minY = startBounds.minY + dy;
                    break;
                case 'sw':
                    bounds.minX = startBounds.minX + dx;
                    bounds.maxY = startBounds.maxY + dy;
                    break;
                case 'se':
                    bounds.maxX = startBounds.maxX + dx;
                    bounds.maxY = startBounds.maxY + dy;
                    break;
            }
            
            // Apply new bounds
            node.setBounds(bounds);
        }
    }
    
    finishResizing() {
        if (this.transformStart) {
            this.app.addToHistory();
            this.transformStart = null;
        }
        this.resizeHandle = null;
    }
    
    /**
     * Handle rotating
     */
    startRotating(x, y) {
        this.mode = 'rotating';
        
        const bounds = this.app.selection.getBounds();
        const center = {
            x: (bounds.minX + bounds.maxX) / 2,
            y: (bounds.minY + bounds.maxY) / 2
        };
        
        this.transformStart = {
            x,
            y,
            center,
            startAngle: Math.atan2(y - center.y, x - center.x),
            nodes: this.app.selection.getSelectedNodes().map(node => ({
                node,
                startRotation: node.rotation || 0
            }))
        };
    }
    
    updateRotating(x, y) {
        if (!this.transformStart) return;
        
        const currentAngle = Math.atan2(
            y - this.transformStart.center.y,
            x - this.transformStart.center.x
        );
        
        const deltaAngle = currentAngle - this.transformStart.startAngle;
        
        for (const { node, startRotation } of this.transformStart.nodes) {
            node.rotation = startRotation + deltaAngle;
            
            if (this.isSnappingEnabled()) {
                // Snap to common angles (0°, 45°, 90°, etc.)
                const snap = Math.PI / 4; // 45 degrees
                node.rotation = Math.round(node.rotation / snap) * snap;
            }
        }
    }
    
    finishRotating() {
        if (this.transformStart) {
            this.app.addToHistory();
            this.transformStart = null;
        }
    }
    
    /**
     * Check if a point hits any transform handles
     */
    checkHandles(x, y) {
        if (!this.app.selection.hasSelection()) return false;
        
        const bounds = this.app.selection.getBounds();
        const handles = this.getHandlePositions(bounds);
        
        // Check resize handles
        for (const [handle, pos] of Object.entries(handles.resize)) {
            if (this.pointInHandle(x, y, pos)) {
                this.startResizing(handle, x, y);
                return true;
            }
        }
        
        // Check rotate handle
        if (this.pointInHandle(x, y, handles.rotate)) {
            this.startRotating(x, y);
            return true;
        }
        
        return false;
    }
    
    /**
     * Get positions of all transform handles
     */
    getHandlePositions(bounds) {
        const { minX, minY, maxX, maxY } = bounds;
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;
        
        return {
            resize: {
                'nw': { x: minX, y: minY },
                'n': { x: midX, y: minY },
                'ne': { x: maxX, y: minY },
                'e': { x: maxX, y: midY },
                'se': { x: maxX, y: maxY },
                's': { x: midX, y: maxY },
                'sw': { x: minX, y: maxY },
                'w': { x: minX, y: midY }
            },
            rotate: { x: midX, y: minY - 20 }
        };
    }
    
    /**
     * Check if a point is within a handle's hit area
     */
    pointInHandle(x, y, handle) {
        const threshold = 5 / this.app.state.zoom;
        return Math.abs(x - handle.x) <= threshold &&
               Math.abs(y - handle.y) <= threshold;
    }
    
    /**
     * Get the appropriate cursor for resizing
     */
    getResizeCursor() {
        if (!this.resizeHandle) return 'default';
        
        const cursors = {
            'n': 'ns-resize',
            's': 'ns-resize',
            'e': 'ew-resize',
            'w': 'ew-resize',
            'nw': 'nw-resize',
            'ne': 'ne-resize',
            'sw': 'sw-resize',
            'se': 'se-resize'
        };
        
        return cursors[this.resizeHandle] || 'default';
    }
    
    /**
     * Handle selection changes
     */
    onSelectionChanged() {
        // Update cursor
        document.body.style.cursor = this.getCursor();
    }
}

// Export the SelectTool class
window.SelectTool = SelectTool; 