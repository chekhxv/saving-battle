import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Flame,
  TrendingUp,
  CalendarClock,
  Target,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import type { PlayerView } from '../types.ts';
import { money, signedMoney, categoryInfo } from '../lib/format.ts';
import CountUp from './CountUp.tsx';
import ProgressRing from './ProgressRing.tsx';
import LevelBar from './LevelBar.tsx';
import AchievementGrid from './AchievementGrid.tsx';
import Sparkline from './Sparkline.tsx';

const MEDALS = ['🥇', '🥈', '🥉'];

interface Props {
  player: PlayerView;
  isLeader: boolean;
  index: number;
}

function StatTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.04] p-2.5">
      <div className="flex items-center gap-1.5 text-[11px] text-white/45">
        {icon}
        {label}
      </div>
      <div
        className="mt-0.5 text-sm font-bold"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

export default function PlayerCard({ player, isLeader, index }: Props) {
  const cat = categoryInfo(player.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 120, damping: 18 }}
      className={[
        'glass-strong relative overflow-hidden rounded-3xl p-5 shadow-card',
        isLeader ? 'ring-2 ring-amber-300/40' : '',
      ].join(' ')}
    >
      {/* Светящийся акцент сверху */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: player.accent, opacity: 0.16 }}
      />

      {isLeader && (
        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-amber-300/15 px-2.5 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-300/30">
          <Crown size={13} /> Лидер
        </div>
      )}

      {/* Шапка */}
      <div className="flex items-center gap-3">
        <div
          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl font-black text-ink-950"
          style={{ background: `linear-gradient(135deg, ${player.accent}, ${player.accent}aa)` }}
        >
          {player.displayName.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight">
              {player.displayName}
            </span>
            <span className="text-xl">{MEDALS[player.rank - 1] ?? `#${player.rank}`}</span>
          </div>
          <div className="truncate text-xs text-white/45">
            {cat.emoji} {cat.label}
            {player.daysLeft != null ? ` · осталось ${player.daysLeft} дн` : ''}
          </div>
        </div>
      </div>

      {/* Сумма + кольцо прогресса */}
      <div className="mt-5 flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-white/40">Накоплено</div>
          <CountUp
            value={player.collectSum}
            format={(n) => money(n)}
            className="text-3xl font-black text-white sm:text-4xl"
          />
          {player.goal > 0 && (
            <div className="mt-1 text-xs text-white/45">из {money(player.goal)}</div>
          )}
        </div>
        {player.goal > 0 && (
          <ProgressRing percent={player.progressPct} color={player.accent}>
            <div>
              <div className="text-base font-black" style={{ color: player.accent }}>
                {Math.round(player.progressPct)}%
              </div>
              <div className="text-[9px] text-white/40">к цели</div>
            </div>
          </ProgressRing>
        )}
      </div>

      {/* Уровень */}
      <div className="mt-5">
        <LevelBar level={player.level} accent={player.accent} />
      </div>

      {/* Мини-график динамики */}
      <div className="mt-4">
        <Sparkline data={player.sparkline} color={player.accent} />
      </div>

      {/* Статы */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile
          icon={<ArrowUpRight size={13} />}
          label="за 24ч"
          value={signedMoney(player.delta24h)}
          accent={player.delta24h > 0 ? '#4ade80' : undefined}
        />
        <StatTile
          icon={<TrendingUp size={13} />}
          label="за неделю"
          value={signedMoney(player.delta7d)}
          accent={player.delta7d > 0 ? '#4ade80' : undefined}
        />
        <StatTile
          icon={<Flame size={13} />}
          label="стрик"
          value={`${player.streakDays} дн`}
          accent={player.streakDays > 0 ? '#fb923c' : undefined}
        />
        <StatTile
          icon={player.projectedDaysToGoal ? <Target size={13} /> : <CalendarClock size={13} />}
          label={player.projectedDaysToGoal ? 'до цели' : 'темп/день'}
          value={
            player.projectedDaysToGoal
              ? `~${player.projectedDaysToGoal} дн`
              : `${money(Math.max(0, player.perDayAvg))}`
          }
        />
      </div>

      {/* Ачивки */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-white/45">
          <span>Достижения</span>
          <span>
            {player.achievementsUnlocked}/{player.achievements.length}
          </span>
        </div>
        <AchievementGrid achievements={player.achievements} />
      </div>

      {/* Ссылка на сбор */}
      <a
        href={player.link}
        target="_blank"
        rel="noreferrer"
        className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.05] py-2.5 text-sm font-semibold text-white/70 ring-1 ring-white/8 transition hover:bg-white/[0.09] hover:text-white"
      >
        Поддержать сбор <ExternalLink size={14} />
      </a>
    </motion.div>
  );
}
