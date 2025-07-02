class Food {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 3;
    }
    
    update() {
        return true; // Food doesn't expire
    }
    
    draw(ctx) {
        // Food shadow
        ctx.beginPath();
        ctx.arc(this.x + 1, this.y + 2, this.radius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fill();
        
        // Food body with gradient
        const gradient = ctx.createRadialGradient(
            this.x - this.radius * 0.3, this.y - this.radius * 0.3, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, '#5dade2');
        gradient.addColorStop(0.7, '#3498db');
        gradient.addColorStop(1, '#2980b9');
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Outline
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Shine effect
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
    }
} 