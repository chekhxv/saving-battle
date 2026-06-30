// Общие типы для функций и движка статистики.

/** Снимок состояния одного участника в конкретный момент времени. */
export interface PlayerSnapshot {
  /** Собрано, ₽ */
  collectSum: number;
  /** Цель сбора, ₽ (0 — цель не задана) */
  goal: number;
  /** Баланс счёта сбора, ₽ */
  balance: number;
  /** Дней до завершения сбора (null — бессрочно/неизвестно) */
  daysLeft: number | null;
  /** Статус сбора в T-Bank: Open / Closed / ... */
  status: string;
  /** Имя владельца сбора (как в T-Bank) */
  ownerName: string;
  /** Категория сбора: travel, present, ... */
  category: string;
}

/** Один снимок всей таблицы (все участники одновременно). */
export interface Snapshot {
  /** Время снятия, epoch ms */
  t: number;
  players: Record<string, PlayerSnapshot>;
}

/** Достижение. */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** Имя иконки lucide-react */
  icon: string;
  /** Редкость для цвета: common | rare | epic | legendary */
  tier: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  /** Когда открыто, epoch ms (если известно) */
  unlockedAt: number | null;
}

/** Уровень игрока. */
export interface LevelInfo {
  level: number;
  title: string;
  /** XP, набранный внутри текущего уровня */
  xpInLevel: number;
  /** XP, нужный для следующего уровня */
  xpForNext: number;
  /** Прогресс по текущему уровню 0..1 */
  progress: number;
}

/** Точка для мини-графика. */
export interface SparkPoint {
  t: number;
  value: number;
}

/** Полностью посчитанное представление игрока для фронта. */
export interface PlayerView {
  id: string;
  /** Отображаемое имя из конфига (напр. «Егор Саныч») */
  displayName: string;
  /** Имя из T-Bank */
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

/** Ответ /api/data. */
export interface ApiData {
  updatedAt: number | null;
  /** Сколько снимков в истории */
  snapshots: number;
  /** Период наблюдения в днях */
  trackedDays: number;
  players: PlayerView[];
  /** id лидера (или null) */
  leaderId: string | null;
  /** Разрыв между лидером и вторым местом, ₽ */
  gap: number;
  /** Совокупно накоплено всеми, ₽ */
  totalSaved: number;
  /** Подсказки/инсайты для мотивации */
  insights: string[];
  /** Ошибка последнего сбора, если была */
  error?: string;
}
