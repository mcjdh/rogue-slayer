# Rogue Slayer

**Rogue Slayer** is a roguelike RPG available as both a terminal-based Python game and a web-based JavaScript game where you explore randomly generated dungeons, battle bosses, and level up your hero to face the Dark Overlord.

The game uses a Key-Driven Procedural Dungeon Generation system: each Dungeon Key unlocks a themed dungeon instance that is algorithmically generated with unique layouts, enemy placements, and loot on every run—ensuring no two dungeons are ever the same.

## Table of Contents
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Game](#running-the-game)
- [Gameplay Overview](#gameplay-overview)
  - [Dungeon Exploration](#dungeon-exploration)
  - [Dungeon Keys](#dungeon-keys)
  - [Loot & Progression](#loot--progression)
  - [Shop & Rest Mechanics](#shop--rest-mechanics)
  - [Achievements](#achievements)
  - [Final Challenge](#final-challenge)
- [Quick Guide](#quick-guide)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features
- 🏰 Procedurally generated themed dungeons (Fire, Ice, Earth, Lightning)
- 🔑 Dungeon Key system for varied playthroughs
- 👾 Random mobs and challenging Dungeon Lords
- 💰 Loot drops: weapons, armor, consumables, and new keys
- 📄 Collect Pages to unlock the Final Dungeon
- 📈 RPG progression: XP, levels, HP, Attack, Defense, and abilities
- 🛒 In-game shop to buy/sell items
- 🛌 Rest to recover HP between dungeon runs
- 🌟 Achievements and a final boss fight against the Dark Overlord

## Getting Started

### Terminal Version

#### Prerequisites
- Python 3.7 or higher
- Windows, macOS, or Linux

#### Running the Terminal Game
```powershell
python main.py
```

### Web Version

#### Prerequisites
- Any modern web browser (Chrome, Firefox, Safari, Edge)
- Supports both desktop and mobile devices

#### Running the Web Game
1. Open the `index.html` file in a web browser
2. Or serve the files using a local web server:
   ```
   # Python 3 simple HTTP server
   python -m http.server
   ```
   Then open `http://localhost:8000` in your browser

#### Web Version Features
- Responsive design for mobile and desktop
- Tap/click interface for easy interaction
- Game progress saved in browser localStorage
- Modern UI with improved visuals

## Gameplay Overview

### Dungeon Exploration 🏰
- Pick a Dungeon Key from your inventory to generate a new instance of that themed dungeon.
- Each run features a new layout, enemy placement, and loot.
- Fight through mobs and face the Dungeon Lord to earn unique gear and Pages.

### Dungeon Keys 🔑
- Four key types: Fire, Ice, Earth, and Lightning.
- Keys are consumed on use but can also be bought or sold in the shop.
- Collect Pages from boss drops to craft the Final Key.

### Loot & Progression 💰📈
- Defeat enemies and bosses to gather:
  - Weapons & Armor (boost your stats)
  - Consumables (potions, food)
  - Dungeon Keys
- Earn XP from battles to level up and unlock special abilities.
- Stats include HP, Attack, and Defense.

### Shop & Rest Mechanics 🛒🛌
- Visit the in-game shop to buy or sell items and keys.
- Rest at the main menu to recover HP before your next dungeon run.

### Achievements 🏆
- Unlock milestones such as:
  - Defeating dungeon bosses
  - Accumulating gold
  - Reaching new levels

### Final Challenge 🌟
Once you’ve collected all required Pages, use the Final Key to open the rift gate to the Final Dungeon and confront the Dark Overlord.

## Quick Guide 📜
1. Collect Keys: Gather Dungeon Keys 🔑 to enter dungeons.
2. Explore & Fight: Conquer mobs and bosses for loot and Pages.
3. Progress & Prepare: Level up, manage gear, and rest or shop.
4. Defeat the Dark Overlord: Unlock and clear the Final Dungeon.

## Project Structure
```
# Terminal Version
entities.py   # Defines characters, mobs, bosses, and items in Python
game.py       # Core game logic, combat, progression, and menus in Python
main.py       # Game entry point and main loop for terminal version
utils.py      # Helper functions for terminal version

# Web Version
index.html    # Main HTML file for the web game
style.css     # CSS styling for responsive UI
entities.js   # JavaScript classes for game entities
game.js       # Game logic and state management in JavaScript
ui.js         # UI rendering and input handling

README.md     # This file
```
