/**
 * AABB (Axis-Aligned Bounding Box) Class
 * 
 * Represents a rectangle aligned with the coordinate axes.
 * Used for spatial queries, collision detection, and bounds calculations.
 * Optimized for performance with minimal object creation.
 */

export class AABB {
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
    }
    
    /**
     * Set the bounds directly
     * @param {number} x - Minimum X coordinate
     * @param {number} y - Minimum Y coordinate
     * @param {number} width - Width
     * @param {number} height - Height
     * @returns {AABB} - This AABB for chaining
     */
    set(x, y, width, height) {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
        return this;
    }
    
    /**
     * Copy another AABB
     * @param {AABB} aabb - AABB to copy
     * @returns {AABB} - This AABB for chaining
     */
    copy(aabb) {
        this._x = aabb._x;
        this._y = aabb._y;
        this._width = aabb._width;
        this._height = aabb._height;
        return this;
    }
    
    /**
     * Clone this AABB
     * @returns {AABB} - New AABB with same bounds
     */
    clone() {
        return new AABB(this._x, this._y, this._width, this._height);
    }
    
    /**
     * Check if this AABB equals another
     * @param {AABB} aabb - AABB to compare with
     * @returns {boolean} - Whether the AABBs are equal
     */
    equals(aabb) {
        return this._x === aabb._x &&
               this._y === aabb._y &&
               this._width === aabb._width &&
               this._height === aabb._height;
    }
    
    /**
     * Get the width of the AABB
     * @returns {number} - Width
     */
    get width() {
        return this._width;
    }
    
    /**
     * Get the height of the AABB
     * @returns {number} - Height
     */
    get height() {
        return this._height;
    }
    
    /**
     * Get the center X coordinate
     * @returns {number} - Center X
     */
    get centerX() {
        return this._x + this._width * 0.5;
    }
    
    /**
     * Get the center Y coordinate
     * @returns {number} - Center Y
     */
    get centerY() {
        return this._y + this._height * 0.5;
    }
    
    /**
     * Get the area of the AABB
     * @returns {number} - Area
     */
    get area() {
        return this._width * this._height;
    }
    
    /**
     * Get the perimeter of the AABB
     * @returns {number} - Perimeter
     */
    get perimeter() {
        return 2 * (this._width + this._height);
    }
    
    /**
     * Check if the AABB is empty (has zero area)
     * @returns {boolean} - Whether the AABB is empty
     */
    isEmpty() {
        return this._width <= 0 || this._height <= 0;
    }
    
    /**
     * Clear the AABB (set to empty)
     * @returns {AABB} - This AABB for chaining
     */
    clear() {
        this._x = 0;
        this._y = 0;
        this._width = 0;
        this._height = 0;
        return this;
    }
    
    /**
     * Set from center and size
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} width - Width
     * @param {number} height - Height
     * @returns {AABB} - This AABB for chaining
     */
    setFromCenter(centerX, centerY, width, height) {
        const halfWidth = width * 0.5;
        const halfHeight = height * 0.5;
        
        this._x = centerX - halfWidth;
        this._y = centerY - halfHeight;
        this._width = width;
        this._height = height;
        
        return this;
    }
    
    /**
     * Set from points
     * @param {Array} points - Array of points with x and y coordinates
     * @returns {AABB} - This AABB for chaining
     */
    setFromPoints(points) {
        if (points.length === 0) {
            return this.clear();
        }
        
        this._x = this._width = points[0]._x;
        this._y = this._height = points[0]._y;
        
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            this._x = Math.min(this._x, point._x);
            this._y = Math.min(this._y, point._y);
            this._width = Math.max(this._width, point._x);
            this._height = Math.max(this._height, point._y);
        }
        
        this._width -= this._x;
        this._height -= this._y;
        
        return this;
    }
    
    /**
     * Set from path
     * @param {Path2D} path - Path to calculate bounds from
     * @returns {AABB} - This AABB for chaining
     */
    setFromPath(path) {
        const bounds = path.getBounds();
        return this.set(bounds.x, bounds.y, bounds.width, bounds.height);
    }
    
    /**
     * Transform this AABB by a transform matrix
     * @param {Transform} transform - Transform to apply
     * @returns {AABB} - This AABB for chaining
     */
    transform(transform) {
        // Transform all four corners and compute new bounds
        const points = [
            { x: this._x, y: this._y },
            { x: this._x + this._width, y: this._y },
            { x: this._x, y: this._y + this._height },
            { x: this._x + this._width, y: this._y + this._height }
        ].map(p => transform.transformPoint(p));

        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);
        
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);

        this.set(minX, minY, maxX - minX, maxY - minY);
        return this;
    }
    
    /**
     * Expand the AABB by a margin
     * @param {number} margin - Margin to expand by
     * @returns {AABB} - This AABB for chaining
     */
    expand(margin) {
        this._x -= margin;
        this._y -= margin;
        this._width += margin * 2;
        this._height += margin * 2;
        return this;
    }
    
    /**
     * Scale the AABB by a factor
     * @param {number} scale - Scale factor
     * @returns {AABB} - This AABB for chaining
     */
    scale(scale) {
        const centerX = this.centerX;
        const centerY = this.centerY;
        const halfWidth = this._width * 0.5 * scale;
        const halfHeight = this._height * 0.5 * scale;
        
        this._x = centerX - halfWidth;
        this._y = centerY - halfHeight;
        this._width = halfWidth * 2;
        this._height = halfHeight * 2;
        
        return this;
    }
    
    /**
     * Union with another AABB
     * @param {AABB} aabb - AABB to union with
     * @returns {AABB} - This AABB for chaining
     */
    union(aabb) {
        const x = Math.min(this._x, aabb._x);
        const y = Math.min(this._y, aabb._y);
        const width = Math.max(this._x + this._width, aabb._x + aabb._width) - x;
        const height = Math.max(this._y + this._height, aabb._y + aabb._height) - y;
        this.set(x, y, width, height);
        return this;
    }
    
    /**
     * Intersect with another AABB
     * @param {AABB} aabb - AABB to intersect with
     * @returns {AABB} - This AABB for chaining
     */
    intersect(aabb) {
        this._x = Math.max(this._x, aabb._x);
        this._y = Math.max(this._y, aabb._y);
        this._width = Math.min(this._x + this._width, aabb._x + aabb._width) - this._x;
        this._height = Math.min(this._y + this._height, aabb._y + aabb._height) - this._y;
        return this;
    }
    
    /**
     * Check if this AABB contains a point
     * @param {number} x - Point X coordinate
     * @param {number} y - Point Y coordinate
     * @returns {boolean} - Whether the point is contained
     */
    containsPoint(x, y) {
        return x >= this._x && x <= this._x + this._width &&
               y >= this._y && y <= this._y + this._height;
    }
    
    /**
     * Check if this AABB contains another AABB
     * @param {AABB} aabb - AABB to check
     * @returns {boolean} - Whether the AABB is contained
     */
    containsAABB(aabb) {
        return aabb._x >= this._x && aabb._x + aabb._width <= this._x + this._width &&
               aabb._y >= this._y && aabb._y + aabb._height <= this._y + this._height;
    }
    
    /**
     * Check if this AABB intersects another AABB
     * @param {AABB} aabb - AABB to check
     * @returns {boolean} - Whether the AABBs intersect
     */
    intersectsAABB(aabb) {
        return this._x < aabb._x + aabb._width &&
               this._x + this._width > aabb._x &&
               this._y < aabb._y + aabb._height &&
               this._y + this._height > aabb._y;
    }
    
    /**
     * Get the intersection area with another AABB
     * @param {AABB} aabb - AABB to check
     * @returns {number} - Intersection area
     */
    getIntersectionArea(aabb) {
        if (!this.intersectsAABB(aabb)) {
            return 0;
        }
        
        const intersectionWidth = Math.min(this._x + this._width, aabb._x + aabb._width) - Math.max(this._x, aabb._x);
        const intersectionHeight = Math.min(this._y + this._height, aabb._y + aabb._height) - Math.max(this._y, aabb._y);
        
        return intersectionWidth * intersectionHeight;
    }
    
    /**
     * Get the closest point on the AABB to a point
     * @param {number} x - Point X coordinate
     * @param {number} y - Point Y coordinate
     * @returns {Object} - Closest point
     */
    getClosestPoint(x, y) {
        return {
            x: Math.max(this._x, Math.min(this._x + this._width, x)),
            y: Math.max(this._y, Math.min(this._y + this._height, y))
        };
    }
    
    /**
     * Get the distance to a point
     * @param {number} x - Point X coordinate
     * @param {number} y - Point Y coordinate
     * @returns {number} - Distance to point
     */
    getDistanceToPoint(x, y) {
        const closest = this.getClosestPoint(x, y);
        const dx = x - closest.x;
        const dy = y - closest.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Convert to array [x, y, width, height]
     * @returns {Array} - Array representation
     */
    toArray() {
        return [this._x, this._y, this._width, this._height];
    }
    
    /**
     * Convert to JSON
     * @returns {Object} - JSON representation
     */
    toJSON() {
        return {
            x: this._x,
            y: this._y,
            width: this._width,
            height: this._height
        };
    }
    
    /**
     * Load from JSON
     * @param {Object} json - JSON representation
     * @returns {AABB} - This AABB for chaining
     */
    fromJSON(json) {
        return this.set(json.x, json.y, json.width, json.height);
    }
}

// Make AABB available globally
window.AABB = AABB; 