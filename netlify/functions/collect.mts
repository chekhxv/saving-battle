// GET/POST /api/collect — ручной запуск сбора (удобно для отладки и для внешнего cron).
// Можно защитить токеном: задайте env COLLECT_TOKEN и передавайте ?token=...

import type { Config, Context } from '@netlify/functions';
import { runCollect } from '../lib/collect.ts';

export default async (req: Request, _ctx: Context): Promise<Response> => {
  const token = process.env.COLLECT_TOKEN;
  if (token) {
    const url = new URL(req.url);
    const provided = url.searchParams.get('token') ?? req.headers.get('x-collect-token');
    if (provided !== token) {
      return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
  }

  const result = await runCollect(true);
  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 502,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};

export const config: Config = {
  path: '/api/collect',
};
