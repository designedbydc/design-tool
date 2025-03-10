/**
 * QuadTree Class
 * 
 * A spatial partitioning data structure that recursively subdivides space
 * into four quadrants. Used for efficient spatial queries and collision detection.
 * Optimized for dynamic updates and minimal memory usage.
 */

class QuadTree {
    constructor(bounds, maxObjects = 10, maxLevels = 5, level = 0) {
        this.bounds = bounds;
        this.maxObjects = maxObjects;
        this.maxLevels = maxLevels;
        this.level = level;
        
        this.objects = [];
        this.nodes = [];
        
        // For object removal
        this.objectsMap = new Map();
    }
    
    /**
     * Clear the quadtree
     */
    clear() {
        this.objects = [];
        this.objectsMap.clear();
        
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].clear();
        }
        
        this.nodes = [];
    }
    
    /**
     * Split the node into four subnodes
     */
    split() {
        const subWidth = this.bounds.width / 2;
        const subHeight = this.bounds.height / 2;
        const x = this.bounds.minX;
        const y = this.bounds.minY;
        
        // Top right
        this.nodes[0] = new QuadTree(
            new AABB(x + subWidth, y, x + subWidth * 2, y + subHeight),
            this.maxObjects,
            this.maxLevels,
            this.level + 1
        );
        
        // Top left
        this.nodes[1] = new QuadTree(
            new AABB(x, y, x + subWidth, y + subHeight),
            this.maxObjects,
            this.maxLevels,
            this.level + 1
        );
        
        // Bottom left
        this.nodes[2] = new QuadTree(
            new AABB(x, y + subHeight, x + subWidth, y + subHeight * 2),
            this.maxObjects,
            this.maxLevels,
            this.level + 1
        );
        
        // Bottom right
        this.nodes[3] = new QuadTree(
            new AABB(x + subWidth, y + subHeight, x + subWidth * 2, y + subHeight * 2),
            this.maxObjects,
            this.maxLevels,
            this.level + 1
        );
    }
    
    /**
     * Get the indices of nodes that an object belongs to
     * @param {Object} object - Object with bounds property
     * @returns {Array} - Array of node indices
     */
    getIndices(object) {
        const indices = [];
        const verticalMidpoint = this.bounds.minX + this.bounds.width / 2;
        const horizontalMidpoint = this.bounds.minY + this.bounds.height / 2;
        
        const startIsNorth = object.bounds.maxY < horizontalMidpoint;
        const startIsWest = object.bounds.maxX < verticalMidpoint;
        const endIsEast = object.bounds.minX > verticalMidpoint;
        const endIsSouth = object.bounds.minY > horizontalMidpoint;
        
        // Top right
        if (startIsNorth && endIsEast) {
            indices.push(0);
        }
        
        // Top left
        if (startIsWest && startIsNorth) {
            indices.push(1);
        }
        
        // Bottom left
        if (startIsWest && endIsSouth) {
            indices.push(2);
        }
        
        // Bottom right
        if (endIsEast && endIsSouth) {
            indices.push(3);
        }
        
        return indices;
    }
    
    /**
     * Insert an object into the quadtree
     * @param {Object} object - Object with bounds property
     */
    insert(object) {
        // If we have subnodes, add object to them
        if (this.nodes.length > 0) {
            const indices = this.getIndices(object);
            
            for (let i = 0; i < indices.length; i++) {
                this.nodes[indices[i]].insert(object);
            }
            
            return;
        }
        
        // Add object to this node
        this.objects.push(object);
        this.objectsMap.set(object, this);
        
        // Split if needed
        if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
            if (this.nodes.length === 0) {
                this.split();
            }
            
            // Add objects to subnodes
            for (let i = 0; i < this.objects.length; i++) {
                const indices = this.getIndices(this.objects[i]);
                for (let j = 0; j < indices.length; j++) {
                    this.nodes[indices[j]].insert(this.objects[i]);
                }
            }
            
            this.objects = [];
            this.objectsMap.clear();
        }
    }
    
    /**
     * Remove an object from the quadtree
     * @param {Object} object - Object to remove
     */
    remove(object) {
        const node = this.objectsMap.get(object);
        
        if (node) {
            const index = node.objects.indexOf(object);
            if (index !== -1) {
                node.objects.splice(index, 1);
                node.objectsMap.delete(object);
            }
        } else {
            // Object might be in multiple nodes
            for (let i = 0; i < this.nodes.length; i++) {
                this.nodes[i].remove(object);
            }
        }
    }
    
    /**
     * Update an object's position in the quadtree
     * @param {Object} object - Object to update
     * @param {AABB} oldBounds - Old bounds of the object
     */
    update(object, oldBounds) {
        // Store old bounds
        const tempBounds = object.bounds;
        object.bounds = oldBounds;
        
        // Remove with old bounds
        this.remove(object);
        
        // Restore new bounds and reinsert
        object.bounds = tempBounds;
        this.insert(object);
    }
    
    /**
     * Get all objects that could collide with the given object
     * @param {Object} object - Object to check
     * @returns {Array} - Array of potential colliders
     */
    getPotentialColliders(object) {
        const result = new Set();
        this.retrieve(object.bounds, result);
        result.delete(object); // Remove self
        return Array.from(result);
    }
    
    /**
     * Retrieve objects that intersect with the given bounds
     * @param {AABB} bounds - Bounds to check
     * @param {Set} result - Set to store results in
     */
    retrieve(bounds, result = new Set()) {
        if (this.nodes.length > 0) {
            const indices = this.getIndices({ bounds });
            
            for (let i = 0; i < indices.length; i++) {
                this.nodes[indices[i]].retrieve(bounds, result);
            }
        }
        
        for (let i = 0; i < this.objects.length; i++) {
            if (bounds.intersectsAABB(this.objects[i].bounds)) {
                result.add(this.objects[i]);
            }
        }
        
        return result;
    }
    
    /**
     * Query objects within a radius of a point
     * @param {number} x - Center X coordinate
     * @param {number} y - Center Y coordinate
     * @param {number} radius - Radius to check
     * @returns {Array} - Array of objects within radius
     */
    queryRadius(x, y, radius) {
        const bounds = new AABB(
            x - radius,
            y - radius,
            x + radius,
            y + radius
        );
        
        const candidates = Array.from(this.retrieve(bounds));
        const result = [];
        const radiusSq = radius * radius;
        
        for (let i = 0; i < candidates.length; i++) {
            const object = candidates[i];
            const distance = object.bounds.getDistanceToPoint(x, y);
            
            if (distance <= radius) {
                result.push(object);
            }
        }
        
        return result;
    }
    
    /**
     * Query objects that intersect a ray
     * @param {number} startX - Ray start X
     * @param {number} startY - Ray start Y
     * @param {number} dirX - Ray direction X
     * @param {number} dirY - Ray direction Y
     * @param {number} maxDistance - Maximum distance to check
     * @returns {Array} - Array of intersecting objects
     */
    queryRay(startX, startY, dirX, dirY, maxDistance) {
        // Calculate ray bounds
        const endX = startX + dirX * maxDistance;
        const endY = startY + dirY * maxDistance;
        
        const bounds = new AABB(
            Math.min(startX, endX),
            Math.min(startY, endY),
            Math.max(startX, endX),
            Math.max(startY, endY)
        );
        
        const candidates = Array.from(this.retrieve(bounds));
        const result = [];
        
        for (let i = 0; i < candidates.length; i++) {
            const object = candidates[i];
            
            // Perform more precise ray intersection test here
            if (this.rayIntersectsAABB(
                startX, startY, dirX, dirY,
                object.bounds.minX, object.bounds.minY,
                object.bounds.maxX, object.bounds.maxY
            )) {
                result.push(object);
            }
        }
        
        return result;
    }
    
    /**
     * Check if a ray intersects an AABB
     * @private
     */
    rayIntersectsAABB(startX, startY, dirX, dirY, minX, minY, maxX, maxY) {
        const invDirX = 1 / dirX;
        const invDirY = 1 / dirY;
        
        let tNear, tFar, tymin, tymax;
        
        if (invDirX >= 0) {
            tNear = (minX - startX) * invDirX;
            tFar = (maxX - startX) * invDirX;
        } else {
            tNear = (maxX - startX) * invDirX;
            tFar = (minX - startX) * invDirX;
        }
        
        if (invDirY >= 0) {
            tymin = (minY - startY) * invDirY;
            tymax = (maxY - startY) * invDirY;
        } else {
            tymin = (maxY - startY) * invDirY;
            tymax = (minY - startY) * invDirY;
        }
        
        if (tNear > tymax || tymin > tFar) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Get statistics about the quadtree
     * @returns {Object} - Statistics object
     */
    getStats() {
        let totalNodes = 1;
        let totalObjects = this.objects.length;
        let maxDepth = this.level;
        
        for (let i = 0; i < this.nodes.length; i++) {
            const stats = this.nodes[i].getStats();
            totalNodes += stats.totalNodes;
            totalObjects += stats.totalObjects;
            maxDepth = Math.max(maxDepth, stats.maxDepth);
        }
        
        return {
            totalNodes,
            totalObjects,
            maxDepth,
            averageObjectsPerNode: totalObjects / totalNodes
        };
    }
}

// Export the QuadTree class
window.QuadTree = QuadTree; 