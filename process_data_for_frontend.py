#!/usr/bin/env python3
"""
Process player data for the Angular frontend.
Generates a single JSON file with all pre-computed statistics.
"""

import json
import os
from analyze_team import (
    load_player_data,
    extract_player_stats,
    find_optimal_compositions,
    HERO_ROLES
)

def process_all_data():
    """Process all player data and generate frontend JSON."""

    data_dir = os.path.join(os.path.dirname(__file__), "player-data")

    # Load all player profiles
    players = []
    for filename in os.listdir(data_dir):
        if filename.endswith(".json"):
            filepath = os.path.join(data_dir, filename)
            player_name = filename.replace(".json", "")
            data = load_player_data(filepath)
            profile = extract_player_stats(data, player_name)
            players.append(profile)

    # Build frontend data structure
    frontend_data = {
        "squadSummary": build_squad_summary(players),
        "players": [build_player_data(p) for p in players],
        "compositions": build_compositions(players),
        "heroStats": build_hero_stats(players),
        "roleCoverage": build_role_coverage(players),
        "leaderboard": build_leaderboard(players)
    }

    # Write to frontend assets
    output_path = os.path.join(
        os.path.dirname(__file__),
        "rivals-dashboard",
        "public",
        "data",
        "stats.json"
    )

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, 'w') as f:
        json.dump(frontend_data, f, indent=2)

    print(f"Generated frontend data: {output_path}")
    print(f"File size: {os.path.getsize(output_path) / 1024:.1f} KB")


def build_squad_summary(players):
    """Build overall squad statistics."""
    total_games = sum(p.total_games for p in players)
    total_wins = sum(p.total_wins for p in players)

    # Count total MVPs and SVPs
    total_mvps = sum(
        sum(h.mvp_count for h in p.hero_stats.values())
        for p in players
    )
    total_svps = sum(
        sum(h.svp_count for h in p.hero_stats.values())
        for p in players
    )

    return {
        "totalGames": total_games,
        "totalWins": total_wins,
        "winRate": round(total_wins / total_games * 100, 1) if total_games > 0 else 0,
        "totalMvps": total_mvps,
        "totalSvps": total_svps,
        "playerCount": len(players)
    }


def build_player_data(profile):
    """Build player data for frontend."""
    # Get role scores
    role_scores = {}
    for role in ["Vanguard", "Duelist", "Strategist"]:
        heroes = profile.get_best_heroes_by_role(role, min_games=2)
        if heroes:
            avg_score = sum(h[1].performance_score for h in heroes[:2]) / min(len(heroes), 2)
            role_scores[role.lower()] = round(avg_score, 1)
        else:
            role_scores[role.lower()] = 0

    # Determine primary/secondary roles
    sorted_roles = sorted(role_scores.items(), key=lambda x: x[1], reverse=True)
    primary_role = sorted_roles[0][0] if sorted_roles[0][1] > 0 else None
    secondary_role = sorted_roles[1][0] if len(sorted_roles) > 1 and sorted_roles[1][1] > 0 else None

    # Get top heroes
    top_heroes = []
    for hero_name, stats in profile.get_top_heroes(5, min_games=2):
        top_heroes.append({
            "name": hero_name,
            "role": stats.role.lower(),
            "gamesPlayed": stats.games_played,
            "winRate": round(stats.win_rate * 100, 1),
            "kda": round(stats.kda, 2),
            "performanceScore": round(stats.performance_score, 1),
            "avgDamage": round(stats.avg_damage_per_min, 0),
            "avgHealing": round(stats.avg_healing_per_min, 0),
            "avgBlocked": round(stats.avg_blocked_per_min, 0),
            "mvpCount": stats.mvp_count,
            "svpCount": stats.svp_count
        })

    # Build hero breakdown by role
    hero_breakdown = {"vanguard": [], "duelist": [], "strategist": []}
    for role in ["Vanguard", "Duelist", "Strategist"]:
        heroes = profile.get_best_heroes_by_role(role, min_games=1)
        for hero_name, stats in heroes:
            hero_breakdown[role.lower()].append({
                "name": hero_name,
                "gamesPlayed": stats.games_played,
                "winRate": round(stats.win_rate * 100, 1),
                "kda": round(stats.kda, 2),
                "performanceScore": round(stats.performance_score, 1)
            })

    return {
        "name": profile.player_name,
        "totalGames": profile.total_games,
        "totalWins": profile.total_wins,
        "winRate": round(profile.overall_win_rate * 100, 1),
        "primaryRole": primary_role,
        "secondaryRole": secondary_role,
        "roleScores": role_scores,
        "topHeroes": top_heroes,
        "heroBreakdown": hero_breakdown
    }


def build_compositions(players):
    """Build optimal team compositions."""
    compositions = find_optimal_compositions(players, min_games=2, top_n=5)

    result = []
    for score, assignment in compositions:
        comp = {
            "score": round(score, 1),
            "assignments": []
        }

        for player_name, (hero_name, role) in assignment.items():
            comp["assignments"].append({
                "player": player_name,
                "hero": hero_name,
                "role": role.lower()
            })

        # Sort by role for display
        comp["assignments"].sort(key=lambda x: ["vanguard", "duelist", "strategist"].index(x["role"]))
        result.append(comp)

    return result


def build_hero_stats(players):
    """Build aggregated hero statistics across all players."""
    hero_data = {}

    for player in players:
        for hero_name, stats in player.hero_stats.items():
            if hero_name not in hero_data:
                hero_data[hero_name] = {
                    "name": hero_name,
                    "role": stats.role.lower() if stats.role != "Unknown" else "unknown",
                    "totalGames": 0,
                    "totalWins": 0,
                    "players": []
                }

            hero_data[hero_name]["totalGames"] += stats.games_played
            hero_data[hero_name]["totalWins"] += stats.wins
            hero_data[hero_name]["players"].append({
                "name": player.player_name,
                "gamesPlayed": stats.games_played,
                "winRate": round(stats.win_rate * 100, 1),
                "performanceScore": round(stats.performance_score, 1)
            })

    # Calculate win rates and sort players
    result = []
    for hero_name, data in hero_data.items():
        data["winRate"] = round(data["totalWins"] / data["totalGames"] * 100, 1) if data["totalGames"] > 0 else 0
        data["players"].sort(key=lambda x: x["performanceScore"], reverse=True)
        result.append(data)

    # Sort by total games played
    result.sort(key=lambda x: x["totalGames"], reverse=True)

    return result


def build_role_coverage(players):
    """Build role coverage statistics."""
    coverage = {
        "vanguard": {"count": 0, "players": []},
        "duelist": {"count": 0, "players": []},
        "strategist": {"count": 0, "players": []}
    }

    for player in players:
        for role in ["Vanguard", "Duelist", "Strategist"]:
            heroes = player.get_best_heroes_by_role(role, min_games=3)
            if heroes:
                coverage[role.lower()]["count"] += 1
                coverage[role.lower()]["players"].append(player.player_name)

    return coverage


def build_leaderboard(players):
    """Build leaderboard data for various metrics."""
    leaderboard = {
        "winRate": [],
        "kda": [],
        "damage": [],
        "healing": [],
        "blocked": []
    }

    for player in players:
        if player.total_games == 0:
            continue

        # Calculate aggregate stats
        total_kills = sum(h.total_kills for h in player.hero_stats.values())
        total_deaths = sum(h.total_deaths for h in player.hero_stats.values())
        total_assists = sum(h.total_assists for h in player.hero_stats.values())
        total_time_ms = sum(h.total_time_played_ms for h in player.hero_stats.values())
        total_damage = sum(h.total_damage for h in player.hero_stats.values())
        total_healing = sum(h.total_healing for h in player.hero_stats.values())
        total_blocked = sum(h.total_damage_blocked for h in player.hero_stats.values())

        minutes = total_time_ms / 60000 if total_time_ms > 0 else 1

        leaderboard["winRate"].append({
            "name": player.player_name,
            "value": round(player.overall_win_rate * 100, 1),
            "games": player.total_games
        })

        leaderboard["kda"].append({
            "name": player.player_name,
            "value": round((total_kills + total_assists) / max(total_deaths, 1), 2),
            "kills": total_kills,
            "deaths": total_deaths,
            "assists": total_assists
        })

        leaderboard["damage"].append({
            "name": player.player_name,
            "value": round(total_damage / minutes, 0),
            "total": round(total_damage, 0)
        })

        leaderboard["healing"].append({
            "name": player.player_name,
            "value": round(total_healing / minutes, 0),
            "total": round(total_healing, 0)
        })

        leaderboard["blocked"].append({
            "name": player.player_name,
            "value": round(total_blocked / minutes, 0),
            "total": round(total_blocked, 0)
        })

    # Sort each leaderboard
    for key in leaderboard:
        leaderboard[key].sort(key=lambda x: x["value"], reverse=True)

    return leaderboard


if __name__ == "__main__":
    process_all_data()
