/**
 * SelectionManager Class
 * 
 * Manages selection and interaction with nodes in the scene.
 * Handles single and multiple selection, selection bounds,
 * and selection-based operations.
 */

class SelectionManager {
    constructor(scene) {
        this.scene = scene;
        
        // Selection state
        this.selectedNodes = new Set();
        this.activeNode = null;
        this.selectionBounds = new AABB();
        this.selectionTransform = new Transform();
        
        // Selection history
        this.selectionHistory = [];
        this.historyIndex = -1;
        
        // Interaction state
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragOffset = { x: 0, y: 0 };
        this.resizeHandle = null;
        this.rotationCenter = { x: 0, y: 0 };
        this.initialRotation = 0;
        
        // Selection constraints
        this.constraints = {
            snapToGrid: false,
            snapToObjects: false,
            maintainAspectRatio: false,
            gridSize: 10,
            snapThreshold: 5
        };
        
        // Event handlers
        this.events = new EventEmitter();
        
        // Initialize
        this.initialize();
    }
    
    /**
     * Initialize the selection manager
     * @private
     */
    initialize() {
        // Set up event listeners
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners
     * @private
     */
    setupEventListeners() {
        // Selection events
        this.events.on('selectionChanged', this.onSelectionChanged.bind(this));
        this.events.on('activeNodeChanged', this.onActiveNodeChanged.bind(this));
        
        // Interaction events
        this.events.on('dragStart', this.onDragStart.bind(this));
        this.events.on('dragMove', this.onDragMove.bind(this));
        this.events.on('dragEnd', this.onDragEnd.bind(this));
        
        this.events.on('resizeStart', this.onResizeStart.bind(this));
        this.events.on('resizeMove', this.onResizeMove.bind(this));
        this.events.on('resizeEnd', this.onResizeEnd.bind(this));
        
        this.events.on('rotateStart', this.onRotateStart.bind(this));
        this.events.on('rotateMove', this.onRotateMove.bind(this));
        this.events.on('rotateEnd', this.onRotateEnd.bind(this));
    }
    
    /**
     * Select a node
     * @param {SceneNode} node - Node to select
     * @param {boolean} addToSelection - Whether to add to current selection
     */
    selectNode(node, addToSelection = false) {
        if (!node || !node.selectable) return;
        
        if (!addToSelection) {
            this.clearSelection();
        }
        
        this.selectedNodes.add(node);
        this.activeNode = node;
        
        this.updateSelectionBounds();
        this.addToHistory();
        
        this.events.emit('selectionChanged', {
            selectedNodes: Array.from(this.selectedNodes),
            activeNode: this.activeNode
        });
    }
    
    /**
     * Deselect a node
     * @param {SceneNode} node - Node to deselect
     */
    deselectNode(node) {
        if (!node) return;
        
        this.selectedNodes.delete(node);
        
        if (this.activeNode === node) {
            this.activeNode = this.selectedNodes.size > 0 ?
                Array.from(this.selectedNodes)[this.selectedNodes.size - 1] :
                null;
        }
        
        this.updateSelectionBounds();
        this.addToHistory();
        
        this.events.emit('selectionChanged', {
            selectedNodes: Array.from(this.selectedNodes),
            activeNode: this.activeNode
        });
    }
    
    /**
     * Clear the selection
     */
    clearSelection() {
        if (this.selectedNodes.size === 0) return;
        
        this.selectedNodes.clear();
        this.activeNode = null;
        
        this.updateSelectionBounds();
        this.addToHistory();
        
        this.events.emit('selectionChanged', {
            selectedNodes: [],
            activeNode: null
        });
    }
    
    /**
     * Select nodes in a region
     * @param {AABB} bounds - Region to select in
     * @param {boolean} addToSelection - Whether to add to current selection
     */
    selectInRegion(bounds, addToSelection = false) {
        if (!addToSelection) {
            this.clearSelection();
        }
        
        const nodes = this.scene.queryRegion(bounds, {
            visible: true,
            selectable: true
        });
        
        for (const node of nodes) {
            this.selectedNodes.add(node);
        }
        
        if (nodes.length > 0) {
            this.activeNode = nodes[nodes.length - 1];
        }
        
        this.updateSelectionBounds();
        this.addToHistory();
        
        this.events.emit('selectionChanged', {
            selectedNodes: Array.from(this.selectedNodes),
            activeNode: this.activeNode
        });
    }
    
    /**
     * Update selection bounds
     * @private
     */
    updateSelectionBounds() {
        if (this.selectedNodes.size === 0) {
            this.selectionBounds.clear();
            this.selectionTransform.identity();
            return;
        }
        
        // Calculate combined bounds
        let first = true;
        for (const node of this.selectedNodes) {
            if (first) {
                this.selectionBounds.copy(node.worldBounds);
                first = false;
            } else {
                this.selectionBounds.union(node.worldBounds);
            }
        }
        
        // Update transform
        this.selectionTransform.identity();
        this.selectionTransform.translate(
            this.selectionBounds.centerX,
            this.selectionBounds.centerY
        );
    }
    
    /**
     * Add current selection to history
     * @private
     */
    addToHistory() {
        // Remove any forward history
        this.selectionHistory.splice(this.historyIndex + 1);
        
        // Add current selection
        this.selectionHistory.push({
            selectedNodes: new Set(this.selectedNodes),
            activeNode: this.activeNode
        });
        
        // Limit history size
        if (this.selectionHistory.length > 50) {
            this.selectionHistory.shift();
        } else {
            this.historyIndex++;
        }
    }
    
    /**
     * Undo last selection change
     */
    undo() {
        if (this.historyIndex <= 0) return;
        
        this.historyIndex--;
        this.restoreHistoryState(this.selectionHistory[this.historyIndex]);
    }
    
    /**
     * Redo last undone selection change
     */
    redo() {
        if (this.historyIndex >= this.selectionHistory.length - 1) return;
        
        this.historyIndex++;
        this.restoreHistoryState(this.selectionHistory[this.historyIndex]);
    }
    
    /**
     * Restore a selection history state
     * @private
     */
    restoreHistoryState(state) {
        this.selectedNodes = new Set(state.selectedNodes);
        this.activeNode = state.activeNode;
        
        this.updateSelectionBounds();
        
        this.events.emit('selectionChanged', {
            selectedNodes: Array.from(this.selectedNodes),
            activeNode: this.activeNode
        });
    }
    
    /**
     * Start dragging selection
     * @param {number} x - Start X coordinate
     * @param {number} y - Start Y coordinate
     */
    startDrag(x, y) {
        if (this.selectedNodes.size === 0) return;
        
        this.isDragging = true;
        this.dragStart = { x, y };
        this.dragOffset = { x: 0, y: 0 };
        
        this.events.emit('dragStart', {
            selectedNodes: Array.from(this.selectedNodes),
            position: { x, y }
        });
    }
    
    /**
     * Update drag position
     * @param {number} x - Current X coordinate
     * @param {number} y - Current Y coordinate
     */
    updateDrag(x, y) {
        if (!this.isDragging) return;
        
        const dx = x - this.dragStart.x;
        const dy = y - this.dragStart.y;
        
        // Apply constraints
        if (this.constraints.snapToGrid) {
            const gridSize = this.constraints.gridSize;
            const offsetX = dx % gridSize;
            const offsetY = dy % gridSize;
            
            this.dragOffset.x = dx - offsetX;
            this.dragOffset.y = dy - offsetY;
        } else {
            this.dragOffset.x = dx;
            this.dragOffset.y = dy;
        }
        
        // Update selection transform
        this.selectionTransform.translate(this.dragOffset.x, this.dragOffset.y);
        
        this.events.emit('dragMove', {
            selectedNodes: Array.from(this.selectedNodes),
            offset: { ...this.dragOffset }
        });
    }
    
    /**
     * End dragging selection
     */
    endDrag() {
        if (!this.isDragging) return;
        
        // Apply final transform to nodes
        for (const node of this.selectedNodes) {
            node.transform.translate(this.dragOffset.x, this.dragOffset.y);
            node.isTransformDirty = true;
        }
        
        this.isDragging = false;
        this.updateSelectionBounds();
        
        this.events.emit('dragEnd', {
            selectedNodes: Array.from(this.selectedNodes),
            offset: { ...this.dragOffset }
        });
    }
    
    /**
     * Start resizing selection
     * @param {string} handle - Resize handle identifier
     * @param {number} x - Start X coordinate
     * @param {number} y - Start Y coordinate
     */
    startResize(handle, x, y) {
        if (this.selectedNodes.size === 0) return;
        
        this.isResizing = true;
        this.resizeHandle = handle;
        this.dragStart = { x, y };
        
        this.events.emit('resizeStart', {
            selectedNodes: Array.from(this.selectedNodes),
            handle,
            position: { x, y }
        });
    }
    
    /**
     * Update resize
     * @param {number} x - Current X coordinate
     * @param {number} y - Current Y coordinate
     */
    updateResize(x, y) {
        if (!this.isResizing) return;
        
        const dx = x - this.dragStart.x;
        const dy = y - this.dragStart.y;
        
        // Calculate scale factors based on handle
        let scaleX = 1;
        let scaleY = 1;
        
        switch (this.resizeHandle) {
            case 'top-left':
                scaleX = 1 - dx / this.selectionBounds.width;
                scaleY = 1 - dy / this.selectionBounds.height;
                break;
            case 'top-right':
                scaleX = 1 + dx / this.selectionBounds.width;
                scaleY = 1 - dy / this.selectionBounds.height;
                break;
            case 'bottom-left':
                scaleX = 1 - dx / this.selectionBounds.width;
                scaleY = 1 + dy / this.selectionBounds.height;
                break;
            case 'bottom-right':
                scaleX = 1 + dx / this.selectionBounds.width;
                scaleY = 1 + dy / this.selectionBounds.height;
                break;
        }
        
        // Apply constraints
        if (this.constraints.maintainAspectRatio) {
            const ratio = this.selectionBounds.width / this.selectionBounds.height;
            if (Math.abs(scaleX - 1) > Math.abs(scaleY - 1)) {
                scaleY = scaleX / ratio;
            } else {
                scaleX = scaleY * ratio;
            }
        }
        
        // Update selection transform
        this.selectionTransform.scale(scaleX, scaleY);
        
        this.events.emit('resizeMove', {
            selectedNodes: Array.from(this.selectedNodes),
            scale: { x: scaleX, y: scaleY }
        });
    }
    
    /**
     * End resizing selection
     */
    endResize() {
        if (!this.isResizing) return;
        
        // Apply final transform to nodes
        for (const node of this.selectedNodes) {
            node.transform.scale(
                this.selectionTransform.a,
                this.selectionTransform.d
            );
            node.isTransformDirty = true;
        }
        
        this.isResizing = false;
        this.resizeHandle = null;
        this.updateSelectionBounds();
        
        this.events.emit('resizeEnd', {
            selectedNodes: Array.from(this.selectedNodes)
        });
    }
    
    /**
     * Start rotating selection
     * @param {number} x - Start X coordinate
     * @param {number} y - Start Y coordinate
     */
    startRotate(x, y) {
        if (this.selectedNodes.size === 0) return;
        
        this.isRotating = true;
        this.rotationCenter = {
            x: this.selectionBounds.centerX,
            y: this.selectionBounds.centerY
        };
        
        this.initialRotation = Math.atan2(
            y - this.rotationCenter.y,
            x - this.rotationCenter.x
        );
        
        this.events.emit('rotateStart', {
            selectedNodes: Array.from(this.selectedNodes),
            center: { ...this.rotationCenter }
        });
    }
    
    /**
     * Update rotation
     * @param {number} x - Current X coordinate
     * @param {number} y - Current Y coordinate
     */
    updateRotate(x, y) {
        if (!this.isRotating) return;
        
        const currentRotation = Math.atan2(
            y - this.rotationCenter.y,
            x - this.rotationCenter.x
        );
        
        let rotation = currentRotation - this.initialRotation;
        
        // Apply constraints
        if (this.constraints.snapToGrid) {
            const snapAngle = Math.PI / 12; // 15 degrees
            rotation = Math.round(rotation / snapAngle) * snapAngle;
        }
        
        // Update selection transform
        this.selectionTransform.rotate(rotation);
        
        this.events.emit('rotateMove', {
            selectedNodes: Array.from(this.selectedNodes),
            rotation
        });
    }
    
    /**
     * End rotating selection
     */
    endRotate() {
        if (!this.isRotating) return;
        
        // Apply final transform to nodes
        for (const node of this.selectedNodes) {
            node.transform.rotate(this.selectionTransform.decompose().rotation);
            node.isTransformDirty = true;
        }
        
        this.isRotating = false;
        this.updateSelectionBounds();
        
        this.events.emit('rotateEnd', {
            selectedNodes: Array.from(this.selectedNodes)
        });
    }
    
    /**
     * Selection changed event handler
     * @private
     */
    onSelectionChanged(event) {
        // Handle selection change
    }
    
    /**
     * Active node changed event handler
     * @private
     */
    onActiveNodeChanged(event) {
        // Handle active node change
    }
    
    /**
     * Drag start event handler
     * @private
     */
    onDragStart(event) {
        // Handle drag start
    }
    
    /**
     * Drag move event handler
     * @private
     */
    onDragMove(event) {
        // Handle drag move
    }
    
    /**
     * Drag end event handler
     * @private
     */
    onDragEnd(event) {
        // Handle drag end
    }
    
    /**
     * Resize start event handler
     * @private
     */
    onResizeStart(event) {
        // Handle resize start
    }
    
    /**
     * Resize move event handler
     * @private
     */
    onResizeMove(event) {
        // Handle resize move
    }
    
    /**
     * Resize end event handler
     * @private
     */
    onResizeEnd(event) {
        // Handle resize end
    }
    
    /**
     * Rotate start event handler
     * @private
     */
    onRotateStart(event) {
        // Handle rotate start
    }
    
    /**
     * Rotate move event handler
     * @private
     */
    onRotateMove(event) {
        // Handle rotate move
    }
    
    /**
     * Rotate end event handler
     * @private
     */
    onRotateEnd(event) {
        // Handle rotate end
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        this.clearSelection();
        this.events.removeAllListeners();
    }
}

// Export the SelectionManager class
window.SelectionManager = SelectionManager; 