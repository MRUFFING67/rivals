import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '../../models/stats.model';

@Component({
  selector: 'app-player-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card hover:scale-[1.02] transition-transform">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-white">{{ player.name }}</h3>
        <div class="flex gap-2">
          @if (player.primaryRole) {
            <span [class]="'badge-' + player.primaryRole">{{ player.primaryRole }}</span>
          }
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-cyan-400">{{ player.totalGames }}</div>
          <div class="text-xs text-gray-500">Games</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold" [class]="getWinRateColor(player.winRate)">
            {{ player.winRate }}%
          </div>
          <div class="text-xs text-gray-500">Win Rate</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-400">{{ player.totalWins }}</div>
          <div class="text-xs text-gray-500">Wins</div>
        </div>
      </div>

      <!-- Role Scores -->
      <div class="mb-4">
        <div class="text-sm text-gray-400 mb-2">Role Proficiency</div>
        <div class="space-y-2">
          @for (role of roleList; track role.key) {
            <div class="flex items-center gap-2">
              <span class="text-xs w-20" [class]="'text-' + role.color">{{ role.name }}</span>
              <div class="flex-1 progress-bar">
                <div
                  class="h-full rounded"
                  [class]="'bg-' + role.color"
                  [style.width.%]="getScorePercent(player.roleScores[role.key])"
                  [style.background]="role.gradient"
                ></div>
              </div>
              <span class="text-xs text-gray-500 w-8">{{ player.roleScores[role.key] || 0 }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Top Heroes -->
      <div>
        <div class="text-sm text-gray-400 mb-2">Top Heroes</div>
        <div class="space-y-2">
          @for (hero of player.topHeroes.slice(0, 3); track hero.name) {
            <div class="flex items-center justify-between bg-black/30 rounded-lg px-3 py-2">
              <div class="flex items-center gap-2">
                <span [class]="'badge-' + hero.role" class="text-[10px] px-2 py-0.5">
                  {{ hero.role.charAt(0).toUpperCase() }}
                </span>
                <span class="text-sm font-medium">{{ hero.name }}</span>
              </div>
              <div class="flex items-center gap-3 text-xs">
                <span class="text-gray-500">{{ hero.gamesPlayed }}g</span>
                <span [class]="getWinRateColor(hero.winRate)">{{ hero.winRate }}%</span>
                <span class="text-yellow-400">{{ hero.kda }} KDA</span>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bg-vanguard { background: linear-gradient(90deg, #4a90d9, #2563eb); }
    .bg-duelist { background: linear-gradient(90deg, #e23636, #dc2626); }
    .bg-strategist { background: linear-gradient(90deg, #00ff88, #10b981); }
    .text-vanguard { color: #4a90d9; }
    .text-duelist { color: #e23636; }
    .text-strategist { color: #00ff88; }
  `]
})
export class PlayerCardComponent {
  @Input() player!: Player;

  roleList = [
    { key: 'vanguard' as const, name: 'Vanguard', color: 'vanguard', gradient: 'linear-gradient(90deg, #4a90d9, #2563eb)' },
    { key: 'duelist' as const, name: 'Duelist', color: 'duelist', gradient: 'linear-gradient(90deg, #e23636, #dc2626)' },
    { key: 'strategist' as const, name: 'Strategist', color: 'strategist', gradient: 'linear-gradient(90deg, #00ff88, #10b981)' }
  ];

  getWinRateColor(rate: number): string {
    if (rate >= 50) return 'text-green-400';
    if (rate >= 40) return 'text-yellow-400';
    return 'text-red-400';
  }

  getScorePercent(score: number): number {
    return Math.min((score / 100) * 100, 100);
  }
}
