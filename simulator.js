class Creature {
    constructor(x, y, genes = null) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        
        // Genetic traits (0-1 normalized)
        if (genes) {
            this.genes = { ...genes };
        } else {
            this.genes = {
                size: Math.random(),      // 0-1 (affects strength and visibility)
                speed: Math.random(),     // 0-1 (movement speed)
                aggression: Math.random() // 0-1 (likelihood to fight)
            };
        }
        
        // Derived properties from genes
        this.radius = 5 + this.genes.size * 15; // 5-20 pixels
        this.maxSpeed = 0.5 + this.genes.speed * 2; // 0.5-2.5 pixels/frame
        this.strength = this.genes.size * 100; // Used in combat
        
        // Life properties
        this.energy = 100;
        this.maxEnergy = 100;
        this.age = 0;
        this.maxAge = 1000 + Math.random() * 2000;
        this.reproductionCooldown = 0;
        this.generation = 1;
        
        // Behavior state
        this.target = null;
        this.state = 'wandering'; // wandering, seeking_food, fighting, mating
        
        // Visual properties
        this.color = this.getColor();
    }
    
    getColor() {
        // Color based on aggression level
        const aggression = this.genes.aggression;
        if (aggression > 0.7) {
            return '#e74c3c'; // Red - high aggression
        } else if (aggression > 0.4) {
            return '#f39c12'; // Orange - medium aggression
        } else {
            return '#2ecc71'; // Green - low aggression
        }
    }
    
    update(world) {
        this.age++;
        this.energy -= 0.1; // Base energy consumption
        this.reproductionCooldown = Math.max(0, this.reproductionCooldown - 1);
        
        // Die if too old or no energy
        if (this.age > this.maxAge || this.energy <= 0) {
            this.die(world);
            return;
        }
        
        // AI behavior
        this.behave(world);
        
        // Move
        this.move(world);
        
        // Boundary checking
        this.checkBoundaries(world);
    }
    
    behave(world) {
        // Find nearby creatures and food
        const nearbyCreatures = world.creatures.filter(c => 
            c !== this && this.distanceTo(c) < 50
        );
        const nearbyFood = world.food.filter(f => 
            this.distanceTo(f) < 80
        );
        
        // Prioritize actions based on needs and personality
        if (this.energy < 30 && nearbyFood.length > 0) {
            // Seek food when hungry
            this.state = 'seeking_food';
            this.target = this.findClosest(nearbyFood);
            this.moveToward(this.target);
        } else if (this.energy > 60 && this.reproductionCooldown <= 0 && nearbyCreatures.length > 0) {
            // Try to reproduce when well-fed
            const mate = nearbyCreatures.find(c => 
                c.energy > 60 && c.reproductionCooldown <= 0
            );
            if (mate) {
                this.state = 'mating';
                this.target = mate;
                this.moveToward(mate);
                if (this.distanceTo(mate) < this.radius + mate.radius) {
                    this.reproduce(mate, world);
                }
            }
        } else if (this.genes.aggression > Math.random() && nearbyCreatures.length > 0) {
            // Fight based on aggression
            const enemy = nearbyCreatures[Math.floor(Math.random() * nearbyCreatures.length)];
            this.state = 'fighting';
            this.target = enemy;
            this.moveToward(enemy);
            if (this.distanceTo(enemy) < this.radius + enemy.radius) {
                this.fight(enemy, world);
            }
        } else {
            // Wander randomly
            this.state = 'wandering';
            this.wander();
        }
    }
    
    moveToward(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.vx = (dx / distance) * this.maxSpeed;
            this.vy = (dy / distance) * this.maxSpeed;
        }
    }
    
    wander() {
        // Add some randomness to movement
        this.vx += (Math.random() - 0.5) * 0.2;
        this.vy += (Math.random() - 0.5) * 0.2;
        
        // Limit speed
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
    }
    
    move(world) {
        this.x += this.vx;
        this.y += this.vy;
        
        // Energy cost for movement
        const movementCost = Math.sqrt(this.vx * this.vx + this.vy * this.vy) * 0.05;
        this.energy -= movementCost;
        
        // Friction
        this.vx *= 0.95;
        this.vy *= 0.95;
    }
    
    checkBoundaries(world) {
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx = Math.abs(this.vx);
        }
        if (this.x + this.radius > world.width) {
            this.x = world.width - this.radius;
            this.vx = -Math.abs(this.vx);
        }
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy = Math.abs(this.vy);
        }
        if (this.y + this.radius > world.height) {
            this.y = world.height - this.radius;
            this.vy = -Math.abs(this.vy);
        }
    }
    
    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    findClosest(targets) {
        let closest = null;
        let minDistance = Infinity;
        
        for (const target of targets) {
            const distance = this.distanceTo(target);
            if (distance < minDistance) {
                minDistance = distance;
                closest = target;
            }
        }
        
        return closest;
    }
    
    fight(enemy, world) {
        // Combat based on size/strength with some randomness
        const myPower = this.strength + Math.random() * 20;
        const enemyPower = enemy.strength + Math.random() * 20;
        
        if (myPower > enemyPower) {
            // I win - gain energy, enemy loses more
            this.energy += 10;
            enemy.energy -= 25;
            enemy.vx += (enemy.x - this.x) * 0.1; // Knockback
            enemy.vy += (enemy.y - this.y) * 0.1;
        } else {
            // Enemy wins
            this.energy -= 25;
            enemy.energy += 10;
            this.vx += (this.x - enemy.x) * 0.1; // Knockback
            this.vy += (this.y - enemy.y) * 0.1;
        }
        
        // Both lose some energy from fighting
        this.energy -= 5;
        enemy.energy -= 5;
    }
    
    reproduce(mate, world) {
        // Both parents need energy
        if (this.energy < 50 || mate.energy < 50) return;
        
        // Create offspring with genetic crossover and mutation
        const childGenes = this.crossoverGenes(mate);
        this.mutateGenes(childGenes);
        
        // Place child near parents
        const childX = (this.x + mate.x) / 2 + (Math.random() - 0.5) * 50;
        const childY = (this.y + mate.y) / 2 + (Math.random() - 0.5) * 50;
        
        const child = new Creature(childX, childY, childGenes);
        child.generation = Math.max(this.generation, mate.generation) + 1;
        
        world.creatures.push(child);
        world.stats.totalBirths++;
        
        // Reproduction costs energy and has cooldown
        this.energy -= 30;
        mate.energy -= 30;
        this.reproductionCooldown = 200;
        mate.reproductionCooldown = 200;
        
        // Update generation counter
        if (child.generation > world.stats.currentGeneration) {
            world.stats.currentGeneration = child.generation;
        }
    }
    
    crossoverGenes(mate) {
        // Simple genetic crossover - average parents' genes
        return {
            size: (this.genes.size + mate.genes.size) / 2,
            speed: (this.genes.speed + mate.genes.speed) / 2,
            aggression: (this.genes.aggression + mate.genes.aggression) / 2
        };
    }
    
    mutateGenes(genes) {
        const mutationRate = 0.1;
        const mutationStrength = 0.1;
        
        for (const trait in genes) {
            if (Math.random() < mutationRate) {
                genes[trait] += (Math.random() - 0.5) * mutationStrength;
                genes[trait] = Math.max(0, Math.min(1, genes[trait])); // Keep in 0-1 range
            }
        }
    }
    
    eatFood(food, world) {
        this.energy = Math.min(this.maxEnergy, this.energy + 25);
        world.removeFood(food);
    }
    
    die(world) {
        world.removeCreature(this);
        world.stats.totalDeaths++;
    }
    
    draw(ctx) {
        // Draw creature
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Add darker border
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Energy bar
        const barWidth = this.radius * 2;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 8;
        
        // Background
        ctx.fillStyle = '#34495e';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Energy level
        const energyPercent = this.energy / this.maxEnergy;
        ctx.fillStyle = energyPercent > 0.5 ? '#2ecc71' : energyPercent > 0.25 ? '#f39c12' : '#e74c3c';
        ctx.fillRect(barX, barY, barWidth * energyPercent, barHeight);
        
        // Age indicator (small dot)
        const agePercent = this.age / this.maxAge;
        ctx.beginPath();
        ctx.arc(this.x + this.radius - 3, this.y - this.radius + 3, 2, 0, Math.PI * 2);
        ctx.fillStyle = agePercent > 0.7 ? '#e74c3c' : agePercent > 0.4 ? '#f39c12' : '#2ecc71';
        ctx.fill();
    }
}

class Food {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 3;
        this.energy = 25;
        this.age = 0;
        this.maxAge = 2000;
    }
    
    update() {
        this.age++;
        return this.age < this.maxAge;
    }
    
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#3498db';
        ctx.fill();
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.creatures = [];
        this.food = [];
        this.running = false;
        this.speed = 3;
        
        this.stats = {
            currentGeneration: 1,
            totalBirths: 0,
            totalDeaths: 0
        };
        
        this.foodSpawnRate = 0.3; // Food spawns per frame
        this.maxFood = 50;
    }
    
    initialize() {
        this.creatures = [];
        this.food = [];
        this.stats = {
            currentGeneration: 1,
            totalBirths: 0,
            totalDeaths: 0
        };
        
        // Create initial population
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            this.creatures.push(new Creature(x, y));
        }
        
        // Create initial food
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
        
        // If population gets too low, add some random creatures
        if (this.creatures.length < 3) {
            for (let i = 0; i < 5; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                this.creatures.push(new Creature(x, y));
            }
        }
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
            return { size: 0, speed: 0, aggression: 0 };
        }
        
        const totals = this.creatures.reduce((acc, creature) => ({
            size: acc.size + creature.genes.size,
            speed: acc.speed + creature.genes.speed,
            aggression: acc.aggression + creature.genes.aggression
        }), { size: 0, speed: 0, aggression: 0 });
        
        return {
            size: totals.size / this.creatures.length,
            speed: totals.speed / this.creatures.length,
            aggression: totals.aggression / this.creatures.length
        };
    }
    
    draw(ctx) {
        // Clear canvas
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw food
        this.food.forEach(food => food.draw(ctx));
        
        // Draw creatures
        this.creatures.forEach(creature => creature.draw(ctx));
    }
}

// Game initialization and controls
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const world = new World(canvas.width, canvas.height);

let animationId;
let frameCount = 0;

// UI elements
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const speedSlider = document.getElementById('speedSlider');

// Stats elements
const populationStat = document.getElementById('population');
const generationStat = document.getElementById('generation');
const avgSizeStat = document.getElementById('avgSize');
const avgSpeedStat = document.getElementById('avgSpeed');
const avgAggressionStat = document.getElementById('avgAggression');

// Event listeners
startBtn.addEventListener('click', () => {
    world.running = true;
    if (!animationId) {
        gameLoop();
    }
});

pauseBtn.addEventListener('click', () => {
    world.running = false;
});

resetBtn.addEventListener('click', () => {
    world.running = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    world.initialize();
    updateStats();
    world.draw(ctx);
});

speedSlider.addEventListener('input', (e) => {
    world.speed = parseInt(e.target.value);
});

function gameLoop() {
    frameCount++;
    
    // Update simulation at the specified speed
    for (let i = 0; i < world.speed; i++) {
        world.update();
    }
    
    // Draw every frame
    world.draw(ctx);
    
    // Update stats every 30 frames
    if (frameCount % 30 === 0) {
        updateStats();
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

function updateStats() {
    const avgTraits = world.getAverageTraits();
    
    populationStat.textContent = world.creatures.length;
    generationStat.textContent = world.stats.currentGeneration;
    avgSizeStat.textContent = (avgTraits.size * 100).toFixed(1) + '%';
    avgSpeedStat.textContent = (avgTraits.speed * 100).toFixed(1) + '%';
    avgAggressionStat.textContent = (avgTraits.aggression * 100).toFixed(1) + '%';
}

// Initialize the simulation
world.initialize();
updateStats();
world.draw(ctx); 