export class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2');
        if (!this.gl) {
            throw new Error('WebGL2 not supported');
        }
        this.initialize();
    }

    initialize() {
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
    }

    render(scene) {
        this.clear();
        // Implement rendering logic here
    }
} 