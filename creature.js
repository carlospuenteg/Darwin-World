class Creature {
    constructor(x, y, genes = null) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        
        // Genetic traits (0.1 to 10) with 2 decimal precision
        if (genes) {
            this.genes = { 
                size: parseFloat(genes.size.toFixed(2)),
                speed: parseFloat(genes.speed.toFixed(2)),
                appetite: parseFloat(genes.appetite.toFixed(2))
            };
            this.hasMutation = genes.hasMutation || false;
        } else {
            this.genes = {
                size: 1.00,     // Default starting size is 1.00
                speed: 1.00,    // Default starting speed is 1.00
                appetite: 1.00  // Default starting appetite is 1.00 (food-focused)
            };
            this.hasMutation = false;
        }
        
        // Derived properties from genes (will be updated with world values in setWorldParams)
        this.radius = parseFloat((5 + this.genes.size * 4).toFixed(2)); // Size 1 = 9px, range 5.4-45 pixels (changed from 8 to 5)
        this.maxSpeed = parseFloat((this.genes.speed * (1 / this.genes.size)).toFixed(2)); // Actual speed = speed * (1/size)
        
        // Life properties - energy based on size
        this.maxEnergy = parseFloat((this.genes.size * 10).toFixed(2)); // maximum energy = size * 10
        this.energy = this.maxEnergy / 2; // start with exactly half energy
        this.age = 0;
        this.maxAge = 1000 + Math.random() * 2000;
        this.reproductionCooldown = 0;
        this.birthTime = Date.now(); // Track when creature was born
        this.bornFromReproduction = genes ? true : false; // Track if born from reproduction or spawned randomly
        
        // Behavior state
        this.target = null;
        this.state = 'seeking_food'; // seeking_food or mating
        
        // Interaction properties
        this.isHovered = false;
    }

    setWorldParams(world) {
        // Update derived properties with world values
        // Visual size only (doesn't affect other calculations) = creature_size * base_visual_size
        this.radius = parseFloat((5 + (world.creatureSize * this.genes.size) * 4).toFixed(2)); // Changed from 8 to 5        
        // Actual speed = creature_speed * speed * (1/size)
        this.maxSpeed = parseFloat((world.creatureSpeed * this.genes.speed * (1 / this.genes.size)).toFixed(2));
        
        // Max energy = size * base_energy (size affects energy, not visual scaling)
        this.maxEnergy = parseFloat((this.genes.size * world.baseEnergy).toFixed(2));
        
        // If this is a new creature, set energy to half of max
        if (this.energy === this.maxEnergy / 2) {
            this.energy = this.maxEnergy / 2;
        }
    }
    
    getColor() {
        // Color based on age and mutation status for newborns
        const ageInSeconds = (Date.now() - this.birthTime) / 1000;
        if (this.bornFromReproduction && ageInSeconds < 2) {
            if (this.hasMutation) {
                return '#2ecc71'; // Green for newborns with mutations
            } else {
                return '#f1c40f'; // Yellow for normal newborns from reproduction
            }
        }
        return '#e74c3c'; // Red for adults and randomly spawned creatures
    }
    
    update(world) {
        this.age++;
        
        // Frame-rate independent energy consumption: base_consumption * speed * size per second (constant rate)
        const deltaTime = 1/60; // Assuming 60fps for frame-rate independence
        const energyLoss = world.baseConsumption * this.genes.speed * this.genes.size * deltaTime;
        this.energy = parseFloat((this.energy - energyLoss).toFixed(2));
        
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
        // Three-tier decision making based on energy levels
        const energyPercent = this.energy / this.maxEnergy;
        
        if (energyPercent <= 0.3) {
            // Must seek food when energy is 30% or less
            this.state = 'seeking_food';
            const nearbyFood = world.food.filter(f => this.distanceTo(f) < 200);
            if (nearbyFood.length > 0) {
                this.target = this.findClosest(nearbyFood);
                this.moveToward(this.target);
            } else {
                this.wander(); // No food nearby, wander to find some
            }
        } else if (energyPercent >= 0.7) {
            // Must try to reproduce when energy is 70% or more
            this.state = 'mating';
            if (this.reproductionCooldown <= 0) {
                const potentialMates = world.creatures.filter(c => 
                    c !== this && 
                    c.energy > c.maxEnergy * 0.5 && 
                    c.reproductionCooldown <= 0
                );
                const closestMate = this.findClosest(potentialMates);
                
                if (closestMate && this.distanceTo(closestMate) < this.radius + closestMate.radius + 20) {
                    this.reproduce(closestMate, world);
                } else if (closestMate) {
                    this.target = closestMate;
                    this.moveToward(this.target);
                } else {
                    this.wander(); // No suitable mate found
                }
            } else {
                this.wander(); // Reproduction cooldown active
            }
        } else {
            // Between 30% and 70% energy - use new decision formula
            const closestFood = this.findClosest(world.food);
            const potentialMates = world.creatures.filter(c => 
                c !== this && 
                c.energy > c.maxEnergy * 0.5 && 
                c.reproductionCooldown <= 0
            );
            const closestMate = this.findClosest(potentialMates);
            
            let food_drive = Infinity;
            let mate_drive = Infinity;
            
            if (closestFood) {
                food_drive = this.distanceTo(closestFood) * this.genes.appetite;
            }
            
            if (closestMate) {
                mate_drive = this.distanceTo(closestMate) * (1 / this.genes.appetite);
            }
            
            // Compare drives directly - lower drive value wins (closer distance or stronger preference)
            if (food_drive <= mate_drive && closestFood) {
                this.state = 'seeking_food';
                this.target = closestFood;
                this.moveToward(this.target);
            } else if (mate_drive < food_drive && closestMate && this.reproductionCooldown <= 0) {
                this.state = 'mating';
                if (this.distanceTo(closestMate) < this.radius + closestMate.radius + 20) {
                    this.reproduce(closestMate, world);
                } else {
                    this.target = closestMate;
                    this.moveToward(this.target);
                }
            } else {
                this.wander(); // No clear decision or targets available
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
        // Both parents need more than half energy to reproduce
        if (this.energy <= this.maxEnergy * 0.5 || mate.energy <= mate.maxEnergy * 0.5) return;
        
        // Create offspring with genetic crossover and mutation
        const childGenes = this.crossoverGenes(mate);
        this.mutateGenes(childGenes, world);
        
        // Place child right next to parents
        const childX = (this.x + mate.x) / 2 + (Math.random() - 0.5) * 20;
        const childY = (this.y + mate.y) / 2 + (Math.random() - 0.5) * 20;
        
        const child = new Creature(childX, childY, childGenes);
        child.setWorldParams(world);
        
        world.creatures.push(child);
        world.stats.totalBirths++;
        world.stats.totalReproductions++;
        
        // Track mutations
        if (childGenes.hasMutation) {
            world.stats.totalMutations++;
        }
        
        // Reproduction costs energy (relative to max energy)
        this.energy = parseFloat((this.energy - this.maxEnergy * 0.3).toFixed(2));
        mate.energy = parseFloat((mate.energy - mate.maxEnergy * 0.3).toFixed(2));
        this.reproductionCooldown = 200;
        mate.reproductionCooldown = 200;
    }
    
    crossoverGenes(mate) {
        // Simple genetic crossover - average parents' genes with 2 decimal precision
        return {
            size: parseFloat(((this.genes.size + mate.genes.size) / 2).toFixed(2)),
            speed: parseFloat(((this.genes.speed + mate.genes.speed) / 2).toFixed(2)),
            appetite: parseFloat(((this.genes.appetite + mate.genes.appetite) / 2).toFixed(2)),
            hasMutation: false // Will be set during mutation
        };
    }
    
    mutateGenes(genes, world) {
        const mutationRate = world.mutationRate / 100; // Convert percentage to decimal
        const mutationStrength = world.mutationStrength / 100; // Convert percentage to decimal
        let hasMutated = false;
        
        // Calculate mutation factor range based on strength
        const minFactor = 1 - mutationStrength; // e.g., 1 - 0.2 = 0.8
        const maxFactor = 1 + mutationStrength; // e.g., 1 + 0.2 = 1.2
        
        // Mutate size
        if (Math.random() < mutationRate) {
            const mutationFactor = minFactor + Math.random() * (maxFactor - minFactor);
            genes.size = parseFloat((genes.size * mutationFactor).toFixed(2));
            genes.size = parseFloat(Math.max(0.10, Math.min(10.00, genes.size)).toFixed(2)); // Keep in 0.10-10.00 range
            hasMutated = true;
        }
        
        // Mutate speed
        if (Math.random() < mutationRate) {
            const mutationFactor = minFactor + Math.random() * (maxFactor - minFactor);
            genes.speed = parseFloat((genes.speed * mutationFactor).toFixed(2));
            genes.speed = parseFloat(Math.max(0.10, Math.min(10.00, genes.speed)).toFixed(2)); // Keep in 0.10-10.00 range
            hasMutated = true;
        }
        
        // Mutate appetite
        if (Math.random() < mutationRate) {
            const mutationFactor = minFactor + Math.random() * (maxFactor - minFactor);
            genes.appetite = parseFloat((genes.appetite * mutationFactor).toFixed(2));
            genes.appetite = parseFloat(Math.max(0.10, Math.min(1.00, genes.appetite)).toFixed(2)); // Keep in 0.10-1.00 range
            hasMutated = true;
        }
        
        genes.hasMutation = hasMutated;
    }
    
    eatFood(food, world) {
        this.energy = parseFloat(Math.min(this.maxEnergy, this.energy + 5).toFixed(2)); // Energy gain of 5 units per food
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
        const tooltipWidth = 160;
        const tooltipHeight = 71; // Increased height for appetite field
        
        // Calculate tooltip position, adjusting for canvas boundaries
        let tooltipX = this.x + this.radius + 10;
        let tooltipY = this.y - 15;
        
        // Get canvas dimensions (assuming standard canvas size)
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        // Adjust position if tooltip would go outside canvas
        if (tooltipX + tooltipWidth > canvasWidth) {
            tooltipX = this.x - this.radius - tooltipWidth - 10; // Position to the left
        }
        if (tooltipY < 0) {
            tooltipY = this.y + this.radius + 10; // Position below
        }
        if (tooltipY + tooltipHeight > canvasHeight) {
            tooltipY = this.y - this.radius - tooltipHeight - 10; // Position above
        }
        
        // Save current context settings
        ctx.save();
        
        // Ensure tooltip is drawn above everything else
        ctx.globalCompositeOperation = 'source-over';
        
        // Tooltip background with shadow for better visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
        ctx.fill();
        ctx.stroke();
        
        // Reset shadow for text
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Tooltip text
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        
        const textX = tooltipX + 8;
        let textY = tooltipY + 18;
        
        // Gene values in orange color
        ctx.fillStyle = '#f39c12';
        ctx.fillText(`Size: ${this.genes.size.toFixed(2)}`, textX, textY);
        textY += 16;
        ctx.fillText(`Speed: ${this.genes.speed.toFixed(2)}`, textX, textY);
        textY += 16;
        ctx.fillText(`Appetite: ${this.genes.appetite.toFixed(2)}`, textX, textY);
        textY += 16;
        
        // Energy in white color
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Energy: ${this.energy.toFixed(2)}/${this.maxEnergy.toFixed(2)}`, textX, textY);
        
        // Arrow pointing to creature (adjust direction based on tooltip position)
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        if (tooltipX > this.x) {
            // Tooltip is to the right, arrow points left
            ctx.moveTo(tooltipX, tooltipY + tooltipHeight / 2);
            ctx.lineTo(tooltipX - 10, tooltipY + tooltipHeight / 2 - 5);
            ctx.lineTo(tooltipX - 10, tooltipY + tooltipHeight / 2 + 5);
        } else {
            // Tooltip is to the left, arrow points right
            ctx.moveTo(tooltipX + tooltipWidth, tooltipY + tooltipHeight / 2);
            ctx.lineTo(tooltipX + tooltipWidth + 10, tooltipY + tooltipHeight / 2 - 5);
            ctx.lineTo(tooltipX + tooltipWidth + 10, tooltipY + tooltipHeight / 2 + 5);
        }
        ctx.closePath();
        ctx.fill();
        
        // Restore context
        ctx.restore();
    }
    
    isPointInside(x, y) {
        const distance = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
        return distance <= this.radius;
    }
} 