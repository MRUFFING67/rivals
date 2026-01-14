import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { StatsService } from '../../services/stats.service';
import { PlayerCardComponent } from '../player-card/player-card.component';
import { HeroChartComponent } from '../hero-chart/hero-chart.component';
import { TeamBuilderComponent } from '../team-builder/team-builder.component';
import { LeaderboardComponent } from '../leaderboard/leaderboard.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NgxChartsModule,
    PlayerCardComponent,
    HeroChartComponent,
    TeamBuilderComponent,
    LeaderboardComponent
  ],
  template: `
    <div class="min-h-screen p-6">
      <!-- Loading State -->
      @if (statsService.isLoading()) {
        <div class="flex items-center justify-center h-64">
          <div class="animate-pulse text-cyan-400 text-xl">Loading analytics...</div>
        </div>
      }

      <!-- Error State -->
      @if (statsService.loadError()) {
        <div class="card text-red-400 text-center">
          {{ statsService.loadError() }}
        </div>
      }

      <!-- Main Content -->
      @if (statsService.statsData()) {
        <!-- Header -->
        <header class="text-center mb-8">
          <h1 class="text-4xl font-bold mb-2">
            <span class="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Marvel Rivals
            </span>
          </h1>
          <p class="text-gray-400 text-lg">Squad Analytics Dashboard</p>
        </header>

        <!-- Squad Summary Cards -->
        <section class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="card text-center">
            <div class="text-gray-400 text-sm mb-1">Total Games</div>
            <div class="stat-value">{{ summary()?.totalGames }}</div>
          </div>
          <div class="card text-center">
            <div class="text-gray-400 text-sm mb-1">Win Rate</div>
            <div class="stat-value">{{ summary()?.winRate }}%</div>
          </div>
          <div class="card text-center">
            <div class="text-gray-400 text-sm mb-1">Total MVPs</div>
            <div class="stat-value">{{ summary()?.totalMvps }}</div>
          </div>
          <div class="card text-center">
            <div class="text-gray-400 text-sm mb-1">Squad Size</div>
            <div class="stat-value">{{ summary()?.playerCount }}</div>
          </div>
        </section>

        <!-- Role Coverage -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-4 text-cyan-400">Role Coverage</h2>
          <div class="grid grid-cols-3 gap-4">
            @for (role of roles; track role.key) {
              <div class="card">
                <div class="flex items-center justify-between mb-2">
                  <span [class]="'badge-' + role.key">{{ role.name }}</span>
                  <span class="text-gray-400">{{ roleCoverage()?.[role.key]?.count }}/{{ summary()?.playerCount }}</span>
                </div>
                <div class="progress-bar">
                  <div
                    class="progress-bar-fill"
                    [style.width.%]="(roleCoverage()?.[role.key]?.count || 0) / (summary()?.playerCount || 1) * 100"
                  ></div>
                </div>
                <div class="mt-2 text-sm text-gray-500">
                  {{ roleCoverage()?.[role.key]?.players?.join(', ') || 'None' }}
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Player Cards -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-4 text-cyan-400">Player Profiles</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (player of players(); track player.name) {
              <app-player-card [player]="player" />
            }
          </div>
        </section>

        <!-- Team Compositions -->
        <section class="mb-8">
          <app-team-builder [compositions]="compositions()" />
        </section>

        <!-- Charts Row -->
        <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Win Rate Chart -->
          <div class="card">
            <h3 class="text-lg font-semibold mb-4 text-cyan-400">Win Rates by Player</h3>
            <div class="h-64">
              <ngx-charts-bar-horizontal
                [results]="winRateData()"
                [xAxis]="true"
                [yAxis]="true"
                [showXAxisLabel]="true"
                [showYAxisLabel]="true"
                xAxisLabel="Win Rate %"
                [scheme]="colorScheme"
                [gradient]="true"
              />
            </div>
          </div>

          <!-- Role Distribution Pie -->
          <div class="card">
            <h3 class="text-lg font-semibold mb-4 text-cyan-400">Games by Role</h3>
            <div class="h-64">
              <ngx-charts-pie-chart
                [results]="roleDistributionData()"
                [scheme]="roleColorScheme"
                [labels]="true"
                [doughnut]="true"
                [arcWidth]="0.4"
              />
            </div>
          </div>
        </section>

        <!-- Hero Stats -->
        <section class="mb-8">
          <app-hero-chart [heroStats]="heroStats()" />
        </section>

        <!-- Leaderboards -->
        <section>
          <app-leaderboard [leaderboard]="leaderboard()" />
        </section>
      }
    </div>
  `,
  styles: []
})
export class DashboardComponent {
  statsService = inject(StatsService);

  roles = [
    { key: 'vanguard' as const, name: 'Vanguard' },
    { key: 'duelist' as const, name: 'Duelist' },
    { key: 'strategist' as const, name: 'Strategist' }
  ];

  colorScheme: any = {
    domain: ['#00f5ff', '#ff00ff', '#ffd700', '#00ff88', '#e23636']
  };

  roleColorScheme: any = {
    domain: ['#4a90d9', '#e23636', '#00ff88']
  };

  summary = computed(() => this.statsService.getSquadSummary());
  players = computed(() => this.statsService.getPlayers());
  compositions = computed(() => this.statsService.getCompositions());
  heroStats = computed(() => this.statsService.getHeroStats());
  roleCoverage = computed(() => this.statsService.getRoleCoverage());
  leaderboard = computed(() => this.statsService.getLeaderboard());

  winRateData = computed(() => this.statsService.getWinRateChartData());
  roleDistributionData = computed(() => this.statsService.getRoleDistributionChartData());
}
