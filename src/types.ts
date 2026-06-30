// Типы ответа /api/data (зеркало netlify/lib/types.ts).

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt: number | null;
}

export interface LevelInfo {
  level: number;
  title: string;
  xpInLevel: number;
  xpForNext: number;
  progress: number;
}

export interface SparkPoint {
  t: number;
  value: number;
}

export interface PlayerView {
  id: string;
  displayName: string;
  ownerName: string;
  link: string;
  category: string;
  accent: string;
  collectSum: number;
  goal: number;
  progressPct: number;
  daysLeft: number | null;
  status: string;
  delta24h: number;
  delta7d: number;
  perDayAvg: number;
  projectedDaysToGoal: number | null;
  streakDays: number;
  bestDay: { date: string; amount: number } | null;
  level: LevelInfo;
  achievements: Achievement[];
  achievementsUnlocked: number;
  rank: number;
  sparkline: SparkPoint[];
}

export interface ApiData {
  updatedAt: number | null;
  snapshots: number;
  trackedDays: number;
  players: PlayerView[];
  leaderId: string | null;
  gap: number;
  totalSaved: number;
  insights: string[];
  error?: string;
}
