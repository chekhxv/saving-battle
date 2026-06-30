import type { LevelInfo } from '../types.ts';
import { money } from '../lib/format.ts';

interface LevelBarProps {
  level: LevelInfo;
  accent: string;
}

export default function LevelBar({ level, accent }: LevelBarProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <span
            className="grid h-7 w-7 place-items-center rounded-lg text-sm font-extrabold text-ink-950"
            style={{ background: accent }}
          >
            {level.level}
          </span>
          <span className="text-sm font-semibold text-white/90">{level.title}</span>
        </div>
        <span className="text-xs text-white/45">
          {money(level.xpInLevel)} / {money(level.xpForNext)}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/8">
        <div
          className="relative h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${Math.max(4, level.progress * 100)}%`,
            background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
          }}
        >
          <div className="absolute inset-0 -skew-x-12 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>
      </div>
    </div>
  );
}
