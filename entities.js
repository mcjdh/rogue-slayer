/**
 * Entities module for Rogue Slayer web version
 * Contains classes for Player, Enemy, Boss, Item, and Achievement
 */

// Constants for achievements
const ALL_ACHIEVEMENTS = [
    { name: "First Blood", description: "Defeat your first enemy" },
    { name: "Dungeon Crawler", description: "Complete your first dungeon" },
    { name: "Treasure Hunter", description: "Collect 50 gold" },
    { name: "Fire Lord", description: "Defeat the Fire Dungeon Boss" },
    { name: "Ice Lord", description: "Defeat the Ice Dungeon Boss" },
    { name: "Earth Lord", description: "Defeat the Earth Dungeon Boss" },
    { name: "Lightning Lord", description: "Defeat the Lightning Dungeon Boss" },
    { name: "Master of Elements", description: "Defeat all elemental Dungeon Lords" },
    { name: "Dark Vanquisher", description: "Defeat the Dark Overlord" },
    { name: "Rested and Recovered HP", description: "Use the rest function" }
];

/**
 * Item class
 */
class Item {
    constructor({
        name = "",
        description = "",
        rarity = "common",
        price = 0,
        attack_bonus = 0,
        defense_bonus = 0,
        unique_effect = "",
        type = "weapon",  // weapon, armor, consumable, key
        key_type = ""
    } = {}) {
        this.name = name;
        this.description = description;
        this.rarity = rarity;
        this.price = price;
        this.attack_bonus = attack_bonus;
        this.defense_bonus = defense_bonus;
        this.unique_effect = unique_effect;
        this.type = type;
        this.key_type = key_type;
    }

    emoji() {
        const emojis = {
            "weapon": "⚔️",
            "armor": "🛡️",
            "consumable": "🧪",
            "key": "🔑"
        };
        
        if (this.key_type) {
            const keyEmojis = {
                "Fire": "🔥",
                "Ice": "❄️",
                "Earth": "🌍",
                "Lightning": "⚡",
                "Final": "✨"
            };
            return keyEmojis[this.key_type] || emojis["key"];
        }
        
        return emojis[this.type] || "📦";
    }

    toJSON() {
        return {
            name: this.name,
            description: this.description,
            rarity: this.rarity,
            price: this.price,
            attack_bonus: this.attack_bonus,
            defense_bonus: this.defense_bonus,
            unique_effect: this.unique_effect,
            type: this.type,
            key_type: this.key_type
        };
    }

    static fromJSON(json) {
        return new Item(json);
    }
}

/**
 * Inventory class
 */
class Inventory {
    constructor() {
        this.items = [];
        this.equipped_weapon = null;
        this.equipped_armor = null;
    }

    addItem(item) {
        this.items.push(item);
    }

    removeItem(item) {
        const index = this.items.findIndex(i => 
            i.name === item.name && i.type === item.type);
        
        if (index !== -1) {
            this.items.splice(index, 1);
            return true;
        }
        return false;
    }

    equipWeapon(item) {
        if (item.type !== "weapon") return false;
        
        this.equipped_weapon = item;
        return true;
    }

    equipArmor(item) {
        if (item.type !== "armor") return false;
        
        this.equipped_armor = item;
        return true;
    }

    getConsumables() {
        return this.items.filter(item => item.type === "consumable");
    }

    getKeys() {
        return this.items.filter(item => item.type === "key");
    }

    toJSON() {
        return {
            items: this.items.map(item => item.toJSON()),
            equipped_weapon: this.equipped_weapon ? this.equipped_weapon.toJSON() : null,
            equipped_armor: this.equipped_armor ? this.equipped_armor.toJSON() : null
        };
    }

    static fromJSON(json) {
        const inventory = new Inventory();
        if (json) {
            inventory.items = json.items ? json.items.map(item => Item.fromJSON(item)) : [];
            inventory.equipped_weapon = json.equipped_weapon ? Item.fromJSON(json.equipped_weapon) : null;
            inventory.equipped_armor = json.equipped_armor ? Item.fromJSON(json.equipped_armor) : null;
        }
        return inventory;
    }
}

/**
 * Achievement class
 */
class Achievement {
    constructor(name, description) {
        this.name = name;
        this.description = description;
    }

    toJSON() {
        return {
            name: this.name,
            description: this.description
        };
    }

    static fromJSON(json) {
        return new Achievement(json.name, json.description);
    }
}

/**
 * Player class
 */
class Player {
    constructor({
        name = "Hero",
        level = 1,
        xp = 0,
        xp_to_next_level = 100,
        hp = 288,
        max_hp = 288,
        attack = 12,
        defense = 6,
        gold = 50,
        keys = 0,
        pages = 0,
        special_ability_ready = true,
        inventory = new Inventory(),
        achievements = []
    } = {}) {
        this.name = name;
        this.level = level;
        this.xp = xp;
        this.xp_to_next_level = xp_to_next_level;
        this.hp = hp;
        this.max_hp = max_hp;
        this.attack = attack;
        this.defense = defense;
        this.gold = gold;
        this.keys = keys;
        this.pages = pages;
        this.special_ability_ready = special_ability_ready;
        
        // Handle inventory reconstruction
        if (inventory instanceof Inventory) {
            this.inventory = inventory;
        } else {
            this.inventory = Inventory.fromJSON(inventory);
        }
        
        // Handle achievements reconstruction
        if (Array.isArray(achievements) && achievements.length > 0) {
            if (achievements[0] instanceof Achievement) {
                this.achievements = achievements;
            } else {
                this.achievements = achievements.map(a => new Achievement(a.name, a.description));
            }
        } else {
            this.achievements = [];
        }
    }

    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= this.xp_to_next_level) {
            this.levelUp();
            return true;
        }
        return false;
    }

    levelUp() {
        this.level += 1;
        this.xp -= this.xp_to_next_level;
        this.xp_to_next_level = Math.floor(this.xp_to_next_level * 1.1);
        
        // Stat increases
        const hpIncrease = Math.floor(20 + this.level * 2);
        this.max_hp += hpIncrease;
        this.hp = this.max_hp;  // Full heal on level up
        this.attack += 2;
        this.defense += 1;
        
        // Unlock achievement for level ups
        this.unlockAchievement(`Reached Level ${this.level}`);
        
        return {
            level: this.level,
            hpIncrease,
            attackIncrease: 2,
            defenseIncrease: 1
        };
    }

    useSpecialAbility() {
        if (this.special_ability_ready) {
            this.special_ability_ready = false;
            return true;
        }
        return false;
    }

    resetSpecialAbility() {
        this.special_ability_ready = true;
    }

    isAlive() {
        return this.hp > 0;
    }

    unlockAchievement(achievementName) {
        // Check if achievement already exists
        const existingAchievement = this.achievements.find(a => a.name === achievementName);
        if (existingAchievement) return false;
        
        // Find achievement definition
        const achievementDef = ALL_ACHIEVEMENTS.find(a => a.name === achievementName);
        if (achievementDef) {
            this.achievements.push(new Achievement(achievementDef.name, achievementDef.description));
            return true;
        }
        
        // Create custom achievement if not in predefined list
        this.achievements.push(new Achievement(achievementName, `Achieved: ${achievementName}`));
        return true;
    }

    getTotalAttack() {
        let totalAttack = this.attack;
        if (this.inventory.equipped_weapon) {
            totalAttack += this.inventory.equipped_weapon.attack_bonus;
        }
        return totalAttack;
    }

    getTotalDefense() {
        let totalDefense = this.defense;
        if (this.inventory.equipped_armor) {
            totalDefense += this.inventory.equipped_armor.defense_bonus;
        }
        return totalDefense;
    }

    toJSON() {
        return {
            name: this.name,
            level: this.level,
            xp: this.xp,
            xp_to_next_level: this.xp_to_next_level,
            hp: this.hp,
            max_hp: this.max_hp,
            attack: this.attack,
            defense: this.defense,
            gold: this.gold,
            keys: this.keys,
            pages: this.pages,
            special_ability_ready: this.special_ability_ready,
            inventory: this.inventory.toJSON(),
            achievements: this.achievements.map(a => a.toJSON())
        };
    }

    static fromJSON(json) {
        if (!json) return new Player();
        
        const inventory = Inventory.fromJSON(json.inventory);
        const achievements = json.achievements ? 
            json.achievements.map(a => Achievement.fromJSON(a)) : [];
        
        return new Player({
            ...json,
            inventory,
            achievements
        });
    }
}

/**
 * Enemy class
 */
class Enemy {
    constructor(name, level, hp, attack, defense, xp_reward, is_boss = false, special_attack_chance = 0.2) {
        this.name = name;
        this.level = level;
        this.hp = hp;
        this.attack = attack;
        this.defense = defense;
        this.xp_reward = xp_reward;
        this.is_boss = is_boss;
        this.special_attack_chance = special_attack_chance;
    }

    static generate(player_level, dungeon_type) {
        if (dungeon_type === "Final") {
            const name = "Final Guardian";
            const hp = 33 + (player_level * 30);
            const attack = 15 + (player_level * 4);
            const defense = 8 + player_level;
            const xp_reward = 1000 + (player_level * 100);
            return new Enemy(name, player_level, hp, attack, defense, xp_reward);
        } else {
            const names = {
                "Fire": ["Flame Imp", "Lava Golem", "Ember Drake"],
                "Ice": ["Frost Wraith", "Ice Elemental", "Glacial Yeti"],
                "Earth": ["Stone Giant", "Mud Monster", "Terrakhan"],
                "Lightning": ["Thunder Drake", "Electric Serpent", "Volt Phoenix"],
                "Normal": ["Goblin", "Skeleton", "Orc", "Troll", "Bandit", "Dark Knight"]
            };
            
            const name = names[dungeon_type] ? 
                names[dungeon_type][Math.floor(Math.random() * names[dungeon_type].length)] : 
                names["Normal"][Math.floor(Math.random() * names["Normal"].length)];
            
            const hp = 38 + (player_level * 10);
            const attack = 6 + (player_level * 2);
            const defense = 3 + player_level;
            const xp_reward = 50 + (player_level * 10);
            
            return new Enemy(name, player_level, hp, attack, defense, xp_reward);
        }
    }

    performAttack() {
        if (Math.random() < this.special_attack_chance && this.is_boss) {
            // Special attack for bosses
            return {
                damage: Math.floor(this.attack * 1.5),
                isSpecial: true
            };
        }
        return {
            damage: this.attack,
            isSpecial: false
        };
    }

    isAlive() {
        return this.hp > 0;
    }
}

/**
 * Boss class extends Enemy
 */
class Boss extends Enemy {
    constructor(name, level, hp, attack, defense, xp_reward, is_boss = true, special_attack_chance = 0.3) {
        super(name, level, hp, attack, defense, xp_reward, is_boss, special_attack_chance);
    }

    static generate(player_level, dungeon_type) {
        if (dungeon_type === "Final") {
            const name = "Dark Overlord";
            const hp = 300 + (player_level * 30);
            const attack = 20 + (player_level * 2);
            const defense = 15 + player_level;
            const xp_reward = 1500 + (player_level * 100);
            return new Boss(name, player_level + 2, hp, attack, defense, xp_reward);
        } else {
            const name = `${dungeon_type} Lord`;
            const hp = 150 + (player_level * 10);
            const attack = 15 + (player_level * 2);
            const defense = 10 + player_level;
            const xp_reward = 400 + (player_level * 20);
            return new Boss(name, player_level + 2, hp, attack, defense, xp_reward);
        }
    }
}

// Export all classes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        Player, 
        Enemy, 
        Boss, 
        Item, 
        Inventory, 
        Achievement, 
        ALL_ACHIEVEMENTS 
    };
}