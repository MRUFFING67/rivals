import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Leaderboard } from '../../models/stats.model';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <h2 class="text-xl font-semibold text-cyan-400 mb-4">Squad Leaderboards</h2>

      <!-- Category Tabs -->
      <div class="flex flex-wrap gap-2 mb-6">
        @for (cat of categories; track cat.key) {
          <button
            (click)="activeCategory.set(cat.key)"
            [class]="getCategoryClass(cat.key)"
            class="px-4 py-2 rounded-lg text-sm transition-all"
          >
            {{ cat.icon }} {{ cat.name }}
          </button>
        }
      </div>

      <!-- Leaderboard Display -->
      @if (leaderboard) {
        <div class="space-y-3">
          @for (entry of getEntries(); track entry.name; let i = $index) {
            <div
              class="flex items-center gap-4 p-4 rounded-xl transition-all"
              [class]="getRankClass(i)"
            >
              <!-- Rank -->
              <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                   [class]="getRankBadgeClass(i)">
                {{ i + 1 }}
              </div>

              <!-- Player Info -->
              <div class="flex-1">
                <div class="font-semibold text-white">{{ entry.name }}</div>
                <div class="text-xs text-gray-500">{{ getSubtext(entry) }}</div>
              </div>

              <!-- Value -->
              <div class="text-right">
                <div class="text-2xl font-bold" [class]="getValueColor(i)">
                  {{ formatValue(entry.value) }}
                </div>
                <div class="text-xs text-gray-500">{{ getUnit() }}</div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: []
})
export class LeaderboardComponent {
  @Input() leaderboard: Leaderboard | null = null;

  activeCategory = signal<keyof Leaderboard>('winRate');

  categories = [
    { key: 'winRate' as const, name: 'Win Rate', icon: '🏆', unit: '%' },
    { key: 'kda' as const, name: 'KDA', icon: '⚔️', unit: 'ratio' },
    { key: 'damage' as const, name: 'Damage', icon: '💥', unit: '/min' },
    { key: 'healing' as const, name: 'Healing', icon: '💚', unit: '/min' },
    { key: 'blocked' as const, name: 'Blocked', icon: '🛡️', unit: '/min' }
  ];

  getEntries(): any[] {
    return this.leaderboard?.[this.activeCategory()] ?? [];
  }

  getCategoryClass(key: string): string {
    const isActive = this.activeCategory() === key;
    if (isActive) {
      return 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400';
    }
    return 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10';
  }

  getRankClass(index: number): string {
    if (index === 0) return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30';
    if (index === 1) return 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border border-gray-400/30';
    if (index === 2) return 'bg-gradient-to-r from-amber-600/20 to-amber-700/10 border border-amber-600/30';
    return 'bg-white/5 border border-white/5';
  }

  getRankBadgeClass(index: number): string {
    if (index === 0) return 'bg-yellow-500 text-black';
    if (index === 1) return 'bg-gray-400 text-black';
    if (index === 2) return 'bg-amber-600 text-black';
    return 'bg-white/10 text-gray-400';
  }

  getValueColor(index: number): string {
    if (index === 0) return 'text-yellow-400';
    if (index === 1) return 'text-gray-300';
    if (index === 2) return 'text-amber-500';
    return 'text-white';
  }

  getUnit(): string {
    const cat = this.categories.find(c => c.key === this.activeCategory());
    return cat?.unit ?? '';
  }

  formatValue(value: number): string {
    const cat = this.activeCategory();
    if (cat === 'winRate') return `${value}`;
    if (cat === 'kda') return value.toFixed(2);
    if (cat === 'damage' || cat === 'healing' || cat === 'blocked') {
      return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString();
    }
    return value.toString();
  }

  getSubtext(entry: any): string {
    const cat = this.activeCategory();
    if (cat === 'winRate') return `${entry.games} games played`;
    if (cat === 'kda') return `${entry.kills}K / ${entry.deaths}D / ${entry.assists}A`;
    if (cat === 'damage' || cat === 'healing' || cat === 'blocked') {
      const total = entry.total >= 1000 ? `${(entry.total / 1000).toFixed(0)}k` : entry.total;
      return `${total} total`;
    }
    return '';
  }
}
