/**
 * Transform Class
 * 
 * Handles 2D transformations using a 3x3 matrix.
 * Provides methods for translation, rotation, scaling, and other transformations.
 * Optimized for performance with matrix pooling and minimal object creation.
 */

export class Transform {
    constructor(x = 0, y = 0, rotation = 0, scaleX = 1, scaleY = 1) {
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.scaleX = scaleX;
        this.scaleY = scaleY;
        
        // Create matrix components
        this.a = 1;  // scale x
        this.b = 0;  // skew y
        this.c = 0;  // skew x
        this.d = 1;  // scale y
        this.e = 0;  // translate x
        this.f = 0;  // translate y
        
        // Cache for decomposed transform
        this._decomposed = null;
        
        // For matrix pool
        this._pooled = false;
    }
    
    /**
     * Reset the transform to identity
     * @returns {Transform} - This transform for chaining
     */
    identity() {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.e = 0;
        this.f = 0;
        
        this._decomposed = null;
        
        return this;
    }
    
    /**
     * Copy another transform
     * @param {Transform} transform - Transform to copy
     * @returns {Transform} - This transform for chaining
     */
    copy(transform) {
        this.a = transform.a;
        this.b = transform.b;
        this.c = transform.c;
        this.d = transform.d;
        this.e = transform.e;
        this.f = transform.f;
        
        this._decomposed = transform._decomposed ? { ...transform._decomposed } : null;
        
        return this;
    }
    
    /**
     * Set the transform components directly
     * @param {number} a - Scale X
     * @param {number} b - Skew Y
     * @param {number} c - Skew X
     * @param {number} d - Scale Y
     * @param {number} e - Translate X
     * @param {number} f - Translate Y
     * @returns {Transform} - This transform for chaining
     */
    set(a, b, c, d, e, f) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.e = e;
        this.f = f;
        
        this._decomposed = null;
        
        return this;
    }
    
    /**
     * Translate the transform
     * @param {number} x - X translation
     * @param {number} y - Y translation
     * @returns {Transform} - This transform for chaining
     */
    translate(x, y) {
        this.e += x;
        this.f += y;
        
        if (this._decomposed) {
            this._decomposed.x += x;
            this._decomposed.y += y;
        }
        
        return this;
    }
    
    /**
     * Scale the transform
     * @param {number} x - X scale
     * @param {number} y - Y scale
     * @returns {Transform} - This transform for chaining
     */
    scale(x, y) {
        this.a *= x;
        this.b *= x;
        this.c *= y;
        this.d *= y;
        
        this._decomposed = null;
        
        return this;
    }
    
    /**
     * Rotate the transform
     * @param {number} angle - Angle in radians
     * @returns {Transform} - This transform for chaining
     */
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;
        
        this.a = a * cos - b * sin;
        this.b = a * sin + b * cos;
        this.c = c * cos - d * sin;
        this.d = c * sin + d * cos;
        
        this._decomposed = null;
        
        return this;
    }
    
    /**
     * Skew the transform
     * @param {number} x - X skew in radians
     * @param {number} y - Y skew in radians
     * @returns {Transform} - This transform for chaining
     */
    skew(x, y) {
        const tanX = Math.tan(x);
        const tanY = Math.tan(y);
        
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;
        
        this.a += tanY * c;
        this.b += tanY * d;
        this.c += tanX * a;
        this.d += tanX * b;
        
        this._decomposed = null;
        
        return this;
    }
    
    /**
     * Multiply this transform by another
     * @param {Transform} transform - Transform to multiply by
     * @returns {Transform} - This transform for chaining
     */
    multiply(transform) {
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;
        const e = this.e;
        const f = this.f;
        
        this.a = a * transform.a + b * transform.c;
        this.b = a * transform.b + b * transform.d;
        this.c = c * transform.a + d * transform.c;
        this.d = c * transform.b + d * transform.d;
        this.e = e * transform.a + f * transform.c + transform.e;
        this.f = e * transform.b + f * transform.d + transform.f;
        
        this._decomposed = null;
        
        return this;
    }
    
    /**
     * Invert the transform
     * @returns {Transform} - This transform for chaining
     */
    invert() {
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;
        const e = this.e;
        const f = this.f;
        
        const det = a * d - b * c;
        
        if (det === 0) {
            return this.identity();
        }
        
        const invDet = 1 / det;
        
        this.a = d * invDet;
        this.b = -b * invDet;
        this.c = -c * invDet;
        this.d = a * invDet;
        this.e = (c * f - d * e) * invDet;
        this.f = (b * e - a * f) * invDet;
        
        this._decomposed = null;
        
        return this;
    }
    
    /**
     * Decompose the transform into translation, rotation, scale, and skew
     * @returns {Object} - Decomposed transform
     */
    decompose() {
        if (this._decomposed) {
            return this._decomposed;
        }
        
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;
        const e = this.e;
        const f = this.f;
        
        const delta = a * d - b * c;
        
        const result = {
            x: e,
            y: f,
            rotation: 0,
            scaleX: 0,
            scaleY: 0,
            skewX: 0,
            skewY: 0
        };
        
        // Apply QR decomposition
        if (a !== 0 || b !== 0) {
            const r = Math.sqrt(a * a + b * b);
            result.rotation = b > 0 ? Math.acos(a / r) : -Math.acos(a / r);
            result.scaleX = r;
            result.scaleY = delta / r;
            result.skewX = Math.atan((a * c + b * d) / (r * r));
            result.skewY = 0;
        } else if (c !== 0 || d !== 0) {
            const s = Math.sqrt(c * c + d * d);
            result.rotation = Math.PI / 2 - (d > 0 ? Math.acos(-c / s) : -Math.acos(c / s));
            result.scaleX = delta / s;
            result.scaleY = s;
            result.skewX = 0;
            result.skewY = Math.atan((a * c + b * d) / (s * s));
        }
        
        this._decomposed = result;
        return result;
    }
    
    /**
     * Recompose the transform from decomposed values
     * @param {Object} decomposed - Decomposed transform values
     * @returns {Transform} - This transform for chaining
     */
    recompose(decomposed) {
        this.identity();
        
        this.translate(decomposed.x, decomposed.y);
        this.rotate(decomposed.rotation);
        this.scale(decomposed.scaleX, decomposed.scaleY);
        this.skew(decomposed.skewX, decomposed.skewY);
        
        this._decomposed = { ...decomposed };
        
        return this;
    }
    
    /**
     * Transform a point
     * @param {Object} point - Point to transform
     * @returns {Object} - Transformed point
     */
    transformPoint(point) {
        const x = point.x;
        const y = point.y;
        
        return {
            x: x * this.a + y * this.c + this.e,
            y: x * this.b + y * this.d + this.f
        };
    }
    
    /**
     * Transform an array of points
     * @param {Array} points - Points to transform
     * @returns {Array} - Transformed points
     */
    transformPoints(points) {
        return points.map(point => this.transformPoint(point));
    }
    
    /**
     * Convert to CSS transform string
     * @returns {string} - CSS transform string
     */
    toCSS() {
        return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`;
    }
    
    /**
     * Convert to WebGL matrix array (column-major)
     * @returns {Float32Array} - WebGL matrix array
     */
    toWebGL() {
        return new Float32Array([
            this.a, this.b, 0,
            this.c, this.d, 0,
            this.e, this.f, 1
        ]);
    }
    
    /**
     * Convert to JSON
     * @returns {Object} - JSON representation
     */
    toJSON() {
        return {
            a: this.a,
            b: this.b,
            c: this.c,
            d: this.d,
            e: this.e,
            f: this.f
        };
    }
    
    /**
     * Load from JSON
     * @param {Object} json - JSON representation
     * @returns {Transform} - This transform for chaining
     */
    fromJSON(json) {
        this.set(json.a, json.b, json.c, json.d, json.e, json.f);
        return this;
    }
    
    /**
     * Get a transform from the pool
     * @returns {Transform} - Pooled transform
     */
    static getFromPool() {
        if (Transform._pool.length > 0) {
            const transform = Transform._pool.pop();
            transform._pooled = false;
            return transform.identity();
        }
        return new Transform();
    }
    
    /**
     * Return a transform to the pool
     * @param {Transform} transform - Transform to return
     */
    static returnToPool(transform) {
        if (!transform._pooled && Transform._pool.length < Transform._poolSize) {
            transform._pooled = true;
            Transform._pool.push(transform);
        }
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    setRotation(rotation) {
        this.rotation = rotation;
        return this;
    }

    setScale(scaleX, scaleY) {
        this.scaleX = scaleX;
        this.scaleY = scaleY || scaleX;
        return this;
    }

    clone() {
        return new Transform(this.x, this.y, this.rotation, this.scaleX, this.scaleY);
    }
}

// Static properties
Transform._pool = [];
Transform._poolSize = 100;

// Make Transform available globally
window.Transform = Transform; 