class InputHandler {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false, click: false };

        window.addEventListener('keydown', e => { this.keys[e.code] = true; this.keys[e.key] = true; });
        window.addEventListener('keyup', e => { this.keys[e.code] = false; this.keys[e.key] = false; });

        window.addEventListener('mousemove', e => { this.mouse.x = e.offsetX; this.mouse.y = e.offsetY; });
        window.addEventListener('mousedown', () => { this.mouse.down = true; this.mouse.click = true; });
        window.addEventListener('mouseup', () => { this.mouse.down = false; });
    }

    isHover(x, y, w, h) { return this.mouse.x >= x && this.mouse.x <= x + w && this.mouse.y >= y && this.mouse.y <= y + h; }
    isClicked(x, y, w, h) { return this.mouse.click && this.isHover(x, y, w, h); }
    isDragging(x, y, w, h) { return this.mouse.down && this.isHover(x, y, w, h); }
}