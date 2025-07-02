class Creature {
    constructor(x, y, genes = null) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        
        // Genetic traits (0.1 to 10)
        if (genes) {
            this.genes = { ...genes };
        } else {
            this.genes = {
                size: 1,  // Default starting size is 1
                speed: 1  // Default starting speed is 1
            };
        }
        
        // Derived properties from genes
        this.radius = 8 + this.genes.size * 4; // Size 1 = 12px (50% bigger), range 8.4-48 pixels
        this.maxSpeed = this.genes.speed; // Speed trait directly determines movement speed
        
        // Life properties - energy based on size
        this.maxEnergy = this.genes.size * 10; // initial energy = maximum energy = size * 10
        this.energy = this.maxEnergy;
        this.age = 0;
        this.maxAge = 1000 + Math.random() * 2000;
        this.reproductionCooldown = 0;
        this.birthTime = Date.now(); // Track when creature was born
        this.bornFromReproduction = genes ? true : false; // Track if born from reproduction or spawned randomly
        
        // Behavior state
        this.target = null;
        this.state = 'seeking_food'; // seeking_food or mating
        
        // Visual properties
        this.color = this.getColor();
        
        // Interaction properties
        this.isHovered = false;
    }
    
    getColor() {
        // Yellow for first 2 seconds of life if born from reproduction, otherwise always red
        const ageInSeconds = (Date.now() - this.birthTime) / 1000;
        if (this.bornFromReproduction && ageInSeconds < 2) {
            return '#f1c40f'; // Yellow for newborns from reproduction
        }
        return '#e74c3c'; // Red for adults and randomly spawned creatures
    }
    
    update(world) {
        this.age++;
        this.energy -= (this.genes.speed * this.genes.size / 60); // Energy consumption: 1 energy/second * speed * size (60fps)
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
        // Simple two-state behavior based on energy level
        if (this.energy < this.maxEnergy * 0.5) {
            // Seek food when energy is less than half
            this.state = 'seeking_food';
            const nearbyFood = world.food.filter(f => this.distanceTo(f) < 100);
            if (nearbyFood.length > 0) {
                this.target = this.findClosest(nearbyFood);
                this.moveToward(this.target);
            } else {
                this.wander(); // No food nearby, wander to find some
            }
        } else {
            // Try to mate when energy is half or more
            this.state = 'mating';
            if (this.reproductionCooldown <= 0) {
                const nearbyCreatures = world.creatures.filter(c => 
                    c !== this && 
                    c.energy >= c.maxEnergy * 0.5 && 
                    c.reproductionCooldown <= 0 &&
                    this.distanceTo(c) < this.radius + c.radius + 20
                );
                
                if (nearbyCreatures.length > 0) {
                    this.reproduce(nearbyCreatures[0], world);
                } else {
                    // No suitable mate nearby, move around to find one
                    this.wander();
                }
            } else {
                this.wander(); // Reproduction cooldown active
            }
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
        
        // No additional movement cost - already included in base consumption
        
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
    
    reproduce(mate, world) {
        // Both parents need enough energy (relative to their max)
        if (this.energy < this.maxEnergy * 0.5 || mate.energy < mate.maxEnergy * 0.5) return;
        
        // Create offspring with genetic crossover and mutation
        const childGenes = this.crossoverGenes(mate);
        this.mutateGenes(childGenes);
        
        // Place child right next to parents
        const childX = (this.x + mate.x) / 2 + (Math.random() - 0.5) * 20;
        const childY = (this.y + mate.y) / 2 + (Math.random() - 0.5) * 20;
        
        const child = new Creature(childX, childY, childGenes);
        
        world.creatures.push(child);
        world.stats.totalBirths++;
        world.stats.totalReproductions++;
        
        // Reproduction costs energy (relative to max energy)
        this.energy -= this.maxEnergy * 0.3;
        mate.energy -= mate.maxEnergy * 0.3;
        this.reproductionCooldown = 200;
        mate.reproductionCooldown = 200;
    }
    
    crossoverGenes(mate) {
        // Simple genetic crossover - average parents' genes
        return {
            size: (this.genes.size + mate.genes.size) / 2,
            speed: (this.genes.speed + mate.genes.speed) / 2
        };
    }
    
    mutateGenes(genes) {
        const mutationRate = 0.1; // 10% chance per trait
        
        // Mutate size
        if (Math.random() < mutationRate) {
            const mutationFactor = 1 + (Math.random() - 0.5); // 0.5 to 1.5 multiplier
            genes.size *= mutationFactor;
            genes.size = Math.max(0.1, Math.min(10, genes.size)); // Keep in 0.1-10 range
        }
        
        // Mutate speed
        if (Math.random() < mutationRate) {
            const mutationFactor = 1 + (Math.random() - 0.5); // 0.5 to 1.5 multiplier
            genes.speed *= mutationFactor;
            genes.speed = Math.max(0.1, Math.min(10, genes.speed)); // Keep in 0.1-10 range
        }
    }
    
    eatFood(food, world) {
        this.energy = Math.min(this.maxEnergy, this.energy + 5); // Energy gain of 5 units per food
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
        
        // Draw hover tooltip if creature is being hovered
        if (this.isHovered) {
            this.drawTooltip(ctx);
        }
        
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
        
        // Base color with highlights (update color dynamically)
        const baseColor = this.getColor();
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
        if (this.genes.size > 3) {
            this.drawSpikes(ctx, wiggle);
        }
        
        // Draw speed indicator (speed lines for fast creatures)
        if (this.genes.speed > 3) {
            this.drawSpeedLines(ctx, wiggle);
        }
        
        // Energy bar
        this.drawEnergyBar(ctx);
        
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
        
        ctx.strokeStyle = this.darkenColor(this.getColor(), 50);
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
    
    drawTooltip(ctx) {
        const tooltipX = this.x + this.radius + 10;
        const tooltipY = this.y - 15;
        const tooltipWidth = 160;
        const tooltipHeight = 55;
        
        // Tooltip background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
        ctx.fill();
        ctx.stroke();
        
        // Tooltip text
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        
        const textX = tooltipX + 8;
        let textY = tooltipY + 18;
        
        ctx.fillText(`Size: ${this.genes.size.toFixed(1)}`, textX, textY);
        textY += 16;
        ctx.fillText(`Speed: ${this.genes.speed.toFixed(1)}`, textX, textY);
        textY += 16;
        ctx.fillText(`Energy: ${this.energy.toFixed(1)}/${this.maxEnergy.toFixed(1)}`, textX, textY);
        
        // Arrow pointing to creature
        ctx.beginPath();
        ctx.moveTo(tooltipX, tooltipY + tooltipHeight / 2);
        ctx.lineTo(tooltipX - 10, tooltipY + tooltipHeight / 2 - 5);
        ctx.lineTo(tooltipX - 10, tooltipY + tooltipHeight / 2 + 5);
        ctx.closePath();
        ctx.fillStyle = '#3498db';
        ctx.fill();
    }
    
    isPointInside(x, y) {
        const distance = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
        return distance <= this.radius;
    }
} 