import { motion } from 'framer-motion';
import type { Achievement } from '../types.ts';
import { TIER_STYLES } from '../lib/format.ts';
import Icon from './Icon.tsx';

interface Props {
  achievements: Achievement[];
}

export default function AchievementGrid({ achievements }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {achievements.map((a, i) => {
        const tier = TIER_STYLES[a.tier];
        return (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className="group relative"
            title={`${a.title} — ${a.description}`}
          >
            <div
              className={[
                'grid aspect-square place-items-center rounded-xl ring-1 transition',
                a.unlocked
                  ? `${tier.ring} ${tier.glow} bg-white/[0.06]`
                  : 'ring-white/8 bg-white/[0.015] opacity-40 grayscale',
              ].join(' ')}
            >
              <Icon
                name={a.icon}
                className={a.unlocked ? tier.text : 'text-white/40'}
                size={20}
                strokeWidth={2.2}
              />
            </div>
            {/* Тултип */}
            <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-40 -translate-x-1/2 scale-95 rounded-xl border border-white/10 bg-ink-800/95 p-2.5 text-center opacity-0 shadow-card backdrop-blur transition group-hover:scale-100 group-hover:opacity-100">
              <div className="text-xs font-semibold text-white">{a.title}</div>
              <div className="mt-0.5 text-[10px] leading-tight text-white/55">
                {a.description}
              </div>
              <div className={`mt-1 text-[9px] font-semibold uppercase ${tier.text}`}>
                {a.unlocked ? tier.label : 'Закрыто'}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
