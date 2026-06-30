import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Swords, Coins, Sparkles, Clock, AlertTriangle } from 'lucide-react';
import type { ApiData } from './types.ts';
import { money, moneyShort, relativeTime } from './lib/format.ts';
import PlayerCard from './components/PlayerCard.tsx';

function useData() {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/data', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as ApiData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  return { data, loading, error, reload: load };
}

function HeroBattle({ data }: { data: ApiData }) {
  const players = data.players;
  const leader = players.find((p) => p.id === data.leaderId);
  return (
    <div className="glass relative overflow-hidden rounded-3xl p-5 sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-grid-glow" />
      <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
        {/* VS блок */}
        <div className="flex items-center gap-3 sm:gap-5">
          {players.slice(0, 2).map((p, i) => (
            <div key={p.id} className="flex items-center gap-3">
              {i === 1 && (
                <div className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-xs font-black text-white/70 ring-1 ring-white/10">
                  VS
                </div>
              )}
              <div className="text-center">
                <div
                  className="mx-auto grid h-16 w-16 place-items-center rounded-2xl text-2xl font-black text-ink-950"
                  style={{
                    background: `linear-gradient(135deg, ${p.accent}, ${p.accent}aa)`,
                  }}
                >
                  {p.displayName.charAt(0)}
                </div>
                <div className="mt-2 text-sm font-bold">{p.displayName}</div>
                <div className="text-xs text-white/50">{moneyShort(p.collectSum)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Сводка */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <Summary icon={<Coins size={15} />} label="Всего собрано" value={moneyShort(data.totalSaved)} />
          <Summary
            icon={<Swords size={15} />}
            label="Разрыв"
            value={data.gap > 0 ? moneyShort(data.gap) : 'ничья'}
          />
          <Summary
            icon={<Sparkles size={15} />}
            label="Наблюдаем"
            value={`${data.trackedDays} дн`}
          />
        </div>
      </div>

      {leader && (
        <div className="relative mt-5 rounded-2xl bg-amber-300/10 px-4 py-2.5 text-center text-sm text-amber-200 ring-1 ring-amber-300/20">
          👑 Сейчас впереди <b>{leader.displayName}</b>
          {data.gap > 0 && <> — отрыв {money(data.gap)}</>}
        </div>
      )}
    </div>
  );
}

function Summary({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.04] px-3 py-2">
      <div className="flex items-center justify-center gap-1 text-[11px] text-white/45">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-base font-extrabold sm:text-lg">{value}</div>
    </div>
  );
}

function Insights({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {items.map((t, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.07 }}
          className="glass rounded-full px-4 py-1.5 text-sm text-white/75"
        >
          {t}
        </motion.div>
      ))}
    </div>
  );
}

export default function App() {
  const { data, loading, error, reload } = useData();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:py-12">
      {/* Шапка */}
      <header className="mb-8 flex flex-col items-center gap-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3"
        >
          <img src="/coin.svg" alt="" className="h-11 w-11 animate-float drop-shadow-glow" />
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            <span className="text-gradient">Битва Накоплений</span>
          </h1>
        </motion.div>
        <p className="max-w-md text-sm text-white/50">
          Кто отложит больше — соревнование на реальных данных сборов T-Bank. Бот обновляет
          статистику автоматически.
        </p>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/75 ring-1 ring-white/10 transition hover:bg-white/[0.1] hover:text-white disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Обновить
        </button>
      </header>

      {loading && !data && (
        <div className="grid place-items-center py-24 text-white/40">
          <RefreshCw className="mb-3 animate-spin" />
          Загружаем статистику…
        </div>
      )}

      {error && !data && (
        <div className="mx-auto max-w-md rounded-2xl bg-red-500/10 p-6 text-center text-red-200 ring-1 ring-red-500/20">
          <AlertTriangle className="mx-auto mb-2" />
          Не удалось загрузить данные: {error}
        </div>
      )}

      {data && (
        <div className="space-y-7">
          <HeroBattle data={data} />
          <Insights items={data.insights} />

          {data.error && (
            <div className="flex items-center justify-center gap-2 text-xs text-amber-300/70">
              <AlertTriangle size={13} /> Последний сбор частично не удался: {data.error}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            {data.players.map((p, i) => (
              <PlayerCard
                key={p.id}
                player={p}
                isLeader={p.id === data.leaderId}
                index={i}
              />
            ))}
          </div>

          <footer className="flex flex-col items-center gap-1 pt-4 text-center text-xs text-white/35">
            <div className="flex items-center gap-1.5">
              <Clock size={12} />
              Обновлено {relativeTime(data.updatedAt)} · снимков: {data.snapshots}
            </div>
            <div>Данные: публичные сборы T-Bank · сделано для дружеского челленджа</div>
          </footer>
        </div>
      )}
    </div>
  );
}
