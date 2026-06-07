import type { Lang } from "./types";

export const dict = {
  ru: {
    appName: "Музыка",
    tagline: "медиа-плеер",
    tabs: { player: "Плеер", library: "Моя музыка", search: "Поиск", settings: "Настройки" },
    player: {
      nothingTitle: "Нет треков",
      nothingHint: "Откройте «Поиск» или «Мою музыку», чтобы выбрать трек.",
      noSubtitles: "Субтитры не добавлены",
      subtitlesTitle: "Субтитры",
      unknownArtist: "Неизвестный исполнитель",
      now: "Сейчас играет",
    },
    library: {
      title: "Библиотека",
      count: (n: number) => `${n} ${plural(n, "трек", "трека", "треков")}`,
      empty: "Лайков пока нет",
      emptyHint: "Лайкните треки в Яндекс.Музыке — они появятся здесь.",
      hasSubs: "текст",
      filter: "Фильтр по библиотеке",
      offline: "Нет связи с сервером",
      offlineHint: "Сервер просыпается или токен не задан. Подождите немного и обновите страницу.",
    },
    search: {
      placeholder: "Найти любой трек…",
      recent: "Недавно слушали",
      hint: "Введите название трека или исполнителя.",
      nothing: "Ничего не найдено",
      noRecent: "Пока пусто",
    },
    settings: {
      title: "Настройки",
      appearance: "Оформление",
      theme: "Тема",
      themeDark: "Тёмная",
      themeLight: "Светлая",
      language: "Язык",
      background: "Фон",
      backgroundAuto: "Автосмена",
      backgroundNone: "Выключен",
      backgroundHint: "Видео из папки public/video проигрываются в цикле.",
      noVideos: "Фоновые видео не добавлены",
      playback: "Воспроизведение",
      visualizer: "Визуализатор",
      about: "О плеере",
      aboutText:
        "Веб-плеер для личной фонотеки Яндекс.Музыки: лайки, поиск, обложки и синхронный текст.",
    },
    controls: {
      play: "Играть",
      pause: "Пауза",
      next: "Следующий",
      prev: "Предыдущий",
      shuffle: "Перемешать",
      repeat: "Повтор",
      mute: "Без звука",
      volume: "Громкость",
    },
    on: "Вкл",
    off: "Выкл",
  },
  en: {
    appName: "Music",
    tagline: "media player",
    tabs: { player: "Player", library: "Library", search: "Search", settings: "Settings" },
    player: {
      nothingTitle: "No tracks",
      nothingHint: "Open Search or your Library to pick a track.",
      noSubtitles: "No subtitles added",
      subtitlesTitle: "Subtitles",
      unknownArtist: "Unknown artist",
      now: "Now playing",
    },
    library: {
      title: "Library",
      count: (n: number) => `${n} ${n === 1 ? "track" : "tracks"}`,
      empty: "No liked tracks yet",
      emptyHint: "Like tracks in Yandex Music — they show up here.",
      hasSubs: "lyrics",
      filter: "Filter your library",
      offline: "No server connection",
      offlineHint: "The server is waking up or the token is missing. Wait a moment and refresh.",
    },
    search: {
      placeholder: "Find any track…",
      recent: "Recently played",
      hint: "Type a track title or artist.",
      nothing: "Nothing found",
      noRecent: "Nothing yet",
    },
    settings: {
      title: "Settings",
      appearance: "Appearance",
      theme: "Theme",
      themeDark: "Dark",
      themeLight: "Light",
      language: "Language",
      background: "Background",
      backgroundAuto: "Auto-cycle",
      backgroundNone: "Off",
      backgroundHint: "Videos from public/video play on a loop.",
      noVideos: "No background videos added",
      playback: "Playback",
      visualizer: "Visualizer",
      about: "About",
      aboutText:
        "A web player for your personal Yandex Music library: likes, search, covers and synced lyrics.",
    },
    controls: {
      play: "Play",
      pause: "Pause",
      next: "Next",
      prev: "Previous",
      shuffle: "Shuffle",
      repeat: "Repeat",
      mute: "Mute",
      volume: "Volume",
    },
    on: "On",
    off: "Off",
  },
} as const;

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export type Dict = (typeof dict)[Lang];
