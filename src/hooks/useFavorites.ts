import { useCallback, useEffect, useState } from "react";

const KEY = "viktor.favorites";

function read(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
  } catch {
    return new Set();
  }
}

export function useFavorites() {
  const [ids, setIds] = useState<Set<string>>(() => read());

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify([...ids])); } catch {}
  }, [ids]);

  const isFav = useCallback((id: string) => ids.has(id), [ids]);
  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return { ids, isFav, toggle, count: ids.size };
}
