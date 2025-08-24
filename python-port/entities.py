# entities.py

import random
from dataclasses import dataclass, field
from typing import List, Optional
from colorama import Fore, Style  # Importing necessary color constants


@dataclass
class Achievement:
    name: str
    description: str


@dataclass
class Item:
    name: str
    description: str
    rarity: str
    price: int
    attack_bonus: int = 0
    defense_bonus: int = 0
    unique_effect: Optional[str] = None  # For unique effects
    type: str = "equippable"  # 'consumable', 'weapon', 'armor', 'key'
    key_type: Optional[str] = None  # For keys

    def emoji(self):
        """Assign emojis and color codes based on item type and rarity."""
        rarity_colors = {
            "common": Fore.WHITE,
            "uncommon": Fore.GREEN,
            "rare": Fore.BLUE,
            "epic": Fore.MAGENTA,
            "legendary": Fore.YELLOW
        }
        color = rarity_colors.get(self.rarity.lower(), Fore.WHITE)

        if self.type == "weapon":
            return f"{color}🗡️{Style.RESET_ALL}"
        elif self.type == "armor":
            return f"{color}🛡️{Style.RESET_ALL}"
        elif self.type == "consumable":
            return f"{color}🍎{Style.RESET_ALL}"
        elif self.type == "key":
            key_colors = {
                "Fire": Fore.RED,
                "Ice": Fore.CYAN,
                "Earth": Fore.GREEN,
                "Lightning": Fore.YELLOW,
                "Final": Fore.MAGENTA
            }
            key_color = key_colors.get(self.key_type, Fore.WHITE)
            return f"{key_color}🔑{Style.RESET_ALL}"
        else:
            return f"{color}📦{Style.RESET_ALL}"


@dataclass
class Inventory:
    items: List[Item] = field(default_factory=list)
    equipped_weapon: Optional[Item] = None
    equipped_armor: Optional[Item] = None

    def add_item(self, item: Item):
        self.items.append(item)
        print(f"\n📦 {item.emoji()} {item.name} added to inventory.")

    def remove_item(self, item: Item):
        if item in self.items:
            self.items.remove(item)
            print(f"\n📦 {item.emoji()} {item.name} removed from inventory.")


@dataclass
class Player:
    name: str = "Hero"
    level: int = 1
    xp: int = 0
    xp_to_next_level: int = 100
    hp: int = 288  # Increased starting HP
    max_hp: int = 288
    attack: int = 12
    defense: int = 6
    gold: int = 50
    keys: int = 0  # Number of dungeon keys
    pages: int = 0  # Number of pages from bosses
    special_ability_ready: bool = True
    inventory: Inventory = field(default_factory=Inventory)
    achievements: List[Achievement] = field(default_factory=list)

    def gain_xp(self, amount):
        self.xp += amount
        print(f"\n{self.name} gains {amount} XP.")
        while self.xp >= self.xp_to_next_level:
            self.level_up()

    def level_up(self):
        self.level += 1
        self.xp -= self.xp_to_next_level
        self.xp_to_next_level = int(self.xp_to_next_level * 1.5)
        self.max_hp += 20
        self.hp = self.max_hp
        self.attack += 5
        self.defense += 2
        self.special_ability_ready = True
        print(f"\n*** {self.name} leveled up to Level {self.level}! ***")
        print(f"Stats increased: HP={self.max_hp}, Attack={self.attack}, Defense={self.defense}\n")
        self.unlock_achievement(f"Leveled Up to Level {self.level}")

    def use_special_ability(self):
        if self.special_ability_ready:
            self.attack *= 2
            self.special_ability_ready = False
            print(f"\n🔥 {self.name} uses their Special Ability! Attack damage doubled for this turn! 🔥")
        else:
            print("\n⚠️ Special Ability not ready yet. Gain more XP to level up! ⚠️")

    def reset_special_ability(self):
        if not self.special_ability_ready and self.xp >= self.xp_to_next_level / 2:
            self.special_ability_ready = True
            print(f"\n✨ {self.name}'s Special Ability is ready to use again! ✨")

    def is_alive(self):
        return self.hp > 0

    def unlock_achievement(self, achievement_name):
        if achievement_name not in [ach.name for ach in self.achievements]:
            # Find the achievement from ALL_ACHIEVEMENTS
            achievement = next((ach for ach in ALL_ACHIEVEMENTS if ach.name == achievement_name), None)
            if achievement:
                self.achievements.append(achievement)
                print(f"\n🏆 Achievement Unlocked: {achievement.name} 🏆\n")


@dataclass
class Enemy:
    name: str
    level: int
    hp: int
    attack: int
    defense: int
    xp_reward: int
    is_boss: bool = False
    special_attack_chance: float = 0.2  # 20% chance

    @staticmethod
    def generate(player_level, dungeon_type):
        if dungeon_type == "Final":
            name = "Final Guardian"
            hp = 33 + (player_level * 30)
            attack = 15 + (player_level * 4)  # Reduced attack
            defense = 8 + player_level
            xp_reward = 1000 + (player_level * 100)
        else:
            names = {
                "Fire": ["Flame Imp", "Lava Golem", "Ember Drake"],
                "Ice": ["Frost Wraith", "Ice Elemental", "Glacial Yeti"],
                "Earth": ["Stone Giant", "Mud Monster", "Terrakhan"],
                "Lightning": ["Thunder Drake", "Electric Serpent", "Volt Phoenix"],
                "Normal": ["Goblin", "Skeleton", "Orc", "Troll", "Bandit", "Dark Knight"]
            }
            name = random.choice(names.get(dungeon_type, names["Normal"]))
            hp = 38 + (player_level * 10)
            attack = 6 + (player_level * 2)
            defense = 3 + player_level
            xp_reward = 50 + (player_level * 10)
        return Enemy(name, player_level, hp, attack, defense, xp_reward)

    def perform_attack(self):
        if random.random() < self.special_attack_chance:
            damage = self.attack * 2  # Reduced multiplier for special attacks
            attack_type = "a mighty blow"
        else:
            damage = self.attack
            attack_type = "an attack"
        # Cap damage to prevent excessive hits
        damage = min(damage, 100)
        return damage, attack_type

    def is_alive(self):
        return self.hp > 0


@dataclass
class Boss(Enemy):
    special_attack_chance: float = 0.3  # 30% chance

    @staticmethod
    def generate(player_level, dungeon_type):
        if dungeon_type == "Final":
            name = "Dark Overlord"
            hp = 300 + (player_level * 30)  # Reduced HP scaling
            attack = 20 + (player_level * 2)  # Lowered attack
            defense = 15 + player_level  # Adjust defense
            xp_reward = 1500 + (player_level * 100)
        else:
            name = f"{dungeon_type} Lord"
            hp = 150 + (player_level * 10)  # Lower base HP scaling
            attack = 15 + (player_level * 2)  # Lowered attack
            defense = 10 + player_level  # Lower defense
            xp_reward = 400 + (player_level * 20)
        return Boss(name, player_level + 2, hp, attack, defense, xp_reward, is_boss=True, special_attack_chance=0.3)

    def perform_attack(self):
        if random.random() < self.special_attack_chance:
            damage = self.attack * 2  # Further reduced multiplier for bosses
            attack_type = "a devastating strike"
        else:
            damage = self.attack
            attack_type = "an attack"
        # Cap damage to ensure it doesn't exceed a reasonable limit
        damage = min(damage, 100)
        return damage, attack_type


@dataclass
class Shop:
    items_for_sale: List[Item] = field(default_factory=lambda: [
        # Equippable Items
        Item(name="Health Potion", description="Restores 50 HP.", rarity="common", price=20, type="consumable"),
        Item(name="Healing Herb", description="Heals 40 HP.", rarity="common", price=20, type="consumable"),
        Item(name="Iron Sword", description="Increases attack by 5.", rarity="uncommon", price=100, attack_bonus=5, type="weapon"),
        Item(name="Steel Armor", description="Increases defense by 3.", rarity="rare", price=150, defense_bonus=3, type="armor"),
        Item(name="Ring of Power", description="Increases attack by 10.", rarity="epic", price=300, attack_bonus=10, type="weapon"),
        Item(name="Bomb", description="Deals 20 damage to the enemy.", rarity="uncommon", price=50, type="consumable"),
        Item(name="Elixir of Fortitude", description="Temporarily increases defense by 5 for the next combat.", rarity="rare", price=150, type="consumable"),
        Item(name="Scroll of Fireball", description="Deals 30 damage to all enemies.", rarity="epic", price=300, type="consumable"),
        # Keys
        Item(name="Fire Key", description="Opens Fire Dungeons.", rarity="rare", price=200, type="key", key_type="Fire"),
        Item(name="Ice Key", description="Opens Ice Dungeons.", rarity="rare", price=200, type="key", key_type="Ice"),
        Item(name="Earth Key", description="Opens Earth Dungeons.", rarity="rare", price=200, type="key", key_type="Earth"),
        Item(name="Lightning Key", description="Opens Lightning Dungeons.", rarity="rare", price=200, type="key", key_type="Lightning"),
        # Additional Equippable Items
        Item(name="Silver Axe", description="Increases attack by 7.", rarity="uncommon", price=120, attack_bonus=7, type="weapon"),
        Item(name="Golden Shield", description="Increases defense by 5.", rarity="rare", price=200, defense_bonus=5, type="armor"),
        Item(name="Amulet of Vitality", description="Increases max HP by 30.", rarity="epic", price=350, unique_effect="Increases max HP by 30.", type="armor"),
        Item(name="Boots of the Swift", description="Allows double attack per turn.", rarity="epic", price=400, unique_effect="Allows double attack per turn.", type="armor"),
        Item(name="Shadow Cloak", description="Grants invisibility for one turn.", rarity="legendary", price=500, defense_bonus=5, unique_effect="Grants invisibility for one turn.", type="armor"),
        # Additional Consumables
        Item(name="Mana Potion", description="Restores 30 MP (not implemented).", rarity="common", price=25, type="consumable"),
        Item(name="Thunder Bolt", description="Deals 25 lightning damage to the enemy.", rarity="rare", price=200, type="consumable"),
        Item(name="Poison Dagger", description="Deals 15 poison damage over time.", rarity="rare", price=180, type="consumable"),
        Item(name="Revive Potion", description="Revives the player with 50% HP.", rarity="epic", price=400, type="consumable"),
        Item(name="Lightning Scroll", description="Deals 40 lightning damage to all enemies.", rarity="epic", price=350, type="consumable"),
        # More items can be added here
    ])


# Global Achievements List
ALL_ACHIEVEMENTS = [
    Achievement(name="First Blood", description="Defeat your first enemy."),
    Achievement(name="Dungeon Explorer", description="Clear 5 dungeons."),
    Achievement(name="Boss Slayer", description="Defeat 10 bosses."),
    Achievement(name="Treasure Hunter", description="Obtain 50 gold."),
    Achievement(name="Collector", description="Obtain your first unique item."),
    Achievement(name="Master of Keys", description="Collect all types of dungeon keys."),
    Achievement(name="Final Conqueror", description="Defeat the Dark Overlord."),
    Achievement(name="Dungeon Master", description="Clear all dungeon tiers (C, B, A, S)."),
    Achievement(name="Specialist", description="Use a special ability 10 times."),
    Achievement(name="Overworld Wanderer", description="Explore the Overworld 10 times."),
    Achievement(name="Key Hoarder", description="Collect 100 dungeon keys."),
    Achievement(name="Ultimate Slayer", description="Defeat all bosses."),
    Achievement(name="Purchased Iron Sword", description="Purchase the Iron Sword from the shop."),
    Achievement(name="Purchased Steel Armor", description="Purchase the Steel Armor from the shop."),
    Achievement(name="Sold 10 Dungeon Keys", description="Sell a total of 10 dungeon keys."),
    Achievement(name="Used Bomb", description="Use the Bomb consumable 5 times."),
    Achievement(name="Obtained Flame Crown", description="Obtain the Flame Crown from defeating the Fire Lord."),
    Achievement(name="Obtained Frost Pendant", description="Obtain the Frost Pendant from defeating the Ice Lord."),
    Achievement(name="Obtained Gaia's Shield", description="Obtain Gaia's Shield from defeating the Earth Lord."),
    Achievement(name="Obtained Storm Bracer", description="Obtain the Storm Bracer from defeating the Lightning Lord."),
    Achievement(name="Used Scroll of Fireball", description="Use the Scroll of Fireball 3 times."),
    Achievement(name="Purchased Shadow Cloak", description="Purchase the Shadow Cloak from the shop."),
    Achievement(name="Used Poison Dagger", description="Use the Poison Dagger 5 times."),
    # Add more as needed
]

# Global Loot Table
LOOT_TABLE = [
    # Equippable Items
    Item(name="Leather Boots", description="Increases defense by 2.", rarity="common", price=50, defense_bonus=2, type="armor"),
    Item(name="Silver Dagger", description="Increases attack by 3.", rarity="uncommon", price=150, attack_bonus=3, type="weapon"),
    Item(name="Amulet of Strength", description="Increases attack by 7.", rarity="rare", price=300, attack_bonus=7, type="weapon", unique_effect="Grants a chance to deal double damage."),
    Item(name="Guardian Shield", description="Increases defense by 5.", rarity="rare", price=300, defense_bonus=5, type="armor", unique_effect="Reduces incoming damage by 10%."),
    Item(name="Boots of Swiftness", description="Allows the player to attack twice per turn.", rarity="epic", price=500, type="armor", unique_effect="Allows the player to attack twice per turn."),
    Item(name="Flame Sword", description="Deals additional fire damage.", rarity="epic", price=400, attack_bonus=12, type="weapon", unique_effect="Adds 10 fire damage on each attack."),
    Item(name="Frost Armor", description="Increases defense by 8 and slows enemies.", rarity="epic", price=400, defense_bonus=8, type="armor", unique_effect="Slows enemies by 10%."),
    Item(name="Shadow Blade", description="Deals shadow damage and has a chance to blind enemies.", rarity="legendary", price=600, attack_bonus=15, type="weapon", unique_effect="Chance to blind enemies on hit."),
    Item(name="Dragon Scale Mail", description="Increases defense by 12 and grants fire resistance.", rarity="legendary", price=700, defense_bonus=12, type="armor", unique_effect="Grants fire resistance."),
    Item(name="Golden Axe", description="Increases attack by 10.", rarity="epic", price=500, attack_bonus=10, type="weapon"),
    Item(name="Titanium Shield", description="Increases defense by 8.", rarity="epic", price=500, defense_bonus=8, type="armor"),
    Item(name="Cursed Ring", description="Increases attack by 5 but reduces defense by 2.", rarity="rare", price=250, attack_bonus=5, defense_bonus=-2, type="weapon", unique_effect="Increases attack by 5 but reduces defense by 2."),
    # Consumable Items
    Item(name="Mana Potion", description="Restores 30 MP (not implemented).", rarity="common", price=25, type="consumable"),
    Item(name="Bomb", description="Deals 20 damage to the enemy.", rarity="uncommon", price=50, type="consumable"),
    Item(name="Elixir of Fortitude", description="Temporarily increases defense by 5 for the next combat.", rarity="rare", price=150, type="consumable"),
    Item(name="Scroll of Fireball", description="Deals 30 damage to all enemies.", rarity="epic", price=300, type="consumable"),
    Item(name="Healing Herb", description="Heals 40 HP.", rarity="common", price=20, type="consumable"),
    Item(name="Thunder Bolt", description="Deals 25 lightning damage to the enemy.", rarity="rare", price=200, type="consumable"),
    Item(name="Poison Dagger", description="Deals 15 poison damage over time.", rarity="rare", price=180, type="consumable"),
    Item(name="Revive Potion", description="Revives the player with 50% HP.", rarity="epic", price=400, type="consumable"),
    Item(name="Lightning Scroll", description="Deals 40 lightning damage to all enemies.", rarity="epic", price=350, type="consumable"),
    # Keys as Loot
    Item(name="Fire Key", description="Opens Fire Dungeons.", rarity="rare", price=200, type="key", key_type="Fire"),
    Item(name="Ice Key", description="Opens Ice Dungeons.", rarity="rare", price=200, type="key", key_type="Ice"),
    Item(name="Earth Key", description="Opens Earth Dungeons.", rarity="rare", price=200, type="key", key_type="Earth"),
    Item(name="Lightning Key", description="Opens Lightning Dungeons.", rarity="rare", price=200, type="key", key_type="Lightning"),
    Item(name="Final Key", description="Opens the Final Dungeon.", rarity="legendary", price=500, type="key", key_type="Final"),
    # More items can be added here
]

# Unique Loot for Bosses
BOSS_LOOT = {
    "Fire Lord": Item(
        name="Flame Crown",
        description="A crown imbued with the power of fire. Increases attack by 15 and grants fire immunity.",
        rarity="legendary",
        price=1000,
        attack_bonus=15,
        defense_bonus=0,
        type="weapon",
        unique_effect="Grants immunity to fire damage."
    ),
    "Ice Lord": Item(
        name="Frost Pendant",
        description="A pendant that channels the essence of ice. Increases defense by 10 and grants ice immunity.",
        rarity="legendary",
        price=1000,
        attack_bonus=0,
        defense_bonus=10,
        type="armor",
        unique_effect="Grants immunity to ice damage."
    ),
    "Earth Lord": Item(
        name="Gaia's Shield",
        description="A shield forged from the heart of the earth. Increases defense by 15 and reflects a portion of damage back.",
        rarity="legendary",
        price=1000,
        attack_bonus=0,
        defense_bonus=15,
        type="armor",
        unique_effect="Reflects 10% of incoming damage back to the attacker."
    ),
    "Lightning Lord": Item(
        name="Storm Bracer",
        description="Bracers that harness the power of lightning. Increases attack by 12 and grants lightning immunity.",
        rarity="legendary",
        price=1000,
        attack_bonus=12,
        defense_bonus=0,
        type="weapon",
        unique_effect="Grants immunity to lightning damage."
    ),
    "Dark Overlord": Item(
        name="Crown of the Conqueror",
        description="A majestic crown that increases attack by 20 and grants immunity to one negative effect.",
        rarity="legendary",
        price=1500,
        attack_bonus=20,
        defense_bonus=0,
        type="weapon",
        unique_effect="Grants immunity to poison."
    )
    # Add more boss-specific loot if there are multiple boss types
}
