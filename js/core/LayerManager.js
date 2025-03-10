/**
 * LayerManager Class
 * 
 * Manages rendering layers and z-ordering of nodes in the scene.
 * Provides efficient sorting and batching of nodes for rendering.
 * Supports layer visibility, opacity, and blending modes.
 */

class LayerManager {
    constructor() {
        // Layer definitions
        this.layers = new Map();
        
        // Nodes by layer
        this.nodesByLayer = new Map();
        
        // Sorted nodes cache
        this._sortedNodes = null;
        this._sortedNodesVersion = 0;
        this._currentVersion = 0;
        
        // Initialize default layers
        this.initializeDefaultLayers();
    }
    
    /**
     * Initialize default layers
     * @private
     */
    initializeDefaultLayers() {
        // Background layer
        this.createLayer('background', {
            name: 'Background',
            zIndex: -1000,
            visible: true,
            opacity: 1,
            blendMode: 'normal'
        });
        
        // Default layer
        this.createLayer('default', {
            name: 'Layer 1',
            zIndex: 0,
            visible: true,
            opacity: 1,
            blendMode: 'normal'
        });
        
        // UI layer
        this.createLayer('ui', {
            name: 'UI',
            zIndex: 1000,
            visible: true,
            opacity: 1,
            blendMode: 'normal'
        });
    }
    
    /**
     * Create a new layer
     * @param {string} id - Layer ID
     * @param {Object} options - Layer options
     */
    createLayer(id, options = {}) {
        const layer = {
            id,
            name: options.name || id,
            zIndex: options.zIndex || 0,
            visible: options.visible !== undefined ? options.visible : true,
            opacity: options.opacity !== undefined ? options.opacity : 1,
            blendMode: options.blendMode || 'normal',
            mask: options.mask || null,
            effects: options.effects || [],
            metadata: options.metadata || {}
        };
        
        this.layers.set(id, layer);
        this.nodesByLayer.set(id, []);
        this._currentVersion++;
    }
    
    /**
     * Delete a layer
     * @param {string} id - Layer ID
     */
    deleteLayer(id) {
        // Move nodes to default layer
        const nodes = this.nodesByLayer.get(id) || [];
        const defaultNodes = this.nodesByLayer.get('default');
        defaultNodes.push(...nodes);
        
        // Update nodes' layer reference
        nodes.forEach(node => {
            node.layer = 'default';
        });
        
        this.layers.delete(id);
        this.nodesByLayer.delete(id);
        this._currentVersion++;
    }
    
    /**
     * Get a layer by ID
     * @param {string} id - Layer ID
     * @returns {Object} - Layer object
     */
    getLayer(id) {
        return this.layers.get(id);
    }
    
    /**
     * Set layer properties
     * @param {string} id - Layer ID
     * @param {Object} properties - Properties to set
     */
    setLayerProperties(id, properties) {
        const layer = this.layers.get(id);
        if (!layer) return;
        
        Object.assign(layer, properties);
        this._currentVersion++;
    }
    
    /**
     * Add a node to a layer
     * @param {SceneNode} node - Node to add
     */
    addNode(node) {
        const layerId = node.layer || 'default';
        const nodes = this.nodesByLayer.get(layerId);
        
        if (nodes) {
            nodes.push(node);
            this._currentVersion++;
        }
    }
    
    /**
     * Remove a node from its layer
     * @param {SceneNode} node - Node to remove
     */
    removeNode(node) {
        const layerId = node.layer || 'default';
        const nodes = this.nodesByLayer.get(layerId);
        
        if (nodes) {
            const index = nodes.indexOf(node);
            if (index !== -1) {
                nodes.splice(index, 1);
                this._currentVersion++;
            }
        }
    }
    
    /**
     * Move a node to a different layer
     * @param {SceneNode} node - Node to move
     * @param {string} targetLayerId - Target layer ID
     */
    moveNodeToLayer(node, targetLayerId) {
        this.removeNode(node);
        node.layer = targetLayerId;
        this.addNode(node);
    }
    
    /**
     * Get all nodes in render order
     * @returns {Array} - Array of nodes in render order
     */
    getSortedNodes() {
        // Return cached result if valid
        if (this._sortedNodes && this._sortedNodesVersion === this._currentVersion) {
            return this._sortedNodes;
        }
        
        // Get layers in order
        const sortedLayers = Array.from(this.layers.values())
            .sort((a, b) => a.zIndex - b.zIndex);
        
        // Collect visible nodes from each layer
        const result = [];
        for (const layer of sortedLayers) {
            if (!layer.visible) continue;
            
            const nodes = this.nodesByLayer.get(layer.id) || [];
            
            // Sort nodes within layer by zIndex
            const sortedNodes = nodes
                .filter(node => node.properties.visible)
                .sort((a, b) => a.zIndex - b.zIndex);
            
            result.push({
                layer,
                nodes: sortedNodes
            });
        }
        
        // Cache result
        this._sortedNodes = result;
        this._sortedNodesVersion = this._currentVersion;
        
        return result;
    }
    
    /**
     * Get nodes for batched rendering
     * @returns {Object} - Batched nodes by material properties
     */
    getBatchedNodes() {
        const sortedNodes = this.getSortedNodes();
        const batches = new Map();
        
        for (const { layer, nodes } of sortedNodes) {
            for (const node of nodes) {
                // Generate batch key based on material properties
                const key = this.getBatchKey(node, layer);
                
                if (!batches.has(key)) {
                    batches.set(key, {
                        layer,
                        material: this.getMaterialProperties(node, layer),
                        nodes: []
                    });
                }
                
                batches.get(key).nodes.push(node);
            }
        }
        
        return Array.from(batches.values());
    }
    
    /**
     * Generate a batch key for a node
     * @private
     */
    getBatchKey(node, layer) {
        // Combine relevant properties for batching
        return [
            node.type,
            layer.blendMode,
            node.properties.fill,
            node.properties.stroke,
            node.properties.strokeWidth,
            node.effects.map(e => e.type).join(',')
        ].join('|');
    }
    
    /**
     * Get material properties for a node
     * @private
     */
    getMaterialProperties(node, layer) {
        return {
            blendMode: layer.blendMode,
            opacity: layer.opacity * node.properties.opacity,
            fill: node.properties.fill,
            stroke: node.properties.stroke,
            strokeWidth: node.properties.strokeWidth,
            effects: [...node.effects]
        };
    }
    
    /**
     * Clear all layers
     */
    clear() {
        this.layers.clear();
        this.nodesByLayer.clear();
        this._sortedNodes = null;
        this._currentVersion++;
        
        // Reinitialize default layers
        this.initializeDefaultLayers();
    }
    
    /**
     * Convert to JSON
     * @returns {Object} - JSON representation
     */
    toJSON() {
        return {
            layers: Array.from(this.layers.entries()).map(([id, layer]) => ({
                id,
                ...layer
            }))
        };
    }
    
    /**
     * Load from JSON
     * @param {Object} json - JSON representation
     */
    fromJSON(json) {
        this.clear();
        
        for (const layerData of json.layers) {
            const { id, ...options } = layerData;
            this.createLayer(id, options);
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        this.clear();
    }
}

// Export the LayerManager class
window.LayerManager = LayerManager; 