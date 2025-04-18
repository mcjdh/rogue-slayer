# game.py

import random
from entities import Player, Enemy, Boss, Item, Shop, LOOT_TABLE, BOSS_LOOT, ALL_ACHIEVEMENTS
from utils import (
    clear_screen, display_hud, get_player_choice, press_enter_to_continue, 
    display_message, display_inventory, display_achievements
)
from colorama import Fore, Style  # Ensure both Fore and Style are imported


class Game:
    def __init__(self):
        self.player = Player()
        self.shop = Shop()
        self.current_dungeon_level = 1
        self.final_boss_defeated = False
        self.overworld_explorations = 0  # To track overworld explorations for achievements

    def start(self):
        clear_screen()
        display_hud(self.player)
        display_message("Welcome to Rogue Slayer! 🗡️", Fore.CYAN)
        press_enter_to_continue()
        self.introduction()
        self.main_loop()

    def introduction(self):
        clear_screen()
        display_hud(self.player)
        narrative = (
            f"{Fore.YELLOW}Embark on an epic quest through mystical dungeons and treacherous landscapes. "
            f"Face formidable foes, collect legendary items, and restore peace to the land.{Style.RESET_ALL}"
        )
        display_message(narrative)
        press_enter_to_continue()

    def restart_game(self):
        """Reset the game state and restart."""
        display_message("\nRestarting the game...", Fore.CYAN)
        press_enter_to_continue()
        self.__init__()  # Re-initialize the game object to reset the state
        self.start()  # Start the game again

    def main_loop(self):
        while self.player.is_alive() and not self.final_boss_defeated:
            self.post_dungeon_menu()
        if self.final_boss_defeated:
            self.final_narrative()
        else:
            display_message("\n💀 Game Over! You have been slain. 😔", Fore.RED)
            press_enter_to_continue()
            self.restart_game()  # Restart the game after the player dies

    def post_dungeon_menu(self):
        while True:
            clear_screen()
            display_hud(self.player)
            display_message("--- Main Menu --- 🗺️", Fore.CYAN)
            options = [
                "Explore Dungeon 🕳️",
                "Explore Overworld 🏞️",
                "Rest to Recover HP 🛌",
                "Visit Shop 🛒",
                "View Inventory 📦",
                "View Achievements 🏆",
                "Exit Game ❌"
            ]
            choice = get_player_choice(options)

            if choice == 1:
                self.explore_dungeon()
                break  # After exploring, go back to main loop
            elif choice == 2:
                self.explore_overworld()
            elif choice == 3:
                self.rest()
            elif choice == 4:
                self.visit_shop()
            elif choice == 5:
                display_inventory(self.player)
            elif choice == 6:
                display_achievements(self.player)
            elif choice == 7:
                display_message("\nThank you for playing Rogue Slayer! 👋", Fore.CYAN)
                exit()
            else:
                display_message(f"{Fore.RED}Invalid choice. Please try again.{Style.RESET_ALL}", Fore.RED)
                press_enter_to_continue()

    def explore_dungeon(self):
        if self.player.keys < 1:
            display_message("\n🔑 You need at least 1 Dungeon Key to explore the dungeon.", Fore.RED)
            press_enter_to_continue()
            return
        # Select dungeon type based on available keys
        key_types = list(set(item.key_type for item in self.player.inventory.items if item.type == "key"))
        if not key_types:
            display_message("\n🔑 You have no keys to explore any dungeon.", Fore.RED)
            press_enter_to_continue()
            return
        display_message("\nAvailable Dungeon Types:", Fore.CYAN)
        options = [f"{kt} Dungeon 🔑" for kt in key_types]
        # Only show Final Dungeon option if player has at least 5 pages and has Final Key
        if self.player.pages >= 5 and any(item.key_type == "Final" for item in self.player.inventory.items if item.type == "key"):
            options.append("Final Dungeon 🌟")
        options.append("Cancel")
        choice = get_player_choice(options)

        if choice == len(options):
            display_message("Canceled exploring the dungeon.", Fore.YELLOW)
            press_enter_to_continue()
            return
        elif 1 <= choice <= len(key_types):
            selected_dungeon = key_types[choice-1]
        elif self.player.pages >= 5 and choice == len(options)-1:
            selected_dungeon = "Final"
        else:
            display_message(f"{Fore.RED}Invalid choice. Returning to main menu.{Style.RESET_ALL}", Fore.RED)
            press_enter_to_continue()
            return

        # Check if player has the required key
        required_key = None
        if selected_dungeon == "Final":
            required_key = next((item for item in self.player.inventory.items if item.type == "key" and item.key_type == "Final"), None)
        else:
            required_key = next((item for item in self.player.inventory.items if item.type == "key" and item.key_type == selected_dungeon), None)

        if not required_key:
            display_message(f"\n🔑 You don't have the {selected_dungeon} Key to explore this dungeon.", Fore.RED)
            press_enter_to_continue()
            return

        # Show dungeon details
        num_mobs = random.randint(3, 6)
        boss_name = f"{selected_dungeon} Lord" if selected_dungeon != "Final" else "Dark Overlord"
        boss_info = self.get_boss_info(boss_name)
        display_message(f"\n📜 Dungeon Details:", Fore.CYAN)
        display_message(f"• Number of Enemies: {num_mobs}", Fore.YELLOW)
        display_message(f"• Boss: {boss_info['name']} | HP: {boss_info['hp']} | Attack: {boss_info['attack']} 🐉", Fore.MAGENTA)
        print("\n0. Cancel")
        choice_confirm = input("Do you want to proceed and consume the key? (yes/no): ").lower()
        if choice_confirm not in ['yes', 'y']:
            display_message("Canceled exploring the dungeon.", Fore.YELLOW)
            press_enter_to_continue()
            return

        # Consume the key
        self.player.keys -= 1
        self.player.inventory.remove_item(required_key)
        display_message(f"\n🔑 {required_key.name} consumed. Remaining Keys: {self.player.keys}", Fore.MAGENTA)
        press_enter_to_continue()

        # Display narrative for using the key
        clear_screen()
        display_hud(self.player)
        narrative = (
            f"{Fore.YELLOW}You embark on your journey into the {selected_dungeon} Dungeon. "
            f"The air grows thick with the essence of {selected_dungeon.lower()}.{Style.RESET_ALL}"
        )
        display_message(narrative)
        press_enter_to_continue()

        # Scale dungeon difficulty based on player level and dungeon tier
        scaled_level = self.current_dungeon_level + self.player.level
        display_message(f"\n🕳️ Entering Dungeon Level {self.current_dungeon_level} (Scaled Level: {scaled_level})...\n", Fore.YELLOW)
        press_enter_to_continue()

        rooms = self.generate_rooms(scaled_level, selected_dungeon, num_mobs, boss_name)
        mobs_remaining = num_mobs
        for room in rooms:
            if not self.player.is_alive() or self.final_boss_defeated:
                break
            self.enter_room(room, scaled_level, selected_dungeon, mobs_remaining)
            if room["type"] == "monster":
                mobs_remaining -= 1
                if mobs_remaining > 0:
                    options = ["Continue Fighting", "Leave and Return to Main Menu"]
                    choice = get_player_choice(options)
                    if choice == 2:
                        display_message("You decide to leave the dungeon for now.", Fore.YELLOW)
                        press_enter_to_continue()
                        return
        if self.player.is_alive() and not self.final_boss_defeated:
            display_message(f"\n*** 🎉 Dungeon Level {self.current_dungeon_level} Cleared! ***", Fore.GREEN)
            # After clearing dungeon, player gains XP and may level up
            xp_gain = num_mobs * 20 + 100  # Example XP calculation
            self.player.gain_xp(xp_gain)
            # Achievement for clearing a dungeon
            self.player.unlock_achievement(f"Cleared Dungeon Level {self.current_dungeon_level}")
            # Increment dungeon level
            self.current_dungeon_level += 1  # Increment dungeon level
            press_enter_to_continue()

    def get_boss_info(self, boss_name):
        # Retrieve boss info from BOSS_LOOT
        boss_item = BOSS_LOOT.get(boss_name, None)
        if boss_item:
            boss_info = {
                "name": boss_name,
                "hp": 100,  # Placeholder, can be adjusted
                "attack": 15  # Placeholder, can be adjusted
            }
            # Customize boss info based on name or other attributes
            if boss_name == "Fire Lord":
                boss_info["hp"] = 64
                boss_info["attack"] = 16
            elif boss_name == "Ice Lord":
                boss_info["hp"] = 72
                boss_info["attack"] = 14
            elif boss_name == "Earth Lord":
                boss_info["hp"] = 80
                boss_info["attack"] = 12
            elif boss_name == "Lightning Lord":
                boss_info["hp"] = 55
                boss_info["attack"] = 18
            elif boss_name == "Dark Overlord":
                boss_info["hp"] = 100
                boss_info["attack"] = 22
            return boss_info
        else:
            return {"name": "Unknown Boss", "hp": 200, "attack": 25}

    def generate_rooms(self, scaled_level, dungeon_type, num_mobs, boss_name):
        return [{"type": "monster", "dungeon_type": dungeon_type} for _ in range(num_mobs)] + \
               [{"type": "boss", "dungeon_type": dungeon_type, "boss_name": boss_name}]

    def enter_room(self, room, scaled_level, dungeon_type, mobs_remaining):
        clear_screen()
        display_hud(self.player)
        if room["type"] == "monster":
            display_message("You enter a room... 🏚️", Fore.YELLOW)
            enemy = Enemy.generate(scaled_level, dungeon_type)
            display_message(f"You encounter a {enemy.name} (Level {enemy.level})! 👾\n", Fore.RED)
            press_enter_to_continue()
            self.combat(enemy)
            if not enemy.is_alive():
                self.drop_loot(enemy, dungeon_type)
        elif room["type"] == "boss":
            display_message("You enter the Boss Chamber... 🏰", Fore.YELLOW)
            boss_name = room.get("boss_name", "Unknown Boss")
            boss = Boss.generate(scaled_level, dungeon_type)
            display_message(f"A formidable {boss.name} appears! (Level {boss.level}) 🐉\n", Fore.RED)
            press_enter_to_continue()
            self.combat(boss, is_boss=True)
            if not boss.is_alive():
                self.drop_loot(boss, dungeon_type)
                if dungeon_type == "Final":
                    self.final_boss_defeated = True

    def combat(self, enemy, is_boss=False):
        while enemy.is_alive() and self.player.is_alive():
            clear_screen()
            display_hud(self.player)
            display_message(f"Enemy: {enemy.name} | HP: {enemy.hp}", Fore.RED)
            print()

            if is_boss:
                print(f"{Fore.MAGENTA}✨ Boss Ability: {int(enemy.special_attack_chance * 100)}% chance to perform special attacks.{Style.RESET_ALL}\n")

            # Check if player has consumable items
            has_consumables = any(item.type == "consumable" for item in self.player.inventory.items)
            display_message("Choose your action:", Fore.CYAN)
            action_options = []
            if self.player.special_ability_ready and has_consumables:
                action_options = [
                    "Attack ⚔️",
                    "Use Consumable 🔥",
                    "Use Special Ability 🌟",
                    "Flee 🏃‍♂️"
                ]
            elif self.player.special_ability_ready:
                action_options = [
                    "Attack ⚔️",
                    "Use Special Ability 🌟",
                    "Flee 🏃‍♂️"
                ]
            elif has_consumables:
                action_options = [
                    "Attack ⚔️",
                    "Use Consumable 🔥",
                    "Flee 🏃‍♂️"
                ]
            else:
                action_options = [
                    "Attack ⚔️",
                    "Flee 🏃‍♂️"
                ]

            choice = get_player_choice(action_options)

            # Handle player actions
            if self.player.special_ability_ready and has_consumables:
                if choice == 1:
                    self.player_attack(enemy)
                elif choice == 2:
                    self.use_consumable_in_combat(enemy)
                elif choice == 3:
                    self.player_use_special_ability(enemy)
                elif choice == 4:
                    if self.attempt_flee():
                        return
            elif self.player.special_ability_ready:
                if choice == 1:
                    self.player_attack(enemy)
                elif choice == 2:
                    self.player_use_special_ability(enemy)
                elif choice == 3:
                    if self.attempt_flee():
                        return
            elif has_consumables:
                if choice == 1:
                    self.player_attack(enemy)
                elif choice == 2:
                    self.use_consumable_in_combat(enemy)
                elif choice == 3:
                    if self.attempt_flee():
                        return
            else:
                if choice == 1:
                    self.player_attack(enemy)
                elif choice == 2:
                    if self.attempt_flee():
                        return

            # Enemy's turn
            if enemy.is_alive():
                self.enemy_turn(enemy)
            else:
                if is_boss:
                    display_message(f"\n*** You have defeated the Boss {enemy.name}! *** 🎉", Fore.GREEN)
                else:
                    display_message(f"\nYou have defeated the {enemy.name}! 🎊", Fore.GREEN)

        # Reset special ability if it was used
        if not self.player.special_ability_ready and self.player.xp >= self.player.xp_to_next_level / 2:
            self.player.reset_special_ability()

        press_enter_to_continue()

    def player_attack(self, enemy):
        damage = max(0, self.player.attack - enemy.defense)
        damage += self.player.pages * 2

        # Amulet of Strength unique effect: chance to deal double damage
        if self.player.inventory.equipped_weapon and self.player.inventory.equipped_weapon.name == "Amulet of Strength":
            if random.random() < 0.25:  # 25% chance for double damage
                damage *= 2
                display_message(f"\nThe Amulet of Strength glows! You deal double damage to {enemy.name} for {damage} damage! 💥", Fore.YELLOW)

        # Flame Sword unique effect: adds 10 fire damage
        if self.player.inventory.equipped_weapon and self.player.inventory.equipped_weapon.name == "Flame Sword":
            fire_damage = 10
            damage += fire_damage
            display_message(f"\nYour Flame Sword burns {enemy.name} for an additional {fire_damage} fire damage! 🔥", Fore.RED)

        # Boots of Swiftness unique effect: double attack
        if self.player.inventory.equipped_armor and self.player.inventory.equipped_armor.name == "Boots of Swiftness":
            total_damage = damage * 2
            display_message(f"\nYou swiftly attack {enemy.name} twice for a total of {total_damage} damage! ⚔️", Fore.MAGENTA)
        else:
            total_damage = damage
            display_message(f"\nYou attack {enemy.name} for {total_damage} damage. 🗡️", Fore.GREEN)

        enemy.hp -= total_damage
        self.player.unlock_achievement("First Blood")

    def use_consumable_in_combat(self, enemy):
        consumables = [item for item in self.player.inventory.items if item.type == "consumable"]
        if not consumables:
            display_message("\nNo consumable items available to use. ❌", Fore.RED)
            press_enter_to_continue()
            return
        display_message("\n--- Use Consumable Item --- 🔥", Fore.CYAN)
        options = [f"{item.name} - {item.description}" for item in consumables] + ["Cancel"]
        choice = get_player_choice(options)
        if choice == len(options):
            return
        selected_item = consumables[choice-1]
        # Apply the consumable's effect
        if selected_item.name == "Bomb":
            display_message(f"\n🧨 You used {selected_item.name}! It deals 20 damage to the enemy. 💣", Fore.MAGENTA)
            enemy.hp -= 20
            display_message(f"{enemy.name} takes 20 additional damage from the bomb! 🔥", Fore.MAGENTA)
        elif selected_item.name == "Scroll of Fireball":
            display_message(f"\n🔥 You used {selected_item.name}! It deals 30 damage to all enemies. 🔥", Fore.MAGENTA)
            enemy.hp -= 30
            display_message(f"{enemy.name} takes 30 additional damage from the fireball! 🔥", Fore.MAGENTA)
        else:
            self.apply_consumable_effect(selected_item)
        # No need to remove the item here, it's already handled in apply_consumable_effect

        # Achievement for using consumables
        self.player.unlock_achievement(f"Used {selected_item.name}")

    def player_use_special_ability(self, enemy):
        self.player.use_special_ability()
        damage = max(0, self.player.attack - enemy.defense)
        # Scale damage based on player pages
        damage += self.player.pages * 3
        enemy.hp -= damage
        display_message(f"\nYour special attack deals {damage} damage to {enemy.name}! 💥", Fore.MAGENTA)

    def attempt_flee(self):
        flee_success = random.random() < 0.5
        if flee_success:
            display_message("\nYou successfully fled the battle. 🏃‍♂️", Fore.GREEN)
            self.player.reset_special_ability()
            press_enter_to_continue()
            return True
        else:
            display_message("\nFlee attempt failed! 😵", Fore.RED)
            press_enter_to_continue()
            return False

    def enemy_turn(self, enemy):
        damage, attack_type = enemy.perform_attack()
        # Scale enemy damage based on dungeon level
        damage += self.current_dungeon_level
    # Guardian Shield unique effect: reduce incoming damage by 10%
        if self.player.inventory.equipped_armor and self.player.inventory.equipped_armor.name == "Guardian Shield":
            damage = int(damage * 0.9)
            display_message(f"\nYour Guardian Shield reduces the damage by 10%! You take {damage} damage.", Fore.CYAN)

        # Frost Armor unique effect: slow enemies, reducing attack by 10%
        if self.player.inventory.equipped_armor and self.player.inventory.equipped_armor.name == "Frost Armor":
            enemy.attack = int(enemy.attack * 0.9)
            display_message(f"\nYour Frost Armor slows {enemy.name}, reducing its attack power by 10%. ❄️", Fore.CYAN)

        # Shadow Cloak unique effect: 25% chance to avoid attack
        if self.player.inventory.equipped_armor and self.player.inventory.equipped_armor.name == "Shadow Cloak":
            if random.random() < 0.25:
                display_message(f"\nYou become invisible and avoid {enemy.name}'s attack! 🖤", Fore.MAGENTA)
                return  # Skip the enemy's attack
            
        self.player.hp -= damage
        if attack_type == "Fire Breath":
            display_message(f"\n{enemy.name} uses {attack_type} and deals {damage} damage! 🔥", Fore.RED)
        elif attack_type == "a powerful strike":
            display_message(f"\n{enemy.name} uses {attack_type} and deals {damage} damage! ⚔️", Fore.RED)
        else:
            display_message(f"\n{enemy.name} {attack_type} you for {damage} damage. 🩸", Fore.RED)

    def apply_consumable_effect(self, item):
        # Define the effects of consumable items
        if item.name in ["Health Potion", "Healing Herb"]:
            heal_amount = 50 if item.name == "Health Potion" else 40
            # Scale healing based on player pages
            heal_amount += self.player.pages * 2
            self.player.hp = min(self.player.hp + heal_amount, self.player.max_hp)
            display_message(f"\nYou used {item.name} and healed {heal_amount} HP. 🩸", Fore.GREEN)
        elif item.name == "Elixir of Fortitude":
            self.player.defense += 5
            display_message(f"\nYou used {item.name}! Defense increased by 5 for the next combat. 🛡️", Fore.MAGENTA)
        elif item.name == "Poison Dagger":
            # Implement poison effect
            poison_damage = 15 + self.player.pages * 1
            self.player.hp -= poison_damage
            display_message(f"\n☠️ You used {item.name}! It deals {poison_damage} poison damage over time. 🩸", Fore.MAGENTA)
        elif item.name == "Revive Potion":
            # Implement revive effect
            if self.player.hp <= 0:
                self.player.hp = int(self.player.max_hp * 0.5)
                display_message(f"\n🛡️ You used {item.name}! You have been revived with {self.player.hp} HP. 🩸", Fore.GREEN)
            else:
                display_message(f"\n🔮 {item.name} has no effect right now.", Fore.YELLOW)
        elif item.name == "Lightning Scroll":
            display_message(f"\n⚡ You used {item.name}! It deals 40 lightning damage to all enemies. ⚡", Fore.MAGENTA)
            enemy = Enemy(name="Dummy", level=self.player.level, hp=40, attack=0, defense=0, xp_reward=0)
            enemy.hp -= 40  # Simulate damage to all enemies
        else:
            display_message(f"\nYou used {item.name}, but nothing happened. ❓", Fore.YELLOW)
        # Remove the item after use
        self.player.inventory.remove_item(item)
        # Achievement for using consumables
        self.player.unlock_achievement(f"Used {item.name}")

    def drop_loot(self, enemy, dungeon_type):
        if enemy.is_boss:
            # Bosses drop a unique item and a page
            loot_item = BOSS_LOOT.get(enemy.name, None)
            if loot_item:
                # Scale loot based on player pages
                scaled_attack = loot_item.attack_bonus + self.player.pages
                scaled_defense = loot_item.defense_bonus + self.player.pages
                scaled_loot = Item(
                    name=loot_item.name,
                    description=loot_item.description,
                    rarity=loot_item.rarity,
                    price=loot_item.price,
                    attack_bonus=scaled_attack,
                    defense_bonus=scaled_defense,
                    unique_effect=loot_item.unique_effect,
                    type=loot_item.type,
                    key_type=loot_item.key_type
                )
                self.player.inventory.add_item(scaled_loot)
                display_message(f"\n🛍️ {enemy.name} dropped {scaled_loot.name}! {scaled_loot.description}", Fore.GREEN)
                # Achievement for obtaining a unique item
                self.player.unlock_achievement(f"Obtained {scaled_loot.name}")
            # Drop a guaranteed page
            self.player.pages += 1
            display_message(f"\n📄 You obtained a Page! Total Pages: {self.player.pages}", Fore.CYAN)
            # Achievement for defeating a boss
            self.player.unlock_achievement(f"Defeated {enemy.name}")
            if dungeon_type != "Final":
                # Chance to drop a key based on dungeon type
                key_drop_chance = 0.3
                if random.random() < key_drop_chance:
                    key_name = f"{dungeon_type} Key"
                    key_item = next((item for item in LOOT_TABLE if item.name == key_name and item.type == "key"), None)
                    if key_item:
                        self.player.keys += 1
                        # Scale key stats based on pages
                        scaled_key = Item(
                            name=key_item.name,
                            description=key_item.description,
                            rarity=key_item.rarity,
                            price=key_item.price,
                            attack_bonus=key_item.attack_bonus + self.player.pages,
                            defense_bonus=key_item.defense_bonus + self.player.pages,
                            unique_effect=key_item.unique_effect,
                            type=key_item.type,
                            key_type=key_item.key_type
                        )
                        self.player.inventory.add_item(scaled_key)
                        display_message(f"\n🔑 {enemy.name} dropped a {scaled_key.name}! {scaled_key.description}", Fore.GREEN)
                        # Achievement for obtaining a key
                        self.player.unlock_achievement(f"Obtained {scaled_key.name}")
        else:
            # Regular mobs drop items based on loot table
            drop_chance = 0.5  # 50% chance to drop loot
            if random.random() < drop_chance:
                loot_item = random.choice(LOOT_TABLE)
                # Scale loot based on player pages
                scaled_attack = loot_item.attack_bonus + self.player.pages
                scaled_defense = loot_item.defense_bonus + self.player.pages
                scaled_loot = Item(
                    name=loot_item.name,
                    description=loot_item.description,
                    rarity=loot_item.rarity,
                    price=loot_item.price,
                    attack_bonus=scaled_attack,
                    defense_bonus=scaled_defense,
                    unique_effect=loot_item.unique_effect,
                    type=loot_item.type,
                    key_type=loot_item.key_type
                )
                self.player.inventory.add_item(scaled_loot)
                display_message(f"\n🛍️ {enemy.name} dropped {scaled_loot.name}! {scaled_loot.description}", Fore.GREEN)
                # Achievement for obtaining an item for the first time
                self.player.unlock_achievement(f"Obtained {scaled_loot.name}")
            # Chance to drop additional equippable gear
            if not enemy.is_boss and random.random() < 0.2:  # 20% chance
                equippable_items = [item for item in LOOT_TABLE if item.type == "equippable"]
                if equippable_items:
                    additional_loot = random.choice(equippable_items)
                    scaled_attack = additional_loot.attack_bonus + self.player.pages
                    scaled_defense = additional_loot.defense_bonus + self.player.pages
                    scaled_additional_loot = Item(
                        name=additional_loot.name,
                        description=additional_loot.description,
                        rarity=additional_loot.rarity,
                        price=additional_loot.price,
                        attack_bonus=scaled_attack,
                        defense_bonus=scaled_defense,
                        unique_effect=additional_loot.unique_effect,
                        type=additional_loot.type,
                        key_type=additional_loot.key_type
                    )
                    self.player.inventory.add_item(scaled_additional_loot)
                    display_message(f"\n✨ {enemy.name} also dropped {scaled_additional_loot.name}! {scaled_additional_loot.description}", Fore.BLUE)
                    # Achievement for obtaining additional equippable gear
                    self.player.unlock_achievement(f"Obtained {scaled_additional_loot.name}")
        press_enter_to_continue()

    def rest(self):
        clear_screen()
        display_hud(self.player)
        recovery = int(self.player.max_hp * 0.5)
        # Scale recovery based on player pages
        recovery += self.player.pages * 2
        self.player.hp = min(self.player.hp + recovery, self.player.max_hp)
        display_message(f"You take a rest and recover {recovery} HP. 💤", Fore.GREEN)
        press_enter_to_continue()
        # Achievement for resting
        self.player.unlock_achievement("Rested and Recovered HP")

    def visit_shop(self):
        while True:
            clear_screen()
            display_hud(self.player)
            display_message("--- Shop --- 🛒", Fore.CYAN)
            options = [
                "Buy Items 🛍️",
                "Sell Dungeon Keys 🏷️",
                "Return to Main Menu ↩️"
            ]
            choice = get_player_choice(options)

            if choice == 1:
                self.buy_items()
            elif choice == 2:
                self.sell_keys()
            elif choice == 3:
                break
            else:
                display_message(f"{Fore.RED}Invalid choice. Please try again.{Style.RESET_ALL}", Fore.RED)
                press_enter_to_continue()

    def buy_items(self):
        while True:
            clear_screen()
            display_hud(self.player)
            display_message("--- Shop: Buy Items --- 🛍️", Fore.CYAN)
            # Dynamically create the list of items available for purchase
            available_items = self.shop.items_for_sale.copy()
            # Add Final Key if player meets the conditions
            if self.player.pages >= 5 and not any(item.name == "Final Key" for item in available_items):
                # Ensure Final Key is added only once
                final_key = Item(
                    name="Final Key",
                    description="Opens the Final Dungeon.",
                    rarity="legendary",
                    price=500,
                    type="key",
                    key_type="Final"
                )
                available_items.append(final_key)
            options = [f"{item.emoji()} {item.name} - {item.description} | Price: {item.price} gold" for item in available_items]
            options.append("Return to Shop")
            choice = get_player_choice(options)

            if choice == len(options):
                return
            selected_item = available_items[choice-1]
            if self.player.gold >= selected_item.price:
                self.player.gold -= selected_item.price
                # Scale item stats based on player pages
                scaled_attack = selected_item.attack_bonus + self.player.pages
                scaled_defense = selected_item.defense_bonus + self.player.pages
                scaled_item = Item(
                    name=selected_item.name,
                    description=selected_item.description,
                    rarity=selected_item.rarity,
                    price=selected_item.price,
                    attack_bonus=scaled_attack,
                    defense_bonus=scaled_defense,
                    unique_effect=selected_item.unique_effect,
                    type=selected_item.type,
                    key_type=selected_item.key_type
                )
                self.player.inventory.add_item(scaled_item)
                display_message(f"Purchased {scaled_item.emoji()} {scaled_item.name} for {scaled_item.price} gold.", Fore.GREEN)
                # Achievement
                self.player.unlock_achievement(f"Purchased {scaled_item.name}")
            else:
                display_message("Not enough gold to purchase this item.", Fore.RED)
            press_enter_to_continue()

    def sell_keys(self):
        while True:
            clear_screen()
            display_hud(self.player)
            display_message("--- Shop: Sell Dungeon Keys --- 🏷️", Fore.CYAN)
            print(f"You have {self.player.keys} Dungeon Key(s).")
            print("Each key sells for 10 gold.")
            print("\n0. Return to Shop")
            choice = input("Enter number of keys to sell or return: ")
            if choice == '0':
                return
            elif choice.isdigit() and 1 <= int(choice) <= self.player.keys:
                quantity = int(choice)
                sell_price_per_key = 10
                total_gold = sell_price_per_key * quantity
                self.player.keys -= quantity
                self.player.gold += total_gold
                display_message(f"Sold {quantity} Dungeon Key(s) for {total_gold} gold.", Fore.GREEN)
                # Achievement for selling keys
                self.player.unlock_achievement(f"Sold {quantity} Dungeon Key(s)")
            else:
                display_message(f"{Fore.RED}Invalid choice. Please try again.{Style.RESET_ALL}", Fore.RED)
            press_enter_to_continue()

    def explore_overworld(self):
        clear_screen()
        display_hud(self.player)
        display_message("--- Exploring Overworld --- 🏞️", Fore.GREEN)
        # Random event: chance to get a key or gold or encounter a scaled mob
        event_chance = random.random()
        self.overworld_explorations += 1
        if event_chance < 0.4:
            # 40% chance to find gold
            gold_found = random.randint(10, 100)
            # Scale gold based on player pages
            gold_found += self.player.pages * 2
            self.player.gold += gold_found
            display_message(f"You explore the overworld and find {gold_found} gold! 💰", Fore.GREEN)
            self.player.unlock_achievement(f"Found {gold_found} gold in Overworld")
            # Achievement for obtaining gold
            if self.player.gold >= 50 and "Treasure Hunter" not in [ach.name for ach in self.player.achievements]:
                self.player.unlock_achievement("Treasure Hunter")
        elif event_chance < 0.7:
            # 30% chance to find a dungeon key
            key_types = ["Fire", "Ice", "Earth", "Lightning"]
            key_found = random.choice(key_types)
            # Create a key item
            key_item = Item(
                name=f"{key_found} Key",
                description=f"Opens {key_found} Dungeons.",
                rarity="rare",
                price=200,
                type="key",
                key_type=key_found
            )
            self.player.keys += 1
            # Scale key stats based on pages
            scaled_key = Item(
                name=key_item.name,
                description=key_item.description,
                rarity=key_item.rarity,
                price=key_item.price,
                attack_bonus=key_item.attack_bonus + self.player.pages,
                defense_bonus=key_item.defense_bonus + self.player.pages,
                unique_effect=key_item.unique_effect,
                type=key_item.type,
                key_type=key_item.key_type
            )
            self.player.inventory.add_item(scaled_key)
            display_message(f"You explore the overworld and find a {scaled_key.emoji()} {scaled_key.name}! 🔑", Fore.GREEN)
            # Achievement for finding a key
            self.player.unlock_achievement(f"Found a {scaled_key.name} in Overworld")
            # Achievement for collecting all key types
            all_key_types = ["Fire", "Ice", "Earth", "Lightning"]
            collected_keys = set(item.key_type for item in self.player.inventory.items if item.type == "key")
            if set(all_key_types).issubset(collected_keys):
                self.player.unlock_achievement("Master of Keys")
        else:
            # 30% chance to encounter a random scaled mob
            display_message("\n🌲 You venture deeper into the wilderness...", Fore.GREEN)
            press_enter_to_continue()
            scaled_level = self.player.level + random.randint(1, 3)
            enemy = Enemy.generate(scaled_level, "Normal")
            display_message(f"You encounter a wild {enemy.name} (Level {enemy.level})! 🐾\n", Fore.RED)
            press_enter_to_continue()
            self.combat(enemy)
            if not enemy.is_alive():
                self.drop_loot(enemy, "Normal")
                # Option to continue or leave
                options = ["Continue Exploring", "Return to Main Menu"]
                choice = get_player_choice(options)
                if choice == 2:
                    display_message("You decide to return to the main path.", Fore.YELLOW)
                    press_enter_to_continue()
                    return
        press_enter_to_continue()

    def final_narrative(self):
        clear_screen()
        display_hud(self.player)
        narrative = (
            f"{Fore.MAGENTA}After an arduous battle, you have defeated the Dark Overlord. "
            f"The land begins to heal as peace is restored.{Style.RESET_ALL}"
        )
        display_message(narrative)
        press_enter_to_continue()
        display_message("\n🌟 Congratulations! You have completed Rogue Slayer and restored peace to the land. 🌟", Fore.GREEN)
        press_enter_to_continue()
        exit()
