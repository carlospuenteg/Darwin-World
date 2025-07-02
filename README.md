# 🧬 Darwin World - Evolution Simulator

An interactive evolution simulator where digital creatures evolve, reproduce, and adapt through natural selection using a sophisticated three-gene system and intelligent decision-making algorithms.

## ✨ Current Features

### 🧬 **Advanced Genetics System**
- **Three Core Genes**: Size (0.10-10.00), Speed (0.10-10.00), and Appetite (0.10-1.00)
- **Realistic Inheritance**: Offspring inherit average of parents' traits
- **Independent Mutations**: 10% chance per genome with ±20% variation per gene
- **Visual Mutation Indicator**: Mutant newborns appear green for 2 seconds

### 🎯 **Three-Tier Decision Making**
- **Energy ≤30%**: Must seek food (survival mode)
- **Energy ≥70%**: Must reproduce (reproduction mode)
- **Energy 30-70%**: Decision based on appetite using formula: `distance_to_food × appetite - distance_to_partner × (1/appetite)`

### 📈 **Real-Time Evolution Graph**
- **Live Gene Tracking**: Shows evolution of Size, Speed, and Appetite over time
- **Current Values**: Displays latest values at line endpoints with anti-overlap system
- **Min/Max Statistics**: Shows historical ranges for each gene
- **Full Simulation History**: Tracks complete evolutionary timeline

### ⚙️ **Comprehensive Configuration**
- **Population Control**: Initial creatures (0-100)
- **Food System**: Spawn rate (0-5.0), Initial food (0-500), no maximum limit
- **Energy System**: Base consumption (0-10), Base energy multiplier (1-100)
- **Creature Scaling**: Visual size multiplier (0-10), Speed multiplier (0-10)
- **Simulation Speed**: Variable speed (0-10000x) with preset buttons (x1, x2, x5, x10, x100, x200, x500, x1000)

### 🎨 **Enhanced User Interface**
- **Prominent Speed Control**: Easy access to simulation speed with preset buttons
- **Organized Layout**: Graph and stats prominently displayed, settings at bottom
- **Smart Tooltips**: Show creature details with gene information
- **Responsive Design**: Optimized for larger screens with better space utilization

## 🔬 Genetic System Details

### **Gene Functions:**
- **Size**: Affects visual scale, energy capacity (`Max Energy = Size × Base Energy`), and movement speed
- **Speed**: Controls movement rate (`Actual Speed = Creature Speed × Speed × (1/Size)`)
- **Appetite**: Determines food vs. mating preference (1.0 = pure food focus, 0.1 = mating focus)

### **Energy System:**
- **Energy Consumption**: `Base Consumption × Speed × Size` per second (frame-rate independent)
- **Starting Energy**: All creatures start with exactly half their maximum energy
- **Reproduction Cost**: 30% of maximum energy for both parents

### **Mutation System:**
- **10% chance per genome** (not per individual gene)
- **±20% variation** when mutation occurs
- **Gene-specific ranges**: Size/Speed (0.10-10.00), Appetite (0.10-1.00)
- **Visual feedback**: Green newborns indicate mutations

## 🎮 Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/carlospuenteg/Darwin-World.git
   cd Darwin-World
   ```

2. **Open in browser**:
   - Simply open `index.html` in any modern web browser
   - No installation or build process required!

3. **Controls & Settings**:
   - **Play/Pause/Reset**: Control simulation execution
   - **Simulation Speed**: Use preset buttons (x1-x1000) or custom input
   - **Environment Settings**: Adjust population, food, energy, and creature parameters
   - **Real-time Tooltips**: Hover over creatures for detailed information

## 🎨 Visual Guide

- **🔴 Red Creatures**: Adult creatures
- **🟡 Yellow Newborns**: Normal offspring (first 2 seconds)
- **🟢 Green Newborns**: Mutant offspring (first 2 seconds)
- **🔵 Blue Dots**: Food sources
- **🟠 Orange Values**: Gene statistics in UI
- **Energy Bars**: Show current/maximum energy levels

## 📈 Understanding the Evolution Graph

The real-time graph shows:
- **Red Line**: Average Size evolution over time
- **Blue Line**: Average Speed evolution over time  
- **Green Line**: Average Appetite evolution over time
- **Current Values**: Displayed at line endpoints with backgrounds
- **Min/Max Ranges**: Historical extremes shown below graph

## 🔬 Evolutionary Mechanics

### **Reproduction Requirements:**
- Both parents must have >50% energy
- Cooldown period after reproduction
- Energy cost encourages selective mating

### **Survival Pressures:**
- Energy depletion leads to death
- Food scarcity creates competition
- No random spawning - true survival simulation

### **Behavioral Evolution:**
- **High Appetite (→1.0)**: Food-focused, better survival in scarcity
- **Low Appetite (→0.1)**: Mating-focused, rapid population growth
- **Size vs Speed**: Trade-offs between energy capacity and mobility

## 🛠 Technical Architecture

### **File Structure:**
```
Darwin-World/
├── index.html          # Main interface and styling
├── config.js          # Default configuration values
├── creature.js         # Creature class with genetics and AI
├── food.js            # Food resource management  
├── world.js           # World simulation and environment
├── simulator.js       # Main game loop, controls, and graph
└── README.md          # This documentation
```

### **Technologies:**
- **HTML5 Canvas**: Real-time 2D graphics rendering
- **Vanilla JavaScript**: Simulation engine and genetic algorithms
- **CSS3**: Modern responsive UI design
- **Object-Oriented Design**: Modular, maintainable codebase

## 🎯 Educational Applications

Perfect for demonstrating:
- **Natural Selection**: Beneficial traits become more common
- **Genetic Inheritance**: Mathematical trait combination
- **Mutation Effects**: Random variation driving evolution
- **Resource Competition**: Environmental selection pressure
- **Complex Systems**: Emergent behavior from simple rules
- **Data Visualization**: Real-time evolutionary tracking

## 📊 What to Observe

Watch for:
- **Population cycles** based on food availability
- **Genetic drift** in small populations
- **Adaptive radiation** when mutations prove beneficial
- **Trade-off optimization** between competing traits
- **Extinction events** and recovery patterns
- **Speed of evolution** at different simulation rates

## 🚀 Future Enhancements

Potential additions:
- **Additional genes** (metabolism, lifespan, aggression)
- **Environmental challenges** (seasons, disasters, territories)
- **Advanced genetics** (dominant/recessive, gene linkage)
- **Data export** capabilities for analysis
- **Multi-species** ecosystems
- **Machine learning** integration

## 🤝 Contributing

Contributions welcome! The codebase is well-organized and documented for easy enhancement.

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

**Created with ❤️ by [Carlos Puente](https://github.com/carlospuenteg)**

*Experience evolution in action as digital life adapts, survives, and thrives through the power of natural selection.* 