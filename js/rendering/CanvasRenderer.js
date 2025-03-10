/**
 * CanvasRenderer Class
 * 
 * A 2D canvas renderer that serves as a fallback when WebGL is not available.
 * Implements the same interface as WebGLRenderer but uses the Canvas 2D API.
 * Optimized for performance with path batching and state caching.
 */

class CanvasRenderer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.options = {
            alpha: true,
            ...options
        };
        
        // Initialize context
        this.ctx = this.initContext();
        
        // Renderer state
        this.width = canvas.width;
        this.height = canvas.height;
        this.devicePixelRatio = window.devicePixelRatio || 1;
        this.viewportTransform = new Transform();
        this.currentTransform = new Transform();
        this.transformStack = [];
        
        // State caching
        this.currentFillStyle = '';
        this.currentStrokeStyle = '';
        this.currentLineWidth = 1;
        this.currentLineCap = 'butt';
        this.currentLineJoin = 'miter';
        this.currentMiterLimit = 10;
        this.currentGlobalAlpha = 1;
        this.currentGlobalCompositeOperation = 'source-over';
        this.currentFont = '10px sans-serif';
        this.currentTextAlign = 'left';
        this.currentTextBaseline = 'alphabetic';
        
        // Path batching
        this.pathBatch = [];
        this.maxPathBatchSize = 1000;
        
        // Initialize renderer
        this.initialize();
    }
    
    /**
     * Initialize canvas context
     * @private
     */
    initContext() {
        const ctx = this.canvas.getContext('2d', {
            alpha: this.options.alpha
        });
        
        if (!ctx) {
            throw new Error('2D context not supported');
        }
        
        return ctx;
    }
    
    /**
     * Initialize renderer
     * @private
     */
    initialize() {
        // Set up initial state
        this.ctx.globalAlpha = 1;
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.imageSmoothingEnabled = true;
        
        // Set up viewport
        this.resize(this.width, this.height);
    }
    
    /**
     * Resize the renderer
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        
        // Update canvas size
        this.canvas.width = width * this.devicePixelRatio;
        this.canvas.height = height * this.devicePixelRatio;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        
        // Update viewport transform
        this.viewportTransform.identity()
            .scale(this.devicePixelRatio, this.devicePixelRatio);
        
        // Reset context state
        this.ctx.globalAlpha = 1;
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.imageSmoothingEnabled = true;
    }
    
    /**
     * Begin a new frame
     */
    beginFrame() {
        // Clear the canvas
        if (this.options.alpha) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Reset transform
        this.currentTransform.copy(this.viewportTransform);
        this.ctx.setTransform(
            this.currentTransform.a,
            this.currentTransform.b,
            this.currentTransform.c,
            this.currentTransform.d,
            this.currentTransform.e,
            this.currentTransform.f
        );
        
        // Clear transform stack
        this.transformStack = [];
        
        // Clear path batch
        this.pathBatch = [];
    }
    
    /**
     * End the current frame
     */
    endFrame() {
        // Flush any remaining paths
        this.flushPathBatch();
    }
    
    /**
     * Push a transform onto the stack
     * @param {Transform} transform - Transform to push
     */
    pushTransform(transform) {
        // Save current transform
        this.transformStack.push(this.currentTransform.clone());
        
        // Apply new transform
        this.currentTransform.multiply(transform);
        this.ctx.setTransform(
            this.currentTransform.a,
            this.currentTransform.b,
            this.currentTransform.c,
            this.currentTransform.d,
            this.currentTransform.e,
            this.currentTransform.f
        );
    }
    
    /**
     * Pop a transform from the stack
     */
    popTransform() {
        if (this.transformStack.length === 0) return;
        
        // Restore previous transform
        this.currentTransform = this.transformStack.pop();
        this.ctx.setTransform(
            this.currentTransform.a,
            this.currentTransform.b,
            this.currentTransform.c,
            this.currentTransform.d,
            this.currentTransform.e,
            this.currentTransform.f
        );
    }
    
    /**
     * Set the current fill style
     * @param {string} style - Fill style
     */
    setFillStyle(style) {
        if (this.currentFillStyle === style) return;
        this.flushPathBatch();
        this.ctx.fillStyle = style;
        this.currentFillStyle = style;
    }
    
    /**
     * Set the current stroke style
     * @param {string} style - Stroke style
     */
    setStrokeStyle(style) {
        if (this.currentStrokeStyle === style) return;
        this.flushPathBatch();
        this.ctx.strokeStyle = style;
        this.currentStrokeStyle = style;
    }
    
    /**
     * Set the current line width
     * @param {number} width - Line width
     */
    setLineWidth(width) {
        if (this.currentLineWidth === width) return;
        this.flushPathBatch();
        this.ctx.lineWidth = width;
        this.currentLineWidth = width;
    }
    
    /**
     * Set the current line cap style
     * @param {string} cap - Line cap style
     */
    setLineCap(cap) {
        if (this.currentLineCap === cap) return;
        this.flushPathBatch();
        this.ctx.lineCap = cap;
        this.currentLineCap = cap;
    }
    
    /**
     * Set the current line join style
     * @param {string} join - Line join style
     */
    setLineJoin(join) {
        if (this.currentLineJoin === join) return;
        this.flushPathBatch();
        this.ctx.lineJoin = join;
        this.currentLineJoin = join;
    }
    
    /**
     * Set the current miter limit
     * @param {number} limit - Miter limit
     */
    setMiterLimit(limit) {
        if (this.currentMiterLimit === limit) return;
        this.flushPathBatch();
        this.ctx.miterLimit = limit;
        this.currentMiterLimit = limit;
    }
    
    /**
     * Set the current global alpha
     * @param {number} alpha - Alpha value
     */
    setGlobalAlpha(alpha) {
        if (this.currentGlobalAlpha === alpha) return;
        this.flushPathBatch();
        this.ctx.globalAlpha = alpha;
        this.currentGlobalAlpha = alpha;
    }
    
    /**
     * Set the current blend mode
     * @param {string} mode - Blend mode
     */
    setBlendMode(mode) {
        const operation = this.getCompositeOperation(mode);
        if (this.currentGlobalCompositeOperation === operation) return;
        this.flushPathBatch();
        this.ctx.globalCompositeOperation = operation;
        this.currentGlobalCompositeOperation = operation;
    }
    
    /**
     * Get composite operation for blend mode
     * @private
     */
    getCompositeOperation(mode) {
        switch (mode) {
            case 'normal': return 'source-over';
            case 'add': return 'lighter';
            case 'multiply': return 'multiply';
            case 'screen': return 'screen';
            default: return 'source-over';
        }
    }
    
    /**
     * Begin a new path
     */
    beginPath() {
        this.ctx.beginPath();
    }
    
    /**
     * Close the current path
     */
    closePath() {
        this.ctx.closePath();
    }
    
    /**
     * Move to a point
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    moveTo(x, y) {
        this.ctx.moveTo(x, y);
    }
    
    /**
     * Line to a point
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    lineTo(x, y) {
        this.ctx.lineTo(x, y);
    }
    
    /**
     * Bezier curve to a point
     * @param {number} cp1x - Control point 1 X
     * @param {number} cp1y - Control point 1 Y
     * @param {number} cp2x - Control point 2 X
     * @param {number} cp2y - Control point 2 Y
     * @param {number} x - End point X
     * @param {number} y - End point Y
     */
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
        this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }
    
    /**
     * Quadratic curve to a point
     * @param {number} cpx - Control point X
     * @param {number} cpy - Control point Y
     * @param {number} x - End point X
     * @param {number} y - End point Y
     */
    quadraticCurveTo(cpx, cpy, x, y) {
        this.ctx.quadraticCurveTo(cpx, cpy, x, y);
    }
    
    /**
     * Arc to a point
     * @param {number} x1 - Start point X
     * @param {number} y1 - Start point Y
     * @param {number} x2 - End point X
     * @param {number} y2 - End point Y
     * @param {number} radius - Arc radius
     */
    arcTo(x1, y1, x2, y2, radius) {
        this.ctx.arcTo(x1, y1, x2, y2, radius);
    }
    
    /**
     * Draw an arc
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} radius - Radius
     * @param {number} startAngle - Start angle
     * @param {number} endAngle - End angle
     * @param {boolean} anticlockwise - Whether to draw anticlockwise
     */
    arc(x, y, radius, startAngle, endAngle, anticlockwise = false) {
        this.ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise);
    }
    
    /**
     * Draw a rectangle
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     */
    rect(x, y, width, height) {
        this.ctx.rect(x, y, width, height);
    }
    
    /**
     * Fill the current path
     */
    fill() {
        this.ctx.fill();
    }
    
    /**
     * Stroke the current path
     */
    stroke() {
        this.ctx.stroke();
    }
    
    /**
     * Draw an image
     * @param {HTMLImageElement} image - Image to draw
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     */
    drawImage(image, x, y, width, height) {
        this.flushPathBatch();
        this.ctx.drawImage(image, x, y, width, height);
    }
    
    /**
     * Add a path to the batch
     * @param {Path2D} path - Path to add
     * @param {Object} style - Path style
     */
    addPathToBatch(path, style) {
        this.pathBatch.push({ path, style });
        
        if (this.pathBatch.length >= this.maxPathBatchSize) {
            this.flushPathBatch();
        }
    }
    
    /**
     * Flush the path batch
     * @private
     */
    flushPathBatch() {
        if (this.pathBatch.length === 0) return;
        
        // Group paths by style
        const styleGroups = new Map();
        for (const item of this.pathBatch) {
            const key = JSON.stringify(item.style);
            if (!styleGroups.has(key)) {
                styleGroups.set(key, []);
            }
            styleGroups.get(key).push(item.path);
        }
        
        // Draw paths by style
        for (const [key, paths] of styleGroups) {
            const style = JSON.parse(key);
            
            // Apply style
            if (style.fill) {
                this.setFillStyle(style.fill);
            }
            if (style.stroke) {
                this.setStrokeStyle(style.stroke);
                this.setLineWidth(style.lineWidth || 1);
                this.setLineCap(style.lineCap || 'butt');
                this.setLineJoin(style.lineJoin || 'miter');
                this.setMiterLimit(style.miterLimit || 10);
            }
            
            // Draw paths
            for (const path of paths) {
                if (style.fill) {
                    this.ctx.fill(path);
                }
                if (style.stroke) {
                    this.ctx.stroke(path);
                }
            }
        }
        
        // Clear batch
        this.pathBatch = [];
    }
    
    /**
     * Create a pattern
     * @param {HTMLImageElement} image - Image to create pattern from
     * @param {string} repetition - Pattern repetition
     * @returns {CanvasPattern} - Canvas pattern
     */
    createPattern(image, repetition) {
        return this.ctx.createPattern(image, repetition);
    }
    
    /**
     * Create a gradient
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     * @returns {CanvasGradient} - Canvas gradient
     */
    createLinearGradient(x1, y1, x2, y2) {
        return this.ctx.createLinearGradient(x1, y1, x2, y2);
    }
    
    /**
     * Create a radial gradient
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} r1 - Start radius
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     * @param {number} r2 - End radius
     * @returns {CanvasGradient} - Canvas gradient
     */
    createRadialGradient(x1, y1, r1, x2, y2, r2) {
        return this.ctx.createRadialGradient(x1, y1, r1, x2, y2, r2);
    }
    
    /**
     * Measure text
     * @param {string} text - Text to measure
     * @returns {TextMetrics} - Text metrics
     */
    measureText(text) {
        return this.ctx.measureText(text);
    }
    
    /**
     * Set the current font
     * @param {string} font - Font string
     */
    setFont(font) {
        if (this.currentFont === font) return;
        this.ctx.font = font;
        this.currentFont = font;
    }
    
    /**
     * Set the current text alignment
     * @param {string} align - Text alignment
     */
    setTextAlign(align) {
        if (this.currentTextAlign === align) return;
        this.ctx.textAlign = align;
        this.currentTextAlign = align;
    }
    
    /**
     * Set the current text baseline
     * @param {string} baseline - Text baseline
     */
    setTextBaseline(baseline) {
        if (this.currentTextBaseline === baseline) return;
        this.ctx.textBaseline = baseline;
        this.currentTextBaseline = baseline;
    }
    
    /**
     * Fill text
     * @param {string} text - Text to fill
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    fillText(text, x, y) {
        this.flushPathBatch();
        this.ctx.fillText(text, x, y);
    }
    
    /**
     * Stroke text
     * @param {string} text - Text to stroke
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    strokeText(text, x, y) {
        this.flushPathBatch();
        this.ctx.strokeText(text, x, y);
    }
    
    /**
     * Save the current state
     */
    save() {
        this.flushPathBatch();
        this.ctx.save();
    }
    
    /**
     * Restore the previous state
     */
    restore() {
        this.flushPathBatch();
        this.ctx.restore();
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        // Nothing to clean up for canvas renderer
    }
}

// Export the CanvasRenderer class
window.CanvasRenderer = CanvasRenderer; 