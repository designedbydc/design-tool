import { Scene } from './core/Scene.js';
import { SceneNode } from './core/SceneNode.js';

/**
 * Figma Clone - Main Application
 * 
 * This file contains the main Application class that coordinates between different modules
 * and manages the overall application state.
 */

export class Application {
    constructor() {
        this.scene = null;
        this.initialized = false;
        this.canvas = null;
        this.selectedTool = 'select';
        this.activeNode = null;
        this.isDrawing = false;
        this.SceneNode = SceneNode; // Store reference to SceneNode class
    }

    async initialize() {
        console.log('Initializing application...');
        try {
            // Initialize scene
            this.scene = new Scene();
            
            // Create root node
            const rootNode = new SceneNode();
            rootNode.name = 'root';
            this.scene.addNode(rootNode);
            
            // Initialize canvas
            this.initializeCanvas();
            
            // Set up UI event listeners
            this.setupEventListeners();
            
            // Initialize color pickers
            this.initializeColorPickers();
            
            this.initialized = true;
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            throw error;
        }
    }

    initializeCanvas() {
        this.canvas = document.getElementById('canvas');
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }

        // Set canvas size
        const resizeCanvas = () => {
            const container = this.canvas.parentElement;
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            this.render(); // Re-render when resized
        };

        // Initial size
        resizeCanvas();
        
        // Listen for window resize
        window.addEventListener('resize', resizeCanvas);
        
        // Initial render
        this.render();
    }

    setupEventListeners() {
        // Tool selection
        document.querySelectorAll('.tool-item').forEach(tool => {
            tool.addEventListener('click', (e) => {
                const toolName = e.currentTarget.dataset.tool;
                this.selectTool(toolName);
            });
        });

        // Canvas interactions
        this.canvas.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleCanvasMouseUp.bind(this));

        // Menu interactions - Fix dropdown menu functionality
        const menuButtons = document.querySelectorAll('[id$="-menu-button"]');
        menuButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const targetId = button.id.replace('-button', '');
                const targetDropdown = document.getElementById(`${targetId}-dropdown`);
                
                // Close all other dropdowns first
                document.querySelectorAll('.dropdown-menu').forEach(dropdown => {
                    if (dropdown.id !== `${targetId}-dropdown`) {
                        dropdown.classList.add('hidden');
                    }
                });
                
                // Toggle this dropdown
                if (targetDropdown) {
                    targetDropdown.classList.toggle('hidden');
                }
            });
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-menu').forEach(dropdown => {
                dropdown.classList.add('hidden');
            });
        });
        
        // Menu item actions
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleMenuAction(action);
            });
        });
        
        // Tab switching
        document.getElementById('properties-tab-btn').addEventListener('click', () => {
            this.switchTab('properties');
        });
        
        document.getElementById('layers-tab-btn').addEventListener('click', () => {
            this.switchTab('layers');
        });
        
        // Track mouse position for status bar
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.round(e.clientX - rect.left);
            const y = Math.round(e.clientY - rect.top);
            
            document.querySelector('.coordinates').textContent = `X: ${x} Y: ${y}`;
        });
    }

    selectTool(toolName) {
        // Remove active class from all tools
        document.querySelectorAll('.tool-item').forEach(tool => {
            tool.classList.remove('active');
        });

        // Add active class to selected tool
        const selectedTool = document.querySelector(`.tool-item[data-tool="${toolName}"]`);
        if (selectedTool) {
            selectedTool.classList.add('active');
        }

        this.selectedTool = toolName;
        console.log('Selected tool:', toolName);
    }

    handleCanvasMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        console.log('Mouse down at:', x, y, 'with tool:', this.selectedTool);

        switch (this.selectedTool) {
            case 'select':
                this.startSelection(x, y);
                break;
            case 'rectangle':
                this.startDrawingRectangle(x, y);
                break;
            case 'circle':
                this.startDrawingCircle(x, y);
                break;
            case 'line':
                this.startDrawingLine(x, y);
                break;
            case 'text':
                this.startDrawingText(x, y);
                break;
        }
    }

    handleCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.isDrawing) {
            // Update shape being drawn
            this.updateCurrentShape(x, y);
        } else if (this.isDragging && this.activeNode) {
            // Move the selected node
            this.moveSelectedNode(x, y);
        }
    }

    handleCanvasMouseUp(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.isDrawing) {
            // Final update to the shape
            this.updateCurrentShape(x, y);
            this.isDrawing = false;
        }
        
        // End dragging
        this.isDragging = false;
        
        // Keep the node selected
        // this.activeNode remains set for property editing
        
        console.log('Drawing or dragging completed');
    }

    handleMenuAction(action) {
        console.log('Menu action:', action);
        switch (action) {
            case 'new':
                this.scene.clear();
                break;
            case 'save':
                this.saveScene();
                break;
            case 'open':
                this.openScene();
                break;
            case 'export':
                this.exportCanvas();
                break;
            case 'undo':
                // Implement undo
                break;
            case 'redo':
                // Implement redo
                break;
        }
        this.render();
    }

    startSelection(x, y) {
        console.log('Starting selection at', x, y);
        
        // Find the node under the cursor
        const selectedNode = this.findNodeAtPosition(x, y);
        
        if (selectedNode) {
            // Select the node
            this.scene.selectNode(selectedNode);
            this.activeNode = selectedNode;
            
            // Store initial position for dragging
            this.dragStartX = x;
            this.dragStartY = y;
            this.dragOffsetX = x - selectedNode.properties.x;
            this.dragOffsetY = y - selectedNode.properties.y;
            this.isDragging = true;
            
            console.log('Selected node:', selectedNode);
            
            // Update properties panel
            this.updatePropertiesPanel(selectedNode);
        } else {
            // Deselect if clicked on empty space
            this.scene.clearSelection();
            this.activeNode = null;
            this.isDragging = false;
            
            // Clear properties panel
            this.clearPropertiesPanel();
        }
        
        this.render();
    }
    
    /**
     * Find a node at the given position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {SceneNode} - The node at the position, or null if none
     */
    findNodeAtPosition(x, y) {
        let foundNode = null;
        
        // Iterate through all nodes in reverse order (top to bottom)
        const nodes = Array.from(this.scene.nodes.values()).reverse();
        
        for (const node of nodes) {
            if (this.isPointInNode(x, y, node)) {
                foundNode = node;
                break;
            }
        }
        
        return foundNode;
    }
    
    /**
     * Check if a point is inside a node
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {SceneNode} node - The node to check
     * @returns {boolean} - Whether the point is in the node
     */
    isPointInNode(x, y, node) {
        if (!node.properties) return false;
        
        switch (node.type) {
            case 'rectangle':
                return (
                    x >= node.properties.x &&
                    x <= node.properties.x + node.properties.width &&
                    y >= node.properties.y &&
                    y <= node.properties.y + node.properties.height
                );
                
            case 'circle':
                const centerX = node.properties.x;
                const centerY = node.properties.y;
                const radius = Math.sqrt(
                    Math.pow(node.properties.width, 2) + 
                    Math.pow(node.properties.height, 2)
                );
                
                const distToCenter = Math.sqrt(
                    Math.pow(x - centerX, 2) + 
                    Math.pow(y - centerY, 2)
                );
                
                return distToCenter <= radius;
                
            case 'line':
                // Simple line hit testing with a small threshold
                const threshold = 5;
                const x1 = node.properties.x1;
                const y1 = node.properties.y1;
                const x2 = node.properties.x2;
                const y2 = node.properties.y2;
                
                // Calculate distance from point to line
                const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                if (lineLength === 0) return false;
                
                const distToLine = Math.abs(
                    (y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1
                ) / lineLength;
                
                // Check if point is within the line segment bounds
                const dotProduct = 
                    ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / 
                    (Math.pow(lineLength, 2));
                
                return distToLine <= threshold && dotProduct >= 0 && dotProduct <= 1;
                
            case 'text':
                return (
                    x >= node.properties.x &&
                    x <= node.properties.x + 100 && // Approximate text width
                    y >= node.properties.y - node.properties.fontSize &&
                    y <= node.properties.y
                );
                
            default:
                return false;
        }
    }

    startDrawingRectangle(x, y) {
        console.log('Creating rectangle at', x, y);
        const node = new SceneNode();
        node.type = 'rectangle';
        node.properties = {
            x: x,
            y: y,
            width: 0,
            height: 0,
            fill: '#4285F4',
            stroke: '#000000',
            strokeWidth: 1
        };
        this.scene.addNode(node);
        this.activeNode = node;
        this.isDrawing = true;
        this.render();
    }

    startDrawingCircle(x, y) {
        console.log('Creating circle at', x, y);
        const node = new SceneNode();
        node.type = 'circle';
        node.properties = {
            x: x,
            y: y,
            width: 0,
            height: 0,
            fill: '#34A853',
            stroke: '#000000',
            strokeWidth: 1
        };
        this.scene.addNode(node);
        this.activeNode = node;
        this.isDrawing = true;
        this.render();
        console.log('Circle created:', node);
    }

    startDrawingLine(x, y) {
        console.log('Creating line at', x, y);
        const node = new SceneNode();
        node.type = 'line';
        node.properties = {
            x1: x,
            y1: y,
            x2: x,
            y2: y,
            stroke: '#000000',
            strokeWidth: 2
        };
        this.scene.addNode(node);
        this.activeNode = node;
        this.isDrawing = true;
        this.render();
    }

    startDrawingText(x, y) {
        console.log('Creating text at', x, y);
        const node = new SceneNode();
        node.type = 'text';
        node.properties = {
            x: x,
            y: y,
            text: 'Text',
            fontSize: 16,
            fontFamily: 'Arial',
            fill: '#000000'
        };
        this.scene.addNode(node);
        this.render();
    }

    updateCurrentShape(x, y) {
        if (!this.activeNode) return;

        console.log('Updating shape to', x, y);
        
        switch (this.activeNode.type) {
            case 'rectangle':
                const width = x - this.activeNode.properties.x;
                const height = y - this.activeNode.properties.y;
                this.activeNode.properties.width = Math.abs(width);
                this.activeNode.properties.height = Math.abs(height);
                break;
            case 'circle':
                // For circles, store the x and y distances from center
                // These will be used to calculate the radius during rendering
                this.activeNode.properties.width = x - this.activeNode.properties.x;
                this.activeNode.properties.height = y - this.activeNode.properties.y;
                break;
            case 'line':
                this.activeNode.properties.x2 = x;
                this.activeNode.properties.y2 = y;
                break;
        }
        
        this.render();
    }

    render() {
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Render all nodes
        this.scene.traverse(node => {
            if (node.type) {
                this.renderNode(ctx, node);
            }
        });
        
        console.log('Canvas rendered with', this.scene.nodes.size, 'nodes');
    }

    renderNode(ctx, node) {
        if (!node.properties) return;
        
        console.log('Rendering node:', node.type, node.properties);
        
        ctx.save();
        
        // Set styles
        if (node.properties.fill) {
            ctx.fillStyle = node.properties.fill;
        }
        if (node.properties.stroke) {
            ctx.strokeStyle = node.properties.stroke;
        }
        if (node.properties.strokeWidth) {
            ctx.lineWidth = node.properties.strokeWidth;
        }
        
        // Set opacity
        if (node.properties.opacity !== undefined) {
            ctx.globalAlpha = node.properties.opacity;
        }
        
        // Draw based on shape type
        switch (node.type) {
            case 'rectangle':
                ctx.beginPath();
                ctx.rect(
                    node.properties.x,
                    node.properties.y,
                    node.properties.width || 0,
                    node.properties.height || 0
                );
                if (node.properties.fill) ctx.fill();
                if (node.properties.stroke) ctx.stroke();
                break;
                
            case 'circle':
                ctx.beginPath();
                // For circles, use the distance from start to current point as the radius
                // This creates a more intuitive circle drawing experience
                const centerX = node.properties.x;
                const centerY = node.properties.y;
                const radius = Math.sqrt(
                    Math.pow(node.properties.width, 2) + 
                    Math.pow(node.properties.height, 2)
                );
                console.log('Drawing circle:', centerX, centerY, radius);
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                if (node.properties.fill) ctx.fill();
                if (node.properties.stroke) ctx.stroke();
                break;
                
            case 'line':
                ctx.beginPath();
                ctx.moveTo(node.properties.x1, node.properties.y1);
                ctx.lineTo(node.properties.x2, node.properties.y2);
                ctx.stroke();
                break;
                
            case 'text':
                if (node.properties.fontSize) {
                    ctx.font = `${node.properties.fontSize}px ${node.properties.fontFamily || 'Arial'}`;
                }
                if (node.properties.fill) {
                    ctx.fillText(node.properties.text, node.properties.x, node.properties.y);
                }
                break;
        }
        
        // Draw selection indicators if node is selected
        if (this.activeNode === node) {
            ctx.globalAlpha = 1.0; // Reset opacity for selection indicators
            ctx.strokeStyle = '#1E88E5'; // Blue selection color
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]); // Dashed line for selection
            
            switch (node.type) {
                case 'rectangle':
                    // Draw selection rectangle
                    ctx.strokeRect(
                        node.properties.x - 2,
                        node.properties.y - 2,
                        node.properties.width + 4,
                        node.properties.height + 4
                    );
                    break;
                    
                case 'circle':
                    // Draw selection circle
                    ctx.beginPath();
                    ctx.arc(
                        centerX,
                        centerY,
                        radius + 2,
                        0,
                        Math.PI * 2
                    );
                    ctx.stroke();
                    break;
                    
                case 'line':
                    // Draw selection rectangle around line
                    const x1 = node.properties.x1;
                    const y1 = node.properties.y1;
                    const x2 = node.properties.x2;
                    const y2 = node.properties.y2;
                    
                    // Draw slightly larger line
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineWidth = node.properties.strokeWidth + 4;
                    ctx.stroke();
                    
                    // Draw control points
                    ctx.setLineDash([]); // Solid line for control points
                    ctx.fillStyle = '#1E88E5';
                    ctx.beginPath();
                    ctx.arc(x1, y1, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x2, y2, 4, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'text':
                    // Draw selection rectangle around text
                    const textWidth = ctx.measureText(node.properties.text).width;
                    ctx.strokeRect(
                        node.properties.x - 2,
                        node.properties.y - node.properties.fontSize - 2,
                        textWidth + 4,
                        node.properties.fontSize + 4
                    );
                    break;
            }
            
            ctx.setLineDash([]); // Reset dash pattern
        }
        
        ctx.restore();
    }

    saveScene() {
        try {
            const data = JSON.stringify(this.scene);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'scene.json';
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Error saving scene:', e);
        }
    }

    async openScene() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const text = await file.text();
                    const data = JSON.parse(text);
                    // Implement scene loading
                    this.render();
                } catch (e) {
                    console.error('Error loading scene:', e);
                }
            }
        };
        input.click();
    }
    
    exportCanvas() {
        try {
            const dataUrl = this.canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = 'canvas.png';
            a.click();
        } catch (e) {
            console.error('Error exporting canvas:', e);
        }
    }

    /**
     * Move the selected node to a new position
     * @param {number} x - Current mouse X position
     * @param {number} y - Current mouse Y position
     */
    moveSelectedNode(x, y) {
        if (!this.activeNode || !this.activeNode.properties) return;
        
        // Calculate new position
        const newX = x - this.dragOffsetX;
        const newY = y - this.dragOffsetY;
        
        // Update node position based on type
        switch (this.activeNode.type) {
            case 'rectangle':
            case 'circle':
                this.activeNode.properties.x = newX;
                this.activeNode.properties.y = newY;
                break;
                
            case 'line':
                // Move both endpoints
                const dx = newX - this.activeNode.properties.x1;
                const dy = newY - this.activeNode.properties.y1;
                
                this.activeNode.properties.x1 += dx;
                this.activeNode.properties.y1 += dy;
                this.activeNode.properties.x2 += dx;
                this.activeNode.properties.y2 += dy;
                break;
                
            case 'text':
                this.activeNode.properties.x = newX;
                this.activeNode.properties.y = newY;
                break;
        }
        
        // Update properties panel
        this.updatePropertiesPanel(this.activeNode);
        
        // Re-render
        this.render();
    }

    /**
     * Initialize color pickers
     */
    initializeColorPickers() {
        // Fill color picker
        this.fillColorPicker = Pickr.create({
            el: '#fill-color-picker',
            theme: 'classic',
            default: '#4285F4',
            components: {
                preview: true,
                opacity: true,
                hue: true,
                interaction: {
                    hex: true,
                    rgba: true,
                    hsla: false,
                    hsva: false,
                    cmyk: false,
                    input: true,
                    clear: false,
                    save: true
                }
            }
        });
        
        // Stroke color picker
        this.strokeColorPicker = Pickr.create({
            el: '#stroke-color-picker',
            theme: 'classic',
            default: '#000000',
            components: {
                preview: true,
                opacity: true,
                hue: true,
                interaction: {
                    hex: true,
                    rgba: true,
                    hsla: false,
                    hsva: false,
                    cmyk: false,
                    input: true,
                    clear: false,
                    save: true
                }
            }
        });
        
        // Set up event listeners for color pickers
        this.fillColorPicker.on('save', (color) => {
            if (!this.activeNode) return;
            
            const rgba = color.toRGBA();
            const rgbaString = `rgba(${Math.round(rgba[0])}, ${Math.round(rgba[1])}, ${Math.round(rgba[2])}, ${rgba[3]})`;
            
            this.activeNode.properties.fill = rgbaString;
            this.activeNode.properties.opacity = rgba[3];
            
            // Update opacity slider
            document.getElementById('opacity').value = Math.round(rgba[3] * 100);
            document.getElementById('opacity-value').textContent = `${Math.round(rgba[3] * 100)}%`;
            
            this.render();
        });
        
        this.strokeColorPicker.on('save', (color) => {
            if (!this.activeNode) return;
            
            const rgba = color.toRGBA();
            const rgbaString = `rgba(${Math.round(rgba[0])}, ${Math.round(rgba[1])}, ${Math.round(rgba[2])}, ${rgba[3]})`;
            
            this.activeNode.properties.stroke = rgbaString;
            this.render();
        });
    }
    
    /**
     * Update the properties panel with the selected node's properties
     * @param {SceneNode} node - The selected node
     */
    updatePropertiesPanel(node) {
        if (!node || !node.properties) return;
        
        // Get property inputs
        const posXInput = document.getElementById('posX');
        const posYInput = document.getElementById('posY');
        const widthInput = document.getElementById('width');
        const heightInput = document.getElementById('height');
        const strokeWidthInput = document.getElementById('stroke-width');
        const opacityInput = document.getElementById('opacity');
        const opacityValue = document.getElementById('opacity-value');
        
        // Update position inputs
        switch (node.type) {
            case 'rectangle':
            case 'circle':
                posXInput.value = Math.round(node.properties.x);
                posYInput.value = Math.round(node.properties.y);
                break;
                
            case 'line':
                posXInput.value = Math.round(node.properties.x1);
                posYInput.value = Math.round(node.properties.y1);
                break;
                
            case 'text':
                posXInput.value = Math.round(node.properties.x);
                posYInput.value = Math.round(node.properties.y);
                break;
        }
        
        // Update size inputs
        switch (node.type) {
            case 'rectangle':
                widthInput.value = Math.round(node.properties.width);
                heightInput.value = Math.round(node.properties.height);
                break;
                
            case 'circle':
                const radius = Math.sqrt(
                    Math.pow(node.properties.width, 2) + 
                    Math.pow(node.properties.height, 2)
                );
                widthInput.value = Math.round(radius * 2);
                heightInput.value = Math.round(radius * 2);
                break;
                
            case 'line':
                // Calculate line length
                const dx = node.properties.x2 - node.properties.x1;
                const dy = node.properties.y2 - node.properties.y1;
                const length = Math.sqrt(dx * dx + dy * dy);
                widthInput.value = Math.round(length);
                heightInput.value = 0;
                break;
                
            case 'text':
                widthInput.value = 100; // Approximate text width
                heightInput.value = node.properties.fontSize;
                break;
        }
        
        // Update stroke width
        if (node.properties.strokeWidth !== undefined) {
            strokeWidthInput.value = node.properties.strokeWidth;
        }
        
        // Update opacity
        if (node.properties.opacity !== undefined) {
            const opacityPercent = Math.round(node.properties.opacity * 100);
            opacityInput.value = opacityPercent;
            opacityValue.textContent = `${opacityPercent}%`;
        } else {
            opacityInput.value = 100;
            opacityValue.textContent = '100%';
        }
        
        // Update color pickers
        if (node.properties.fill && this.fillColorPicker) {
            this.fillColorPicker.setColor(node.properties.fill);
        }
        
        if (node.properties.stroke && this.strokeColorPicker) {
            this.strokeColorPicker.setColor(node.properties.stroke);
        }
        
        // Set up event listeners for property changes
        this.setupPropertyChangeListeners(node);
    }
    
    /**
     * Clear the properties panel
     */
    clearPropertiesPanel() {
        // Reset all inputs to default values
        document.getElementById('posX').value = 0;
        document.getElementById('posY').value = 0;
        document.getElementById('width').value = 100;
        document.getElementById('height').value = 100;
        document.getElementById('stroke-width').value = 1;
        document.getElementById('opacity').value = 100;
        document.getElementById('opacity-value').textContent = '100%';
        
        // Remove event listeners
        this.removePropertyChangeListeners();
    }
    
    /**
     * Set up event listeners for property changes
     * @param {SceneNode} node - The selected node
     */
    setupPropertyChangeListeners(node) {
        // Remove existing listeners first
        this.removePropertyChangeListeners();
        
        // Position X change
        const posXInput = document.getElementById('posX');
        posXInput.onchange = (e) => {
            const newX = parseFloat(e.target.value);
            if (isNaN(newX)) return;
            
            switch (node.type) {
                case 'rectangle':
                case 'circle':
                    node.properties.x = newX;
                    break;
                    
                case 'line':
                    // Move both endpoints
                    const dx = newX - node.properties.x1;
                    node.properties.x1 = newX;
                    node.properties.x2 += dx;
                    break;
                    
                case 'text':
                    node.properties.x = newX;
                    break;
            }
            
            this.render();
        };
        
        // Position Y change
        const posYInput = document.getElementById('posY');
        posYInput.onchange = (e) => {
            const newY = parseFloat(e.target.value);
            if (isNaN(newY)) return;
            
            switch (node.type) {
                case 'rectangle':
                case 'circle':
                    node.properties.y = newY;
                    break;
                    
                case 'line':
                    // Move both endpoints
                    const dy = newY - node.properties.y1;
                    node.properties.y1 = newY;
                    node.properties.y2 += dy;
                    break;
                    
                case 'text':
                    node.properties.y = newY;
                    break;
            }
            
            this.render();
        };
        
        // Width change
        const widthInput = document.getElementById('width');
        widthInput.onchange = (e) => {
            const newWidth = parseFloat(e.target.value);
            if (isNaN(newWidth)) return;
            
            switch (node.type) {
                case 'rectangle':
                    node.properties.width = newWidth;
                    break;
                    
                case 'circle':
                    // Set both width and height to create a proper radius vector
                    const radius = newWidth / 2;
                    // Calculate the direction vector from center to edge
                    const currentRadius = Math.sqrt(
                        Math.pow(node.properties.width, 2) + 
                        Math.pow(node.properties.height, 2)
                    );
                    if (currentRadius === 0) {
                        // If radius is 0, set width to radius and height to 0 (circle to the right)
                        node.properties.width = radius;
                        node.properties.height = 0;
                    } else {
                        // Scale the current direction vector to the new radius
                        const scale = radius / currentRadius;
                        node.properties.width *= scale;
                        node.properties.height *= scale;
                    }
                    break;
                    
                case 'line':
                    // Scale the line
                    const currentLength = Math.sqrt(
                        Math.pow(node.properties.x2 - node.properties.x1, 2) + 
                        Math.pow(node.properties.y2 - node.properties.y1, 2)
                    );
                    if (currentLength === 0) return;
                    
                    const scale = newWidth / currentLength;
                    const dx = node.properties.x2 - node.properties.x1;
                    const dy = node.properties.y2 - node.properties.y1;
                    
                    node.properties.x2 = node.properties.x1 + dx * scale;
                    node.properties.y2 = node.properties.y1 + dy * scale;
                    break;
            }
            
            this.render();
        };
        
        // Height change
        const heightInput = document.getElementById('height');
        heightInput.onchange = (e) => {
            const newHeight = parseFloat(e.target.value);
            if (isNaN(newHeight)) return;
            
            switch (node.type) {
                case 'rectangle':
                    node.properties.height = newHeight;
                    break;
                    
                case 'circle':
                    // Set both width and height to create a proper radius vector
                    const radiusHeight = newHeight / 2;
                    // Calculate the direction vector from center to edge
                    const currentRadiusHeight = Math.sqrt(
                        Math.pow(node.properties.width, 2) + 
                        Math.pow(node.properties.height, 2)
                    );
                    if (currentRadiusHeight === 0) {
                        // If radius is 0, set width to radius and height to 0 (circle to the right)
                        node.properties.width = radiusHeight;
                        node.properties.height = 0;
                    } else {
                        // Scale the current direction vector to the new radius
                        const scaleHeight = radiusHeight / currentRadiusHeight;
                        node.properties.width *= scaleHeight;
                        node.properties.height *= scaleHeight;
                    }
                    break;
                    
                case 'text':
                    node.properties.fontSize = newHeight;
                    break;
            }
            
            this.render();
        };
        
        // Stroke width change
        const strokeWidthInput = document.getElementById('stroke-width');
        strokeWidthInput.onchange = (e) => {
            const newStrokeWidth = parseFloat(e.target.value);
            if (isNaN(newStrokeWidth)) return;
            
            node.properties.strokeWidth = newStrokeWidth;
            this.render();
        };
        
        // Opacity change
        const opacityInput = document.getElementById('opacity');
        opacityInput.oninput = (e) => {
            const opacityPercent = parseInt(e.target.value);
            if (isNaN(opacityPercent)) return;
            
            const opacity = opacityPercent / 100;
            node.properties.opacity = opacity;
            
            document.getElementById('opacity-value').textContent = `${opacityPercent}%`;
            this.render();
        };
    }
    
    /**
     * Remove event listeners for property changes
     */
    removePropertyChangeListeners() {
        document.getElementById('posX').onchange = null;
        document.getElementById('posY').onchange = null;
        document.getElementById('width').onchange = null;
        document.getElementById('height').onchange = null;
        document.getElementById('stroke-width').onchange = null;
        document.getElementById('opacity').oninput = null;
    }

    /**
     * Switch between tabs in the right sidebar
     * @param {string} tabName - Name of the tab to switch to
     */
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
            btn.classList.add('text-gray-500');
        });
        
        document.getElementById(`${tabName}-tab-btn`).classList.remove('text-gray-500');
        document.getElementById(`${tabName}-tab-btn`).classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
        
        // Update tab content
        document.querySelectorAll('.tab-content > div').forEach(panel => {
            panel.classList.add('hidden');
        });
        
        document.getElementById(`${tabName}-panel`).classList.remove('hidden');
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new Application();
    try {
        await window.app.initialize();
    } catch (error) {
        console.error('Application initialization failed:', error);
    }
}); 