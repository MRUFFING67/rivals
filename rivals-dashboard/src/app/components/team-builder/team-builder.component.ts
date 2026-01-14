import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Composition } from '../../models/stats.model';

@Component({
  selector: 'app-team-builder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <h2 class="text-xl font-semibold text-cyan-400 mb-4">Optimal Team Compositions</h2>
      <p class="text-gray-400 text-sm mb-6">
        Recommended lineups based on player performance scores. With 5 players, the random teammate should fill the missing role.
      </p>

      <!-- Composition Tabs -->
      <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
        @for (comp of compositions; track $index; let i = $index) {
          <button
            (click)="selectedIndex.set(i)"
            [class]="getTabClass(i)"
            class="px-4 py-2 rounded-lg whitespace-nowrap transition-all"
          >
            <span class="font-semibold">#{{ i + 1 }}</span>
            <span class="text-xs ml-2 opacity-70">Score: {{ comp.score }}</span>
          </button>
        }
      </div>

      <!-- Selected Composition -->
      @if (selectedComposition()) {
        <div class="bg-black/30 rounded-xl p-6">
          <!-- Score Badge -->
          <div class="text-center mb-6">
            <div class="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
              <span class="text-gray-400 text-sm">Composition Score</span>
              <span class="text-2xl font-bold text-cyan-400 ml-2">{{ selectedComposition()?.score }}</span>
            </div>
          </div>

          <!-- Role Groups -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            @for (role of roleGroups(); track role.name) {
              <div class="text-center">
                <div [class]="'badge-' + role.key + ' mb-3 inline-block'">{{ role.name }}</div>
                <div class="space-y-2">
                  @for (assignment of role.assignments; track assignment.player) {
                    <div class="bg-black/40 rounded-lg p-3 border border-white/5">
                      <div class="font-semibold text-white">{{ assignment.player }}</div>
                      <div class="text-sm text-gray-400">→ {{ assignment.hero }}</div>
                    </div>
                  }
                  @if (role.assignments.length === 0) {
                    <div class="bg-black/40 rounded-lg p-3 border border-dashed border-gray-600">
                      <div class="text-gray-500 text-sm">Random fills</div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Missing Role Indicator -->
          @if (missingRole()) {
            <div class="mt-6 text-center">
              <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30">
                <svg class="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span class="text-yellow-400 text-sm">
                  Need random to play <span class="font-semibold">{{ missingRole() }}</span>
                </span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: []
})
export class TeamBuilderComponent {
  @Input() compositions: Composition[] = [];

  selectedIndex = signal(0);

  selectedComposition = computed(() => {
    return this.compositions[this.selectedIndex()] ?? null;
  });

  roleGroups = computed(() => {
    const comp = this.selectedComposition();
    if (!comp) return [];

    const groups = [
      { key: 'vanguard', name: 'Vanguards', assignments: [] as any[] },
      { key: 'duelist', name: 'Duelists', assignments: [] as any[] },
      { key: 'strategist', name: 'Strategists', assignments: [] as any[] }
    ];

    for (const assignment of comp.assignments) {
      const group = groups.find(g => g.key === assignment.role);
      if (group) {
        group.assignments.push(assignment);
      }
    }

    return groups;
  });

  missingRole = computed(() => {
    const comp = this.selectedComposition();
    if (!comp) return null;

    const roleCounts: Record<string, number> = { vanguard: 0, duelist: 0, strategist: 0 };
    for (const a of comp.assignments) {
      roleCounts[a.role]++;
    }

    // Standard 2-2-2 composition
    const ideal: Record<string, number> = { vanguard: 2, duelist: 2, strategist: 2 };

    for (const [role, count] of Object.entries(roleCounts)) {
      if (count < ideal[role]) {
        return role.charAt(0).toUpperCase() + role.slice(1);
      }
    }

    return null;
  });

  getTabClass(index: number): string {
    const isSelected = this.selectedIndex() === index;
    if (isSelected) {
      return 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border border-cyan-500/50 text-white';
    }
    return 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10';
  }
}
