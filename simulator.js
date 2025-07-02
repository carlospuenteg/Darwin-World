// Main simulation variables
let world;
let canvas;
let ctx;
let animationFrame;

// Graph variables
let graphCanvas;
let graphCtx;
let geneHistory = {
    size: [],
    speed: [],
    appetite: []
};
const maxHistoryLength = 200;

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
    geneHistory = { size: [], speed: [], appetite: [] };
    
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
    
    // Run full updates
    for (let i = 0; i < updates; i++) {
        world.update();
    }
    
    // Run partial update (for fractional speeds)
    if (partialUpdate > 0 && Math.random() < partialUpdate) {
        world.update();
    }
    
    // Draw everything
    world.draw(ctx);
    
    // Update UI stats and graph
    updateStats();
    updateGraph();
    
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
    
    // Update gene history for graph
    if (world.creatures.length > 0) {
        geneHistory.size.push(avgTraits.size);
        geneHistory.speed.push(avgTraits.speed);
        geneHistory.appetite.push(avgTraits.appetite);
        
        // Keep history at max length
        if (geneHistory.size.length > maxHistoryLength) {
            geneHistory.size.shift();
            geneHistory.speed.shift();
            geneHistory.appetite.shift();
        }
    }
}

// Update gene evolution graph
function updateGraph() {
    if (!graphCtx || geneHistory.size.length === 0) return;
    
    const width = graphCanvas.width;
    const height = graphCanvas.height;
    
    // Clear graph
    graphCtx.fillStyle = 'rgba(0,0,0,0.8)';
    graphCtx.fillRect(0, 0, width, height);
    
    // Draw grid
    graphCtx.strokeStyle = 'rgba(255,255,255,0.1)';
    graphCtx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = (height / 5) * i;
        graphCtx.beginPath();
        graphCtx.moveTo(0, y);
        graphCtx.lineTo(width, y);
        graphCtx.stroke();
    }
    
    const historyLength = geneHistory.size.length;
    if (historyLength < 2) return;
    
    // Find min/max values for scaling
    const allValues = [...geneHistory.size, ...geneHistory.speed, ...geneHistory.appetite];
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const range = maxVal - minVal || 1;
    
    // Draw gene lines
    const genes = [
        { data: geneHistory.size, color: '#e74c3c', name: 'Size' },
        { data: geneHistory.speed, color: '#3498db', name: 'Speed' }, 
        { data: geneHistory.appetite, color: '#2ecc71', name: 'Appetite' }
    ];
    
    genes.forEach(gene => {
        graphCtx.strokeStyle = gene.color;
        graphCtx.lineWidth = 2;
        graphCtx.beginPath();
        
        for (let i = 0; i < gene.data.length; i++) {
            const x = (i / (historyLength - 1)) * width;
            const normalizedValue = (gene.data[i] - minVal) / range;
            const y = height - (normalizedValue * height);
            
            if (i === 0) {
                graphCtx.moveTo(x, y);
            } else {
                graphCtx.lineTo(x, y);
            }
        }
        graphCtx.stroke();
    });
    
    // Draw legend
    graphCtx.font = '10px Arial';
    genes.forEach((gene, index) => {
        graphCtx.fillStyle = gene.color;
        const y = 15 + index * 12;
        graphCtx.fillRect(5, y - 8, 8, 8);
        graphCtx.fillText(gene.name, 18, y);
    });
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
    world.baseConsumption = parseFloat(document.getElementById('baseConsumption').value);
    world.gameSpeed = parseFloat(document.getElementById('gameSpeed').value);
    
    // Reset gene history
    geneHistory = { size: [], speed: [], appetite: [] };
    
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
    world.baseConsumption = parseFloat(document.getElementById('baseConsumption').value);
    world.gameSpeed = parseFloat(document.getElementById('gameSpeed').value);
}

// Load config values into UI inputs
function loadConfigIntoUI() {
    document.getElementById('initialCreatures').value = CONFIG.initialCreatures;
    document.getElementById('foodSpawnRate').value = CONFIG.foodSpawnRate;
    document.getElementById('initialFood').value = CONFIG.initialFood;
    document.getElementById('baseConsumption').value = CONFIG.baseConsumption;
    document.getElementById('gameSpeed').value = CONFIG.gameSpeed;
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
    document.getElementById('baseConsumption').addEventListener('input', applySettings);
    document.getElementById('gameSpeed').addEventListener('input', applySettings);
}); 