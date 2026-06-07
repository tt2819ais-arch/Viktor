// Free, key-less translation via MyMemory. Best-effort; cached in memory.
const cache = new Map<string, string>();

export async function translateLine(text: string): Promise<string> {
  const clean = text.trim();
  if (!clean) return "";
  if (cache.has(clean)) return cache.get(clean)!;
  // Cyrillic -> English, otherwise -> Russian.
  const toEn = /[а-яё]/i.test(clean);
  const pair = toEn ? "ru|en" : "en|ru";
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=${pair}`;
    const r = await fetch(url);
    const j = await r.json();
    const out = (j?.responseData?.translatedText as string) || "";
    if (out) cache.set(clean, out);
    return out;
  } catch {
    return "";
  }
}
