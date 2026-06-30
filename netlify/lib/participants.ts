// Участники соревнования. Чтобы добавить нового — просто допишите объект:
// достаточно короткой ссылки сбора T-Bank (вида https://tbank.ru/cf/XXXX),
// nickname/crowdFundingId резолвятся автоматически.

export interface Participant {
  /** Стабильный идентификатор (латиницей, без пробелов) */
  id: string;
  /** Отображаемое имя */
  displayName: string;
  /** Короткая ссылка сбора T-Bank */
  link: string;
  /** Акцентный цвет карточки (hex) */
  accent: string;
}

export const PARTICIPANTS: Participant[] = [
  {
    id: 'egor',
    displayName: 'Егор Саныч',
    link: 'https://tbank.ru/cf/10fEaUCnpCZ',
    accent: '#5b8cff',
  },
  {
    id: 'kirill',
    displayName: 'Кирилл Саныч',
    link: 'https://tbank.ru/cf/AJkrON7VMvB',
    accent: '#ff5bbd',
  },
];
