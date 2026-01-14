import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StatsData, Player, Composition, HeroStats, SquadSummary, Leaderboard, RoleCoverage } from '../models/stats.model';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private data = signal<StatsData | null>(null);
  private loading = signal(true);
  private error = signal<string | null>(null);

  // Expose signals as readonly
  readonly statsData = this.data.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly loadError = this.error.asReadonly();

  constructor(private http: HttpClient) {
    this.loadData();
  }

  private loadData(): void {
    this.http.get<StatsData>('data/stats.json').subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load stats data');
        this.loading.set(false);
        console.error('Error loading stats:', err);
      }
    });
  }

  getSquadSummary(): SquadSummary | null {
    return this.data()?.squadSummary ?? null;
  }

  getPlayers(): Player[] {
    return this.data()?.players ?? [];
  }

  getPlayer(name: string): Player | undefined {
    return this.data()?.players.find(p => p.name === name);
  }

  getCompositions(): Composition[] {
    return this.data()?.compositions ?? [];
  }

  getHeroStats(): HeroStats[] {
    return this.data()?.heroStats ?? [];
  }

  getRoleCoverage(): RoleCoverage | null {
    return this.data()?.roleCoverage ?? null;
  }

  getLeaderboard(): Leaderboard | null {
    return this.data()?.leaderboard ?? null;
  }

  // Chart data helpers
  getRoleDistributionChartData(): { name: string; value: number }[] {
    const heroes = this.data()?.heroStats ?? [];
    const roleCounts = { vanguard: 0, duelist: 0, strategist: 0 };

    heroes.forEach(hero => {
      if (hero.role in roleCounts) {
        roleCounts[hero.role as keyof typeof roleCounts] += hero.totalGames;
      }
    });

    return [
      { name: 'Vanguard', value: roleCounts.vanguard },
      { name: 'Duelist', value: roleCounts.duelist },
      { name: 'Strategist', value: roleCounts.strategist }
    ];
  }

  getHeroPerformanceChartData(): { name: string; series: { name: string; value: number }[] }[] {
    const players = this.data()?.players ?? [];

    return players.map(player => ({
      name: player.name,
      series: player.topHeroes.slice(0, 3).map(hero => ({
        name: hero.name,
        value: hero.performanceScore
      }))
    }));
  }

  getWinRateChartData(): { name: string; value: number }[] {
    const players = this.data()?.players ?? [];
    return players
      .filter(p => p.totalGames > 0)
      .map(p => ({ name: p.name, value: p.winRate }))
      .sort((a, b) => b.value - a.value);
  }
}
