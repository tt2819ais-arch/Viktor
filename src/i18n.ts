import type { Lang } from "./types";

export const dict = {
  ru: {
    appName: "Viktor",
    tagline: "медиа-плеер",
    tabs: { player: "Плеер", library: "Библиотека", settings: "Настройки" },
    player: {
      nothingTitle: "Нет треков",
      nothingHint: "Добавьте аудио в папку public/music и пересоберите сайт.",
      noSubtitles: "Субтитры не добавлены",
      subtitlesTitle: "Субтитры",
      unknownArtist: "Неизвестный исполнитель",
      now: "Сейчас играет",
    },
    library: {
      title: "Библиотека",
      count: (n: number) => `${n} ${plural(n, "трек", "трека", "треков")}`,
      empty: "Папка music пуста",
      emptyHint: "Положите файлы в public/music — они появятся здесь после сборки.",
      hasSubs: "субтитры",
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
        "Статический медиа-плеер. Музыка — public/music, фоны — public/video, субтитры — public/subtitles. Собирается в GitHub Actions.",
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
    appName: "Viktor",
    tagline: "media player",
    tabs: { player: "Player", library: "Library", settings: "Settings" },
    player: {
      nothingTitle: "No tracks",
      nothingHint: "Add audio to public/music and rebuild the site.",
      noSubtitles: "No subtitles added",
      subtitlesTitle: "Subtitles",
      unknownArtist: "Unknown artist",
      now: "Now playing",
    },
    library: {
      title: "Library",
      count: (n: number) => `${n} ${n === 1 ? "track" : "tracks"}`,
      empty: "The music folder is empty",
      emptyHint: "Drop files into public/music — they appear here after a build.",
      hasSubs: "subtitles",
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
        "A static media player. Music — public/music, backgrounds — public/video, subtitles — public/subtitles. Built in GitHub Actions.",
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
