class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.creatures = [];
        this.food = [];
        this.running = false;
        
        this.stats = {
            totalReproductions: 0,
            totalBirths: 0,
            totalDeaths: 0,
            totalMutations: 0
        };
        
        this.foodSpawnRate = CONFIG.foodSpawnRate; // Food spawns per frame (will be updated from UI)
        this.initialFood = CONFIG.initialFood; // Initial food (will be updated from UI)
        this.initialCreatures = CONFIG.initialCreatures; // Initial creatures (will be updated from UI)
        this.baseConsumption = CONFIG.baseConsumption; // Base energy consumption (will be updated from UI)
        this.gameSpeed = CONFIG.gameSpeed; // Game speed multiplier (will be updated from UI)
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
        
        // Create initial population - configurable number of creatures uniformly distributed
        for (let i = 0; i < this.initialCreatures; i++) {
            const x = 50 + Math.random() * (this.width - 100);
            const y = 50 + Math.random() * (this.height - 100);
            this.creatures.push(new Creature(x, y));
        }
        
        // Create initial food scattered around
        for (let i = 0; i < this.initialFood; i++) {
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
        
        // Spawn new food (no max limit)
        if (Math.random() < this.foodSpawnRate) {
            this.spawnFood();
        }
        
        // No random spawning - if all creatures die, simulation ends
    }
    
    spawnFood() {
        // Spawn food with margin from edges to prevent corner issues
        const margin = 20; // Pixels from edge
        const x = margin + Math.random() * (this.width - 2 * margin);
        const y = margin + Math.random() * (this.height - 2 * margin);
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
        
        // Draw food
        this.food.forEach(food => food.draw(ctx));
        
        // Draw creatures (without tooltips)
        this.creatures.forEach(creature => {
            const wasHovered = creature.isHovered;
            creature.isHovered = false; // Temporarily disable tooltip
            creature.draw(ctx);
            creature.isHovered = wasHovered; // Restore hover state
        });
        
        // Draw tooltips on top of everything
        this.creatures.forEach(creature => {
            if (creature.isHovered) {
                creature.drawTooltip(ctx);
            }
        });
    }
    

} 