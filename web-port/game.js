/**
 * Game module for Rogue Slayer web version
 * Core game logic, state management, and game loop
 */

class Game {
    constructor() {
        this.player = new Player();
        this.shop = null;
        this.current_dungeon_level = 1;
        this.final_boss_defeated = false;
        this.overworld_explorations = 0;
        this.currentEnemy = null;
        this.inCombat = false;
        this.isBossFight = false;
        this.currentDungeonType = "";
        
        this.shopItems = []; // Items currently in shop
        this.dungeonRooms = []; // Current dungeon rooms
        this.currentRoomIndex = 0;
        this.mobsRemaining = 0;
        
        // Load game from localStorage if available
        this.loadGame();
    }

    /**
     * Initialize and start the game
     */
    start() {
        ui.showScreen('start-screen');
    }

    /**
     * Restart the game
     */
    restartGame() {
        // Reset all game state
        this.player = new Player();
        this.current_dungeon_level = 1;
        this.final_boss_defeated = false;
        this.overworld_explorations = 0;
        this.currentEnemy = null;
        this.inCombat = false;
        this.isBossFight = false;
        
        // Clear localStorage
        localStorage.removeItem('rogueSlayerSave');
        
        // Go back to start screen
        ui.showScreen('main-menu-screen');
        ui.updateHUD();
    }

    /**
     * Save the game state to localStorage
     */
    saveGame() {
        const gameState = {
            player: this.player.toJSON(),
            current_dungeon_level: this.current_dungeon_level,
            final_boss_defeated: this.final_boss_defeated,
            overworld_explorations: this.overworld_explorations
        };
        
        localStorage.setItem('rogueSlayerSave', JSON.stringify(gameState));
    }

    /**
     * Load the game state from localStorage
     */
    loadGame() {
        const savedGame = localStorage.getItem('rogueSlayerSave');
        if (savedGame) {
            try {
                const gameState = JSON.parse(savedGame);
                this.player = Player.fromJSON(gameState.player);
                this.current_dungeon_level = gameState.current_dungeon_level || 1;
                this.final_boss_defeated = gameState.final_boss_defeated || false;
                this.overworld_explorations = gameState.overworld_explorations || 0;
            } catch (e) {
                console.error('Error loading saved game:', e);
                // If there's an error, just use a new game state
            }
        }
    }

    /**
     * Main post-dungeon menu
     */
    postDungeonMenu() {
        ui.showScreen('main-menu-screen');
        ui.updateHUD();
    }

    /**
     * Explore dungeon flow
     */
    exploreDungeon() {
        // Get available keys from inventory
        const availableKeys = this.player.inventory.getKeys();
        
        if (availableKeys.length === 0) {
            ui.showMessage("You don't have any Dungeon Keys. Try exploring the overworld to find some.", () => {
                this.postDungeonMenu();
            });
            return;
        }
        
        // Show dungeon selection screen
        ui.showScreen('dungeon-select-screen');
        ui.renderDungeonSelection(availableKeys);
    }

    /**
     * Select a dungeon after choosing a key
     * @param {number} keyIndex - Index of the selected key
     */
    selectDungeon(keyIndex) {
        const keys = this.player.inventory.getKeys();
        if (keyIndex < 0 || keyIndex >= keys.length) return;
        
        const selectedKey = keys[keyIndex];
        const dungeonType = selectedKey.key_type || "Normal";
        
        // Consume the key
        this.player.keys--;
        this.player.inventory.removeItem(selectedKey);
        
        // Show narrative for entering dungeon
        ui.showMessage(`🔑 ${selectedKey.name} consumed. You enter the ${dungeonType} Dungeon.`, () => {
            // Continue with dungeon exploration
            this.currentDungeonType = dungeonType;
            
            // Scale dungeon difficulty based on player level and dungeon tier
            const scaledLevel = this.current_dungeon_level + this.player.level;
            
            // Determine number of mobs and boss name
            let numMobs = 3;
            let bossName = `${dungeonType} Lord`;
            
            if (dungeonType === "Final") {
                numMobs = 5;
                bossName = "Dark Overlord";
            }
            
            // Generate dungeon rooms
            const rooms = this.generateRooms(scaledLevel, dungeonType, numMobs, bossName);
            this.dungeonRooms = rooms;
            this.currentRoomIndex = 0;
            this.mobsRemaining = numMobs;
            
            // Start room exploration
            this.enterNextRoom();
        });
    }

    /**
     * Generate dungeon rooms
     * @param {number} scaledLevel - Scaled difficulty level
     * @param {string} dungeonType - Type of dungeon
     * @param {number} numMobs - Number of monster rooms
     * @param {string} bossName - Name of the dungeon boss
     * @returns {Array} - Array of room objects
     */
    generateRooms(scaledLevel, dungeonType, numMobs, bossName) {
        const rooms = [];
        
        // Add monster rooms
        for (let i = 0; i < numMobs; i++) {
            rooms.push({
                type: "monster",
                cleared: false
            });
        }
        
        // Add boss room at the end
        rooms.push({
            type: "boss",
            boss_name: bossName,
            cleared: false
        });
        
        // Shuffle monster rooms (keep boss at end)
        for (let i = 0; i < rooms.length - 1; i++) {
            const j = Math.floor(Math.random() * (rooms.length - 1));
            if (i !== j) {
                [rooms[i], rooms[j]] = [rooms[j], rooms[i]];
            }
        }
        
        return rooms;
    }

    /**
     * Enter the next room in the dungeon
     */
    enterNextRoom() {
        if (this.currentRoomIndex >= this.dungeonRooms.length) {
            // Dungeon complete
            this.finishDungeon();
            return;
        }
        
        const room = this.dungeonRooms[this.currentRoomIndex];
        const scaledLevel = this.current_dungeon_level + this.player.level;
        
        if (room.type === "monster") {
            // Generate enemy
            const enemy = Enemy.generate(scaledLevel, this.currentDungeonType);
            
            ui.showMessage(`You enter a room... 🏚️\n\nYou encounter a ${enemy.name} (Level ${enemy.level})!`, () => {
                this.startCombat(enemy, false);
            });
        } else if (room.type === "boss") {
            // Generate boss
            const boss = Boss.generate(scaledLevel, this.currentDungeonType);
            
            ui.showMessage(`You enter the Boss Chamber... 🏰\n\nA formidable ${boss.name} appears! (Level ${boss.level}) 🐉`, () => {
                this.startCombat(boss, true);
            });
        }
    }

    /**
     * Start combat with an enemy
     * @param {Enemy} enemy - The enemy to fight
     * @param {boolean} isBoss - Whether this is a boss fight
     */
    startCombat(enemy, isBoss = false) {
        this.currentEnemy = enemy;
        this.inCombat = true;
        this.isBossFight = isBoss;
        
        // Show combat screen and setup UI
        ui.showScreen('combat-screen');
        ui.setupCombatScreen(enemy, isBoss);
    }

    /**
     * Handle combat action selected by player
     * @param {string} action - The action to perform
     */
    handleCombatAction(action) {
        if (!this.inCombat || !this.currentEnemy) return;
        
        switch (action) {
            case 'attack':
                this.playerAttack();
                break;
                
            case 'use-consumable':
                this.showConsumableSelection();
                break;
                
            case 'special-ability':
                this.playerUseSpecialAbility();
                break;
                
            case 'flee':
                this.attemptFlee();
                break;
        }
    }

    /**
     * Player attacks the enemy
     */
    playerAttack() {
        const player = this.player;
        const enemy = this.currentEnemy;
        
        // Calculate damage
        let damage = Math.max(1, player.getTotalAttack() - enemy.defense);
        
        // Apply damage to enemy
        enemy.hp = Math.max(0, enemy.hp - damage);
        ui.updateEnemyHP(enemy.hp);
        ui.addCombatLog(`You attack the ${enemy.name} for ${damage} damage!`, 'success');
        
        // Check if enemy is defeated
        if (!enemy.isAlive()) {
            this.handleEnemyDefeated();
            return;
        }
        
        // Enemy's turn
        this.enemyTurn();
    }

    /**
     * Show consumable selection for combat
     */
    showConsumableSelection() {
        // Pause combat temporarily
        const consumables = this.player.inventory.getConsumables();
        
        if (consumables.length === 0) {
            ui.addCombatLog("You don't have any consumables!", 'warning');
            return;
        }
        
        // Create a simple modal dialog for consumable selection
        const dialogHtml = document.createElement('div');
        dialogHtml.className = 'consumable-selection';
        dialogHtml.innerHTML = `
            <h3>Select a Consumable</h3>
            <div class="consumable-list">
                ${consumables.map((item, index) => `
                    <div class="consumable-item" data-index="${index}">
                        ${item.emoji()} ${item.name}
                    </div>
                `).join('')}
            </div>
            <button class="btn-secondary" id="cancel-consumable">Cancel</button>
        `;
        
        document.body.appendChild(dialogHtml);
        
        // Add click listeners
        dialogHtml.querySelectorAll('.consumable-item').forEach(element => {
            element.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index, 10);
                document.body.removeChild(dialogHtml);
                this.useConsumableInCombat(consumables[index]);
            });
        });
        
        document.getElementById('cancel-consumable').addEventListener('click', () => {
            document.body.removeChild(dialogHtml);
        });
    }

    /**
     * Use a consumable item in combat
     * @param {Item} item - The consumable item to use
     */
    useConsumableInCombat(item) {
        if (item.type !== 'consumable') return;
        
        const player = this.player;
        const enemy = this.currentEnemy;
        
        let effectApplied = true;
        
        // Apply effect based on item name
        if (item.name === "Health Potion") {
            const healAmount = Math.floor(player.max_hp * 0.3);
            player.hp = Math.min(player.max_hp, player.hp + healAmount);
            ui.addCombatLog(`You used ${item.name} and recovered ${healAmount} HP!`, 'success');
        } else if (item.name === "Fireball") {
            const damage = 30;
            enemy.hp = Math.max(0, enemy.hp - damage);
            ui.updateEnemyHP(enemy.hp);
            ui.addCombatLog(`🔥 You used ${item.name}! It deals ${damage} damage!`, 'success');
        } else if (item.name === "Elixir of Fortitude") {
            player.defense += 5;
            ui.addCombatLog(`You used ${item.name}! Defense increased by 5 for this combat.`, 'success');
        } else if (item.name === "Poison Dagger") {
            const poisonDamage = 15 + player.pages * 1;
            enemy.hp = Math.max(0, enemy.hp - poisonDamage);
            ui.updateEnemyHP(enemy.hp);
            ui.addCombatLog(`☠️ You used ${item.name}! It deals ${poisonDamage} poison damage!`, 'success');
        } else if (item.name === "Revive Potion") {
            if (player.hp <= 0) {
                player.hp = Math.floor(player.max_hp * 0.5);
                ui.addCombatLog(`You used ${item.name} and revived with ${player.hp} HP!`, 'success');
            } else {
                ui.addCombatLog(`You can only use ${item.name} when defeated.`, 'warning');
                effectApplied = false;
            }
        } else {
            ui.addCombatLog(`You used ${item.name}, but nothing happened.`, 'warning');
        }
        
        // Remove item from inventory if effect was applied
        if (effectApplied) {
            player.inventory.removeItem(item);
            player.unlockAchievement(`Used ${item.name}`);
            
            // Update HUD
            ui.updateHUD();
            
            // Check if enemy is defeated
            if (!enemy.isAlive()) {
                this.handleEnemyDefeated();
                return;
            }
            
            // Enemy's turn
            this.enemyTurn();
        }
    }

    /**
     * Player uses special ability
     */
    playerUseSpecialAbility() {
        const player = this.player;
        const enemy = this.currentEnemy;
        
        if (!player.special_ability_ready) {
            ui.addCombatLog("Your special ability is not ready yet!", 'warning');
            return;
        }
        
        // Use special ability
        player.useSpecialAbility();
        
        // Calculate damage (double attack)
        let damage = Math.max(1, player.getTotalAttack() * 2 - enemy.defense);
        
        // Apply damage to enemy
        enemy.hp = Math.max(0, enemy.hp - damage);
        ui.updateEnemyHP(enemy.hp);
        
        ui.addCombatLog(`🌟 You unleash your special ability for ${damage} damage!`, 'success');
        
        // Update HUD for special ability cooldown
        ui.updateHUD();
        
        // Check if enemy is defeated
        if (!enemy.isAlive()) {
            this.handleEnemyDefeated();
            return;
        }
        
        // Enemy's turn
        this.enemyTurn();
    }

    /**
     * Attempt to flee from combat
     */
    attemptFlee() {
        // 50% chance to flee, lower for boss fights
        const fleeChance = this.isBossFight ? 0.2 : 0.5;
        
        if (Math.random() < fleeChance) {
            ui.addCombatLog("You successfully fled from combat!", 'success');
            
            // End combat
            this.inCombat = false;
            
            setTimeout(() => {
                if (this.currentRoomIndex < this.dungeonRooms.length - 1) {
                    // Not the boss room, ask if player wants to continue or leave
                    ui.showMessage(
                        "You fled from combat. Do you want to continue exploring or leave the dungeon?",
                        () => {
                            // Show options as buttons
                            const buttons = [
                                { text: "Continue Exploring", action: () => this.advanceToNextRoom() },
                                { text: "Leave Dungeon", action: () => this.leaveDungeon() }
                            ];
                            
                            // Create temporary dialog
                            this.showTemporaryDialog("Dungeon Options", "", buttons);
                        }
                    );
                } else {
                    // Boss room, return to main menu
                    ui.showMessage("You fled from the boss. Returning to main menu.", () => {
                        this.postDungeonMenu();
                    });
                }
            }, 1000);
            
            return true;
        } else {
            ui.addCombatLog("You failed to flee!", 'danger');
            
            // Enemy gets a free attack
            this.enemyTurn();
            
            return false;
        }
    }

    /**
     * Enemy's turn in combat
     */
    enemyTurn() {
        const player = this.player;
        const enemy = this.currentEnemy;
        
        // Calculate enemy attack
        const attack = enemy.performAttack();
        let damage = Math.max(1, attack.damage - player.getTotalDefense());
        
        // Apply damage to player
        player.hp = Math.max(0, player.hp - damage);
        
        // Update HUD
        ui.updateHUD();
        
        if (attack.isSpecial) {
            ui.addCombatLog(`✨ ${enemy.name} unleashes a special attack for ${damage} damage!`, 'danger');
        } else {
            ui.addCombatLog(`${enemy.name} attacks you for ${damage} damage!`, 'danger');
        }
        
        // Check if player is defeated
        if (!player.isAlive()) {
            this.handlePlayerDefeated();
            return;
        }
        
        // Check if special ability should be reset
        if (!player.special_ability_ready && player.xp >= player.xp_to_next_level / 2) {
            player.resetSpecialAbility();
            ui.addCombatLog("🌟 Your special ability is ready again!", 'success');
            
            // Update combat actions to show special ability button
            document.querySelector('[data-action="special-ability"]').style.display = 'block';
        }
    }

    /**
     * Handle enemy defeated in combat
     */
    handleEnemyDefeated() {
        const enemy = this.currentEnemy;
        const player = this.player;
        
        // End combat
        this.inCombat = false;
        
        // Add XP and update UI
        const leveledUp = player.gainXp(enemy.xp_reward);
        
        if (this.isBossFight) {
            ui.addCombatLog(`*** You have defeated the Boss ${enemy.name}! *** 🎉`, 'success');
        } else {
            ui.addCombatLog(`You have defeated the ${enemy.name}! 🎊`, 'success');
        }
        
        ui.addCombatLog(`Gained ${enemy.xp_reward} XP!`, 'success');
        
        if (leveledUp) {
            ui.addCombatLog(`Level Up! You are now level ${player.level}! 📈`, 'success');
        }
        
        // Drop loot
        setTimeout(() => {
            this.dropLoot();
        }, 1500);
    }

    /**
     * Drop loot after defeating an enemy
     */
    dropLoot() {
        const enemy = this.currentEnemy;
        const player = this.player;
        const dungeonType = this.currentDungeonType;
        
        // Generate loot based on enemy type and dungeon
        let goldAmount = Math.floor(Math.random() * 20) + 10;
        
        // Scale gold by pages
        goldAmount += player.pages;
        
        // More gold from bosses
        if (this.isBossFight) {
            goldAmount *= 3;
        }
        
        player.gold += goldAmount;
        ui.addCombatLog(`Found ${goldAmount} gold! 💰`, 'success');
        
        // Achievement for finding gold
        if (player.gold >= 50) {
            player.unlockAchievement("Treasure Hunter");
        }
        
        // Chance to find items
        let itemChance = this.isBossFight ? 1.0 : 0.3;  // Always drop from bosses
        
        if (Math.random() < itemChance) {
            // Generate random item
            const item = this.generateRandomItem(dungeonType, this.isBossFight);
            player.inventory.addItem(item);
            ui.addCombatLog(`Found ${item.emoji()} ${item.name}! 🎁`, 'success');
            
            // Achievement for finding items
            player.unlockAchievement(`Found ${item.name}`);
        }
        
        // Boss drops a page
        if (this.isBossFight) {
            player.pages += 1;
            ui.addCombatLog(`${enemy.name} dropped a Page! 📄`, 'success');
            
            // Achievement for defeating boss
            player.unlockAchievement(`Defeat ${enemy.name}`);
            
            if (dungeonType === "Fire") {
                player.unlockAchievement("Fire Lord");
            } else if (dungeonType === "Ice") {
                player.unlockAchievement("Ice Lord");
            } else if (dungeonType === "Earth") {
                player.unlockAchievement("Earth Lord");
            } else if (dungeonType === "Lightning") {
                player.unlockAchievement("Lightning Lord");
            }
            
            // Check if all elemental lords are defeated
            const bosses = ["Fire Lord", "Ice Lord", "Earth Lord", "Lightning Lord"];
            if (bosses.every(boss => player.achievements.some(a => a.name === boss))) {
                player.unlockAchievement("Master of Elements");
            }
            
            // Final boss defeated
            if (dungeonType === "Final") {
                this.final_boss_defeated = true;
                player.unlockAchievement("Dark Vanquisher");
            }
        }
        
        // Mark room as cleared
        this.dungeonRooms[this.currentRoomIndex].cleared = true;
        
        // Update UI
        ui.updateHUD();
        
        // Save game progress
        this.saveGame();
        
        // Continue dungeon
        setTimeout(() => {
            if (this.final_boss_defeated) {
                // Show victory screen
                ui.showScreen('victory-screen');
            } else {
                // After a short delay, show next steps
                if (this.currentRoomIndex < this.dungeonRooms.length - 1) {
                    // Not the boss room, ask if player wants to continue or leave
                    ui.showMessage(
                        "Continue exploring the dungeon or return to the main menu?",
                        () => {
                            // Show options as buttons
                            const buttons = [
                                { text: "Continue Exploring", action: () => this.advanceToNextRoom() },
                                { text: "Leave Dungeon", action: () => this.leaveDungeon() }
                            ];
                            
                            // Create temporary dialog
                            this.showTemporaryDialog("Dungeon Options", "", buttons);
                        }
                    );
                } else {
                    // Boss room, return to main menu
                    this.finishDungeon();
                }
            }
        }, 1000);
    }

    /**
     * Handle player defeated in combat
     */
    handlePlayerDefeated() {
        ui.addCombatLog("You have been defeated! 💀", 'danger');
        
        // Check inventory for Revive Potion
        const revivePotion = this.player.inventory.items.find(
            item => item.type === 'consumable' && item.name === 'Revive Potion'
        );
        
        if (revivePotion) {
            // Ask if player wants to use revive potion
            setTimeout(() => {
                ui.showMessage(
                    "You have a Revive Potion. Do you want to use it?",
                    () => {
                        // Show options as buttons
                        const buttons = [
                            { text: "Use Revive Potion", action: () => this.useRevivePotion(revivePotion) },
                            { text: "Accept Defeat", action: () => this.gameOver() }
                        ];
                        
                        // Create temporary dialog
                        this.showTemporaryDialog("Defeated", "", buttons);
                    }
                );
            }, 1500);
        } else {
            // No revive potion, game over
            setTimeout(() => {
                this.gameOver();
            }, 1500);
        }
    }

    /**
     * Use revive potion when defeated
     * @param {Item} revivePotion - The revive potion item
     */
    useRevivePotion(revivePotion) {
        // Revive player
        this.player.hp = Math.floor(this.player.max_hp * 0.5);
        this.player.inventory.removeItem(revivePotion);
        ui.updateHUD();
        
        ui.addCombatLog("You used the Revive Potion and came back to life!", 'success');
        ui.addCombatLog(`Revived with ${this.player.hp} HP.`, 'success');
        
        // Achievement for using revive potion
        this.player.unlockAchievement("Used Revive Potion");
        
        // Continue combat
        setTimeout(() => {
            ui.addCombatLog("The battle continues...", 'warning');
        }, 1000);
    }

    /**
     * Game over screen
     */
    gameOver() {
        ui.showScreen('game-over-screen');
    }

    /**
     * Generate a random item based on dungeon type and boss status
     * @param {string} dungeonType - The dungeon type
     * @param {boolean} isBoss - Whether this is from a boss
     * @returns {Item} - The generated item
     */
    generateRandomItem(dungeonType, isBoss = false) {
        const itemTypes = ['weapon', 'armor', 'consumable'];
        
        // Bosses have higher chance to drop weapons/armor
        const itemType = isBoss ? 
            (Math.random() < 0.7 ? (Math.random() < 0.5 ? 'weapon' : 'armor') : 'consumable') :
            itemTypes[Math.floor(Math.random() * itemTypes.length)];
        
        const rarityChance = Math.random();
        let rarity = 'common';
        
        if (isBoss) {
            rarity = rarityChance < 0.5 ? 'rare' : (rarityChance < 0.8 ? 'epic' : 'legendary');
        } else {
            rarity = rarityChance < 0.6 ? 'common' : (rarityChance < 0.9 ? 'rare' : 'epic');
        }
        
        // Generate stats based on rarity and player level
        const playerLevel = this.player.level;
        let attackBonus = 0;
        let defenseBonus = 0;
        let price = 0;
        
        if (itemType === 'weapon' || itemType === 'armor') {
            const rarityMultiplier = {
                'common': 1,
                'rare': 1.5,
                'epic': 2,
                'legendary': 3
            }[rarity];
            
            if (itemType === 'weapon') {
                attackBonus = Math.floor((2 + Math.floor(playerLevel / 2)) * rarityMultiplier);
                defenseBonus = 0;
            } else {
                attackBonus = 0;
                defenseBonus = Math.floor((1 + Math.floor(playerLevel / 3)) * rarityMultiplier);
            }
            
            price = Math.floor(20 * playerLevel * rarityMultiplier);
        } else {
            price = Math.floor(15 * playerLevel);
        }
        
        // Generate name and description based on type and dungeon
        let itemName = "";
        let itemDescription = "";
        let uniqueEffect = "";
        
        if (itemType === 'weapon') {
            const weaponTypes = {
                'Fire': ['Flame Sword', 'Magma Dagger', 'Inferno Axe'],
                'Ice': ['Frost Blade', 'Glacial Hammer', 'Arctic Bow'],
                'Earth': ['Stone Mace', 'Terra Blade', 'Gaia\'s Fist'],
                'Lightning': ['Thunder Spear', 'Shock Sword', 'Storm Dagger'],
                'Normal': ['Steel Sword', 'Iron Axe', 'Hunter\'s Bow'],
                'Final': ['Shadow Blade', 'Doomreaver', 'Soul Harvester']
            };
            
            const typeArray = weaponTypes[dungeonType] || weaponTypes['Normal'];
            itemName = typeArray[Math.floor(Math.random() * typeArray.length)];
            itemDescription = `A ${rarity} ${dungeonType.toLowerCase()} weapon.`;
            
            if (rarity === 'epic' || rarity === 'legendary') {
                uniqueEffect = "Critical hit chance increased";
            }
        } else if (itemType === 'armor') {
            const armorTypes = {
                'Fire': ['Flame Plate', 'Ember Shield', 'Magma Mail'],
                'Ice': ['Frost Armor', 'Glacial Shield', 'Arctic Plate'],
                'Earth': ['Stone Plate', 'Terra Shield', 'Earthen Armor'],
                'Lightning': ['Thunder Mail', 'Storm Shield', 'Shock Armor'],
                'Normal': ['Steel Armor', 'Iron Shield', 'Leather Vest'],
                'Final': ['Shadow Plate', 'Doom Armor', 'Soul Shield']
            };
            
            const typeArray = armorTypes[dungeonType] || armorTypes['Normal'];
            itemName = typeArray[Math.floor(Math.random() * typeArray.length)];
            itemDescription = `A ${rarity} ${dungeonType.toLowerCase()} armor piece.`;
            
            if (rarity === 'epic' || rarity === 'legendary') {
                uniqueEffect = "Reduces damage taken";
            }
        } else {
            // Consumables
            const consumables = [
                { name: "Health Potion", desc: "Restores 30% of max HP." },
                { name: "Fireball", desc: "Deals 30 damage to an enemy." },
                { name: "Elixir of Fortitude", desc: "Increases defense by 5 for the combat." },
                { name: "Poison Dagger", desc: "Applies poison that deals damage over time." },
                { name: "Revive Potion", desc: "Revives you when defeated with 50% HP." }
            ];
            
            const consumable = consumables[Math.floor(Math.random() * consumables.length)];
            itemName = consumable.name;
            itemDescription = consumable.desc;
        }
        
        // Keys are special drops from bosses
        if (isBoss && Math.random() < 0.3 && dungeonType !== "Final") {
            const keyTypes = ["Fire", "Ice", "Earth", "Lightning"];
            const randomType = keyTypes[Math.floor(Math.random() * keyTypes.length)];
            
            // Don't drop a key of the same type as the current dungeon
            const finalKeyType = randomType === dungeonType ? 
                keyTypes[(keyTypes.indexOf(randomType) + 1) % keyTypes.length] : 
                randomType;
            
            itemName = `${finalKeyType} Dungeon Key`;
            itemDescription = `Grants access to the ${finalKeyType} Dungeon.`;
            itemType = "key";
            attackBonus = 0;
            defenseBonus = 0;
            rarity = "rare";
            price = 200;
            
            return new Item({
                name: itemName,
                description: itemDescription,
                rarity,
                price,
                attack_bonus: attackBonus,
                defense_bonus: defenseBonus,
                unique_effect: uniqueEffect,
                type: itemType,
                key_type: finalKeyType
            });
        }
        
        // Create and return item
        return new Item({
            name: itemName,
            description: itemDescription,
            rarity,
            price,
            attack_bonus: attackBonus,
            defense_bonus: defenseBonus,
            unique_effect: uniqueEffect,
            type: itemType
        });
    }

    /**
     * Advance to next room in dungeon
     */
    advanceToNextRoom() {
        this.currentRoomIndex++;
        this.enterNextRoom();
    }

    /**
     * Leave the dungeon and return to main menu
     */
    leaveDungeon() {
        ui.showMessage("You leave the dungeon and return to safety.", () => {
            this.postDungeonMenu();
        });
    }

    /**
     * Finish current dungeon
     */
    finishDungeon() {
        // Increase dungeon level for next time
        this.current_dungeon_level++;
        
        // Achievement for completing dungeon
        this.player.unlockAchievement("Dungeon Crawler");
        
        // Final boss defeated?
        if (this.final_boss_defeated) {
            ui.showMessage("You have defeated the Dark Overlord! The land is saved!", () => {
                ui.showScreen('victory-screen');
            });
        } else {
            ui.showMessage("You have completed the dungeon! Returning to main menu.", () => {
                this.postDungeonMenu();
            });
        }
        
        // Save game
        this.saveGame();
    }

    /**
     * Explore the overworld
     */
    exploreOverworld() {
        // Random event in overworld
        const eventChance = Math.random();
        this.overworld_explorations++;
        
        if (eventChance < 0.4) {
            // 40% chance to find gold
            const goldFound = Math.floor(Math.random() * 91) + 10;
            const scaledGold = goldFound + this.player.pages * 2;
            this.player.gold += scaledGold;
            
            ui.showMessage(`You explore the overworld and find ${scaledGold} gold! 💰`, () => {
                // Achievement for finding gold
                if (this.player.gold >= 50) {
                    this.player.unlockAchievement("Treasure Hunter");
                }
                
                this.saveGame();
                this.postDungeonMenu();
            });
        } else if (eventChance < 0.7) {
            // 30% chance to find a key
            const keyTypes = ["Fire", "Ice", "Earth", "Lightning"];
            const keyType = keyTypes[Math.floor(Math.random() * keyTypes.length)];
            
            const key = new Item({
                name: `${keyType} Dungeon Key`,
                description: `Grants access to the ${keyType} Dungeon.`,
                rarity: "rare",
                price: 200,
                type: "key",
                key_type: keyType
            });
            
            this.player.inventory.addItem(key);
            this.player.keys++;
            
            ui.showMessage(`You found a ${keyType} Dungeon Key! 🔑`, () => {
                this.saveGame();
                this.postDungeonMenu();
            });
        } else {
            // 30% chance to encounter an enemy
            const scaledLevel = Math.floor((this.player.level + 1) / 2);
            const enemy = Enemy.generate(scaledLevel, "Normal");
            
            ui.showMessage(`You encounter a wild ${enemy.name} (Level ${enemy.level})! 🐾`, () => {
                this.startCombat(enemy, false);
                
                // After combat, handle continuation in the dropLoot method
                this.currentRoomIndex = -1; // Special flag for overworld
            });
        }
    }

    /**
     * Rest to recover HP
     */
    rest() {
        const recovery = Math.floor(this.player.max_hp * 0.5);
        const scaledRecovery = recovery + this.player.pages * 2;
        
        this.player.hp = Math.min(this.player.hp + scaledRecovery, this.player.max_hp);
        
        ui.showMessage(`You take a rest and recover ${scaledRecovery} HP. 💤`, () => {
            // Achievement for resting
            this.player.unlockAchievement("Rested and Recovered HP");
            
            this.saveGame();
            this.postDungeonMenu();
        });
    }

    /**
     * Visit the shop
     */
    visitShop() {
        ui.showScreen('shop-screen');
        this.showShopTab('buy');
    }

    /**
     * Show a specific shop tab
     * @param {string} tabName - The tab to display ('buy' or 'sell')
     */
    showShopTab(tabName) {
        if (tabName === 'buy') {
            // Generate shop inventory if needed
            if (this.shopItems.length === 0) {
                this.generateShopItems();
            }
            
            // Render buy tab
            ui.renderShop(this.shopItems, 'buy');
        } else if (tabName === 'sell') {
            // Show player's keys for selling
            const playerKeys = this.player.inventory.getKeys();
            ui.renderShop(playerKeys, 'sell');
        }
    }

    /**
     * Generate items for the shop
     */
    generateShopItems() {
        this.shopItems = [];
        
        // Number of items based on player level
        const numItems = 3 + Math.floor(this.player.level / 3);
        
        // Generate random weapons and armor
        for (let i = 0; i < numItems; i++) {
            const itemType = Math.random() < 0.4 ? 'weapon' : 
                            (Math.random() < 0.7 ? 'armor' : 'consumable');
            
            const rarityRoll = Math.random();
            let rarity = 'common';
            
            if (rarityRoll < 0.6) {
                rarity = 'common';
            } else if (rarityRoll < 0.85) {
                rarity = 'rare';
            } else {
                rarity = 'epic';
            }
            
            let name = '';
            let description = '';
            let price = 0;
            let attackBonus = 0;
            let defenseBonus = 0;
            
            if (itemType === 'weapon') {
                const weapons = [
                    "Steel Sword", "Iron Axe", "Hunter's Bow", "Mace", "Dagger", "Spear"
                ];
                name = weapons[Math.floor(Math.random() * weapons.length)];
                description = `A ${rarity} weapon for combat.`;
                
                const rarityMultiplier = rarity === 'common' ? 1 : 
                                        rarity === 'rare' ? 1.5 : 2;
                
                attackBonus = Math.floor((2 + this.player.level / 2) * rarityMultiplier);
                price = 20 * this.player.level * rarityMultiplier;
            } else if (itemType === 'armor') {
                const armors = [
                    "Steel Armor", "Iron Shield", "Leather Vest", "Chain Mail", "Plate Armor"
                ];
                name = armors[Math.floor(Math.random() * armors.length)];
                description = `A ${rarity} piece of armor.`;
                
                const rarityMultiplier = rarity === 'common' ? 1 : 
                                        rarity === 'rare' ? 1.5 : 2;
                
                defenseBonus = Math.floor((1 + this.player.level / 3) * rarityMultiplier);
                price = 20 * this.player.level * rarityMultiplier;
            } else {
                // Consumables
                const consumables = [
                    { name: "Health Potion", desc: "Restores 30% of max HP." },
                    { name: "Fireball", desc: "Deals 30 damage to an enemy." },
                    { name: "Elixir of Fortitude", desc: "Increases defense by 5 for the combat." },
                    { name: "Poison Dagger", desc: "Applies poison that deals damage over time." },
                    { name: "Revive Potion", desc: "Revives you when defeated with 50% HP." }
                ];
                
                const consumable = consumables[Math.floor(Math.random() * consumables.length)];
                name = consumable.name;
                description = consumable.desc;
                price = 15 * this.player.level;
            }
            
            // Add the item to shop
            this.shopItems.push(new Item({
                name,
                description,
                rarity,
                price,
                attack_bonus: attackBonus,
                defense_bonus: defenseBonus,
                type: itemType
            }));
        }
        
        // Add a random key (rare chance)
        if (Math.random() < 0.3) {
            const keyTypes = ["Fire", "Ice", "Earth", "Lightning"];
            const keyType = keyTypes[Math.floor(Math.random() * keyTypes.length)];
            
            this.shopItems.push(new Item({
                name: `${keyType} Dungeon Key`,
                description: `Grants access to the ${keyType} Dungeon.`,
                rarity: "rare",
                price: 200,
                type: "key",
                key_type: keyType
            }));
        }
    }

    /**
     * Buy an item from the shop
     * @param {number} index - Index of the item to buy
     */
    buyItem(index) {
        if (index < 0 || index >= this.shopItems.length) return;
        
        const item = this.shopItems[index];
        
        if (this.player.gold >= item.price) {
            // Purchase the item
            this.player.gold -= item.price;
            
            // Scale item stats based on player pages
            const scaledAttack = item.attack_bonus + this.player.pages;
            const scaledDefense = item.defense_bonus + this.player.pages;
            
            const scaledItem = new Item({
                name: item.name,
                description: item.description,
                rarity: item.rarity,
                price: item.price,
                attack_bonus: scaledAttack,
                defense_bonus: scaledDefense,
                unique_effect: item.unique_effect,
                type: item.type,
                key_type: item.key_type
            });
            
            this.player.inventory.addItem(scaledItem);
            
            // Update key count if it's a key
            if (item.type === "key") {
                this.player.keys++;
            }
            
            // Remove from shop
            this.shopItems.splice(index, 1);
            
            // Achievement
            this.player.unlockAchievement(`Purchased ${item.name}`);
            
            // Update UI
            ui.updateHUD();
            ui.renderShop(this.shopItems, 'buy');
            
            // Show message
            ui.showMessage(`Purchased ${item.emoji()} ${item.name} for ${item.price} gold.`, null);
            
            // Save game
            this.saveGame();
        } else {
            ui.showMessage("Not enough gold to purchase this item.", null);
        }
    }

    /**
     * Sell an item (key)
     * @param {number} index - Index of the item to sell
     */
    sellItem(index) {
        const keys = this.player.inventory.getKeys();
        if (index < 0 || index >= keys.length) return;
        
        const key = keys[index];
        
        // Calculate sell price (half of buy price)
        const sellPrice = Math.floor(key.price / 2);
        
        // Confirm sale
        ui.showMessage(`Sell ${key.name} for ${sellPrice} gold?`, () => {
            // Show options as buttons
            const buttons = [
                { text: "Sell", action: () => this.confirmSellItem(key, sellPrice) },
                { text: "Cancel", action: () => this.showShopTab('sell') }
            ];
            
            // Create temporary dialog
            this.showTemporaryDialog("Confirm Sale", "", buttons);
        });
    }

    /**
     * Confirm selling an item
     * @param {Item} item - Item to sell
     * @param {number} price - Sell price
     */
    confirmSellItem(item, price) {
        // Remove from inventory
        this.player.inventory.removeItem(item);
        
        // Update key count if it's a key
        if (item.type === "key") {
            this.player.keys--;
        }
        
        // Add gold
        this.player.gold += price;
        
        // Update UI
        ui.updateHUD();
        ui.renderShop(this.player.inventory.getKeys(), 'sell');
        
        // Show message
        ui.showMessage(`Sold ${item.emoji()} ${item.name} for ${price} gold.`, null);
        
        // Save game
        this.saveGame();
    }

    /**
     * Handle inventory item click
     * @param {Item} item - The clicked item
     */
    handleInventoryItemClick(item) {
        // Show item action menu
        const actions = [];
        
        if (item.type === 'weapon') {
            actions.push({ text: "Equip", action: () => this.equipItem(item) });
        } else if (item.type === 'armor') {
            actions.push({ text: "Equip", action: () => this.equipItem(item) });
        } else if (item.type === 'consumable') {
            actions.push({ text: "Use", action: () => this.useConsumable(item) });
        }
        
        // All items can be dropped
        actions.push({ text: "Drop", action: () => this.dropItem(item) });
        
        this.showTemporaryDialog(`${item.emoji()} ${item.name}`, item.description, actions);
    }

    /**
     * Equip an item
     * @param {Item} item - Item to equip
     */
    equipItem(item) {
        if (item.type === 'weapon') {
            this.player.inventory.equipWeapon(item);
        } else if (item.type === 'armor') {
            this.player.inventory.equipArmor(item);
        }
        
        ui.updateHUD();
        ui.renderInventory();
        
        ui.showMessage(`Equipped ${item.emoji()} ${item.name}.`, null);
        
        // Save game
        this.saveGame();
    }

    /**
     * Use a consumable outside of combat
     * @param {Item} item - Consumable item to use
     */
    useConsumable(item) {
        if (item.type !== 'consumable') return;
        
        let effectApplied = true;
        let message = "";
        
        // Apply effect based on item name
        if (item.name === "Health Potion") {
            const healAmount = Math.floor(this.player.max_hp * 0.3);
            this.player.hp = Math.min(this.player.max_hp, this.player.hp + healAmount);
            message = `You used ${item.name} and recovered ${healAmount} HP!`;
        } else if (item.name === "Revive Potion") {
            message = "This item can only be used when defeated in combat.";
            effectApplied = false;
        } else {
            message = "This item can only be used in combat.";
            effectApplied = false;
        }
        
        // Remove item if effect was applied
        if (effectApplied) {
            this.player.inventory.removeItem(item);
            this.player.unlockAchievement(`Used ${item.name}`);
            
            // Update inventory view
            ui.updateHUD();
            ui.renderInventory();
            
            // Save game
            this.saveGame();
        }
        
        ui.showMessage(message, null);
    }

    /**
     * Drop an item from inventory
     * @param {Item} item - Item to drop
     */
    dropItem(item) {
        // Confirm drop
        ui.showMessage(`Are you sure you want to drop ${item.name}?`, () => {
            // Show options as buttons
            const buttons = [
                { text: "Drop", action: () => this.confirmDropItem(item) },
                { text: "Cancel", action: () => ui.renderInventory() }
            ];
            
            // Create temporary dialog
            this.showTemporaryDialog("Confirm Drop", "", buttons);
        });
    }

    /**
     * Confirm dropping an item
     * @param {Item} item - Item to drop
     */
    confirmDropItem(item) {
        // Check if equipped
        if (item === this.player.inventory.equipped_weapon) {
            this.player.inventory.equipped_weapon = null;
        } else if (item === this.player.inventory.equipped_armor) {
            this.player.inventory.equipped_armor = null;
        }
        
        // Remove from inventory
        this.player.inventory.removeItem(item);
        
        // Update key count if it's a key
        if (item.type === "key") {
            this.player.keys--;
        }
        
        // Update UI
        ui.updateHUD();
        ui.renderInventory();
        
        // Show message
        ui.showMessage(`Dropped ${item.emoji()} ${item.name}.`, null);
        
        // Save game
        this.saveGame();
    }

    /**
     * Show a temporary dialog with options
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @param {Array} buttons - Array of button objects {text, action}
     */
    showTemporaryDialog(title, message, buttons) {
        // Create dialog element
        const dialog = document.createElement('div');
        dialog.className = 'temp-dialog';
        dialog.style.position = 'fixed';
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.transform = 'translate(-50%, -50%)';
        dialog.style.backgroundColor = 'var(--medium-bg)';
        dialog.style.padding = '20px';
        dialog.style.borderRadius = '10px';
        dialog.style.zIndex = '2000';
        dialog.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        dialog.style.maxWidth = '90%';
        dialog.style.width = '350px';
        
        // Add title and message
        let html = '';
        if (title) {
            html += `<h3 style="margin-bottom: 15px; text-align: center;">${title}</h3>`;
        }
        if (message) {
            html += `<p style="margin-bottom: 20px; text-align: center;">${message}</p>`;
        }
        
        // Add buttons
        html += '<div style="display: flex; flex-direction: column; gap: 10px;">';
        buttons.forEach((button, index) => {
            html += `<button class="temp-dialog-btn" data-index="${index}">${button.text}</button>`;
        });
        html += '</div>';
        
        dialog.innerHTML = html;
        
        // Apply styles to buttons
        document.body.appendChild(dialog);
        document.querySelectorAll('.temp-dialog-btn').forEach((btn, index) => {
            btn.style.padding = '10px';
            btn.style.margin = '5px 0';
            btn.style.backgroundColor = index === 0 ? 'var(--primary-color)' : 'var(--light-bg)';
            btn.style.border = 'none';
            btn.style.borderRadius = '5px';
            btn.style.cursor = 'pointer';
            btn.style.color = 'white';
            
            btn.addEventListener('click', () => {
                document.body.removeChild(dialog);
                const buttonIndex = parseInt(btn.dataset.index, 10);
                if (buttons[buttonIndex] && buttons[buttonIndex].action) {
                    buttons[buttonIndex].action();
                }
            });
        });
    }
}

// Create global game instance
const gameInstance = new Game();

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    gameInstance.start();
});