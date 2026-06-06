import { useEffect, useState } from "react";
import type { Manifest } from "../types";
import { asset } from "../lib/format";

const EMPTY: Manifest = { generatedAt: "", tracks: [], videos: [] };

export function useManifest() {
  const [manifest, setManifest] = useState<Manifest>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch(asset("manifest.json"), { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : EMPTY))
      .then((data: Manifest) => {
        if (!alive) return;
        setManifest({
          generatedAt: data.generatedAt ?? "",
          tracks: Array.isArray(data.tracks) ? data.tracks : [],
          videos: Array.isArray(data.videos) ? data.videos : [],
        });
      })
      .catch(() => alive && setManifest(EMPTY))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { manifest, loading };
}
