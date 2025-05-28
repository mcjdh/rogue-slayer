/**
 * UI module for Rogue Slayer web version
 * Handles DOM manipulation, UI rendering, and user input
 */

// UI class to handle screen transitions and UI updates
class UI {
    constructor() {
        this.currentScreen = null;
        this.messageQueue = [];
        this.combatLog = [];
    }

    /**
     * Initialize the UI and attach event listeners
     */
    initialize() {
        // Start screen button
        document.getElementById('start-button').addEventListener('click', () => {
            this.showScreen('main-menu-screen');
        });

        // Attach event listeners to menu buttons
        this.attachMenuListeners();

        // Show the start screen by default
        this.showScreen('start-screen');
    }

    /**
     * Attach event listeners to menu buttons and other UI elements
     */
    attachMenuListeners() {
        // Main menu buttons
        const menuButtons = document.querySelectorAll('.btn-menu');
        menuButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                
                switch(action) {
                    case 'explore-dungeon':
                        gameInstance.exploreDungeon();
                        break;
                    case 'explore-overworld':
                        gameInstance.exploreOverworld();
                        break;
                    case 'rest':
                        gameInstance.rest();
                        break;
                    case 'shop':
                        gameInstance.visitShop();
                        break;
                    case 'inventory':
                        this.showScreen('inventory-screen');
                        this.renderInventory();
                        break;
                    case 'achievements':
                        this.showScreen('achievements-screen');
                        this.renderAchievements();
                        break;
                    case 'exit':
                        this.showMessage("Thank you for playing Rogue Slayer!", () => {
                            window.location.reload();
                        });
                        break;
                }
            });
        });

        // Back buttons and other navigation
        document.querySelectorAll('[data-action="back"], [data-action="back-to-menu"]').forEach(button => {
            button.addEventListener('click', () => {
                this.showScreen('main-menu-screen');
            });
        });

        // Combat action buttons
        document.querySelectorAll('.btn-combat').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                gameInstance.handleCombatAction(action);
            });
        });

        // Shop tabs
        document.querySelectorAll('.shop-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                const tabName = e.target.dataset.tab;
                gameInstance.showShopTab(tabName);
            });
        });

        // Message box
        document.getElementById('message-confirm').addEventListener('click', () => {
            this.hideMessage();
            this.processMessageQueue();
        });

        // Cancel dungeon selection
        document.querySelector('[data-action="cancel-dungeon"]').addEventListener('click', () => {
            this.showScreen('main-menu-screen');
        });

        // Restart button
        document.querySelectorAll('[data-action="restart"]').forEach(button => {
            button.addEventListener('click', () => {
                gameInstance.restartGame();
            });
        });
    }

    /**
     * Show a specific screen and hide all others
     * @param {string} screenId - The ID of the screen to show
     */
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.game-screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Show the requested screen
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.remove('hidden');
            screen.classList.add('fade-in');
            this.currentScreen = screenId;
        }
        
        // Update HUD if not on start screen
        if (screenId !== 'start-screen' && screenId !== 'game-over-screen' && screenId !== 'victory-screen') {
            this.updateHUD();
        }
    }

    /**
     * Update the HUD with current player stats
     */
    updateHUD() {
        const player = gameInstance.player;
        if (!player) return;
        
        let hudHtml = `
            <div class="hud-item"><span>HP:</span> ${player.hp}/${player.max_hp}</div>
            <div class="hud-item"><span>Level:</span> ${player.level}</div>
            <div class="hud-item"><span>XP:</span> ${player.xp}/${player.xp_to_next_level}</div>
            <div class="hud-item"><span>Attack:</span> ${player.getTotalAttack()}</div>
            <div class="hud-item"><span>Defense:</span> ${player.getTotalDefense()}</div>
            <div class="hud-item"><span>Gold:</span> ${player.gold}</div>
            <div class="hud-item"><span>Keys:</span> ${player.keys}</div>
            <div class="hud-item"><span>Pages:</span> ${player.pages}</div>
        `;

        document.getElementById('hud').innerHTML = hudHtml;
    }

    /**
     * Display a message in the message box
     * @param {string} message - The message to display
     * @param {Function} callback - Optional callback when user confirms
     */
    showMessage(message, callback = null) {
        // If a message is already showing, queue this one
        if (!document.getElementById('message-box').classList.contains('hidden')) {
            this.messageQueue.push({ message, callback });
            return;
        }
        
        document.getElementById('message-text').textContent = message;
        document.getElementById('message-box').classList.remove('hidden');
        
        // Store callback for when user confirms
        this._messageCallback = callback;
    }

    /**
     * Hide the message box
     */
    hideMessage() {
        document.getElementById('message-box').classList.add('hidden');
        
        // Execute callback if exists
        if (this._messageCallback) {
            const callback = this._messageCallback;
            this._messageCallback = null;
            callback();
        }
    }

    /**
     * Process the next message in the queue
     */
    processMessageQueue() {
        if (this.messageQueue.length > 0) {
            const { message, callback } = this.messageQueue.shift();
            this.showMessage(message, callback);
        }
    }

    /**
     * Render player inventory
     */
    renderInventory() {
        const inventoryContainer = document.getElementById('inventory-items');
        const player = gameInstance.player;
        
        if (!player || !player.inventory) {
            inventoryContainer.innerHTML = '<p>No items in inventory</p>';
            return;
        }
        
        if (player.inventory.items.length === 0) {
            inventoryContainer.innerHTML = '<p>Your inventory is empty</p>';
            return;
        }
        
        let html = '';
        player.inventory.items.forEach(item => {
            let equippedStatus = '';
            if (item === player.inventory.equipped_weapon) {
                equippedStatus = ' <span class="text-success">[Equipped]</span>';
            } else if (item === player.inventory.equipped_armor) {
                equippedStatus = ' <span class="text-success">[Equipped]</span>';
            }
            
            html += `
                <div class="inventory-item" data-name="${item.name}" data-type="${item.type}">
                    <div>${item.emoji()} ${item.name}${equippedStatus}</div>
                    <div class="item-description">${item.description}</div>
                    ${item.type === 'weapon' || item.type === 'armor' ? 
                        `<div>Attack: +${item.attack_bonus}, Defense: +${item.defense_bonus}</div>` : ''}
                    ${item.unique_effect ? `<div>${item.unique_effect}</div>` : ''}
                    <div>${item.price > 0 ? `Value: ${item.price} gold` : ''}</div>
                </div>
            `;
        });
        
        inventoryContainer.innerHTML = html;
        
        // Add click events to items
        document.querySelectorAll('.inventory-item').forEach(element => {
            element.addEventListener('click', (e) => {
                const name = e.currentTarget.dataset.name;
                const type = e.currentTarget.dataset.type;
                const item = player.inventory.items.find(i => i.name === name && i.type === type);
                
                if (item) {
                    gameInstance.handleInventoryItemClick(item);
                }
            });
        });
    }

    /**
     * Render achievements list
     */
    renderAchievements() {
        const achievementsContainer = document.getElementById('achievements-list');
        const player = gameInstance.player;
        
        if (!player || !player.achievements) {
            achievementsContainer.innerHTML = '<p>No achievements yet</p>';
            return;
        }
        
        // Get all achievements and mark which ones are unlocked
        const achievements = ALL_ACHIEVEMENTS.map(achievement => {
            const unlocked = player.achievements.some(a => a.name === achievement.name);
            return { ...achievement, unlocked };
        });
        
        let html = '';
        achievements.forEach(achievement => {
            html += `
                <div class="achievement ${achievement.unlocked ? '' : 'achievement-locked'}">
                    <div class="achievement-icon">${achievement.unlocked ? '🏆' : '🔒'}</div>
                    <div>
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-description">${achievement.description}</div>
                    </div>
                </div>
            `;
        });
        
        achievementsContainer.innerHTML = html;
    }

    /**
     * Render the shop items
     * @param {Array} items - Shop items to display
     * @param {string} mode - Shop mode ('buy' or 'sell')
     */
    renderShop(items, mode) {
        const shopContainer = document.getElementById('shop-inventory');
        const player = gameInstance.player;
        
        if (!items || items.length === 0) {
            shopContainer.innerHTML = '<p>No items available</p>';
            return;
        }
        
        let html = '';
        items.forEach((item, index) => {
            let canAfford = true;
            
            if (mode === 'buy' && player.gold < item.price) {
                canAfford = false;
            }
            
            html += `
                <div class="shop-item ${!canAfford ? 'disabled' : ''}" data-index="${index}" data-mode="${mode}">
                    <div>${item.emoji()} ${item.name}</div>
                    <div class="item-description">${item.description}</div>
                    ${item.type === 'weapon' || item.type === 'armor' ? 
                        `<div>Attack: +${item.attack_bonus}, Defense: +${item.defense_bonus}</div>` : ''}
                    <div class="${canAfford ? 'text-success' : 'text-danger'}">
                        ${mode === 'buy' ? `Price: ${item.price} gold` : `Value: ${item.price} gold`}
                    </div>
                </div>
            `;
        });
        
        shopContainer.innerHTML = html;
        
        // Add click events to items
        document.querySelectorAll('.shop-item').forEach(element => {
            element.addEventListener('click', (e) => {
                if (e.currentTarget.classList.contains('disabled')) return;
                
                const index = parseInt(e.currentTarget.dataset.index, 10);
                const mode = e.currentTarget.dataset.mode;
                
                if (mode === 'buy') {
                    gameInstance.buyItem(index);
                } else if (mode === 'sell') {
                    gameInstance.sellItem(index);
                }
            });
        });
    }

    /**
     * Render dungeon selection screen with available keys
     * @param {Array} keys - Available dungeon keys
     */
    renderDungeonSelection(keys) {
        const keysContainer = document.getElementById('available-keys');
        
        if (!keys || keys.length === 0) {
            keysContainer.innerHTML = '<p>You don\'t have any dungeon keys</p>';
            return;
        }
        
        let html = '';
        keys.forEach((key, index) => {
            html += `
                <div class="key-item" data-index="${index}">
                    <div>${key.emoji()} ${key.name}</div>
                    <div>${key.description}</div>
                </div>
            `;
        });
        
        keysContainer.innerHTML = html;
        
        // Add click events to keys
        document.querySelectorAll('.key-item').forEach(element => {
            element.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index, 10);
                gameInstance.selectDungeon(index);
            });
        });
    }

    /**
     * Setup combat screen with enemy info and available actions
     * @param {Object} enemy - The enemy object
     * @param {boolean} isBoss - Whether this is a boss fight
     */
    setupCombatScreen(enemy, isBoss = false) {
        const enemyInfoContainer = document.querySelector('.combat-enemy-info');
        const player = gameInstance.player;
        
        // Clear combat log
        this.combatLog = [];
        document.querySelector('.combat-log').innerHTML = '';
        
        // Display enemy info
        enemyInfoContainer.innerHTML = `
            <div>${isBoss ? '🐉' : '👾'} ${enemy.name} ${isBoss ? '(BOSS)' : ''} | Level ${enemy.level}</div>
            <div>HP: <span id="enemy-hp">${enemy.hp}</span></div>
            ${isBoss ? `<div class="text-highlight">✨ Boss Ability: ${Math.round(enemy.special_attack_chance * 100)}% chance to perform special attacks</div>` : ''}
        `;
        
        // Setup available combat actions
        const hasConsumables = player.inventory.getConsumables().length > 0;
        const specialAbilityReady = player.special_ability_ready;
        
        // Hide all action buttons first
        document.querySelectorAll('.btn-combat').forEach(btn => {
            btn.style.display = 'none';
        });
        
        // Show relevant buttons based on available actions
        document.querySelector('[data-action="attack"]').style.display = 'block';
        
        if (hasConsumables) {
            document.querySelector('[data-action="use-consumable"]').style.display = 'block';
        }
        
        if (specialAbilityReady) {
            document.querySelector('[data-action="special-ability"]').style.display = 'block';
        }
        
        document.querySelector('[data-action="flee"]').style.display = 'block';
    }

    /**
     * Update enemy HP display during combat
     * @param {number} hp - Current enemy HP
     */
    updateEnemyHP(hp) {
        document.getElementById('enemy-hp').textContent = hp;
    }

    /**
     * Add a message to the combat log
     * @param {string} message - Message to add
     * @param {string} type - Message type (normal, success, danger, warning)
     */
    addCombatLog(message, type = 'normal') {
        const logContainer = document.querySelector('.combat-log');
        const colorClass = type === 'success' ? 'text-success' : 
                          type === 'danger' ? 'text-danger' : 
                          type === 'warning' ? 'text-warning' : '';
        
        this.combatLog.push({ message, type });
        
        // Keep log at most recent 10 messages
        if (this.combatLog.length > 10) {
            this.combatLog.shift();
        }
        
        // Update log display
        let html = '';
        this.combatLog.forEach(entry => {
            const entryClass = entry.type === 'success' ? 'text-success' : 
                              entry.type === 'danger' ? 'text-danger' : 
                              entry.type === 'warning' ? 'text-warning' : '';
            
            html += `<div class="${entryClass}">${entry.message}</div>`;
        });
        
        logContainer.innerHTML = html;
        logContainer.scrollTop = logContainer.scrollHeight;
    }
}

// Create global UI instance
const ui = new UI();

// Initialize UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ui.initialize();
});

// For module exports in environments that support it
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UI };
}