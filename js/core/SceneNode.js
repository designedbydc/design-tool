import { EventEmitter } from '../EventEmitter.js';
import { Transform } from './Transform.js';
import { AABB } from './AABB.js';

/**
 * SceneNode Class
 * 
 * Represents a node in the scene graph. Each node can have properties,
 * transformations, effects, and constraints. Nodes can be shapes,
 * images, text, groups, or other specialized types.
 */

export class SceneNode extends EventEmitter {
    constructor(id = crypto.randomUUID()) {
        super();
        this.id = id;
        this.name = '';
        this.transform = new Transform();
        this.parent = null;
        this.children = [];
        this.visible = true;
        this.scene = null;
        this.bounds = new AABB();
        
        // Core properties
        this.properties = {
            visible: true,
            locked: false,
            opacity: 1,
            blendMode: 'normal',
        };
        
        // Hierarchy
        this.parent = null;
        this.children = [];
        
        // Transform
        this.worldTransform = new Transform();
        this.worldBounds = new AABB();
        
        // Rendering
        this.layer = 0;
        this.zIndex = 0;
        this.effects = [];
        this.masks = [];
        
        // Interaction
        this.interactive = true;
        this.draggable = true;
        this.resizable = true;
        this.rotatable = true;
        this.selectable = true;
        
        // Constraints and layout
        this.constraints = [];
        this.layout = null;
        
        // State
        this.isDirty = true;
        this.isTransformDirty = true;
        this.isBoundsDirty = true;
        
        // Events
        this.events = new EventEmitter();
        
        // Initialize based on type
        this.initializeByType();
    }
    
    /**
     * Initialize node-specific properties based on type
     * @private
     */
    initializeByType() {
        switch (this.type) {
            case 'shape':
                this.initializeShape();
                break;
            case 'image':
                this.initializeImage();
                break;
            case 'text':
                this.initializeText();
                break;
            case 'group':
                this.initializeGroup();
                break;
            case 'artboard':
                this.initializeArtboard();
                break;
            case 'component':
                this.initializeComponent();
                break;
        }
    }
    
    /**
     * Initialize shape-specific properties
     * @private
     */
    initializeShape() {
        this.properties = {
            ...this.properties,
            fill: '#000000',
            stroke: null,
            strokeWidth: 1,
            strokeAlign: 'center',
            strokeDashArray: [],
            strokeCap: 'butt',
            strokeJoin: 'miter',
            strokeMiterLimit: 4,
            fillRule: 'nonzero',
            path: null,
            vertices: [],
            closed: true
        };
    }
    
    /**
     * Initialize image-specific properties
     * @private
     */
    initializeImage() {
        this.properties = {
            ...this.properties,
            src: '',
            width: 0,
            height: 0,
            naturalWidth: 0,
            naturalHeight: 0,
            objectFit: 'contain',
            imageRendering: 'auto'
        };
    }
    
    /**
     * Initialize text-specific properties
     * @private
     */
    initializeText() {
        this.properties = {
            ...this.properties,
            text: '',
            fontSize: 16,
            fontFamily: 'Inter',
            fontWeight: 400,
            fontStyle: 'normal',
            letterSpacing: 0,
            lineHeight: 1.2,
            textAlign: 'left',
            verticalAlign: 'top',
            textDecoration: 'none',
            textTransform: 'none',
            paragraphSpacing: 0,
            textWrapping: true
        };
    }
    
    /**
     * Initialize group-specific properties
     * @private
     */
    initializeGroup() {
        this.properties = {
            ...this.properties,
            clipped: false,
            isolate: false
        };
    }
    
    /**
     * Initialize artboard-specific properties
     * @private
     */
    initializeArtboard() {
        this.properties = {
            ...this.properties,
            background: '#ffffff',
            width: 1920,
            height: 1080,
            constrainProportions: false,
            flowStartScreen: false
        };
    }
    
    /**
     * Initialize component-specific properties
     * @private
     */
    initializeComponent() {
        this.properties = {
            ...this.properties,
            master: true,
            instanceProperties: {},
            overrides: new Map()
        };
    }
    
    /**
     * Update the node's transform
     */
    updateTransform() {
        if (!this.isTransformDirty) return;
        
        // Start with local transform
        this.worldTransform.copy(this.transform);
        
        // Combine with parent's world transform
        if (this.parent) {
            this.worldTransform.multiply(this.parent.worldTransform);
        }
        
        // Mark children as dirty
        this.children.forEach(child => {
            child.isTransformDirty = true;
        });
        
        this.isTransformDirty = false;
        this.isBoundsDirty = true;
    }
    
    /**
     * Update the node's bounds
     */
    updateBounds() {
        if (!this.isBoundsDirty) return;
        
        // Calculate local bounds based on type
        this.calculateLocalBounds();
        
        // Transform local bounds to world space
        this.worldBounds.copy(this.bounds);
        this.worldBounds.transform(this.worldTransform);
        
        // Include children bounds
        this.children.forEach(child => {
            child.updateBounds();
            this.worldBounds.union(child.worldBounds);
        });
        
        this.isBoundsDirty = false;
    }
    
    /**
     * Calculate local bounds based on node type
     * @private
     */
    calculateLocalBounds() {
        switch (this.type) {
            case 'shape':
                this.calculateShapeBounds();
                break;
            case 'image':
                this.calculateImageBounds();
                break;
            case 'text':
                this.calculateTextBounds();
                break;
            default:
                this.bounds.set(0, 0, 0, 0);
        }
        
        // Apply effects that might affect bounds
        this.effects.forEach(effect => {
            effect.expandBounds(this.bounds);
        });
    }
    
    /**
     * Calculate shape bounds
     * @private
     */
    calculateShapeBounds() {
        if (this.properties.path) {
            this.bounds.setFromPath(this.properties.path);
        } else if (this.properties.vertices.length > 0) {
            this.bounds.setFromPoints(this.properties.vertices);
        }
    }
    
    /**
     * Calculate image bounds
     * @private
     */
    calculateImageBounds() {
        this.bounds.set(0, 0, this.properties.width, this.properties.height);
    }
    
    /**
     * Calculate text bounds
     * @private
     */
    calculateTextBounds() {
        // Use text measurement service
        const metrics = TextMetrics.measure(this.properties);
        this.bounds.set(0, 0, metrics.width, metrics.height);
    }
    
    /**
     * Add a child node
     * @param {SceneNode} child - The child node to add
     */
    addChild(child) {
        if (child.parent) {
            child.parent.removeChild(child);
        }
        
        child.parent = this;
        this.children.push(child);
        
        child.isTransformDirty = true;
        this.isBoundsDirty = true;
        
        if (this.scene) {
            this.scene.sceneObserver.onNodeAdded(child);
        }
        
        this.events.emit('childAdded', { child });
        
        return child;
    }
    
    /**
     * Remove a child node
     * @param {SceneNode} child - The child node to remove
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
            
            this.isBoundsDirty = true;
            
            if (this.scene) {
                this.scene.sceneObserver.onNodeRemoved(child);
            }
            
            this.events.emit('childRemoved', { child });
        }
        
        return child;
    }
    
    /**
     * Add an effect to the node
     * @param {Effect} effect - The effect to add
     */
    addEffect(effect) {
        this.effects.push(effect);
        effect.node = this;
        
        this.isDirty = true;
        this.isBoundsDirty = true;
        
        this.events.emit('effectAdded', { effect });
    }
    
    /**
     * Remove an effect from the node
     * @param {Effect} effect - The effect to remove
     */
    removeEffect(effect) {
        const index = this.effects.indexOf(effect);
        if (index !== -1) {
            this.effects.splice(index, 1);
            effect.node = null;
            
            this.isDirty = true;
            this.isBoundsDirty = true;
            
            this.events.emit('effectRemoved', { effect });
        }
    }
    
    /**
     * Add a constraint to the node
     * @param {Constraint} constraint - The constraint to add
     */
    addConstraint(constraint) {
        this.constraints.push(constraint);
        constraint.node = this;
        
        this.events.emit('constraintAdded', { constraint });
    }
    
    /**
     * Remove a constraint from the node
     * @param {Constraint} constraint - The constraint to remove
     */
    removeConstraint(constraint) {
        const index = this.constraints.indexOf(constraint);
        if (index !== -1) {
            this.constraints.splice(index, 1);
            constraint.node = null;
            
            this.events.emit('constraintRemoved', { constraint });
        }
    }
    
    /**
     * Set the node's layout
     * @param {Layout} layout - The layout to set
     */
    setLayout(layout) {
        if (this.layout) {
            this.layout.dispose();
        }
        
        this.layout = layout;
        if (layout) {
            layout.node = this;
        }
        
        this.events.emit('layoutChanged', { layout });
    }
    
    /**
     * Clone the node
     * @param {boolean} deep - Whether to clone children
     * @returns {SceneNode} - The cloned node
     */
    clone(deep = true) {
        const clone = new SceneNode(this.id);
        
        // Copy properties
        clone.properties = { ...this.properties };
        
        // Copy transform
        clone.transform.copy(this.transform);
        
        // Copy effects
        this.effects.forEach(effect => {
            clone.addEffect(effect.clone());
        });
        
        // Copy constraints
        this.constraints.forEach(constraint => {
            clone.addConstraint(constraint.clone());
        });
        
        // Copy layout
        if (this.layout) {
            clone.setLayout(this.layout.clone());
        }
        
        // Clone children
        if (deep) {
            this.children.forEach(child => {
                clone.addChild(child.clone(true));
            });
        }
        
        return clone;
    }
    
    /**
     * Convert the node to JSON
     * @returns {Object} - JSON representation
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            properties: { ...this.properties },
            transform: this.transform.toJSON(),
            effects: this.effects.map(effect => effect.toJSON()),
            constraints: this.constraints.map(constraint => constraint.toJSON()),
            layout: this.layout ? this.layout.toJSON() : null,
            children: this.children.map(child => child.toJSON())
        };
    }
    
    /**
     * Load the node from JSON
     * @param {Object} json - JSON representation
     */
    fromJSON(json) {
        this.id = json.id;
        this.type = json.type;
        this.name = json.name;
        this.properties = { ...json.properties };
        
        this.transform.fromJSON(json.transform);
        
        // Load effects
        this.effects = json.effects.map(effectJson => {
            const effect = Effect.fromJSON(effectJson);
            effect.node = this;
            return effect;
        });
        
        // Load constraints
        this.constraints = json.constraints.map(constraintJson => {
            const constraint = Constraint.fromJSON(constraintJson);
            constraint.node = this;
            return constraint;
        });
        
        // Load layout
        if (json.layout) {
            this.layout = Layout.fromJSON(json.layout);
            this.layout.node = this;
        }
        
        // Load children
        json.children.forEach(childJson => {
            const child = new SceneNode(childJson.id);
            child.fromJSON(childJson);
            this.addChild(child);
        });
        
        this.isDirty = true;
        this.isTransformDirty = true;
        this.isBoundsDirty = true;
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        // Remove from parent
        if (this.parent) {
            this.parent.removeChild(this);
        }
        
        // Dispose effects
        this.effects.forEach(effect => effect.dispose());
        this.effects = [];
        
        // Dispose constraints
        this.constraints.forEach(constraint => constraint.dispose());
        this.constraints = [];
        
        // Dispose layout
        if (this.layout) {
            this.layout.dispose();
            this.layout = null;
        }
        
        // Dispose children
        this.children.forEach(child => child.dispose());
        this.children = [];
        
        // Clear events
        this.events.removeAllListeners();
    }

    getWorldTransform() {
        const worldTransform = this.transform.clone();
        let current = this.parent;
        
        while (current) {
            const parentTransform = current.transform;
            // Apply parent transform
            worldTransform.x += parentTransform.x;
            worldTransform.y += parentTransform.y;
            worldTransform.rotation += parentTransform.rotation;
            worldTransform.scaleX *= parentTransform.scaleX;
            worldTransform.scaleY *= parentTransform.scaleY;
            current = current.parent;
        }
        
        return worldTransform;
    }

    traverse(callback) {
        callback(this);
        for (const child of this.children) {
            child.traverse(callback);
        }
    }
}

// Make SceneNode available globally
window.SceneNode = SceneNode; 