/**
 * Effects Class
 * 
 * Handles visual effects like shadows, blurs, gradients, and filters.
 * Supports both WebGL and Canvas rendering.
 * Optimized for performance with effect batching and caching.
 */

class Effects {
    constructor(renderer) {
        this.renderer = renderer;
        
        // Effect caches
        this.shadowCache = new Map();
        this.blurCache = new Map();
        this.gradientCache = new Map();
        this.filterCache = new Map();
        
        // Effect batches
        this.shadowBatch = [];
        this.blurBatch = [];
        this.filterBatch = [];
        
        // Maximum cache sizes
        this.maxCacheSize = 100;
        
        // Initialize shaders if using WebGL
        if (renderer instanceof WebGLRenderer) {
            this.initShaders();
        }
    }
    
    /**
     * Initialize WebGL shaders
     * @private
     */
    initShaders() {
        // Gaussian blur shader
        this.renderer.createShader('blur', `
            attribute vec2 aPosition;
            attribute vec2 aTexCoord;
            
            uniform mat3 uTransform;
            uniform mat3 uViewport;
            
            varying vec2 vTexCoord;
            
            void main() {
                vec3 position = uViewport * uTransform * vec3(aPosition, 1.0);
                gl_Position = vec4(position.xy, 0.0, 1.0);
                vTexCoord = aTexCoord;
            }
        `, `
            precision mediump float;
            
            uniform sampler2D uTexture;
            uniform vec2 uDirection;
            uniform float uRadius;
            
            varying vec2 vTexCoord;
            
            float gaussian(float x, float sigma) {
                return exp(-(x * x) / (2.0 * sigma * sigma));
            }
            
            void main() {
                vec4 color = vec4(0.0);
                float total = 0.0;
                
                for (float i = -uRadius; i <= uRadius; i++) {
                    float weight = gaussian(i, uRadius / 2.0);
                    vec2 offset = uDirection * i;
                    color += texture2D(uTexture, vTexCoord + offset) * weight;
                    total += weight;
                }
                
                gl_FragColor = color / total;
            }
        `);
        
        // Drop shadow shader
        this.renderer.createShader('shadow', `
            attribute vec2 aPosition;
            attribute vec2 aTexCoord;
            
            uniform mat3 uTransform;
            uniform mat3 uViewport;
            uniform vec2 uOffset;
            
            varying vec2 vTexCoord;
            
            void main() {
                vec3 position = uViewport * uTransform * vec3(aPosition + uOffset, 1.0);
                gl_Position = vec4(position.xy, 0.0, 1.0);
                vTexCoord = aTexCoord;
            }
        `, `
            precision mediump float;
            
            uniform sampler2D uTexture;
            uniform vec4 uColor;
            
            varying vec2 vTexCoord;
            
            void main() {
                float alpha = texture2D(uTexture, vTexCoord).a;
                gl_FragColor = vec4(uColor.rgb, uColor.a * alpha);
            }
        `);
    }
    
    /**
     * Apply a drop shadow effect
     * @param {Object} options - Shadow options
     */
    dropShadow(options = {}) {
        const {
            color = 'rgba(0, 0, 0, 0.5)',
            offsetX = 0,
            offsetY = 0,
            blur = 5,
            spread = 0
        } = options;
        
        // Generate cache key
        const key = `${color}-${offsetX}-${offsetY}-${blur}-${spread}`;
        
        // Check cache
        let shadow = this.shadowCache.get(key);
        if (!shadow) {
            if (this.renderer instanceof WebGLRenderer) {
                shadow = this.createWebGLShadow(options);
            } else {
                shadow = this.createCanvasShadow(options);
            }
            
            // Add to cache
            if (this.shadowCache.size >= this.maxCacheSize) {
                const firstKey = this.shadowCache.keys().next().value;
                this.shadowCache.delete(firstKey);
            }
            this.shadowCache.set(key, shadow);
        }
        
        // Apply shadow
        if (this.renderer instanceof WebGLRenderer) {
            this.applyWebGLShadow(shadow);
        } else {
            this.applyCanvasShadow(shadow);
        }
    }
    
    /**
     * Create a WebGL shadow effect
     * @private
     */
    createWebGLShadow(options) {
        const {
            color,
            offsetX,
            offsetY,
            blur,
            spread
        } = options;
        
        // Create render target for shadow
        const target = this.renderer.createRenderTarget(
            this.renderer.width,
            this.renderer.height
        );
        
        // Parse color
        const rgba = this.parseColor(color);
        
        return {
            target,
            offset: { x: offsetX, y: offsetY },
            blur,
            spread,
            color: rgba
        };
    }
    
    /**
     * Create a Canvas shadow effect
     * @private
     */
    createCanvasShadow(options) {
        const {
            color,
            offsetX,
            offsetY,
            blur,
            spread
        } = options;
        
        return {
            color,
            offset: { x: offsetX, y: offsetY },
            blur,
            spread
        };
    }
    
    /**
     * Apply a WebGL shadow effect
     * @private
     */
    applyWebGLShadow(shadow) {
        const {
            target,
            offset,
            blur,
            spread,
            color
        } = shadow;
        
        // Begin rendering to shadow target
        this.renderer.beginRenderTarget(target);
        
        // Draw content with offset and spread
        this.renderer.pushTransform(new Transform()
            .translate(offset.x, offset.y)
            .scale(1 + spread * 2, 1 + spread * 2)
        );
        
        // TODO: Draw scene content
        
        this.renderer.popTransform();
        
        // End rendering to target
        this.renderer.endRenderTarget();
        
        // Apply blur if needed
        if (blur > 0) {
            this.gaussianBlur(target, blur);
        }
        
        // Draw shadow
        this.renderer.setShader('shadow');
        this.renderer.setBlendMode('multiply');
        this.renderer.drawTexturedQuad(
            target.texture,
            0, 0,
            this.renderer.width,
            this.renderer.height,
            new Transform(),
            color
        );
    }
    
    /**
     * Apply a Canvas shadow effect
     * @private
     */
    applyCanvasShadow(shadow) {
        const {
            color,
            offset,
            blur,
            spread
        } = shadow;
        
        const ctx = this.renderer.ctx;
        
        ctx.shadowColor = color;
        ctx.shadowOffsetX = offset.x;
        ctx.shadowOffsetY = offset.y;
        ctx.shadowBlur = blur;
        
        // TODO: Handle spread for canvas
    }
    
    /**
     * Apply a Gaussian blur effect
     * @param {Object} target - Render target to blur
     * @param {number} radius - Blur radius
     */
    gaussianBlur(target, radius) {
        if (this.renderer instanceof WebGLRenderer) {
            // Horizontal pass
            const horizontal = this.renderer.createRenderTarget(
                target.width,
                target.height
            );
            
            this.renderer.beginRenderTarget(horizontal);
            this.renderer.setShader('blur');
            this.renderer.gl.uniform2f(
                this.renderer.shaders.get('blur').uniforms.uDirection,
                1 / target.width,
                0
            );
            this.renderer.gl.uniform1f(
                this.renderer.shaders.get('blur').uniforms.uRadius,
                radius
            );
            this.renderer.drawTexturedQuad(
                target.texture,
                0, 0,
                target.width,
                target.height,
                new Transform(),
                [1, 1, 1, 1]
            );
            this.renderer.endRenderTarget();
            
            // Vertical pass
            this.renderer.beginRenderTarget(target);
            this.renderer.setShader('blur');
            this.renderer.gl.uniform2f(
                this.renderer.shaders.get('blur').uniforms.uDirection,
                0,
                1 / target.height
            );
            this.renderer.gl.uniform1f(
                this.renderer.shaders.get('blur').uniforms.uRadius,
                radius
            );
            this.renderer.drawTexturedQuad(
                horizontal.texture,
                0, 0,
                target.width,
                target.height,
                new Transform(),
                [1, 1, 1, 1]
            );
            this.renderer.endRenderTarget();
        } else {
            // Canvas blur using multiple passes
            const ctx = this.renderer.ctx;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = target.width;
            tempCanvas.height = target.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Copy original content
            tempCtx.drawImage(ctx.canvas, 0, 0);
            
            // Apply blur
            ctx.globalAlpha = 0.3;
            for (let i = 1; i <= radius; i++) {
                ctx.drawImage(tempCanvas, i, 0);
                ctx.drawImage(tempCanvas, -i, 0);
                ctx.drawImage(tempCanvas, 0, i);
                ctx.drawImage(tempCanvas, 0, -i);
            }
            ctx.globalAlpha = 1;
        }
    }
    
    /**
     * Create a linear gradient
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     * @param {Array} stops - Color stops
     * @returns {Object} - Gradient object
     */
    createLinearGradient(x1, y1, x2, y2, stops) {
        if (this.renderer instanceof WebGLRenderer) {
            // Create gradient texture
            const width = Math.ceil(Math.sqrt(
                (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)
            ));
            const height = 1;
            
            const target = this.renderer.createRenderTarget(width, height);
            
            // Draw gradient to texture
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            
            const gradient = tempCtx.createLinearGradient(0, 0, width, 0);
            for (const stop of stops) {
                gradient.addColorStop(stop.offset, stop.color);
            }
            
            tempCtx.fillStyle = gradient;
            tempCtx.fillRect(0, 0, width, height);
            
            // Upload to texture
            const gl = this.renderer.gl;
            gl.bindTexture(gl.TEXTURE_2D, target.texture);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                tempCanvas
            );
            
            return {
                texture: target.texture,
                width,
                height,
                angle: Math.atan2(y2 - y1, x2 - x1)
            };
        } else {
            const gradient = this.renderer.ctx.createLinearGradient(x1, y1, x2, y2);
            for (const stop of stops) {
                gradient.addColorStop(stop.offset, stop.color);
            }
            return gradient;
        }
    }
    
    /**
     * Create a radial gradient
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} r1 - Start radius
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     * @param {number} r2 - End radius
     * @param {Array} stops - Color stops
     * @returns {Object} - Gradient object
     */
    createRadialGradient(x1, y1, r1, x2, y2, r2, stops) {
        if (this.renderer instanceof WebGLRenderer) {
            // Create gradient texture
            const size = Math.ceil(Math.max(r1, r2) * 2);
            const target = this.renderer.createRenderTarget(size, size);
            
            // Draw gradient to texture
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = size;
            tempCanvas.height = size;
            const tempCtx = tempCanvas.getContext('2d');
            
            const gradient = tempCtx.createRadialGradient(
                size / 2, size / 2, r1,
                size / 2, size / 2, r2
            );
            for (const stop of stops) {
                gradient.addColorStop(stop.offset, stop.color);
            }
            
            tempCtx.fillStyle = gradient;
            tempCtx.fillRect(0, 0, size, size);
            
            // Upload to texture
            const gl = this.renderer.gl;
            gl.bindTexture(gl.TEXTURE_2D, target.texture);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                tempCanvas
            );
            
            return {
                texture: target.texture,
                width: size,
                height: size,
                center: { x: x2 - x1, y: y2 - y1 }
            };
        } else {
            const gradient = this.renderer.ctx.createRadialGradient(
                x1, y1, r1,
                x2, y2, r2
            );
            for (const stop of stops) {
                gradient.addColorStop(stop.offset, stop.color);
            }
            return gradient;
        }
    }
    
    /**
     * Parse a color string to RGBA values
     * @private
     */
    parseColor(color) {
        const temp = document.createElement('div');
        temp.style.color = color;
        document.body.appendChild(temp);
        const style = window.getComputedStyle(temp);
        const rgb = style.color;
        document.body.removeChild(temp);
        
        const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (!match) return [0, 0, 0, 1];
        
        return [
            parseInt(match[1]) / 255,
            parseInt(match[2]) / 255,
            parseInt(match[3]) / 255,
            1
        ];
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        // Clear caches
        this.shadowCache.clear();
        this.blurCache.clear();
        this.gradientCache.clear();
        this.filterCache.clear();
        
        // Clear batches
        this.shadowBatch = [];
        this.blurBatch = [];
        this.filterBatch = [];
    }
}

// Export the Effects class
window.Effects = Effects; 