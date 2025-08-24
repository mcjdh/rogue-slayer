# utils.py

import os
from colorama import init, Fore, Style
from entities import ALL_ACHIEVEMENTS

init(autoreset=True)

def clear_screen():
    """Clear the terminal screen."""
    os.system('cls' if os.name == 'nt' else 'clear')

def display_hud(player):
    """Display the player's Heads-Up Display (HUD)."""
    hud = (
        f"{Fore.RED}❤️ HP:{Style.RESET_ALL} {player.hp}/{player.max_hp}  "
        f"{Fore.YELLOW}💰 Gold:{Style.RESET_ALL} {player.gold}  "
        f"{Fore.CYAN}🔑 Keys:{Style.RESET_ALL} {player.keys}  "
        f"{Fore.MAGENTA}📄 Pages:{Style.RESET_ALL} {player.pages}  "
        f"{Fore.MAGENTA}⚔️ Attack:{Style.RESET_ALL} {player.attack}  "
        f"{Fore.BLUE}🛡️ Defense:{Style.RESET_ALL} {player.defense}"
    )
    print(hud)
    print("------------------------------")

def get_player_choice(options):
    """
    Display a list of options and get the player's choice.
    
    Args:
        options (list): A list of option strings.
    
    Returns:
        int: The index of the chosen option.
    """
    for idx, option in enumerate(options, 1):
        # Assign colors based on option keywords
        if "Dungeon" in option:
            option_color = Fore.BLUE
        elif "Overworld" in option:
            option_color = Fore.GREEN
        elif "Rest" in option:
            option_color = Fore.YELLOW
        elif "Shop" in option:
            option_color = Fore.MAGENTA
        elif "Inventory" in option:
            option_color = Fore.CYAN
        elif "Achievements" in option:
            option_color = Fore.WHITE
        elif "Exit" in option or "Cancel" in option or "Return" in option:
            option_color = Fore.RED
        else:
            option_color = Fore.WHITE
        print(f"{Fore.WHITE}{idx}. {option_color}{option}{Style.RESET_ALL}")
    while True:
        choice = input("Choose an action: ")
        if choice.isdigit():
            choice_int = int(choice)
            if 1 <= choice_int <= len(options):
                return choice_int
        print(f"{Fore.RED}Invalid choice. Please try again.{Style.RESET_ALL}")

def press_enter_to_continue():
    """Prompt the player to press Enter to continue."""
    input(f"\n{Fore.GREEN}Press Enter to continue...{Style.RESET_ALL}")

def display_message(message, color=Fore.WHITE):
    """
    Display a colored message.
    
    Args:
        message (str): The message to display.
        color (str): The color to display the message in.
    """
    print(f"{color}{message}{Style.RESET_ALL}")

def display_inventory(player):
    """Display the player's inventory and handle item interactions."""
    while True:
        clear_screen()
        display_message("--- Inventory --- 📦", Fore.CYAN)
        if player.inventory.items:
            for idx, item in enumerate(player.inventory.items, 1):
                equipped = ""
                if player.inventory.equipped_weapon == item:
                    equipped = f" {Fore.GREEN}(Equipped as Weapon){Style.RESET_ALL}"
                elif player.inventory.equipped_armor == item:
                    equipped = f" {Fore.GREEN}(Equipped as Armor){Style.RESET_ALL}"
                print(f"{idx}. {item.emoji()} {item.name} - {item.description}{equipped}")
        else:
            display_message("Your inventory is empty.", Fore.YELLOW)
        print("\n0. Return to main menu")
        choice = input("Choose an item to equip/use/sell or return: ")
        if choice == '0':
            return
        elif choice.isdigit() and 1 <= int(choice) <= len(player.inventory.items):
            selected_item = player.inventory.items[int(choice)-1]
            equip_or_use_or_sell_menu(player, selected_item)
        else:
            display_message(f"{Fore.RED}Invalid choice. Please try again.{Style.RESET_ALL}", Fore.RED)
            press_enter_to_continue()

def equip_or_use_or_sell_menu(player, item):
    """
    Provide options to equip, use, or sell the selected item based on its type.
    
    Args:
        player (Player): The player object.
        item (Item): The selected item.
    """
    display_message(f"\nSelected: {item.emoji()} {item.name}", Fore.CYAN)
    if item.type == "weapon":
        print("1. Equip as Weapon 🗡️")
        print("2. Sell Item 💰")
        print("3. Return to Inventory ↩️")
        choice = input("Choose an action: ")
        if choice == '1':
            if player.inventory.equipped_weapon:
                player.attack -= player.inventory.equipped_weapon.attack_bonus
                display_message(f"Unequipped {player.inventory.equipped_weapon.name} from Weapon slot.", Fore.YELLOW)
            player.inventory.equipped_weapon = item
            player.attack += item.attack_bonus
            display_message(f"Equipped {item.emoji()} {item.name} as Weapon. +{item.attack_bonus} Attack.", Fore.GREEN)
            # Achievement for equipping weapon
            player.unlock_achievement(f"Equipped {item.name} as Weapon")
        elif choice == '2':
            player.gold += item.price
            player.inventory.remove_item(item)
            display_message(f"Sold {item.emoji()} {item.name} for {item.price} gold.", Fore.GREEN)
            # Achievement for selling items
            player.unlock_achievement(f"Sold {item.name}")
        elif choice == '3':
            return
        else:
            display_message(f"{Fore.RED}Invalid choice. Returning to inventory.{Style.RESET_ALL}", Fore.RED)
            press_enter_to_continue()
    elif item.type == "armor":
        print("1. Equip as Armor 🛡️")
        print("2. Sell Item 💰")
        print("3. Return to Inventory ↩️")
        choice = input("Choose an action: ")
        if choice == '1':
            if player.inventory.equipped_armor:
                player.defense -= player.inventory.equipped_armor.defense_bonus
                display_message(f"Unequipped {player.inventory.equipped_armor.name} from Armor slot.", Fore.YELLOW)

            # Check if the item is Amulet of Vitality
            if item.name == "Amulet of Vitality":
                player.max_hp += 30
                player.hp = min(player.hp + 30, player.max_hp)
                display_message(f"\nYou feel stronger! Max HP increased by 30. ❤️", Fore.GREEN)

            player.inventory.equipped_armor = item
            player.defense += item.defense_bonus
            display_message(f"Equipped {item.emoji()} {item.name} as Armor. +{item.defense_bonus} Defense.", Fore.GREEN)
            # Achievement for equipping armor
            player.unlock_achievement(f"Equipped {item.name} as Armor")

        elif choice == '2':
            player.gold += item.price
            player.inventory.remove_item(item)
            display_message(f"Sold {item.emoji()} {item.name} for {item.price} gold.", Fore.GREEN)
            # Achievement for selling items
            player.unlock_achievement(f"Sold {item.name}")
        elif choice == '3':
            return
        else:
            display_message(f"{Fore.RED}Invalid choice. Returning to inventory.{Style.RESET_ALL}", Fore.RED)
            press_enter_to_continue()
    elif item.type == "consumable":
        print("1. Use Item 🍎")
        print("2. Sell Item 💰")
        print("3. Return to Inventory ↩️")
        choice = input("Choose an action: ")
        if choice == '1':
            use_consumable(player, item)
        elif choice == '2':
            player.gold += item.price
            player.inventory.remove_item(item)
            display_message(f"Sold {item.emoji()} {item.name} for {item.price} gold.", Fore.GREEN)
            # Achievement for selling consumables
            player.unlock_achievement(f"Sold {item.name}")
        elif choice == '3':
            return
        else:
            display_message(f"{Fore.RED}Invalid choice. Returning to inventory.{Style.RESET_ALL}", Fore.RED)
            press_enter_to_continue()
    elif item.type == "key":
        print("1. Sell Key 💰")
        print("2. Return to Inventory ↩️")
        choice = input("Choose an action: ")
        if choice == '1':
            player.gold += item.price
            player.keys -= 1
            player.inventory.remove_item(item)
            display_message(f"Sold {item.emoji()} {item.name} for {item.price} gold.", Fore.GREEN)
            # Achievement for selling keys
            player.unlock_achievement(f"Sold {item.name}")
        elif choice == '2':
            return
        else:
            display_message(f"{Fore.RED}Invalid choice. Returning to inventory.{Style.RESET_ALL}", Fore.RED)
            press_enter_to_continue()
    else:
        print(f"{Fore.RED}Unknown item type. Returning to inventory.{Style.RESET_ALL}")
        press_enter_to_continue()

def use_consumable(player, item):
    """
    Apply the effects of a consumable item.
    
    Args:
        player (Player): The player object.
        item (Item): The consumable item.
    """
    # Implement the effects of consumable items
    if item.name in ["Health Potion", "Healing Herb"]:

        player.inventory.remove_item(item)  # Ensure only one item is removed after use
            # Scale healing based on player pages
        heal_amount += player.pages * 2
        player.hp = min(player.hp + heal_amount, player.max_hp)
        display_message(f"\nYou used {item.emoji()} {item.name} and healed {heal_amount} HP. 🩸", Fore.GREEN)
    elif item.name == "Bomb":
        # Implement Bomb usage during combat
        display_message(f"\n🧨 You used {item.emoji()} {item.name}! It deals 20 damage to the enemy. 💣", Fore.MAGENTA)
        # The actual damage application is handled in the combat loop
    elif item.name == "Scroll of Fireball":
        # Implement Fireball effect
        display_message(f"\n🔥 You used {item.emoji()} {item.name}! It deals 30 damage to all enemies. 🔥", Fore.MAGENTA)
        # The actual damage application is handled in the combat loop
    elif item.name == "Elixir of Fortitude":
        # Implement temporary defense boost
        player.defense += 5
        display_message(f"\nYou used {item.emoji()} {item.name}! Defense increased by 5 for the next combat. 🛡️", Fore.MAGENTA)
    elif item.name == "Poison Dagger":
        # Implement poison effect
        poison_damage = 15 + player.pages * 1
        player.hp -= poison_damage
        display_message(f"\n☠️ You used {item.emoji()} {item.name}! It deals {poison_damage} poison damage over time. 🩸", Fore.MAGENTA)
    elif item.name == "Revive Potion":
        # Implement revive effect
        if player.hp <= 0:
            player.hp = int(player.max_hp * 0.5)
            display_message(f"\n🛡️ You used {item.emoji()} {item.name}! You have been revived with {player.hp} HP. 🩸", Fore.GREEN)
        else:
            display_message(f"\n🔮 {item.name} has no effect right now.", Fore.YELLOW)
    elif item.name == "Lightning Scroll":
        # Implement lightning scroll effect
        display_message(f"\n⚡ You used {item.emoji()} {item.name}! It deals 40 lightning damage to all enemies. ⚡", Fore.MAGENTA)
        # The actual damage application is handled in the combat loop
    else:
        display_message(f"\nYou used {item.name}, but nothing happened. ❓", Fore.YELLOW)
    # Remove the item after use
        player.inventory.remove_item(item)  # Ensure only one item is removed after use
    # Achievement for using consumables
    player.unlock_achievement(f"Used {item.name}")

def display_achievements(player):
    """Display the list of achievements, showing which are unlocked."""
    clear_screen()
    display_message("--- Achievements --- 🏆", Fore.CYAN)
    unlocked_names = [ach.name for ach in player.achievements]
    for achievement in ALL_ACHIEVEMENTS:
        if achievement.name in unlocked_names:
            print(f"{Fore.GREEN}✔️ {achievement.name} - {achievement.description}{Style.RESET_ALL}")
        else:
            print(f"{Fore.RED}❌ {achievement.name} - {achievement.description}{Style.RESET_ALL}")
    press_enter_to_continue()
