// Локальный/CI запуск бота: тянет данные и пишет историю в data/history.json.
// Запуск: npm run collect:local  (Node 20+: используется --experimental-strip-types)

import { runCollect } from '../netlify/lib/collect.ts';
import { loadHistory } from '../netlify/lib/store.ts';
import { computeApiData } from '../netlify/lib/stats.ts';
import { PARTICIPANTS } from '../netlify/lib/participants.ts';

const result = await runCollect(true);
console.log('Сбор:', result.added ? 'добавлен снимок' : 'снимок не добавлен');
if (result.errors.length) console.warn('Ошибки:', result.errors);

const history = await loadHistory();
const data = computeApiData(history, PARTICIPANTS);

console.log('\n=== Текущий рейтинг ===');
for (const p of [...data.players].sort((a, b) => a.rank - b.rank)) {
  console.log(
    `#${p.rank} ${p.displayName.padEnd(16)} ${String(p.collectSum).padStart(10)} ₽` +
      `  ур.${p.level.level} (${p.level.title})  ачивок: ${p.achievementsUnlocked}/${p.achievements.length}`,
  );
}
console.log('\nИнсайты:');
data.insights.forEach((i) => console.log(' •', i));
console.log(`\nСнимков в истории: ${data.snapshots}`);
