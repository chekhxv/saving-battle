const moneyFmt = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

export function money(n: number): string {
  return moneyFmt.format(Math.round(n)) + ' ₽';
}

/** Компактная запись: 1 250 000 → 1,25 млн */
export function moneyShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(2).replace('.', ',') + ' млн ₽';
  if (abs >= 10_000) return Math.round(n / 1000) + ' тыс ₽';
  return money(n);
}

export function signedMoney(n: number): string {
  const s = money(Math.abs(n));
  return n > 0 ? `+${s}` : n < 0 ? `−${s}` : s;
}

export function relativeTime(ts: number | null): string {
  if (!ts) return 'нет данных';
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин назад`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.round(h / 24);
  return `${d} дн назад`;
}

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  travel: { label: 'Путешествие', emoji: '✈️' },
  present: { label: 'Подарок', emoji: '🎁' },
  gift: { label: 'Подарок', emoji: '🎁' },
  repair: { label: 'Ремонт', emoji: '🔧' },
  car: { label: 'Авто', emoji: '🚗' },
  tech: { label: 'Техника', emoji: '💻' },
  education: { label: 'Учёба', emoji: '🎓' },
  event: { label: 'Событие', emoji: '🎉' },
  other: { label: 'Цель', emoji: '🎯' },
};

export function categoryInfo(cat: string): { label: string; emoji: string } {
  return CATEGORY_LABELS[cat] ?? CATEGORY_LABELS.other;
}

export const TIER_STYLES: Record<
  string,
  { ring: string; glow: string; text: string; label: string }
> = {
  common: { ring: 'ring-white/15', glow: '', text: 'text-white/70', label: 'Обычная' },
  rare: {
    ring: 'ring-sky-400/40',
    glow: 'shadow-[0_0_24px_-6px_rgba(56,189,248,0.6)]',
    text: 'text-sky-300',
    label: 'Редкая',
  },
  epic: {
    ring: 'ring-fuchsia-400/40',
    glow: 'shadow-[0_0_24px_-6px_rgba(232,121,249,0.6)]',
    text: 'text-fuchsia-300',
    label: 'Эпическая',
  },
  legendary: {
    ring: 'ring-amber-300/50',
    glow: 'shadow-[0_0_30px_-6px_rgba(251,191,36,0.7)]',
    text: 'text-amber-300',
    label: 'Легендарная',
  },
};
