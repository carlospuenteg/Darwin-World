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
        // Save context for transformations
        ctx.save();
        
        // Add subtle movement animation
        const wiggle = Math.sin(Date.now() * 0.01 + this.x * 0.1) * 0.5;
        
        // Draw creature shadow (3D effect)
        ctx.beginPath();
        ctx.ellipse(this.x + 2, this.y + 3, this.radius * 0.8, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fill();
        
        // Main body (larger ellipse)
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + wiggle, this.radius * 0.8, this.radius, 0, 0, Math.PI * 2);
        
        // Create gradient for 3D effect
        const gradient = ctx.createRadialGradient(
            this.x - this.radius * 0.3, this.y - this.radius * 0.3 + wiggle, 0,
            this.x, this.y + wiggle, this.radius
        );
        
        // Base color with highlights
        const baseColor = this.color;
        const lightColor = this.lightenColor(baseColor, 40);
        const darkColor = this.darkenColor(baseColor, 30);
        
        gradient.addColorStop(0, lightColor);
        gradient.addColorStop(0.7, baseColor);
        gradient.addColorStop(1, darkColor);
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Body outline
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw eyes
        this.drawEyes(ctx, wiggle);
        
        // Draw size indicator (spikes for large creatures)
        if (this.genes.size > 0.7) {
            this.drawSpikes(ctx, wiggle);
        }
        
        // Draw speed indicator (fins/streamlines for fast creatures)
        if (this.genes.speed > 0.7) {
            this.drawSpeedLines(ctx, wiggle);
        }
        
        // Draw aggression indicator (teeth/claws for aggressive creatures)
        if (this.genes.aggression > 0.6) {
            this.drawAggressionFeatures(ctx, wiggle);
        }
        
        // Energy bar (more stylized)
        this.drawEnergyBar(ctx);
        
        // Age indicator with better styling
        this.drawAgeIndicator(ctx);
        
        ctx.restore();
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    }
    
    drawEyes(ctx, wiggle) {
        const eyeSize = Math.max(2, this.radius * 0.15);
        const eyeOffset = this.radius * 0.4;
        
        // Left eye
        ctx.beginPath();
        ctx.arc(this.x - eyeOffset, this.y - eyeOffset + wiggle, eyeSize, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Left pupil
        ctx.beginPath();
        ctx.arc(this.x - eyeOffset + 1, this.y - eyeOffset + wiggle + 1, eyeSize * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#2c3e50';
        ctx.fill();
        
        // Right eye
        ctx.beginPath();
        ctx.arc(this.x + eyeOffset, this.y - eyeOffset + wiggle, eyeSize, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Right pupil
        ctx.beginPath();
        ctx.arc(this.x + eyeOffset + 1, this.y - eyeOffset + wiggle + 1, eyeSize * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#2c3e50';
        ctx.fill();
    }
    
    drawSpikes(ctx, wiggle) {
        const spikeCount = 6;
        const spikeLength = this.radius * 0.3;
        
        ctx.strokeStyle = this.darkenColor(this.color, 50);
        ctx.lineWidth = 2;
        
        for (let i = 0; i < spikeCount; i++) {
            const angle = (i / spikeCount) * Math.PI * 2;
            const startX = this.x + Math.cos(angle) * this.radius * 0.8;
            const startY = this.y + Math.sin(angle) * this.radius * 0.8 + wiggle;
            const endX = this.x + Math.cos(angle) * (this.radius * 0.8 + spikeLength);
            const endY = this.y + Math.sin(angle) * (this.radius * 0.8 + spikeLength) + wiggle;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }
    
    drawSpeedLines(ctx, wiggle) {
        const lineCount = 3;
        const lineLength = this.radius * 0.8;
        
        ctx.strokeStyle = 'rgba(52, 152, 219, 0.6)';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < lineCount; i++) {
            const offsetY = (i - 1) * 8;
            const startX = this.x - this.radius - 5;
            const startY = this.y + offsetY + wiggle;
            const endX = startX - lineLength;
            const endY = startY;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }
    
    drawAggressionFeatures(ctx, wiggle) {
        // Draw teeth/fangs
        const teethCount = 4;
        const teethSize = this.radius * 0.2;
        
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < teethCount; i++) {
            const angle = (Math.PI * 0.2) + (i / (teethCount - 1)) * Math.PI * 0.6;
            const teethX = this.x + Math.cos(angle) * this.radius * 0.6;
            const teethY = this.y + Math.sin(angle) * this.radius * 0.6 + wiggle;
            
            ctx.beginPath();
            ctx.moveTo(teethX, teethY);
            ctx.lineTo(teethX - teethSize * 0.5, teethY + teethSize);
            ctx.lineTo(teethX + teethSize * 0.5, teethY + teethSize);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }
    
    drawEnergyBar(ctx) {
        const barWidth = this.radius * 2;
        const barHeight = 6;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 12;
        
        // Background with rounded corners
        ctx.fillStyle = 'rgba(52, 73, 94, 0.8)';
        ctx.beginPath();
        ctx.roundRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2, 3);
        ctx.fill();
        
        // Energy level with gradient
        const energyPercent = this.energy / this.maxEnergy;
        const energyGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        
        if (energyPercent > 0.5) {
            energyGradient.addColorStop(0, '#27ae60');
            energyGradient.addColorStop(1, '#2ecc71');
        } else if (energyPercent > 0.25) {
            energyGradient.addColorStop(0, '#e67e22');
            energyGradient.addColorStop(1, '#f39c12');
        } else {
            energyGradient.addColorStop(0, '#c0392b');
            energyGradient.addColorStop(1, '#e74c3c');
        }
        
        ctx.fillStyle = energyGradient;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth * energyPercent, barHeight, 2);
        ctx.fill();
    }
    
    drawAgeIndicator(ctx) {
        const agePercent = this.age / this.maxAge;
        const indicatorSize = 4;
        const indicatorX = this.x + this.radius - 6;
        const indicatorY = this.y - this.radius + 6;
        
        // Background circle
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, indicatorSize, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        
        // Age indicator
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, indicatorSize - 1, 0, Math.PI * 2);
        if (agePercent > 0.7) {
            ctx.fillStyle = '#e74c3c';
        } else if (agePercent > 0.4) {
            ctx.fillStyle = '#f39c12';
        } else {
            ctx.fillStyle = '#2ecc71';
        }
        ctx.fill();
        
        // Shine effect
        ctx.beginPath();
        ctx.arc(indicatorX - 1, indicatorY - 1, 1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
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
        
        // Pulsing effect based on age
        const pulseIntensity = Math.sin(Date.now() * 0.005 + this.x * 0.1) * 0.1 + 0.9;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulseIntensity, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(52, 152, 219, 0.3)';
        ctx.lineWidth = 2;
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
        
        // Create initial population in corner groups
        const corners = [
            { x: 100, y: 100 },         // Top-left
            { x: this.width - 100, y: 100 },         // Top-right
            { x: 100, y: this.height - 100 },       // Bottom-left
            { x: this.width - 100, y: this.height - 100 }  // Bottom-right
        ];
        
        corners.forEach(corner => {
            for (let i = 0; i < 4; i++) {
                // Create 4 creatures per corner with slight randomization
                const x = corner.x + (Math.random() - 0.5) * 80;
                const y = corner.y + (Math.random() - 0.5) * 80;
                this.creatures.push(new Creature(x, y));
            }
        });
        
        // Create initial food scattered around
        for (let i = 0; i < 40; i++) {
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
        // Clear canvas with gradient background
        const bgGradient = ctx.createLinearGradient(0, 0, 0, this.height);
        bgGradient.addColorStop(0, '#1e3c72');
        bgGradient.addColorStop(0.5, '#2a5298');
        bgGradient.addColorStop(1, '#1e3c72');
        
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Add environmental elements
        this.drawEnvironment(ctx);
        
        // Draw food
        this.food.forEach(food => food.draw(ctx));
        
        // Draw creatures
        this.creatures.forEach(creature => creature.draw(ctx));
        
        // Add atmospheric effects
        this.drawAtmosphere(ctx);
    }
    
    drawEnvironment(ctx) {
        // Draw some environmental features like rocks or plants
        ctx.save();
        
        // Static environmental elements (rocks)
        const rocks = [
            { x: 200, y: 300, size: 25 },
            { x: 600, y: 150, size: 20 },
            { x: 150, y: 500, size: 30 },
            { x: 650, y: 450, size: 18 },
            { x: 400, y: 200, size: 22 },
            { x: 300, y: 550, size: 28 }
        ];
        
        rocks.forEach(rock => {
            // Rock shadow
            ctx.beginPath();
            ctx.ellipse(rock.x + 3, rock.y + 5, rock.size * 0.8, rock.size * 0.4, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fill();
            
            // Rock body
            const rockGradient = ctx.createRadialGradient(
                rock.x - rock.size * 0.3, rock.y - rock.size * 0.3, 0,
                rock.x, rock.y, rock.size
            );
            rockGradient.addColorStop(0, '#7f8c8d');
            rockGradient.addColorStop(0.7, '#34495e');
            rockGradient.addColorStop(1, '#2c3e50');
            
            ctx.beginPath();
            ctx.arc(rock.x, rock.y, rock.size, 0, Math.PI * 2);
            ctx.fillStyle = rockGradient;
            ctx.fill();
            
            // Rock outline
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
        
        // Draw some plant-like decorations
        const plants = [
            { x: 100, y: 200 },
            { x: 700, y: 350 },
            { x: 50, y: 450 },
            { x: 750, y: 100 },
            { x: 350, y: 500 }
        ];
        
        plants.forEach(plant => {
            ctx.strokeStyle = 'rgba(39, 174, 96, 0.6)';
            ctx.lineWidth = 3;
            
            // Draw plant stems
            for (let i = 0; i < 3; i++) {
                const stemHeight = 20 + Math.random() * 20;
                const stemX = plant.x + (i - 1) * 8;
                
                ctx.beginPath();
                ctx.moveTo(stemX, plant.y);
                ctx.lineTo(stemX + (Math.random() - 0.5) * 10, plant.y - stemHeight);
                ctx.stroke();
                
                // Add leaves
                ctx.beginPath();
                ctx.arc(stemX + 3, plant.y - stemHeight * 0.7, 3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(46, 204, 113, 0.7)';
                ctx.fill();
            }
        });
        
        ctx.restore();
    }
    
    drawAtmosphere(ctx) {
        // Add subtle animated particles for atmosphere
        const time = Date.now() * 0.001;
        
        for (let i = 0; i < 20; i++) {
            const x = (Math.sin(time + i) * 100 + this.width / 2 + i * 40) % this.width;
            const y = (Math.cos(time * 0.7 + i * 0.5) * 50 + this.height / 2 + i * 30) % this.height;
            const size = Math.sin(time + i) * 1 + 2;
            
            ctx.beginPath();
            ctx.arc(x, y, Math.abs(size), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(size) * 0.1})`;
            ctx.fill();
        }
        
        // Add corner glow effects
        const corners = [
            { x: 0, y: 0 },
            { x: this.width, y: 0 },
            { x: 0, y: this.height },
            { x: this.width, y: this.height }
        ];
        
        corners.forEach(corner => {
            const glowGradient = ctx.createRadialGradient(corner.x, corner.y, 0, corner.x, corner.y, 150);
            glowGradient.addColorStop(0, 'rgba(52, 152, 219, 0.1)');
            glowGradient.addColorStop(1, 'rgba(52, 152, 219, 0)');
            
            ctx.fillStyle = glowGradient;
            ctx.fillRect(
                corner.x === 0 ? 0 : corner.x - 150,
                corner.y === 0 ? 0 : corner.y - 150,
                150,
                150
            );
        });
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