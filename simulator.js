// Main simulation variables
let world;
let canvas;
let ctx;
let animationFrame;

// Graph variables
let graphCanvas;
let graphCtx;
let geneHistory = []; // Array of {step, size, speed, appetite} objects
let simulationSteps = 0; // Track simulation steps for graph timing

// Initialize simulation
function initializeSimulation() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Initialize graph
    graphCanvas = document.getElementById('geneGraph');
    graphCtx = graphCanvas.getContext('2d');
    
    // Create world
    world = new World(canvas.width, canvas.height);
    world.initialize();
    
    // Reset gene history
    geneHistory = [];
    simulationSteps = 0;
    
    // Draw initial state
    world.draw(ctx);
    updateGraph();
}

// Main game loop
function gameLoop() {
    // Apply game speed (run multiple updates per frame if speed > 1)
    const speed = Math.max(0, world.gameSpeed);
    const updates = Math.floor(speed);
    const partialUpdate = speed - updates;
    
    let simulationUpdated = false;
    
    // Run full updates
    for (let i = 0; i < updates; i++) {
        world.update();
        simulationSteps++;
        simulationUpdated = true;
    }
    
    // Run partial update (for fractional speeds)
    if (partialUpdate > 0 && Math.random() < partialUpdate) {
        world.update();
        simulationSteps++;
        simulationUpdated = true;
    }
    
    // Draw everything
    world.draw(ctx);
    
    // Update UI stats every frame for responsiveness
    updateStats();
    
    // Only update graph when simulation actually progressed
    if (simulationUpdated) {
        updateGraph();
    }
    
    // Continue loop if simulation is running
    if (world.running) {
        animationFrame = requestAnimationFrame(gameLoop);
    }
}

// Update statistics display
function updateStats() {
    document.getElementById('creatureCount').textContent = world.creatures.length;
    document.getElementById('foodCount').textContent = world.food.length;
    document.getElementById('totalReproductions').textContent = world.stats.totalReproductions;
    document.getElementById('totalBirths').textContent = world.stats.totalBirths;
    document.getElementById('totalDeaths').textContent = world.stats.totalDeaths;
    document.getElementById('totalMutations').textContent = world.stats.totalMutations;
    
    // Average traits
    const avgTraits = world.getAverageTraits();
    document.getElementById('avgSize').textContent = avgTraits.size.toFixed(2);
    document.getElementById('avgSpeed').textContent = avgTraits.speed.toFixed(2);
    document.getElementById('avgAppetite').textContent = avgTraits.appetite.toFixed(2);
    
    // Update gene history for graph (keep full simulation history)
    if (world.creatures.length > 0) {
        geneHistory.push({
            step: simulationSteps,
            size: avgTraits.size,
            speed: avgTraits.speed,
            appetite: avgTraits.appetite
        });
    }
}

// Update gene evolution graph
function updateGraph() {
    if (!graphCtx || geneHistory.length === 0) return;
    
    const width = graphCanvas.width;
    const height = graphCanvas.height;
    const padding = 20; // Add padding around the graph
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;
    
    // Clear graph
    graphCtx.fillStyle = 'rgba(0,0,0,0.8)';
    graphCtx.fillRect(0, 0, width, height);
    
    // Draw grid with padding
    graphCtx.strokeStyle = 'rgba(255,255,255,0.1)';
    graphCtx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding + (graphHeight / 5) * i;
        graphCtx.beginPath();
        graphCtx.moveTo(padding, y);
        graphCtx.lineTo(width - padding, y);
        graphCtx.stroke();
    }
    
    const historyLength = geneHistory.length;
    if (historyLength < 2) return;
    
    // Find min/max values for scaling (Y-axis) and simulation step range (X-axis)
    const sizeValues = geneHistory.map(h => h.size);
    const speedValues = geneHistory.map(h => h.speed);
    const appetiteValues = geneHistory.map(h => h.appetite);
    const allValues = [...sizeValues, ...speedValues, ...appetiteValues];
    
    // Use logarithmic scale - ensure all values are positive by using a minimum of 0.01
    const minVal = Math.max(0.01, Math.min(...allValues));
    const maxVal = Math.max(...allValues);
    const logMinVal = Math.log10(minVal);
    const logMaxVal = Math.log10(maxVal);
    const logRange = logMaxVal - logMinVal || 1;
    
    // Get simulation step range for X-axis
    const minStep = geneHistory[0].step;
    const maxStep = geneHistory[historyLength - 1].step;
    const stepRange = maxStep - minStep || 1;
    
    // Draw gene lines with padding
    const genes = [
        { data: sizeValues, color: '#e74c3c', name: 'Size' },
        { data: speedValues, color: '#3498db', name: 'Speed' }, 
        { data: appetiteValues, color: '#2ecc71', name: 'Appetite' }
    ];
    
    genes.forEach(gene => {
        graphCtx.strokeStyle = gene.color;
        graphCtx.lineWidth = 2;
        graphCtx.beginPath();
        
        for (let i = 0; i < gene.data.length; i++) {
            // Use simulation step for X position instead of array index
            const currentStep = geneHistory[i].step;
            const x = padding + ((currentStep - minStep) / stepRange) * graphWidth;
            // Use logarithmic scale for Y position
            const logValue = Math.log10(Math.max(0.01, gene.data[i]));
            const normalizedValue = (logValue - logMinVal) / logRange;
            const y = height - padding - (normalizedValue * graphHeight);
            
            if (i === 0) {
                graphCtx.moveTo(x, y);
            } else {
                graphCtx.lineTo(x, y);
            }
        }
        graphCtx.stroke();
        
        // Draw current value at the end of the line
        if (gene.data.length > 0) {
            const lastValue = gene.data[gene.data.length - 1];
            const lastStep = geneHistory[historyLength - 1].step;
            const lastX = padding + ((lastStep - minStep) / stepRange) * graphWidth;
            // Use logarithmic scale for end point
            const logLastValue = Math.log10(Math.max(0.01, lastValue));
            const lastNormalizedValue = (logLastValue - logMinVal) / logRange;
            const lastY = height - padding - (lastNormalizedValue * graphHeight);
            
            // Draw circle at end point
            graphCtx.fillStyle = gene.color;
            graphCtx.beginPath();
            graphCtx.arc(lastX, lastY, 5, 0, 2 * Math.PI);
            graphCtx.fill();
        }
    });
    
    // Draw all value labels separately to prevent overlapping
    const valuePositions = [];
    genes.forEach((gene, index) => {
        if (gene.data.length > 0) {
            const lastValue = gene.data[gene.data.length - 1];
            const lastStep = geneHistory[historyLength - 1].step;
            const lastX = padding + ((lastStep - minStep) / stepRange) * graphWidth;
            // Use logarithmic scale for value labels
            const logLastValue = Math.log10(Math.max(0.01, lastValue));
            const lastNormalizedValue = (logLastValue - logMinVal) / logRange;
            let lastY = height - padding - (lastNormalizedValue * graphHeight);
            
            // Adjust Y position to prevent overlapping
            const minDistance = 16;
            for (const pos of valuePositions) {
                if (Math.abs(lastY - pos.y) < minDistance) {
                    if (lastY < pos.y) {
                        lastY = pos.y - minDistance;
                    } else {
                        lastY = pos.y + minDistance;
                    }
                }
            }
            
            // Keep within bounds
            lastY = Math.max(padding + 8, Math.min(height - padding - 8, lastY));
            valuePositions.push({ y: lastY });
            
            // Draw background for text
            const text = lastValue.toFixed(2);
            graphCtx.font = 'bold 12px Arial';
            const textMetrics = graphCtx.measureText(text);
            const textWidth = textMetrics.width;
            const textHeight = 14;
            
            let textX = Math.min(lastX + 10, width - padding - textWidth - 4);
            
            // Draw background rectangle
            graphCtx.fillStyle = 'rgba(0,0,0,0.7)';
            graphCtx.fillRect(textX - 2, lastY - textHeight + 2, textWidth + 4, textHeight);
            
            // Draw text
            graphCtx.fillStyle = gene.color;
            graphCtx.textAlign = 'left';
            graphCtx.fillText(text, textX, lastY);
        }
    });
    
    // Draw legend
    graphCtx.font = '10px Arial';
    genes.forEach((gene, index) => {
        graphCtx.fillStyle = gene.color;
        const y = 15 + index * 12;
        graphCtx.fillRect(5, y - 8, 8, 8);
        graphCtx.fillText(gene.name, 18, y);
    });
    
    // Update min/max display below the graph
    if (geneHistory.length > 0) {
        const sizeMin = Math.min(...sizeValues).toFixed(2);
        const sizeMax = Math.max(...sizeValues).toFixed(2);
        const speedMin = Math.min(...speedValues).toFixed(2);
        const speedMax = Math.max(...speedValues).toFixed(2);
        const appetiteMin = Math.min(...appetiteValues).toFixed(2);
        const appetiteMax = Math.max(...appetiteValues).toFixed(2);
        
        const minMaxDiv = document.getElementById('geneMinMax');
        minMaxDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-top: 5px; background: rgba(0,0,0,0.8); padding: 8px; border-radius: 6px;">
                <span style="color: #e74c3c; font-size: 13px; font-weight: bold;"><strong>Size:</strong> ${sizeMin} - ${sizeMax}</span>
                <span style="color: #3498db; font-size: 13px; font-weight: bold;"><strong>Speed:</strong> ${speedMin} - ${speedMax}</span>
                <span style="color: #2ecc71; font-size: 13px; font-weight: bold;"><strong>Appetite:</strong> ${appetiteMin} - ${appetiteMax}</span>
            </div>
        `;
    }
}

// Control functions
function startSimulation() {
    world.running = true;
    gameLoop();
}

function pauseSimulation() {
    world.running = false;
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
}

function resetSimulation() {
    pauseSimulation();
    
    // Update world settings from UI inputs
    world.initialCreatures = parseInt(document.getElementById('initialCreatures').value);
    world.foodSpawnRate = parseFloat(document.getElementById('foodSpawnRate').value);
    world.initialFood = parseInt(document.getElementById('initialFood').value);
    world.maxFood = parseInt(document.getElementById('maxFood').value);
    world.baseConsumption = parseFloat(document.getElementById('baseConsumption').value);
    world.gameSpeed = parseFloat(document.getElementById('gameSpeed').value);
    world.creatureSpeed = parseFloat(document.getElementById('creatureSpeed').value);
    world.creatureSize = parseFloat(document.getElementById('creatureSize').value);
    world.baseEnergy = parseFloat(document.getElementById('baseEnergy').value);
    
    // Reset gene history
    geneHistory = [];
    simulationSteps = 0;
    
    world.initialize();
    world.draw(ctx);
    updateStats();
    updateGraph();
}

// Mouse interaction for creature tooltips
function setupMouseInteraction() {
    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // Check if mouse is over any creature (works even when paused)
        world.creatures.forEach(creature => {
            creature.isHovered = creature.isPointInside(mouseX, mouseY);
        });
        
        // Redraw immediately to show tooltips even when paused
        if (!world.running) {
            world.draw(ctx);
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        // Clear all hover states when mouse leaves canvas
        world.creatures.forEach(creature => {
            creature.isHovered = false;
        });
        
        // Redraw to hide tooltips when paused
        if (!world.running) {
            world.draw(ctx);
        }
    });
}

// Apply settings without resetting
function applySettings() {
    world.foodSpawnRate = parseFloat(document.getElementById('foodSpawnRate').value);
    world.initialFood = parseInt(document.getElementById('initialFood').value);
    world.maxFood = parseInt(document.getElementById('maxFood').value);
    world.baseConsumption = parseFloat(document.getElementById('baseConsumption').value);
    world.gameSpeed = parseFloat(document.getElementById('gameSpeed').value);
    world.creatureSpeed = parseFloat(document.getElementById('creatureSpeed').value);
    world.creatureSize = parseFloat(document.getElementById('creatureSize').value);
    world.baseEnergy = parseFloat(document.getElementById('baseEnergy').value);
    
    // Update all existing creatures with new world parameters
    world.creatures.forEach(creature => creature.setWorldParams(world));
}

// Load config values into UI inputs
function loadConfigIntoUI() {
    document.getElementById('initialCreatures').value = CONFIG.initialCreatures;
    document.getElementById('foodSpawnRate').value = CONFIG.foodSpawnRate;
    document.getElementById('initialFood').value = CONFIG.initialFood;
    document.getElementById('maxFood').value = CONFIG.maxFood;
    document.getElementById('baseConsumption').value = CONFIG.baseConsumption;
    document.getElementById('gameSpeed').value = CONFIG.gameSpeed;
    document.getElementById('creatureSpeed').value = CONFIG.creatureSpeed;
    document.getElementById('creatureSize').value = CONFIG.creatureSize;
    document.getElementById('baseEnergy').value = CONFIG.baseEnergy;
}

// Set speed from preset buttons
function setSpeed(speed) {
    document.getElementById('gameSpeed').value = speed;
    applySettings();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadConfigIntoUI();
    initializeSimulation();
    setupMouseInteraction();
    updateStats();
    
    // Connect buttons to functions
    document.getElementById('startBtn').addEventListener('click', startSimulation);
    document.getElementById('pauseBtn').addEventListener('click', pauseSimulation);
    document.getElementById('resetBtn').addEventListener('click', resetSimulation);
    
    // Connect settings inputs to apply function
    document.getElementById('foodSpawnRate').addEventListener('input', applySettings);
    document.getElementById('initialFood').addEventListener('input', applySettings);
    document.getElementById('maxFood').addEventListener('input', applySettings);
    document.getElementById('baseConsumption').addEventListener('input', applySettings);
    document.getElementById('gameSpeed').addEventListener('input', applySettings);
    document.getElementById('creatureSpeed').addEventListener('input', applySettings);
    document.getElementById('creatureSize').addEventListener('input', applySettings);
    document.getElementById('baseEnergy').addEventListener('input', applySettings);
}); 