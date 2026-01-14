export interface SquadSummary {
  totalGames: number;
  totalWins: number;
  winRate: number;
  totalMvps: number;
  totalSvps: number;
  playerCount: number;
}

export interface HeroStat {
  name: string;
  role: 'vanguard' | 'duelist' | 'strategist';
  gamesPlayed: number;
  winRate: number;
  kda: number;
  performanceScore: number;
  avgDamage: number;
  avgHealing: number;
  avgBlocked: number;
  mvpCount: number;
  svpCount: number;
}

export interface HeroBreakdown {
  vanguard: HeroStat[];
  duelist: HeroStat[];
  strategist: HeroStat[];
}

export interface RoleScores {
  vanguard: number;
  duelist: number;
  strategist: number;
}

export interface Player {
  name: string;
  totalGames: number;
  totalWins: number;
  winRate: number;
  primaryRole: 'vanguard' | 'duelist' | 'strategist' | null;
  secondaryRole: 'vanguard' | 'duelist' | 'strategist' | null;
  roleScores: RoleScores;
  topHeroes: HeroStat[];
  heroBreakdown: HeroBreakdown;
}

export interface CompositionAssignment {
  player: string;
  hero: string;
  role: 'vanguard' | 'duelist' | 'strategist';
}

export interface Composition {
  score: number;
  assignments: CompositionAssignment[];
}

export interface HeroPlayerStat {
  name: string;
  gamesPlayed: number;
  winRate: number;
  performanceScore: number;
}

export interface HeroStats {
  name: string;
  role: 'vanguard' | 'duelist' | 'strategist' | 'unknown';
  totalGames: number;
  totalWins: number;
  winRate: number;
  players: HeroPlayerStat[];
}

export interface RoleCoverageItem {
  count: number;
  players: string[];
}

export interface RoleCoverage {
  vanguard: RoleCoverageItem;
  duelist: RoleCoverageItem;
  strategist: RoleCoverageItem;
}

export interface LeaderboardEntry {
  name: string;
  value: number;
  [key: string]: any;
}

export interface Leaderboard {
  winRate: LeaderboardEntry[];
  kda: LeaderboardEntry[];
  damage: LeaderboardEntry[];
  healing: LeaderboardEntry[];
  blocked: LeaderboardEntry[];
}

export interface StatsData {
  squadSummary: SquadSummary;
  players: Player[];
  compositions: Composition[];
  heroStats: HeroStats[];
  roleCoverage: RoleCoverage;
  leaderboard: Leaderboard;
}
