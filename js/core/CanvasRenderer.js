export class CanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    render(scene) {
        this.clear();
        // Implement rendering logic here
    }
} 