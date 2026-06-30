// Ядро «бота»-сборщика: дёргает T-Bank по каждому участнику и добавляет снимок в историю.
// Используется и Scheduled-функцией, и HTTP-функцией /api/collect, и локальным скриптом.

import { PARTICIPANTS } from './participants.ts';
import { fetchByLink } from './tbank.ts';
import { loadHistory, saveHistory, saveLastError } from './store.ts';
import type { Snapshot, PlayerSnapshot } from './types.ts';

/** Не добавляем новый снимок, если прошло меньше этого времени с прошлого (анти-дубль). */
const MIN_INTERVAL_MS = 5 * 60 * 1000;

export interface CollectResult {
  ok: boolean;
  added: boolean;
  t: number;
  players: Record<string, PlayerSnapshot>;
  errors: string[];
}

export async function runCollect(force = false): Promise<CollectResult> {
  const t = Date.now();
  const players: Record<string, PlayerSnapshot> = {};
  const errors: string[] = [];

  const results = await Promise.allSettled(
    PARTICIPANTS.map(async (p) => {
      const snap = await fetchByLink(p.link);
      return { id: p.id, snap };
    }),
  );

  for (const r of results) {
    if (r.status === 'fulfilled') {
      players[r.value.id] = r.value.snap;
    } else {
      errors.push(String(r.reason?.message ?? r.reason));
    }
  }

  // Если вообще ничего не получили — не портим историю.
  if (Object.keys(players).length === 0) {
    const msg = `Сбор не удался: ${errors.join('; ')}`;
    await saveLastError(msg);
    return { ok: false, added: false, t, players, errors };
  }

  const history = await loadHistory();
  const last = history[history.length - 1];

  const tooSoon = last && t - last.t < MIN_INTERVAL_MS && !force;
  if (tooSoon) {
    return { ok: true, added: false, t, players, errors };
  }

  const snapshot: Snapshot = { t, players };
  history.push(snapshot);
  await saveHistory(history);

  if (errors.length) {
    await saveLastError(`Частичный сбор: ${errors.join('; ')}`);
  } else {
    await saveLastError('');
  }

  return { ok: true, added: true, t, players, errors };
}
