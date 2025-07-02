class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.creatures = [];
        this.food = [];
        this.running = false;
        this.speed = 3;
        
        this.stats = {
            totalReproductions: 0,
            totalBirths: 0,
            totalDeaths: 0,
            totalMutations: 0
        };
        
        this.foodSpawnRate = 1.0; // Food spawns per frame (1 per frame)
        this.maxFood = 50;
    }
    
    initialize() {
        this.creatures = [];
        this.food = [];
        this.stats = {
            totalReproductions: 0,
            totalBirths: 0,
            totalDeaths: 0,
            totalMutations: 0
        };
        
        // Create initial population - 20 creatures uniformly distributed
        for (let i = 0; i < 20; i++) {
            const x = 50 + Math.random() * (this.width - 100);
            const y = 50 + Math.random() * (this.height - 100);
            this.creatures.push(new Creature(x, y));
        }
        
        // Create initial food scattered around
        for (let i = 0; i < 30; i++) {
            this.spawnFood();
        }
    }
    
    update() {
        if (!this.running) return;
        
        // Update creatures
        for (let i = this.creatures.length - 1; i >= 0; i--) {
            this.creatures[i].update(this);
        }
        
        // Update food
        for (let i = this.food.length - 1; i >= 0; i--) {
            if (!this.food[i].update()) {
                this.food.splice(i, 1);
            }
        }
        
        // Check creature-food collisions
        for (let i = this.creatures.length - 1; i >= 0; i--) {
            const creature = this.creatures[i];
            for (let j = this.food.length - 1; j >= 0; j--) {
                const food = this.food[j];
                if (creature.distanceTo(food) < creature.radius + food.radius) {
                    creature.eatFood(food, this);
                    break;
                }
            }
        }
        
        // Spawn new food
        if (Math.random() < this.foodSpawnRate && this.food.length < this.maxFood) {
            this.spawnFood();
        }
        
        // No random spawning - if all creatures die, simulation ends
    }
    
    spawnFood() {
        const x = Math.random() * this.width;
        const y = Math.random() * this.height;
        this.food.push(new Food(x, y));
    }
    
    removeCreature(creature) {
        const index = this.creatures.indexOf(creature);
        if (index > -1) {
            this.creatures.splice(index, 1);
        }
    }
    
    removeFood(food) {
        const index = this.food.indexOf(food);
        if (index > -1) {
            this.food.splice(index, 1);
        }
    }
    
    getAverageTraits() {
        if (this.creatures.length === 0) {
            return { size: 0, speed: 0, appetite: 0 };
        }
        
        const totalSize = this.creatures.reduce((acc, creature) => acc + creature.genes.size, 0);
        const totalSpeed = this.creatures.reduce((acc, creature) => acc + creature.genes.speed, 0);
        const totalAppetite = this.creatures.reduce((acc, creature) => acc + creature.genes.appetite, 0);
        
        return {
            size: totalSize / this.creatures.length,
            speed: totalSpeed / this.creatures.length,
            appetite: totalAppetite / this.creatures.length
        };
    }
    
    draw(ctx) {
        // Clear canvas with gradient background
        const bgGradient = ctx.createLinearGradient(0, 0, 0, this.height);
        bgGradient.addColorStop(0, '#1e3c72');
        bgGradient.addColorStop(0.5, '#2a5298');
        bgGradient.addColorStop(1, '#1e3c72');
        
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Add subtle atmospheric effects only
        this.drawAtmosphere(ctx);
        
        // Draw food
        this.food.forEach(food => food.draw(ctx));
        
        // Draw creatures
        this.creatures.forEach(creature => creature.draw(ctx));
    }
    
    drawAtmosphere(ctx) {
        // Add subtle animated particles for atmosphere only
        const time = Date.now() * 0.001;
        
        for (let i = 0; i < 15; i++) {
            const x = (Math.sin(time + i) * 100 + this.width / 2 + i * 40) % this.width;
            const y = (Math.cos(time * 0.7 + i * 0.5) * 50 + this.height / 2 + i * 30) % this.height;
            const size = Math.sin(time + i) * 1 + 2;
            
            ctx.beginPath();
            ctx.arc(x, y, Math.abs(size), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(size) * 0.05})`;
            ctx.fill();
        }
    }
} 