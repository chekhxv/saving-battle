// Движок статистики: из истории снимков считает уровни, динамику, ачивки и инсайты.

import type {
  Snapshot,
  PlayerView,
  Achievement,
  LevelInfo,
  SparkPoint,
  ApiData,
} from './types.ts';
import type { Participant } from './participants.ts';

const DAY = 86_400_000;

/** Шаг XP. Уровень n требует суммарно STEP * n*(n+1)/2 рублей. */
const LEVEL_STEP = 2500;

const LEVEL_TITLES = [
  'Новичок',
  'Копилкин',
  'Бережливый',
  'Финансист',
  'Капиталист',
  'Магнат',
  'Инвест-гуру',
  'Денежный поток',
  'Золотой запас',
  'Богатей',
  'Олигарх',
  'Легенда',
  'Босс накоплений',
];

function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)];
}

/** Суммарный XP, нужный чтобы достичь уровня n. */
function totalXpForLevel(n: number): number {
  return (LEVEL_STEP * n * (n + 1)) / 2;
}

export function computeLevel(sum: number): LevelInfo {
  let level = 0;
  while (totalXpForLevel(level + 1) <= sum) level++;
  const base = totalXpForLevel(level);
  const next = totalXpForLevel(level + 1);
  const xpForNext = next - base;
  const xpInLevel = Math.max(0, sum - base);
  return {
    level,
    title: levelTitle(level),
    xpInLevel,
    xpForNext,
    progress: xpForNext > 0 ? Math.min(1, xpInLevel / xpForNext) : 1,
  };
}

interface DayPoint {
  date: string;
  t: number;
  value: number;
}

/** Берём последнее значение каждого календарного дня. */
function dailySeries(history: Snapshot[], id: string): DayPoint[] {
  const byDay = new Map<string, DayPoint>();
  for (const snap of history) {
    const ps = snap.players[id];
    if (!ps) continue;
    const date = new Date(snap.t).toISOString().slice(0, 10);
    byDay.set(date, { date, t: snap.t, value: ps.collectSum });
  }
  return [...byDay.values()].sort((a, b) => a.t - b.t);
}

/** Значение на момент targetT (последний снимок не позже target; иначе самый ранний). */
function valueAt(history: Snapshot[], id: string, targetT: number): number {
  let result: number | null = null;
  let earliest: number | null = null;
  for (const snap of history) {
    const ps = snap.players[id];
    if (!ps) continue;
    if (earliest === null) earliest = ps.collectSum;
    if (snap.t <= targetT) result = ps.collectSum;
  }
  return result ?? earliest ?? 0;
}

function firstValue(history: Snapshot[], id: string): number {
  for (const snap of history) {
    const ps = snap.players[id];
    if (ps) return ps.collectSum;
  }
  return 0;
}

/** Стрик: сколько последних дней подряд был положительный прирост. */
function computeStreak(days: DayPoint[]): number {
  let streak = 0;
  for (let i = days.length - 1; i > 0; i--) {
    if (days[i].value - days[i - 1].value > 0) streak++;
    else break;
  }
  return streak;
}

function computeBestDay(days: DayPoint[]): { date: string; amount: number } | null {
  let best: { date: string; amount: number } | null = null;
  for (let i = 1; i < days.length; i++) {
    const amount = days[i].value - days[i - 1].value;
    if (amount > 0 && (!best || amount > best.amount)) {
      best = { date: days[i].date, amount };
    }
  }
  return best;
}

/** Первый момент, когда выполнилось условие по сумме (для unlockedAt). */
function firstTimeReached(
  history: Snapshot[],
  id: string,
  predicate: (sum: number, goal: number) => boolean,
): number | null {
  for (const snap of history) {
    const ps = snap.players[id];
    if (ps && predicate(ps.collectSum, ps.goal)) return snap.t;
  }
  return null;
}

interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: Achievement['tier'];
  test: (ctx: AchievementCtx) => boolean;
  /** Условие по сумме для определения времени открытия (необязательно) */
  moneyAt?: (sum: number, goal: number) => boolean;
}

interface AchievementCtx {
  sum: number;
  goal: number;
  progress: number;
  streak: number;
  bestDayAmount: number;
  perDayAvg: number;
  trackedDays: number;
  rank: number;
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first',
    title: 'Первый рубль',
    description: 'Положить хоть что-то на сбор',
    icon: 'Sparkles',
    tier: 'common',
    test: (c) => c.sum > 0,
    moneyAt: (s) => s > 0,
  },
  {
    id: 'k10',
    title: 'Десятка',
    description: 'Накопить 10 000 ₽',
    icon: 'Coins',
    tier: 'common',
    test: (c) => c.sum >= 10_000,
    moneyAt: (s) => s >= 10_000,
  },
  {
    id: 'k50',
    title: 'Полтинник',
    description: 'Накопить 50 000 ₽',
    icon: 'Banknote',
    tier: 'rare',
    test: (c) => c.sum >= 50_000,
    moneyAt: (s) => s >= 50_000,
  },
  {
    id: 'k100',
    title: 'Сотка',
    description: 'Накопить 100 000 ₽',
    icon: 'Wallet',
    tier: 'rare',
    test: (c) => c.sum >= 100_000,
    moneyAt: (s) => s >= 100_000,
  },
  {
    id: 'k500',
    title: 'Полмиллиона',
    description: 'Накопить 500 000 ₽',
    icon: 'Gem',
    tier: 'epic',
    test: (c) => c.sum >= 500_000,
    moneyAt: (s) => s >= 500_000,
  },
  {
    id: 'half',
    title: 'Экватор',
    description: 'Пройти половину пути к цели',
    icon: 'PieChart',
    tier: 'rare',
    test: (c) => c.goal > 0 && c.progress >= 0.5,
    moneyAt: (s, g) => g > 0 && s / g >= 0.5,
  },
  {
    id: 'goal',
    title: 'Цель взята',
    description: 'Достичь цели сбора',
    icon: 'Trophy',
    tier: 'legendary',
    test: (c) => c.goal > 0 && c.progress >= 1,
    moneyAt: (s, g) => g > 0 && s >= g,
  },
  {
    id: 'streak3',
    title: 'В ударе',
    description: '3 дня роста подряд',
    icon: 'Flame',
    tier: 'rare',
    test: (c) => c.streak >= 3,
  },
  {
    id: 'streak7',
    title: 'Несокрушимый',
    description: '7 дней роста подряд',
    icon: 'Zap',
    tier: 'epic',
    test: (c) => c.streak >= 7,
  },
  {
    id: 'bigday',
    title: 'Рывок дня',
    description: '+10 000 ₽ за один день',
    icon: 'Rocket',
    tier: 'epic',
    test: (c) => c.bestDayAmount >= 10_000,
  },
  {
    id: 'consistent',
    title: 'Стабильность',
    description: 'Положительный средний темп за неделю+',
    icon: 'TrendingUp',
    tier: 'rare',
    test: (c) => c.trackedDays >= 7 && c.perDayAvg > 0,
  },
  {
    id: 'leader',
    title: 'Король горы',
    description: 'Занять первое место',
    icon: 'Crown',
    tier: 'legendary',
    test: (c) => c.rank === 1 && c.sum > 0,
  },
];

function ruMoney(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽';
}

export function computeApiData(
  history: Snapshot[],
  participants: Participant[],
  lastError?: string,
): ApiData {
  const sorted = [...history].sort((a, b) => a.t - b.t);
  const updatedAt = sorted.length ? sorted[sorted.length - 1].t : null;
  const firstT = sorted.length ? sorted[0].t : Date.now();
  const lastT = updatedAt ?? Date.now();
  const trackedDays = Math.max(0, (lastT - firstT) / DAY);
  const now = lastT;

  // Предварительно считаем суммы для рангов.
  const sums = participants.map((p) => {
    const last = sorted.length ? sorted[sorted.length - 1].players[p.id] : undefined;
    return { id: p.id, sum: last?.collectSum ?? 0 };
  });
  const ranked = [...sums].sort((a, b) => b.sum - a.sum);
  const rankById = new Map<string, number>();
  ranked.forEach((r, i) => rankById.set(r.id, i + 1));

  const players: PlayerView[] = participants.map((p) => {
    const last = sorted.length ? sorted[sorted.length - 1].players[p.id] : undefined;
    const sum = last?.collectSum ?? 0;
    const goal = last?.goal ?? 0;
    const days = dailySeries(sorted, p.id);
    const first = firstValue(sorted, p.id);

    const spanDays = Math.max(1, (lastT - firstT) / DAY);
    const perDayAvg = sorted.length > 1 ? (sum - first) / spanDays : 0;
    const delta24h = sum - valueAt(sorted, p.id, now - DAY);
    const delta7d = sum - valueAt(sorted, p.id, now - 7 * DAY);
    const streak = computeStreak(days);
    const bestDay = computeBestDay(days);
    const progressPct = goal > 0 ? Math.min(100, (sum / goal) * 100) : 0;
    const rank = rankById.get(p.id) ?? 0;

    const projectedDaysToGoal =
      goal > sum && perDayAvg > 0 ? Math.ceil((goal - sum) / perDayAvg) : null;

    const ctx: AchievementCtx = {
      sum,
      goal,
      progress: goal > 0 ? sum / goal : 0,
      streak,
      bestDayAmount: bestDay?.amount ?? 0,
      perDayAvg,
      trackedDays,
      rank,
    };

    const achievements: Achievement[] = ACHIEVEMENTS.map((def) => {
      const unlocked = def.test(ctx);
      const unlockedAt =
        unlocked && def.moneyAt ? firstTimeReached(sorted, p.id, def.moneyAt) : null;
      return {
        id: def.id,
        title: def.title,
        description: def.description,
        icon: def.icon,
        tier: def.tier,
        unlocked,
        unlockedAt,
      };
    });

    const sparkline: SparkPoint[] = days.map((d) => ({ t: d.t, value: d.value }));

    return {
      id: p.id,
      displayName: p.displayName,
      ownerName: last?.ownerName ?? p.displayName,
      link: p.link,
      category: last?.category ?? 'other',
      accent: p.accent,
      collectSum: sum,
      goal,
      progressPct,
      daysLeft: last?.daysLeft ?? null,
      status: last?.status ?? 'Unknown',
      delta24h,
      delta7d,
      perDayAvg,
      projectedDaysToGoal,
      streakDays: streak,
      bestDay,
      level: computeLevel(sum),
      achievements,
      achievementsUnlocked: achievements.filter((a) => a.unlocked).length,
      rank,
      sparkline,
    };
  });

  const byRank = [...players].sort((a, b) => a.rank - b.rank);
  const leaderId = byRank.length && byRank[0].collectSum > 0 ? byRank[0].id : null;
  const gap =
    byRank.length >= 2 ? Math.abs(byRank[0].collectSum - byRank[1].collectSum) : 0;
  const totalSaved = players.reduce((acc, p) => acc + p.collectSum, 0);

  const insights = buildInsights(byRank, gap);

  return {
    updatedAt,
    snapshots: sorted.length,
    trackedDays: Math.round(trackedDays * 10) / 10,
    players,
    leaderId,
    gap,
    totalSaved,
    insights,
    error: lastError,
  };
}

function buildInsights(byRank: PlayerView[], gap: number): string[] {
  const out: string[] = [];
  if (byRank.length < 2) return out;
  const [leader, second] = byRank;

  if (gap > 0) {
    out.push(`${leader.displayName} впереди на ${ruMoney(gap)}`);
  } else {
    out.push('Идёт ноздря в ноздрю — разрыва нет!');
  }

  // Кто прибавил больше за неделю
  const byWeek = [...byRank].sort((a, b) => b.delta7d - a.delta7d);
  if (byWeek[0].delta7d > 0) {
    out.push(
      `За неделю быстрее всех копит ${byWeek[0].displayName} (+${ruMoney(byWeek[0].delta7d)})`,
    );
  }

  // Догоняющий и темп
  if (second.perDayAvg > leader.perDayAvg && second.perDayAvg > 0) {
    const daysToCatch =
      gap > 0 ? Math.ceil(gap / (second.perDayAvg - leader.perDayAvg)) : 0;
    if (daysToCatch > 0) {
      out.push(
        `${second.displayName} догоняет: при таком темпе обгонит за ~${daysToCatch} дн.`,
      );
    }
  }

  // Прогноз достижения цели лидером
  if (leader.projectedDaysToGoal) {
    out.push(
      `${leader.displayName} достигнет цели примерно за ${leader.projectedDaysToGoal} дн.`,
    );
  }

  return out;
}
