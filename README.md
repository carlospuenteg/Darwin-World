# 🧬 Darwin World - Evolution Simulator

An interactive evolution simulator where digital creatures evolve, reproduce, and adapt through natural selection using a sophisticated three-gene system and intelligent decision-making algorithms.

## ✨ Features

### 🧬 **Advanced Genetics System**
- **Three Core Genes**: Size, Speed, and Appetite (all with 2 decimal precision)
- **Realistic Inheritance**: Offspring inherit average of parents' traits
- **Independent Mutations**: 10% chance per gene with ±20% variation
- **Visual Mutation Indicator**: Mutant newborns appear blue for 2 seconds

### 🎯 **Intelligent Decision Making**
- **Energy-Based Behavior**: Creatures must maintain energy above 50% to reproduce
- **Appetite-Driven Decisions**: Uses formula: `distance_to_food × appetite - distance_to_partner × (1-appetite)`
- **Survival Override**: Low energy forces food-seeking behavior
- **Spatial Awareness**: Decisions based on normalized distances across the world

### ⚙️ **Configurable Environment**
- **Population Control**: Adjustable initial creature count (1-100)
- **Food Dynamics**: Configurable spawn rate (0.1-5.0 per frame) and maximum food (10-200)
- **Real-time Settings**: Food parameters can be adjusted during simulation
- **No Random Spawning**: True survival simulation - when all creatures die, it's over

### 📊 **Comprehensive Statistics**
- **Population Tracking**: Live counts of creatures, food, births, deaths
- **Genetic Monitoring**: Average traits with color-coded gene values
- **Mutation Tracking**: Count of total mutations throughout simulation
- **Visual Feedback**: Hover tooltips show detailed creature information

### 🎨 **Enhanced Visuals**
- **Smart Tooltips**: Auto-repositioning tooltips that work when paused
- **Gene Highlighting**: Orange-colored gene values for easy identification
- **Creature States**: Visual indicators for newborns, mutants, and adults
- **Atmospheric Effects**: Subtle background animations

## 🔬 Genetic System Details

### **Genes and Formulas:**
- **Size (0.10-10.00)**: Determines creature radius and affects energy systems
- **Speed (0.10-10.00)**: Controls movement speed and energy consumption
- **Appetite (0.10-1.00)**: Balances preference between food-seeking and mating

### **Derived Properties:**
- **Max Energy**: `Size × 10`
- **Energy Consumption**: `1 × Speed × Size` per second
- **Movement Speed**: Directly determined by Speed gene

### **Decision Algorithm:**
When energy > 50%, creatures calculate:
```
Decision = (normalized_distance_to_food × appetite) - (normalized_distance_to_mate × (1-appetite))
```
- **Negative result**: Prefer mating
- **Positive result**: Prefer food seeking

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
   - **Start/Pause/Reset**: Control simulation execution
   - **Initial Creatures**: Set starting population size (1-100)
   - **Food Spawn Rate**: Control food generation speed (0.1-5.0)
   - **Max Food**: Set environmental carrying capacity (10-200)
   - **Real-time Tooltips**: Hover over creatures for detailed stats

## 🎨 Visual Guide

- **🔴 Red Creatures**: Adult creatures
- **🟡 Yellow Newborns**: Normal offspring (first 2 seconds)
- **🔵 Blue Newborns**: Mutant offspring (first 2 seconds)
- **🔵 Blue Dots**: Food sources
- **🟠 Orange Text**: Gene values (Size, Speed, Appetite)
- **Energy Bars**: Show current/maximum energy levels

## 📈 Evolutionary Observations

### **Appetite Evolution:**
- **High Appetite** creatures (≥0.8): Prioritize food, survive better in scarce conditions
- **Low Appetite** creatures (≤0.3): Prioritize reproduction, thrive when food is abundant
- **Balanced Appetite** creatures (≈0.5): Adapt well to changing conditions

### **Size vs Speed Trade-offs:**
- **Large creatures**: More energy capacity but higher consumption
- **Fast creatures**: Better at reaching resources but consume more energy
- **Optimal combinations**: Emerge based on environmental pressures

### **Mutation Impact:**
- **Blue newborns**: Indicate genetic innovations in the population
- **Genetic diversity**: Mutations prevent evolutionary stagnation
- **Adaptation speed**: Higher mutation rates lead to faster evolution

## 🛠 Technical Architecture

### **File Structure:**
```
Darwin-World/
├── index.html          # Main interface and styling
├── creature.js         # Creature class with genetics and AI
├── food.js            # Food resource management  
├── world.js           # World simulation and environment
├── simulator.js       # Main game loop and controls
└── README.md          # This documentation
```

### **Technologies:**
- **HTML5 Canvas**: Real-time 2D graphics rendering
- **Vanilla JavaScript**: Simulation engine and genetic algorithms
- **CSS3**: Modern UI with gradients and responsive design
- **Object-Oriented Design**: Modular, maintainable codebase

## 🔬 The Science Behind It

This simulator demonstrates key evolutionary concepts:

- **Natural Selection**: Beneficial traits become more common over time
- **Genetic Inheritance**: Offspring traits are combinations of parent traits
- **Mutation and Variation**: Random changes drive evolutionary innovation
- **Trade-offs**: Multiple traits create complex fitness landscapes
- **Resource Competition**: Limited food creates selection pressure
- **Behavioral Evolution**: Decision-making strategies evolve over time

## 📊 What to Observe

Over time, you might notice:
- **Population adaptation** to current food availability
- **Appetite specialization** based on environmental conditions
- **Size-speed optimization** for energy efficiency
- **Cyclical dynamics** as populations over/under-adapt
- **Mutation bursts** introducing new genetic combinations
- **Extinction events** when populations can't adapt fast enough

## 🚀 Educational Applications

Perfect for:
- **Biology Education**: Demonstrating natural selection and genetics
- **Computer Science**: Showing emergent behavior and algorithms
- **Data Science**: Observing statistical patterns in populations
- **Philosophy**: Exploring complexity from simple rules
- **Research**: Testing evolutionary hypotheses

## 🤝 Contributing

Feel free to contribute! Ideas for enhancement:
- Additional genes (metabolism, longevity, social behavior)
- Environmental challenges (seasons, disasters, predators)
- Advanced genetics (dominant/recessive traits, linkage)
- Data visualization and export features
- Machine learning integration
- Multi-species ecosystems

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

**Created with ❤️ by [Carlos Puente](https://github.com/carlospuenteg)**

*Experience evolution in action as digital life adapts, survives, and thrives through the power of natural selection.* 