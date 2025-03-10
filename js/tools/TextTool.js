/**
 * Text Tool
 * 
 * Tool for adding and editing text in the scene.
 * Supports text editing, font selection, and text alignment.
 */

class TextTool extends Tool {
    constructor(app) {
        super(app);
        this.textNode = null;
        this.editor = null;
        this.isEditing = false;
    }
    
    /**
     * Get the cursor for this tool
     */
    getCursor() {
        return 'text';
    }
    
    /**
     * Handle mouse down event
     */
    handleMouseDown(event) {
        super.handleMouseDown(event);
        
        const pos = this.getViewportCoordinates(event.clientX, event.clientY);
        
        // Check if clicking existing text
        const node = this.app.scene.queryPoint(pos.x, pos.y);
        
        if (node && node.type === 'text') {
            // Edit existing text
            this.startEditing(node);
        } else {
            // Create new text
            this.createText(pos);
        }
    }
    
    /**
     * Create new text node
     */
    createText(pos) {
        // Create text node
        this.textNode = new SceneNode('text', {
            x: pos.x,
            y: pos.y,
            text: '',
            font: this.app.state.font || 'Arial',
            fontSize: this.app.state.fontSize || 16,
            fill: this.app.state.textColor || '#000000',
            textAlign: this.app.state.textAlign || 'left',
            opacity: this.app.state.opacity || 1
        });
        
        // Add to scene
        this.app.scene.addNode(this.textNode);
        
        // Start editing
        this.startEditing(this.textNode);
    }
    
    /**
     * Start editing text
     */
    startEditing(node) {
        if (this.isEditing) {
            this.stopEditing();
        }
        
        this.textNode = node;
        this.isEditing = true;
        
        // Create editor element
        this.editor = document.createElement('div');
        this.editor.className = 'text-editor';
        this.editor.contentEditable = true;
        this.editor.spellcheck = false;
        
        // Set initial content
        this.editor.textContent = node.text;
        
        // Position editor
        this.updateEditorPosition();
        
        // Style editor
        Object.assign(this.editor.style, {
            position: 'absolute',
            padding: '0',
            margin: '0',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            overflow: 'hidden',
            whiteSpace: 'pre-wrap',
            font: `${node.fontSize}px ${node.font}`,
            color: node.fill,
            textAlign: node.textAlign,
            minWidth: '1px',
            minHeight: '1em'
        });
        
        // Add to DOM
        document.body.appendChild(this.editor);
        
        // Focus and select all
        this.editor.focus();
        document.execCommand('selectAll', false, null);
        
        // Add event listeners
        this.editor.addEventListener('input', this.handleInput.bind(this));
        this.editor.addEventListener('blur', this.handleBlur.bind(this));
        this.editor.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Select the node
        this.app.selection.selectNode(node);
    }
    
    /**
     * Stop editing text
     */
    stopEditing() {
        if (!this.isEditing) return;
        
        // Update final text
        if (this.textNode && this.editor) {
            const oldText = this.textNode.text;
            const newText = this.editor.textContent;
            
            if (newText !== oldText) {
                this.textNode.text = newText;
                this.app.addToHistory();
            }
        }
        
        // Remove editor
        if (this.editor) {
            this.editor.remove();
            this.editor = null;
        }
        
        this.textNode = null;
        this.isEditing = false;
    }
    
    /**
     * Handle input event
     */
    handleInput(event) {
        if (!this.textNode || !this.editor) return;
        
        // Update text node
        this.textNode.text = this.editor.textContent;
        
        // Update editor size
        this.updateEditorPosition();
    }
    
    /**
     * Handle blur event
     */
    handleBlur(event) {
        // Stop editing when editor loses focus
        this.stopEditing();
    }
    
    /**
     * Handle key down event
     */
    handleKeyDown(event) {
        if (event.key === 'Escape') {
            // Cancel editing
            this.stopEditing();
            event.preventDefault();
        } else if (event.key === 'Enter' && !event.shiftKey) {
            // Finish editing
            this.stopEditing();
            event.preventDefault();
        }
    }
    
    /**
     * Update editor position and size
     */
    updateEditorPosition() {
        if (!this.textNode || !this.editor) return;
        
        // Get screen coordinates
        const pos = this.getScreenCoordinates(this.textNode.x, this.textNode.y);
        
        // Position editor
        Object.assign(this.editor.style, {
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            transform: `scale(${this.app.state.zoom})`,
            transformOrigin: 'left top'
        });
    }
    
    /**
     * Deactivate tool
     */
    deactivate() {
        this.stopEditing();
        super.deactivate();
    }
}

// Export the TextTool class
window.TextTool = TextTool; 