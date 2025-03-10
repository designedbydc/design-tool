/**
 * WebGLRenderer Class
 * 
 * High-performance WebGL renderer with support for:
 * - Batch rendering
 * - Hardware-accelerated transforms
 * - Custom shaders
 * - Texture caching
 * - Render targets
 * - Blend modes
 * - Effects
 */

class WebGLRenderer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.options = {
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: false,
            ...options
        };
        
        // Initialize WebGL context
        this.gl = this.initWebGL();
        
        // Renderer state
        this.width = canvas.width;
        this.height = canvas.height;
        this.devicePixelRatio = window.devicePixelRatio || 1;
        this.viewportTransform = new Transform();
        this.currentBatch = null;
        this.currentShader = null;
        this.currentTexture = null;
        this.currentBlendMode = 'normal';
        
        // Resource management
        this.shaders = new Map();
        this.textures = new Map();
        this.buffers = new Map();
        this.renderTargets = new Map();
        
        // Batch management
        this.maxBatchSize = 16384; // Maximum vertices per batch
        this.batchVertices = new Float32Array(this.maxBatchSize * 2);
        this.batchColors = new Float32Array(this.maxBatchSize * 4);
        this.batchUVs = new Float32Array(this.maxBatchSize * 2);
        this.batchIndices = new Uint16Array(this.maxBatchSize * 1.5);
        this.batchSize = 0;
        
        // Initialize renderer
        this.initialize();
    }
    
    /**
     * Initialize WebGL context
     * @private
     */
    initWebGL() {
        const contextOptions = {
            antialias: this.options.antialias,
            alpha: this.options.alpha,
            preserveDrawingBuffer: this.options.preserveDrawingBuffer,
            premultipliedAlpha: true,
            depth: false,
            stencil: true
        };
        
        const gl = this.canvas.getContext('webgl2', contextOptions) ||
                  this.canvas.getContext('webgl', contextOptions);
        
        if (!gl) {
            throw new Error('WebGL not supported');
        }
        
        return gl;
    }
    
    /**
     * Initialize renderer
     * @private
     */
    initialize() {
        // Initialize shaders
        this.initShaders();
        
        // Initialize buffers
        this.initBuffers();
        
        // Initialize state
        this.initState();
        
        // Set up viewport
        this.resize(this.width, this.height);
    }
    
    /**
     * Initialize shaders
     * @private
     */
    initShaders() {
        // Basic shader
        this.createShader('basic', `
            attribute vec2 aPosition;
            attribute vec4 aColor;
            
            uniform mat3 uTransform;
            uniform mat3 uViewport;
            
            varying vec4 vColor;
            
            void main() {
                vec3 position = uViewport * uTransform * vec3(aPosition, 1.0);
                gl_Position = vec4(position.xy, 0.0, 1.0);
                vColor = aColor;
            }
        `, `
            precision mediump float;
            
            varying vec4 vColor;
            
            void main() {
                gl_FragColor = vColor;
            }
        `);
        
        // Texture shader
        this.createShader('texture', `
            attribute vec2 aPosition;
            attribute vec2 aTexCoord;
            attribute vec4 aColor;
            
            uniform mat3 uTransform;
            uniform mat3 uViewport;
            
            varying vec2 vTexCoord;
            varying vec4 vColor;
            
            void main() {
                vec3 position = uViewport * uTransform * vec3(aPosition, 1.0);
                gl_Position = vec4(position.xy, 0.0, 1.0);
                vTexCoord = aTexCoord;
                vColor = aColor;
            }
        `, `
            precision mediump float;
            
            uniform sampler2D uTexture;
            
            varying vec2 vTexCoord;
            varying vec4 vColor;
            
            void main() {
                vec4 texColor = texture2D(uTexture, vTexCoord);
                gl_FragColor = texColor * vColor;
            }
        `);
    }
    
    /**
     * Create a shader program
     * @private
     */
    createShader(name, vertexSource, fragmentSource) {
        const gl = this.gl;
        
        // Create shaders
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);
        
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            throw new Error(`Vertex shader compilation failed: ${gl.getShaderInfoLog(vertexShader)}`);
        }
        
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);
        
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            throw new Error(`Fragment shader compilation failed: ${gl.getShaderInfoLog(fragmentShader)}`);
        }
        
        // Create program
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(`Shader program linking failed: ${gl.getProgramInfoLog(program)}`);
        }
        
        // Get attribute and uniform locations
        const attributes = {};
        const uniforms = {};
        
        const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < numAttributes; i++) {
            const info = gl.getActiveAttrib(program, i);
            attributes[info.name] = gl.getAttribLocation(program, info.name);
        }
        
        const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; i++) {
            const info = gl.getActiveUniform(program, i);
            uniforms[info.name] = gl.getUniformLocation(program, info.name);
        }
        
        // Store shader program
        this.shaders.set(name, {
            program,
            attributes,
            uniforms,
            vertexShader,
            fragmentShader
        });
    }
    
    /**
     * Initialize buffers
     * @private
     */
    initBuffers() {
        const gl = this.gl;
        
        // Vertex buffer
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.batchVertices, gl.DYNAMIC_DRAW);
        this.buffers.set('vertex', vertexBuffer);
        
        // Color buffer
        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.batchColors, gl.DYNAMIC_DRAW);
        this.buffers.set('color', colorBuffer);
        
        // UV buffer
        const uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.batchUVs, gl.DYNAMIC_DRAW);
        this.buffers.set('uv', uvBuffer);
        
        // Index buffer
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.batchIndices, gl.DYNAMIC_DRAW);
        this.buffers.set('index', indexBuffer);
    }
    
    /**
     * Initialize WebGL state
     * @private
     */
    initState() {
        const gl = this.gl;
        
        // Enable blending
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        
        // Set clear color
        gl.clearColor(0, 0, 0, 0);
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
        
        // Update viewport
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // Update viewport transform
        this.viewportTransform.identity()
            .scale(2 / this.canvas.width, -2 / this.canvas.height)
            .translate(-1, 1);
    }
    
    /**
     * Begin a new frame
     */
    beginFrame() {
        const gl = this.gl;
        
        // Clear the canvas
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Reset batch
        this.batchSize = 0;
        this.currentBatch = null;
        this.currentShader = null;
        this.currentTexture = null;
    }
    
    /**
     * End the current frame
     */
    endFrame() {
        // Flush any remaining batch
        this.flush();
    }
    
    /**
     * Flush the current batch
     * @private
     */
    flush() {
        if (this.batchSize === 0) return;
        
        const gl = this.gl;
        
        // Update buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.get('vertex'));
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.batchVertices.subarray(0, this.batchSize * 2));
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.get('color'));
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.batchColors.subarray(0, this.batchSize * 4));
        
        if (this.currentTexture) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.get('uv'));
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.batchUVs.subarray(0, this.batchSize * 2));
        }
        
        // Draw batch
        gl.drawElements(gl.TRIANGLES, this.batchSize * 1.5, gl.UNSIGNED_SHORT, 0);
        
        // Reset batch
        this.batchSize = 0;
    }
    
    /**
     * Set the current shader
     * @param {string} name - Shader name
     */
    setShader(name) {
        if (this.currentShader === name) return;
        
        // Flush current batch
        this.flush();
        
        const gl = this.gl;
        const shader = this.shaders.get(name);
        
        // Use shader program
        gl.useProgram(shader.program);
        
        // Set up attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.get('vertex'));
        gl.vertexAttribPointer(shader.attributes.aPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shader.attributes.aPosition);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.get('color'));
        gl.vertexAttribPointer(shader.attributes.aColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shader.attributes.aColor);
        
        if (shader.attributes.aTexCoord !== undefined) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.get('uv'));
            gl.vertexAttribPointer(shader.attributes.aTexCoord, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shader.attributes.aTexCoord);
        }
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.get('index'));
        
        // Set uniforms
        gl.uniformMatrix3fv(shader.uniforms.uViewport, false, this.viewportTransform.toWebGL());
        
        this.currentShader = name;
    }
    
    /**
     * Set the current texture
     * @param {WebGLTexture} texture - WebGL texture
     */
    setTexture(texture) {
        if (this.currentTexture === texture) return;
        
        // Flush current batch
        this.flush();
        
        const gl = this.gl;
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        this.currentTexture = texture;
    }
    
    /**
     * Set the current blend mode
     * @param {string} mode - Blend mode
     */
    setBlendMode(mode) {
        if (this.currentBlendMode === mode) return;
        
        // Flush current batch
        this.flush();
        
        const gl = this.gl;
        
        switch (mode) {
            case 'normal':
                gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                break;
            case 'add':
                gl.blendFunc(gl.ONE, gl.ONE);
                break;
            case 'multiply':
                gl.blendFunc(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA);
                break;
            case 'screen':
                gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR);
                break;
        }
        
        this.currentBlendMode = mode;
    }
    
    /**
     * Draw a textured quad
     * @param {WebGLTexture} texture - Texture to draw
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {Transform} transform - Transform matrix
     * @param {Array} color - Color array [r, g, b, a]
     */
    drawTexturedQuad(texture, x, y, width, height, transform, color) {
        // Set up shader and texture
        this.setShader('texture');
        this.setTexture(texture);
        
        // Add vertices to batch
        const index = this.batchSize;
        
        // Positions
        this.batchVertices[index * 8 + 0] = x;
        this.batchVertices[index * 8 + 1] = y;
        this.batchVertices[index * 8 + 2] = x + width;
        this.batchVertices[index * 8 + 3] = y;
        this.batchVertices[index * 8 + 4] = x;
        this.batchVertices[index * 8 + 5] = y + height;
        this.batchVertices[index * 8 + 6] = x + width;
        this.batchVertices[index * 8 + 7] = y + height;
        
        // UVs
        this.batchUVs[index * 8 + 0] = 0;
        this.batchUVs[index * 8 + 1] = 0;
        this.batchUVs[index * 8 + 2] = 1;
        this.batchUVs[index * 8 + 3] = 0;
        this.batchUVs[index * 8 + 4] = 0;
        this.batchUVs[index * 8 + 5] = 1;
        this.batchUVs[index * 8 + 6] = 1;
        this.batchUVs[index * 8 + 7] = 1;
        
        // Colors
        for (let i = 0; i < 4; i++) {
            this.batchColors[index * 16 + i * 4 + 0] = color[0];
            this.batchColors[index * 16 + i * 4 + 1] = color[1];
            this.batchColors[index * 16 + i * 4 + 2] = color[2];
            this.batchColors[index * 16 + i * 4 + 3] = color[3];
        }
        
        // Indices
        this.batchIndices[index * 6 + 0] = index * 4 + 0;
        this.batchIndices[index * 6 + 1] = index * 4 + 1;
        this.batchIndices[index * 6 + 2] = index * 4 + 2;
        this.batchIndices[index * 6 + 3] = index * 4 + 1;
        this.batchIndices[index * 6 + 4] = index * 4 + 3;
        this.batchIndices[index * 6 + 5] = index * 4 + 2;
        
        this.batchSize += 4;
        
        // Flush if batch is full
        if (this.batchSize >= this.maxBatchSize) {
            this.flush();
        }
    }
    
    /**
     * Draw a colored quad
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {Transform} transform - Transform matrix
     * @param {Array} color - Color array [r, g, b, a]
     */
    drawQuad(x, y, width, height, transform, color) {
        // Set up shader
        this.setShader('basic');
        
        // Add vertices to batch
        const index = this.batchSize;
        
        // Positions
        this.batchVertices[index * 8 + 0] = x;
        this.batchVertices[index * 8 + 1] = y;
        this.batchVertices[index * 8 + 2] = x + width;
        this.batchVertices[index * 8 + 3] = y;
        this.batchVertices[index * 8 + 4] = x;
        this.batchVertices[index * 8 + 5] = y + height;
        this.batchVertices[index * 8 + 6] = x + width;
        this.batchVertices[index * 8 + 7] = y + height;
        
        // Colors
        for (let i = 0; i < 4; i++) {
            this.batchColors[index * 16 + i * 4 + 0] = color[0];
            this.batchColors[index * 16 + i * 4 + 1] = color[1];
            this.batchColors[index * 16 + i * 4 + 2] = color[2];
            this.batchColors[index * 16 + i * 4 + 3] = color[3];
        }
        
        // Indices
        this.batchIndices[index * 6 + 0] = index * 4 + 0;
        this.batchIndices[index * 6 + 1] = index * 4 + 1;
        this.batchIndices[index * 6 + 2] = index * 4 + 2;
        this.batchIndices[index * 6 + 3] = index * 4 + 1;
        this.batchIndices[index * 6 + 4] = index * 4 + 3;
        this.batchIndices[index * 6 + 5] = index * 4 + 2;
        
        this.batchSize += 4;
        
        // Flush if batch is full
        if (this.batchSize >= this.maxBatchSize) {
            this.flush();
        }
    }
    
    /**
     * Create a texture from an image
     * @param {HTMLImageElement} image - Image element
     * @returns {WebGLTexture} - WebGL texture
     */
    createTexture(image) {
        const gl = this.gl;
        
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        // Upload image data
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        
        return texture;
    }
    
    /**
     * Create a render target
     * @param {number} width - Width
     * @param {number} height - Height
     * @returns {Object} - Render target object
     */
    createRenderTarget(width, height) {
        const gl = this.gl;
        
        // Create framebuffer
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        
        // Create texture
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        // Attach texture to framebuffer
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        
        // Check framebuffer status
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            throw new Error('Framebuffer is not complete');
        }
        
        // Reset state
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        
        return {
            framebuffer,
            texture,
            width,
            height
        };
    }
    
    /**
     * Begin rendering to a render target
     * @param {Object} target - Render target
     */
    beginRenderTarget(target) {
        // Flush current batch
        this.flush();
        
        const gl = this.gl;
        
        // Bind framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
        
        // Set viewport
        gl.viewport(0, 0, target.width, target.height);
        
        // Clear
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    
    /**
     * End rendering to a render target
     */
    endRenderTarget() {
        // Flush current batch
        this.flush();
        
        const gl = this.gl;
        
        // Reset framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        
        // Reset viewport
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        const gl = this.gl;
        
        // Delete shaders
        for (const shader of this.shaders.values()) {
            gl.deleteProgram(shader.program);
            gl.deleteShader(shader.vertexShader);
            gl.deleteShader(shader.fragmentShader);
        }
        
        // Delete buffers
        for (const buffer of this.buffers.values()) {
            gl.deleteBuffer(buffer);
        }
        
        // Delete textures
        for (const texture of this.textures.values()) {
            gl.deleteTexture(texture);
        }
        
        // Delete render targets
        for (const target of this.renderTargets.values()) {
            gl.deleteFramebuffer(target.framebuffer);
            gl.deleteTexture(target.texture);
        }
    }
}

// Export the WebGLRenderer class
window.WebGLRenderer = WebGLRenderer; 