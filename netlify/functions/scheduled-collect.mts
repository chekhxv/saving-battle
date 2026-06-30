// Scheduled-функция — это и есть «бот». Netlify дёргает её по cron.
// По умолчанию — раз в час. Поменять частоту можно в config.schedule (cron-синтаксис).

import type { Config } from '@netlify/functions';
import { runCollect } from '../lib/collect.ts';

export default async (): Promise<Response> => {
  const result = await runCollect();
  console.log('[scheduled-collect]', JSON.stringify(result));
  return new Response('ok');
};

export const config: Config = {
  // Каждый час. Примеры: '@hourly', '0 */3 * * *' (раз в 3 часа), '0 9,21 * * *' (9 и 21).
  schedule: '@hourly',
};
