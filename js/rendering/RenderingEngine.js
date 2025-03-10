/**
 * RenderingEngine class that manages both WebGL and Canvas renderers
 */
class RenderingEngine extends EventEmitter {
    constructor() {
        super();
        this.webglRenderer = null;
        this.canvasRenderer = null;
        this.currentRenderer = null;
        this.canvas = null;
        this.context = null;
    }

    async initialize(canvas, options = {}) {
        this.canvas = canvas;
        
        // Try to initialize WebGL renderer first
        try {
            this.webglRenderer = new WebGLRenderer();
            await this.webglRenderer.initialize(canvas, options);
            this.currentRenderer = this.webglRenderer;
            console.log('Using WebGL renderer');
        } catch (error) {
            console.warn('WebGL initialization failed, falling back to Canvas renderer:', error);
            
            // Fall back to Canvas renderer
            this.canvasRenderer = new CanvasRenderer();
            await this.canvasRenderer.initialize(canvas, options);
            this.currentRenderer = this.canvasRenderer;
            console.log('Using Canvas renderer');
        }

        // Set up the context
        this.context = this.currentRenderer.getContext();
        
        // Set up resize handling
        window.addEventListener('resize', this.handleResize.bind(this));
        this.handleResize();
    }

    handleResize() {
        if (this.canvas) {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width * window.devicePixelRatio;
            this.canvas.height = rect.height * window.devicePixelRatio;
            this.currentRenderer.handleResize();
        }
    }

    render(scene) {
        if (this.currentRenderer) {
            this.currentRenderer.render(scene);
        }
    }

    clear() {
        if (this.currentRenderer) {
            this.currentRenderer.clear();
        }
    }

    dispose() {
        if (this.webglRenderer) {
            this.webglRenderer.dispose();
        }
        if (this.canvasRenderer) {
            this.canvasRenderer.dispose();
        }
        window.removeEventListener('resize', this.handleResize);
    }

    getContext() {
        return this.context;
    }

    // Delegate other methods to current renderer
    setViewport(x, y, width, height) {
        if (this.currentRenderer) {
            this.currentRenderer.setViewport(x, y, width, height);
        }
    }

    setTransform(matrix) {
        if (this.currentRenderer) {
            this.currentRenderer.setTransform(matrix);
        }
    }

    resetTransform() {
        if (this.currentRenderer) {
            this.currentRenderer.resetTransform();
        }
    }
} 