import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { HeroStats } from '../../models/stats.model';

@Component({
  selector: 'app-hero-chart',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  template: `
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-cyan-400">Hero Statistics</h2>
        <div class="flex gap-2">
          @for (role of roles; track role.key) {
            <button
              (click)="toggleRole(role.key)"
              [class]="getRoleButtonClass(role.key)"
              class="px-3 py-1 rounded-full text-sm transition-all"
            >
              {{ role.name }}
            </button>
          }
        </div>
      </div>

      <!-- Hero Bar Chart -->
      <div class="h-80 mb-6">
        <ngx-charts-bar-horizontal
          [results]="chartData()"
          [xAxis]="true"
          [yAxis]="true"
          [showXAxisLabel]="true"
          xAxisLabel="Total Games"
          [scheme]="colorScheme"
          [gradient]="true"
        />
      </div>

      <!-- Hero Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-gray-400 border-b border-gray-700">
              <th class="text-left py-2 px-3">Hero</th>
              <th class="text-left py-2 px-3">Role</th>
              <th class="text-center py-2 px-3">Games</th>
              <th class="text-center py-2 px-3">Win Rate</th>
              <th class="text-left py-2 px-3">Best Player</th>
            </tr>
          </thead>
          <tbody>
            @for (hero of filteredHeroes(); track hero.name) {
              <tr class="border-b border-gray-800 hover:bg-white/5">
                <td class="py-2 px-3 font-medium">{{ hero.name }}</td>
                <td class="py-2 px-3">
                  <span [class]="'badge-' + hero.role">{{ hero.role }}</span>
                </td>
                <td class="py-2 px-3 text-center">{{ hero.totalGames }}</td>
                <td class="py-2 px-3 text-center" [class]="getWinRateColor(hero.winRate)">
                  {{ hero.winRate }}%
                </td>
                <td class="py-2 px-3">
                  @if (hero.players.length > 0) {
                    <span class="text-cyan-400">{{ hero.players[0].name }}</span>
                    <span class="text-gray-500 text-xs ml-1">({{ hero.players[0].performanceScore }})</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: []
})
export class HeroChartComponent {
  @Input() heroStats: HeroStats[] = [];

  activeRoles = signal<Set<string>>(new Set(['vanguard', 'duelist', 'strategist']));

  roles = [
    { key: 'vanguard', name: 'Vanguard' },
    { key: 'duelist', name: 'Duelist' },
    { key: 'strategist', name: 'Strategist' }
  ];

  colorScheme: any = {
    domain: ['#00f5ff', '#ff00ff', '#ffd700', '#00ff88', '#e23636', '#4a90d9']
  };

  filteredHeroes = computed(() => {
    const roles = this.activeRoles();
    return this.heroStats
      .filter(h => roles.has(h.role))
      .sort((a, b) => b.totalGames - a.totalGames);
  });

  chartData = computed(() => {
    return this.filteredHeroes()
      .slice(0, 10)
      .map(hero => ({
        name: hero.name,
        value: hero.totalGames
      }));
  });

  toggleRole(role: string): void {
    const current = new Set(this.activeRoles());
    if (current.has(role)) {
      current.delete(role);
    } else {
      current.add(role);
    }
    this.activeRoles.set(current);
  }

  getRoleButtonClass(role: string): string {
    const isActive = this.activeRoles().has(role);
    const baseClass = isActive ? 'opacity-100' : 'opacity-40';
    return `badge-${role} ${baseClass}`;
  }

  getWinRateColor(rate: number): string {
    if (rate >= 50) return 'text-green-400';
    if (rate >= 40) return 'text-yellow-400';
    return 'text-red-400';
  }
}
