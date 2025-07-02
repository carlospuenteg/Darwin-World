// Main simulation variables
let world;
let canvas;
let ctx;
let animationFrame;

// Initialize simulation
function initializeSimulation() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Create world
    world = new World(canvas.width, canvas.height);
    world.initialize();
    
    // Draw initial state
    world.draw(ctx);
}

// Main game loop
function gameLoop() {
    // Update simulation
    world.update();
    
    // Draw everything
    world.draw(ctx);
    
    // Update UI stats
    updateStats();
    
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
    world.maxFood = parseInt(document.getElementById('maxFood').value);
    world.baseConsumption = parseFloat(document.getElementById('baseConsumption').value);
    
    world.initialize();
    world.draw(ctx);
    updateStats();
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
    world.maxFood = parseInt(document.getElementById('maxFood').value);
    world.baseConsumption = parseFloat(document.getElementById('baseConsumption').value);
}

// Load config values into UI inputs
function loadConfigIntoUI() {
    document.getElementById('initialCreatures').value = CONFIG.initialCreatures;
    document.getElementById('foodSpawnRate').value = CONFIG.foodSpawnRate;
    document.getElementById('maxFood').value = CONFIG.maxFood;
    document.getElementById('baseConsumption').value = CONFIG.baseConsumption;
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
    document.getElementById('maxFood').addEventListener('input', applySettings);
    document.getElementById('baseConsumption').addEventListener('input', applySettings);
}); 