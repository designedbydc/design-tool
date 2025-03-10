/**
 * Core Rendering Engine
 * 
 * A sophisticated rendering engine that handles both WebGL and Canvas rendering
 * with automatic performance optimization and batching.
 */

class RenderingEngine {
    constructor() {
        this.renderer = null;
        this.scene = new Scene();
        this.renderQueue = new RenderQueue();
        this.perfMonitor = new PerformanceMonitor();
        this.state = {
            isWebGLEnabled: false,
            renderMode: 'auto',
            quality: 'high',
            viewport: { width: 0, height: 0 },
            transform: { scale: 1, x: 0, y: 0 },
            dirty: true
        };
    }

    /**
     * Initialize the rendering engine
     * @param {HTMLCanvasElement} canvas - The canvas element
     * @param {Object} options - Initialization options
     */
    async initialize(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Try to initialize WebGL
        try {
            this.webgl = await this.initializeWebGL(canvas);
            this.state.isWebGLEnabled = true;
            console.log('WebGL initialization successful');
        } catch (err) {
            console.warn('WebGL initialization failed, falling back to Canvas:', err);
            this.state.isWebGLEnabled = false;
        }

        // Initialize render strategies
        this.strategies = {
            webgl: new WebGLRenderStrategy(this.webgl),
            canvas: new CanvasRenderStrategy(this.ctx),
            hybrid: new HybridRenderStrategy(this.webgl, this.ctx)
        };

        // Initialize systems
        this.systems = {
            layout: new LayoutSystem(),
            constraints: new ConstraintSystem(),
            effects: new EffectsSystem(),
            animation: new AnimationSystem()
        };

        // Set up render pipeline
        this.pipeline = new RenderPipeline([
            new ScenePreparationStage(),
            new LayerCompositionStage(),
            new EffectsProcessingStage(),
            new FinalRenderStage()
        ]);

        // Initialize viewport manager
        this.viewport = new ViewportManager(canvas);
        
        // Set up event handling
        this.setupEventHandling();
        
        // Start render loop
        this.startRenderLoop();
    }

    /**
     * Initialize WebGL with advanced features
     */
    async initializeWebGL(canvas) {
        const contextOptions = {
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true,
            premultipliedAlpha: true,
            desynchronized: true,
            powerPreference: 'high-performance'
        };

        const gl = canvas.getContext('webgl2', contextOptions) || 
                  canvas.getContext('webgl', contextOptions);
        
        if (!gl) throw new Error('WebGL not supported');

        // Initialize WebGL extensions
        const extensions = [
            'OES_vertex_array_object',
            'OES_standard_derivatives',
            'EXT_blend_minmax',
            'WEBGL_draw_buffers',
            'OES_element_index_uint'
        ];

        for (const ext of extensions) {
            gl.getExtension(ext);
        }

        return gl;
    }

    /**
     * Set up sophisticated event handling
     */
    setupEventHandling() {
        this.eventManager = new EventManager();
        
        // Handle resize with debouncing and optimizations
        const debouncedResize = debounce(this.handleResize.bind(this), 100);
        window.addEventListener('resize', debouncedResize);

        // Handle visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });

        // Handle context loss
        this.canvas.addEventListener('webglcontextlost', this.handleContextLoss.bind(this));
        this.canvas.addEventListener('webglcontextrestored', this.handleContextRestore.bind(this));
    }

    /**
     * Start the render loop with sophisticated frame timing
     */
    startRenderLoop() {
        let lastFrameTime = performance.now();
        let frameDelta = 0;

        const loop = (currentTime) => {
            // Calculate precise frame timing
            frameDelta = currentTime - lastFrameTime;
            lastFrameTime = currentTime;

            // Update performance metrics
            this.perfMonitor.beginFrame();

            // Process the render queue
            this.renderQueue.process();

            // Update all systems
            this.updateSystems(frameDelta);

            // Render the frame if needed
            if (this.state.dirty) {
                this.render();
                this.state.dirty = false;
            }

            // End performance monitoring for this frame
            this.perfMonitor.endFrame();

            // Schedule next frame
            this.frameRequest = requestAnimationFrame(loop);
        };

        this.frameRequest = requestAnimationFrame(loop);
    }

    /**
     * Update all systems with delta time
     */
    updateSystems(delta) {
        // Update in specific order for dependencies
        this.systems.animation.update(delta);
        this.systems.constraints.update(delta);
        this.systems.layout.update(delta);
        this.systems.effects.update(delta);
    }

    /**
     * Render the current frame
     */
    render() {
        // Begin batch for this frame
        this.beginBatch();

        // Execute render pipeline
        this.pipeline.execute({
            scene: this.scene,
            renderer: this.getCurrentRenderer(),
            viewport: this.viewport,
            state: this.state
        });

        // End batch
        this.endBatch();
    }

    /**
     * Get the most appropriate renderer based on current state
     */
    getCurrentRenderer() {
        if (this.state.renderMode === 'auto') {
            return this.getOptimalRenderer();
        }
        return this.strategies[this.state.renderMode];
    }

    /**
     * Determine the optimal renderer based on scene complexity and device capabilities
     */
    getOptimalRenderer() {
        const metrics = this.perfMonitor.getMetrics();
        const complexity = this.scene.getComplexityScore();
        
        if (complexity > 1000 && this.state.isWebGLEnabled && metrics.fps > 30) {
            return this.strategies.webgl;
        } else if (complexity > 500 && this.state.isWebGLEnabled) {
            return this.strategies.hybrid;
        }
        return this.strategies.canvas;
    }

    /**
     * Begin a new render batch
     */
    beginBatch() {
        const renderer = this.getCurrentRenderer();
        renderer.beginBatch();
        
        // Set up common state
        this.viewport.apply(renderer);
        this.state.transform.apply(renderer);
    }

    /**
     * End the current render batch
     */
    endBatch() {
        const renderer = this.getCurrentRenderer();
        renderer.endBatch();
        renderer.flush();
    }

    /**
     * Handle WebGL context loss
     */
    handleContextLoss(event) {
        event.preventDefault();
        this.pause();
        this.state.isWebGLEnabled = false;
        
        // Notify the application
        this.eventManager.emit('contextLost');
        
        // Try to restore
        this.tryRestoreContext();
    }

    /**
     * Try to restore lost WebGL context
     */
    async tryRestoreContext() {
        try {
            await this.initializeWebGL(this.canvas);
            this.state.isWebGLEnabled = true;
            this.resume();
            this.eventManager.emit('contextRestored');
        } catch (err) {
            console.error('Failed to restore WebGL context:', err);
            // Fall back to Canvas API permanently
            this.state.renderMode = 'canvas';
        }
    }

    /**
     * Handle resize events
     */
    handleResize() {
        // Update viewport
        this.viewport.updateSize();
        
        // Mark as dirty
        this.state.dirty = true;
        
        // Emit resize event
        this.eventManager.emit('resize', this.viewport.getSize());
    }

    /**
     * Pause rendering
     */
    pause() {
        if (this.frameRequest) {
            cancelAnimationFrame(this.frameRequest);
            this.frameRequest = null;
        }
        this.perfMonitor.pause();
    }

    /**
     * Resume rendering
     */
    resume() {
        if (!this.frameRequest) {
            this.startRenderLoop();
        }
        this.perfMonitor.resume();
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.pause();
        this.eventManager.dispose();
        Object.values(this.strategies).forEach(strategy => strategy.dispose());
        Object.values(this.systems).forEach(system => system.dispose());
        this.pipeline.dispose();
    }
}

// Export the engine
window.RenderingEngine = RenderingEngine; 