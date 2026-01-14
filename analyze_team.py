#!/usr/bin/env python3
"""
Marvel Rivals Team Composition Analyzer

Analyzes tracker.gg exported player data to determine optimal team compositions
for a 5-player squad in Marvel Rivals (6v6 game with 1 random teammate).
"""

import json
import os
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Tuple
from itertools import combinations, product

# Hero role classifications (as of Season 5)
HERO_ROLES = {
    # Vanguards (Tanks) - 12 heroes
    "Angela": "Vanguard",
    "Bruce Banner": "Vanguard",
    "Hulk": "Vanguard",  # Alias
    "Captain America": "Vanguard",
    "Doctor Strange": "Vanguard",
    "Groot": "Vanguard",
    "Magneto": "Vanguard",
    "Peni Parker": "Vanguard",
    "Thor": "Vanguard",
    "Venom": "Vanguard",
    "The Thing": "Vanguard",
    "Thing": "Vanguard",  # Alias

    # Duelists (Damage) - 23 heroes
    "Black Panther": "Duelist",
    "Black Widow": "Duelist",
    "Blade": "Duelist",
    "Daredevil": "Duelist",
    "Hawkeye": "Duelist",
    "Hela": "Duelist",
    "Human Torch": "Duelist",
    "Iron Fist": "Duelist",
    "Iron Man": "Duelist",
    "Magik": "Duelist",
    "Mister Fantastic": "Duelist",
    "Mr. Fantastic": "Duelist",  # Alias
    "Moon Knight": "Duelist",
    "Namor": "Duelist",
    "Phoenix": "Duelist",
    "Psylocke": "Duelist",
    "Scarlet Witch": "Duelist",
    "Spider-Man": "Duelist",
    "Spiderman": "Duelist",  # Alias
    "Squirrel Girl": "Duelist",
    "Star-Lord": "Duelist",
    "Storm": "Duelist",
    "The Punisher": "Duelist",
    "Punisher": "Duelist",  # Alias
    "Winter Soldier": "Duelist",
    "Wolverine": "Duelist",
    "Emma Frost": "Duelist",
    "Rogue": "Duelist",

    # Strategists (Support/Healers) - 10 heroes
    "Adam Warlock": "Strategist",
    "Cloak & Dagger": "Strategist",
    "Cloak and Dagger": "Strategist",  # Alias
    "Invisible Woman": "Strategist",
    "Jeff the Land Shark": "Strategist",
    "Jeff The Land Shark": "Strategist",  # Case variant
    "Jeff": "Strategist",  # Alias
    "Loki": "Strategist",
    "Luna Snow": "Strategist",
    "Mantis": "Strategist",
    "Rocket Raccoon": "Strategist",
    "Rocket": "Strategist",  # Alias
    "Gambit": "Strategist",
    "Ultron": "Strategist",
}

# Role priorities for team composition (standard is 2-2-2)
IDEAL_COMP = {"Vanguard": 2, "Duelist": 2, "Strategist": 2}


@dataclass
class HeroStats:
    """Aggregated stats for a hero played by a specific player."""
    hero_name: str
    role: str
    games_played: int = 0
    wins: int = 0
    losses: int = 0
    total_kills: int = 0
    total_deaths: int = 0
    total_assists: int = 0
    total_damage: float = 0.0
    total_healing: float = 0.0
    total_damage_blocked: float = 0.0
    total_time_played_ms: int = 0
    mvp_count: int = 0
    svp_count: int = 0

    @property
    def win_rate(self) -> float:
        return self.wins / self.games_played if self.games_played > 0 else 0.0

    @property
    def kda(self) -> float:
        return (self.total_kills + self.total_assists) / max(self.total_deaths, 1)

    @property
    def avg_damage_per_min(self) -> float:
        minutes = self.total_time_played_ms / 60000
        return self.total_damage / minutes if minutes > 0 else 0.0

    @property
    def avg_healing_per_min(self) -> float:
        minutes = self.total_time_played_ms / 60000
        return self.total_healing / minutes if minutes > 0 else 0.0

    @property
    def avg_blocked_per_min(self) -> float:
        minutes = self.total_time_played_ms / 60000
        return self.total_damage_blocked / minutes if minutes > 0 else 0.0

    @property
    def performance_score(self) -> float:
        """
        Calculate a composite performance score for ranking heroes.
        Weights: win_rate (40%), KDA (30%), role-specific stat (30%)
        """
        base_score = (self.win_rate * 40) + (min(self.kda, 5) / 5 * 30)

        if self.role == "Vanguard":
            # Tanks valued for damage blocked
            role_score = min(self.avg_blocked_per_min / 3000, 1) * 30
        elif self.role == "Strategist":
            # Healers valued for healing output
            role_score = min(self.avg_healing_per_min / 2000, 1) * 30
        else:
            # DPS valued for damage output
            role_score = min(self.avg_damage_per_min / 1500, 1) * 30

        # Bonus for MVP/SVP
        mvp_bonus = (self.mvp_count + self.svp_count) / max(self.games_played, 1) * 5

        return base_score + role_score + mvp_bonus


@dataclass
class PlayerProfile:
    """Complete profile of a player's hero pool and performance."""
    player_name: str
    hero_stats: Dict[str, HeroStats] = field(default_factory=dict)
    total_games: int = 0
    total_wins: int = 0

    @property
    def overall_win_rate(self) -> float:
        return self.total_wins / self.total_games if self.total_games > 0 else 0.0

    def get_best_heroes_by_role(self, role: str, min_games: int = 3) -> List[Tuple[str, HeroStats]]:
        """Get player's best heroes for a given role, sorted by performance."""
        role_heroes = [
            (name, stats) for name, stats in self.hero_stats.items()
            if stats.role == role and stats.games_played >= min_games
        ]
        return sorted(role_heroes, key=lambda x: x[1].performance_score, reverse=True)

    def get_top_heroes(self, n: int = 5, min_games: int = 3) -> List[Tuple[str, HeroStats]]:
        """Get player's top N heroes across all roles."""
        qualified = [
            (name, stats) for name, stats in self.hero_stats.items()
            if stats.games_played >= min_games
        ]
        return sorted(qualified, key=lambda x: x[1].performance_score, reverse=True)[:n]


def load_player_data(file_path: str) -> dict:
    """Load and parse a player's JSON data file."""
    with open(file_path, 'r') as f:
        return json.load(f)


def extract_player_stats(data: dict, player_name_hint: str) -> PlayerProfile:
    """Extract and aggregate hero stats from player match data."""
    # First, find the actual player name from the data
    actual_player_name = player_name_hint
    matches = data.get("data", {}).get("matches", [])

    if matches:
        # Get the player name from the first match's first segment
        first_match = matches[0]
        for seg in first_match.get("segments", []):
            if seg.get("type") == "overview":
                pinfo = seg.get("metadata", {}).get("platformInfo", {})
                handle = pinfo.get("platformUserHandle")
                if handle:
                    actual_player_name = handle
                    break

    profile = PlayerProfile(player_name=actual_player_name)

    for match in matches:
        segments = match.get("segments", [])

        for segment in segments:
            if segment.get("type") != "overview":
                continue

            metadata = segment.get("metadata", {})
            stats = segment.get("stats", {})

            # Check if this segment belongs to our player
            platform_info = metadata.get("platformInfo", {})
            if platform_info.get("platformUserHandle", "").lower() != actual_player_name.lower():
                continue

            # Get hero info
            heroes = metadata.get("heroes", [])
            if not heroes:
                continue

            hero_name = heroes[0].get("name", "Unknown")
            role = HERO_ROLES.get(hero_name, "Unknown")

            # Get match result
            result = metadata.get("result", "").lower()
            is_win = result == "win"
            is_mvp = metadata.get("isMvp", False)
            is_svp = metadata.get("isSvp", False)

            # Initialize hero stats if needed
            if hero_name not in profile.hero_stats:
                profile.hero_stats[hero_name] = HeroStats(hero_name=hero_name, role=role)

            hero_stat = profile.hero_stats[hero_name]

            # Aggregate stats
            hero_stat.games_played += 1
            hero_stat.wins += 1 if is_win else 0
            hero_stat.losses += 0 if is_win else 1
            hero_stat.total_kills += int(stats.get("kills", {}).get("value", 0))
            hero_stat.total_deaths += int(stats.get("deaths", {}).get("value", 0))
            hero_stat.total_assists += int(stats.get("assists", {}).get("value", 0))
            hero_stat.total_damage += float(stats.get("totalHeroDamage", {}).get("value", 0))
            hero_stat.total_healing += float(stats.get("totalHeroHeal", {}).get("value", 0))
            hero_stat.total_damage_blocked += float(stats.get("totalDamageTaken", {}).get("value", 0))
            hero_stat.total_time_played_ms += int(stats.get("timePlayed", {}).get("value", 0))
            hero_stat.mvp_count += 1 if is_mvp else 0
            hero_stat.svp_count += 1 if is_svp else 0

            # Update profile totals
            profile.total_games += 1
            profile.total_wins += 1 if is_win else 0

    return profile


def find_optimal_compositions(
    players: List[PlayerProfile],
    min_games: int = 3,
    top_n: int = 5
) -> List[Tuple[float, Dict[str, Tuple[str, str]]]]:
    """
    Find optimal team compositions for 5 players.

    Returns list of (score, assignment) tuples where assignment is
    {player_name: (hero_name, role)}
    """
    compositions = []

    # Get each player's viable hero pool by role
    player_options = {}
    for player in players:
        options = {"Vanguard": [], "Duelist": [], "Strategist": []}
        for role in options.keys():
            heroes = player.get_best_heroes_by_role(role, min_games)
            for hero_name, stats in heroes[:3]:  # Top 3 per role
                options[role].append((hero_name, stats.performance_score))
        # Also add their overall best heroes (only if role is known)
        for hero_name, stats in player.get_top_heroes(5, min_games):
            if stats.role in options and (hero_name, stats.performance_score) not in options[stats.role]:
                options[stats.role].append((hero_name, stats.performance_score))
        player_options[player.player_name] = options

    # Target compositions to try (with 5 players + 1 random)
    # Assuming random fills needed role, we aim for balanced 5-player core
    target_comps = [
        {"Vanguard": 2, "Duelist": 2, "Strategist": 1},  # Random fills healer
        {"Vanguard": 1, "Duelist": 2, "Strategist": 2},  # Random fills tank
        {"Vanguard": 2, "Duelist": 1, "Strategist": 2},  # Random fills DPS
        {"Vanguard": 1, "Duelist": 3, "Strategist": 1},  # Aggressive comp
        {"Vanguard": 2, "Duelist": 1, "Strategist": 2},  # Defensive comp
    ]

    for target in target_comps:
        comp_results = find_best_assignment(players, player_options, target)
        compositions.extend(comp_results)

    # Sort by total score and return top results
    compositions.sort(key=lambda x: x[0], reverse=True)
    return compositions[:top_n]


def find_best_assignment(
    players: List[PlayerProfile],
    player_options: Dict[str, Dict[str, List[Tuple[str, float]]]],
    target_comp: Dict[str, int]
) -> List[Tuple[float, Dict[str, Tuple[str, str]]]]:
    """Find best player-hero assignments for a target composition."""
    results = []
    player_names = [p.player_name for p in players]

    # Generate role assignments for players
    roles_needed = []
    for role, count in target_comp.items():
        roles_needed.extend([role] * count)

    # Try different role assignments to players
    from itertools import permutations

    for role_assignment in set(permutations(roles_needed)):
        assignment = {}
        total_score = 0
        valid = True
        used_heroes = set()

        for i, player_name in enumerate(player_names):
            role = role_assignment[i]
            options = player_options[player_name][role]

            # Find best available hero for this role
            best_hero = None
            best_score = 0
            for hero_name, score in options:
                if hero_name not in used_heroes:
                    best_hero = hero_name
                    best_score = score
                    break

            if best_hero is None:
                # Player has no viable heroes for this role
                valid = False
                break

            assignment[player_name] = (best_hero, role)
            used_heroes.add(best_hero)
            total_score += best_score

        if valid:
            results.append((total_score, assignment))

    return results


def print_player_report(profile: PlayerProfile):
    """Print a detailed report for a single player."""
    print(f"\n{'='*60}")
    print(f"PLAYER: {profile.player_name}")
    print(f"{'='*60}")
    print(f"Total Games: {profile.total_games} | Win Rate: {profile.overall_win_rate:.1%}")

    for role in ["Vanguard", "Duelist", "Strategist"]:
        heroes = profile.get_best_heroes_by_role(role, min_games=2)
        if heroes:
            print(f"\n  {role}s:")
            for hero_name, stats in heroes[:3]:
                print(f"    {hero_name:20} | {stats.games_played:3} games | "
                      f"WR: {stats.win_rate:5.1%} | KDA: {stats.kda:4.1f} | "
                      f"Score: {stats.performance_score:.1f}")


def print_team_recommendations(compositions: List[Tuple[float, Dict[str, Tuple[str, str]]]]):
    """Print team composition recommendations."""
    print(f"\n{'='*60}")
    print("OPTIMAL TEAM COMPOSITIONS")
    print(f"{'='*60}")

    for i, (score, assignment) in enumerate(compositions[:5], 1):
        print(f"\n--- Composition #{i} (Score: {score:.1f}) ---")

        # Group by role for display
        by_role = {"Vanguard": [], "Duelist": [], "Strategist": []}
        for player, (hero, role) in assignment.items():
            by_role[role].append(f"{player} -> {hero}")

        for role in ["Vanguard", "Duelist", "Strategist"]:
            if by_role[role]:
                print(f"  {role}s: {', '.join(by_role[role])}")


def print_role_recommendations(players: List[PlayerProfile]):
    """Print which roles each player should focus on."""
    print(f"\n{'='*60}")
    print("ROLE RECOMMENDATIONS BY PLAYER")
    print(f"{'='*60}")

    for player in players:
        print(f"\n{player.player_name}:")

        role_scores = {}
        for role in ["Vanguard", "Duelist", "Strategist"]:
            heroes = player.get_best_heroes_by_role(role, min_games=2)
            if heroes:
                # Average score of top 2 heroes in role
                avg_score = sum(h[1].performance_score for h in heroes[:2]) / min(len(heroes), 2)
                role_scores[role] = avg_score

        if role_scores:
            sorted_roles = sorted(role_scores.items(), key=lambda x: x[1], reverse=True)
            primary = sorted_roles[0]
            print(f"  Primary Role: {primary[0]} (Score: {primary[1]:.1f})")
            if len(sorted_roles) > 1:
                secondary = sorted_roles[1]
                print(f"  Secondary Role: {secondary[0]} (Score: {secondary[1]:.1f})")

            # Best hero overall
            top = player.get_top_heroes(1, min_games=2)
            if top:
                print(f"  Best Hero: {top[0][0]} ({top[0][1].role})")


def main():
    """Main entry point."""
    # Find player data files
    data_dir = os.path.join(os.path.dirname(__file__), "player-data")

    if not os.path.exists(data_dir):
        print(f"Error: Player data directory not found: {data_dir}")
        return

    # Load all player profiles
    players = []
    for filename in os.listdir(data_dir):
        if filename.endswith(".json"):
            filepath = os.path.join(data_dir, filename)
            player_name = filename.replace(".json", "")

            print(f"Loading data for {player_name}...")
            data = load_player_data(filepath)
            profile = extract_player_stats(data, player_name)
            players.append(profile)

    if not players:
        print("No player data found!")
        return

    print(f"\nLoaded {len(players)} player profiles.")

    # Print individual player reports
    for player in players:
        print_player_report(player)

    # Print role recommendations
    print_role_recommendations(players)

    # Find and print optimal compositions
    compositions = find_optimal_compositions(players, min_games=2)
    print_team_recommendations(compositions)

    # Summary statistics
    print(f"\n{'='*60}")
    print("SQUAD SUMMARY")
    print(f"{'='*60}")

    total_games = sum(p.total_games for p in players)
    total_wins = sum(p.total_wins for p in players)
    print(f"Combined Games: {total_games}")
    print(f"Combined Win Rate: {total_wins/total_games:.1%}" if total_games > 0 else "N/A")

    # Role coverage analysis
    print("\nRole Coverage (heroes with 3+ games):")
    for role in ["Vanguard", "Duelist", "Strategist"]:
        role_players = []
        for player in players:
            if player.get_best_heroes_by_role(role, min_games=3):
                role_players.append(player.player_name)
        coverage = len(role_players) / len(players) * 100
        print(f"  {role}: {len(role_players)}/{len(players)} players ({coverage:.0f}%) - {', '.join(role_players) if role_players else 'None'}")


if __name__ == "__main__":
    main()
