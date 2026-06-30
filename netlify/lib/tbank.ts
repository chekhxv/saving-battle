// Модуль получения данных по сбору T-Bank.
// Эндпоинт обнаружен реверсом фронта paymentscfn:
//   GET https://www.tbank.ru/api/common/v1/cm/crowdfund/info?nickname=..&crowdFundingId=..
// Обязательны заголовки User-Agent и Referer, иначе WAF режет ответ.

import type { PlayerSnapshot } from './types.ts';

const API_BASE = 'https://www.tbank.ru/api/common/v1/cm/crowdfund/info';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

interface CrowdRef {
  nickname: string;
  crowdFundingId: string;
}

/** Превращает короткую ссылку tbank.ru/cf/XXX в nickname + crowdFundingId. */
export async function resolveShortLink(link: string): Promise<CrowdRef> {
  const res = await fetch(link, {
    redirect: 'follow',
    headers: { 'User-Agent': UA },
  });
  // Итоговый URL вида:
  // https://www.tbank.ru/collectmoney/crowd/<nickname>/<crowdFundingId>/?short_link=..
  const finalUrl = new URL(res.url);
  const parts = finalUrl.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('crowd');
  if (idx === -1 || parts.length < idx + 3) {
    throw new Error(`Не удалось разобрать ссылку сбора: ${res.url}`);
  }
  return { nickname: parts[idx + 1], crowdFundingId: parts[idx + 2] };
}

interface MoneyValue {
  value: number;
}
interface CrowdInfoPayload {
  resultCode: string;
  payload?: {
    info: {
      name: string;
      category: string;
      collectAmount?: MoneyValue;
      status: string;
    };
    balance?: MoneyValue;
    collectSum?: MoneyValue;
    daysLeft?: number;
    owner?: { firstName?: string; lastName?: string };
  };
}

/** Запрашивает текущее состояние сбора и нормализует его в PlayerSnapshot. */
export async function fetchCrowdInfo(ref: CrowdRef): Promise<PlayerSnapshot> {
  const url = `${API_BASE}?nickname=${encodeURIComponent(
    ref.nickname,
  )}&crowdFundingId=${encodeURIComponent(ref.crowdFundingId)}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'application/json',
      Referer: 'https://www.tbank.ru/cf/',
    },
  });

  if (!res.ok) {
    throw new Error(`T-Bank API вернул ${res.status} для ${ref.crowdFundingId}`);
  }

  const data = (await res.json()) as CrowdInfoPayload;
  if (data.resultCode !== 'OK' || !data.payload) {
    throw new Error(`T-Bank API resultCode=${data.resultCode}`);
  }

  const p = data.payload;
  const owner = p.owner ?? {};
  const ownerName = [owner.firstName, owner.lastName].filter(Boolean).join(' ').trim();

  return {
    // Храним точные значения с копейками (T-Bank отдаёт, напр., 1234.5600).
    collectSum: p.collectSum?.value ?? 0,
    goal: p.info.collectAmount?.value ?? 0,
    balance: p.balance?.value ?? 0,
    daysLeft: typeof p.daysLeft === 'number' ? p.daysLeft : null,
    status: p.info.status ?? 'Unknown',
    ownerName: ownerName || 'Без имени',
    category: p.info.category ?? 'other',
  };
}

/** Резолвит ссылку и сразу тянет состояние сбора. */
export async function fetchByLink(link: string): Promise<PlayerSnapshot> {
  const ref = await resolveShortLink(link);
  return fetchCrowdInfo(ref);
}
