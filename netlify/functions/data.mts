// GET /api/data — отдаёт посчитанную статистику для фронта.
// Если истории ещё нет (холодный старт) — делает первый сбор на лету.

import type { Config, Context } from '@netlify/functions';
import { loadHistory, loadLastError } from '../lib/store.ts';
import { computeApiData } from '../lib/stats.ts';
import { PARTICIPANTS } from '../lib/participants.ts';
import { runCollect } from '../lib/collect.ts';

export default async (_req: Request, _ctx: Context): Promise<Response> => {
  let history = await loadHistory();

  if (history.length === 0) {
    // Первый заход — соберём данные сразу, чтобы было что показать.
    await runCollect(true).catch(() => undefined);
    history = await loadHistory();
  }

  const lastError = await loadLastError();
  const data = computeApiData(history, PARTICIPANTS, lastError);

  return new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60',
    },
  });
};

export const config: Config = {
  path: '/api/data',
};
