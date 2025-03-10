import { EventEmitter } from '../EventEmitter.js';
import { Transform } from './Transform.js';
import { SceneNode } from './SceneNode.js';
import { AABB } from './AABB.js';

/**
 * Scene Graph Implementation
 * 
 * A professional-grade scene graph implementation with spatial partitioning,
 * efficient traversal, and advanced querying capabilities.
 */

export class Scene extends EventEmitter {
    constructor() {
        super();
        this.root = null;
        this.nodes = new Map();
        this.selectedNodes = new Set();
        this.transform = new Transform();
        this.spatialIndex = new Map();
        this.dirtyNodes = new Set();
        this.setupObservers();
    }

    /**
     * Set up mutation observers and event handlers
     */
    setupObservers() {
        this.sceneObserver = {
            onNodeAdded: (node) => {
                this.nodes.set(node.id, node);
                this.emit('nodeAdded', node);
            },
            onNodeRemoved: (node) => {
                this.nodes.delete(node.id);
                this.selectedNodes.delete(node);
                this.emit('nodeRemoved', node);
            },
            onNodeChanged: (node) => {
                this.emit('nodeChanged', node);
            }
        };
    }

    /**
     * Add a node to the scene
     * @param {SceneNode} node - The node to add
     * @param {SceneNode} parent - Parent node (defaults to root)
     */
    addNode(node, parent = this.root) {
        if (!this.root) {
            this.root = node;
        } else if (parent && parent !== node) {
            // Add to parent if provided and not the same as node
            if (parent.children.indexOf(node) === -1) {
                parent.children.push(node);
                node.parent = parent;
            }
        }
        
        // Always add to nodes map
        node.scene = this;
        this.nodes.set(node.id, node);
        
        // Notify observers
        this.emit('nodeAdded', { node, parent });
        
        return node;
    }

    /**
     * Remove a node from the scene
     * @param {SceneNode} node - The node to remove
     */
    removeNode(node) {
        if (node === this.root) {
            this.root = null;
        }
        node.scene = null;
        this.sceneObserver.onNodeRemoved(node);
    }

    /**
     * Get a node by its ID
     * @param {string} id - The ID of the node to retrieve
     * @returns {SceneNode} - The retrieved node
     */
    getNodeById(id) {
        return this.nodes.get(id);
    }

    /**
     * Select a node
     * @param {SceneNode} node - The node to select
     */
    selectNode(node) {
        if (!this.selectedNodes.has(node)) {
            this.selectedNodes.add(node);
            this.emit('selectionChanged', Array.from(this.selectedNodes));
        }
    }

    /**
     * Deselect a node
     * @param {SceneNode} node - The node to deselect
     */
    deselectNode(node) {
        if (this.selectedNodes.has(node)) {
            this.selectedNodes.delete(node);
            this.emit('selectionChanged', Array.from(this.selectedNodes));
        }
    }

    /**
     * Clear the selection
     */
    clearSelection() {
        if (this.selectedNodes.size > 0) {
            this.selectedNodes.clear();
            this.emit('selectionChanged', []);
        }
    }

    /**
     * Query nodes in a specific region
     * @param {AABB} bounds - The bounds to query
     * @param {Object} options - Query options
     * @returns {Array<SceneNode>} - Matching nodes
     */
    queryRegion(bounds, options = {}) {
        const result = new Set();
        
        // Get nodes from spatial index
        const candidates = this.spatialIndex.query(bounds);
        
        // Filter based on options
        for (const node of candidates) {
            if (this.nodeMatchesQuery(node, options)) {
                result.add(node);
            }
        }
        
        return Array.from(result);
    }

    /**
     * Check if a node matches query options
     * @private
     */
    nodeMatchesQuery(node, options) {
        if (options.type && node.type !== options.type) return false;
        if (options.layer && node.layer !== options.layer) return false;
        if (options.tag && !node.tags.has(options.tag)) return false;
        if (options.visible !== undefined && node.visible !== options.visible) return false;
        return true;
    }

    /**
     * Update the spatial index for a node
     * @private
     */
    updateSpatialIndex(node) {
        this.spatialIndex.remove(node);
        this.spatialIndex.insert(node);
    }

    /**
     * Mark a region as needing redraw
     * @param {AABB} bounds - The bounds to mark as dirty
     */
    markDirty(bounds) {
        // Find all nodes in the affected region
        const affectedNodes = this.spatialIndex.query(bounds);
        
        // Mark them as dirty
        affectedNodes.forEach(node => {
            this.dirtyNodes.add(node);
        });
    }

    /**
     * Get all dirty nodes and clear the dirty set
     * @returns {Set<SceneNode>} - The set of dirty nodes
     */
    getDirtyNodes() {
        const dirty = new Set(this.dirtyNodes);
        this.dirtyNodes.clear();
        return dirty;
    }

    /**
     * Calculate scene complexity for performance optimization
     * @returns {number} - Complexity score
     */
    getComplexityScore() {
        let score = 0;
        
        this.traverse(node => {
            // Base score for each node
            score += 1;
            
            // Additional score based on node type
            switch (node.type) {
                case 'shape':
                    score += node.getVertexCount() * 0.1;
                    break;
                case 'image':
                    score += (node.width * node.height) * 0.0001;
                    break;
                case 'text':
                    score += node.text.length * 0.5;
                    break;
                case 'group':
                    score += node.children.length * 0.3;
                    break;
            }
            
            // Additional score for effects
            if (node.effects) {
                score += node.effects.length * 2;
            }
        });
        
        return score;
    }

    /**
     * Traverse the scene graph
     * @param {Function} callback - Function to call for each node
     * @param {Object} options - Traversal options
     */
    traverse(callback, options = {}) {
        if (!this.root) {
            // If no root, iterate through all nodes in the map
            this.nodes.forEach(node => {
                callback(node, 0);
            });
            return;
        }
        
        // Always call callback on root
        callback(this.root, 0);
        
        const traverseNode = (node, depth = 0) => {
            // Check visibility
            if (options.visibleOnly && !node.visible) return;
            
            // Check depth
            if (options.maxDepth && depth > options.maxDepth) return;
            
            // Traverse children
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => {
                    callback(child, depth + 1);
                    traverseNode(child, depth + 1);
                });
            }
        };
        
        traverseNode(this.root);
    }

    /**
     * Handle node addition
     * @private
     */
    handleNodeAdded({ node, parent }) {
        // Update parent bounds
        parent.updateBounds();
        
        // Update constraints
        this.updateConstraints(node);
    }

    /**
     * Handle node removal
     * @private
     */
    handleNodeRemoved({ node }) {
        // Update parent bounds
        if (node.parent) {
            node.parent.updateBounds();
        }
        
        // Clean up constraints
        this.removeConstraints(node);
    }

    /**
     * Handle node modification
     * @private
     */
    handleNodeModified({ node }) {
        // Update bounds
        node.updateBounds();
        
        // Update constraints
        this.updateConstraints(node);
    }

    /**
     * Handle node transformation
     * @private
     */
    handleNodeTransformed({ node }) {
        // Update spatial index
        this.updateSpatialIndex(node);
        
        // Update constraints
        this.updateConstraints(node);
    }

    /**
     * Update constraints for a node
     * @private
     */
    updateConstraints(node) {
        if (node.constraints) {
            node.constraints.forEach(constraint => {
                constraint.update();
            });
        }
    }

    /**
     * Remove constraints for a node
     * @private
     */
    removeConstraints(node) {
        if (node.constraints) {
            node.constraints.forEach(constraint => {
                constraint.dispose();
            });
            node.constraints = [];
        }
    }

    /**
     * Serialize the scene to JSON
     * @returns {Object} - Serialized scene data
     */
    toJSON() {
        const serializeNode = (node) => {
            const data = {
                id: node.id,
                type: node.type,
                properties: { ...node.properties },
                transform: node.transform.toJSON(),
                children: node.children.map(serializeNode)
            };
            
            if (node.effects) {
                data.effects = node.effects.map(effect => effect.toJSON());
            }
            
            if (node.constraints) {
                data.constraints = node.constraints.map(constraint => constraint.toJSON());
            }
            
            return data;
        };
        
        return {
            version: '1.0',
            root: serializeNode(this.root),
            layers: this.renderLayers.toJSON()
        };
    }

    /**
     * Load scene from JSON
     * @param {Object} data - Serialized scene data
     */
    fromJSON(data) {
        // Clear current scene
        this.clear();
        
        const deserializeNode = (data, parent) => {
            const node = new SceneNode(data.type, data.properties);
            node.id = data.id;
            node.transform.fromJSON(data.transform);
            
            if (data.effects) {
                node.effects = data.effects.map(effectData => Effect.fromJSON(effectData));
            }
            
            if (data.constraints) {
                node.constraints = data.constraints.map(constraintData => 
                    Constraint.fromJSON(constraintData, node)
                );
            }
            
            this.addNode(node, parent);
            
            data.children.forEach(childData => {
                deserializeNode(childData, node);
            });
            
            return node;
        };
        
        // Load scene data
        deserializeNode(data.root, null);
        
        // Load layer data
        if (data.layers) {
            this.renderLayers.fromJSON(data.layers);
        }
    }

    /**
     * Clear the scene
     */
    clear() {
        this.root.children = [];
        this.nodes.clear();
        this.dirtyNodes.clear();
        this.spatialIndex = new QuadTree(new AABB(-Infinity, -Infinity, Infinity, Infinity));
        this.renderLayers.clear();
        this.selectedNodes.clear();
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.clear();
        this.sceneObserver = null;
        this.renderLayers.dispose();
    }
}

// Make Scene available globally
window.Scene = Scene; 