"""Local-free music backend: proxies a personal Yandex Music account.

The OAuth token lives only in the YANDEX_TOKEN environment variable (a host
secret) — never in the frontend. The built SPA is served from this same origin,
so the browser talks only to this server and there are no CORS/token issues.
"""
import os
import re
import threading
import time
import urllib.parse

import requests
from flask import Flask, Response, jsonify, request, send_from_directory, abort
from yandex_music import Client

TOKEN = os.environ.get("YANDEX_TOKEN", "").strip()
DIST_DIR = os.path.join(os.path.dirname(__file__), "..", "dist")
DIST_DIR = os.path.abspath(DIST_DIR)

app = Flask(__name__, static_folder=None)

# ── Yandex client (lazy, thread-safe) ──────────────────────────────────────
_client = None
_client_lock = threading.Lock()


def client() -> Client:
    global _client
    if _client is None:
        with _client_lock:
            if _client is None:
                if not TOKEN:
                    raise RuntimeError("YANDEX_TOKEN is not set")
                _client = Client(TOKEN).init()
    return _client


# ── helpers ────────────────────────────────────────────────────────────────
def cover_url(uri: str | None, size: str = "400x400") -> str | None:
    if not uri:
        return None
    return "/api/cover?" + urllib.parse.urlencode({"uri": uri, "size": size})


def serialize(track) -> dict:
    tid = str(track.id)
    artists = ", ".join(a.name for a in (track.artists or []))
    album = track.albums[0] if track.albums else None
    album_id = album.id if album else None
    yandex_url = (
        f"https://music.yandex.ru/album/{album_id}/track/{tid}"
        if album_id else f"https://music.yandex.ru/track/{tid}"
    )
    return {
        "id": tid,
        "title": track.title or "",
        "artist": artists,
        "album": album.title if album else "",
        "albumId": album_id,
        "cover": cover_url(track.cover_uri),
        "src": f"/api/track/{tid}/stream",
        "lyrics": f"/api/track/{tid}/lyrics.vtt",
        "hasLyrics": True,  # decided lazily by the lyrics endpoint
        "yandexUrl": yandex_url,
        "duration": (track.duration_ms or 0) / 1000.0,
    }


def fetch_tracks_by_ids(ids):
    ids = [str(i) for i in ids if i]
    if not ids:
        return []
    tracks = client().tracks(ids)
    by_id = {str(t.id): t for t in tracks}
    # preserve requested order
    return [serialize(by_id[i]) for i in ids if i in by_id]


# ── caches (in-memory, single instance) ────────────────────────────────────
# Resolved Yandex direct download links are slow to obtain (2-3 round trips),
# and the browser issues many Range requests per track (buffering + seeking).
# Cache the resolved link per track id so only the FIRST request is slow.
_link_cache: dict[str, tuple[float, str]] = {}
_link_lock = threading.Lock()
_LINK_TTL = 600  # seconds; Yandex signed links stay valid well beyond this

# Cache the likes list briefly so repeat loads are instant.
_simple_cache: dict[str, tuple[float, object]] = {}


def _cached(key: str, ttl: float, producer):
    hit = _simple_cache.get(key)
    if hit and (time.time() - hit[0]) < ttl:
        return hit[1]
    val = producer()
    _simple_cache[key] = (time.time(), val)
    return val


def resolve_link(tid: str) -> str:
    now = time.time()
    hit = _link_cache.get(tid)
    if hit and (now - hit[0]) < _LINK_TTL:
        return hit[1]
    with _link_lock:
        hit = _link_cache.get(tid)
        if hit and (time.time() - hit[0]) < _LINK_TTL:
            return hit[1]
        tracks = client().tracks([tid])
        if not tracks:
            raise RuntimeError("track not found")
        # get_direct_links=False fetches only the option list (1 call); we then
        # resolve a single best link (1 call) instead of resolving them all.
        infos = tracks[0].get_download_info(get_direct_links=False)
        mp3 = [d for d in infos if d.codec == "mp3"]
        best = max(mp3 or infos, key=lambda d: d.bitrate_in_kbps)
        link = best.direct_link or best.get_direct_link()
        _link_cache[tid] = (time.time(), link)
        return link


LRC_LINE = re.compile(r"\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]\s?(.*)")


def lrc_to_vtt(lrc: str) -> str:
    rows = []
    for line in lrc.splitlines():
        m = LRC_LINE.match(line.strip())
        if not m:
            continue
        mm, ss, frac, text = m.groups()
        t = int(mm) * 60 + int(ss)
        if frac:
            t += int(frac.ljust(3, "0")) / 1000.0
        rows.append((t, text.strip()))
    rows.sort(key=lambda r: r[0])
    if not rows:
        return ""

    def fmt(sec):
        h = int(sec // 3600)
        m = int((sec % 3600) // 60)
        s = sec % 60
        return f"{h:02d}:{m:02d}:{s:06.3f}"

    out = ["WEBVTT", ""]
    for i, (start, text) in enumerate(rows):
        if not text:
            continue
        end = rows[i + 1][0] if i + 1 < len(rows) else start + 5
        if end <= start:
            end = start + 3
        out.append(f"{fmt(start)} --> {fmt(end)}")
        out.append(text)
        out.append("")
    return "\n".join(out)


# ── API routes ─────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return jsonify(ok=True)


@app.get("/api/likes")
def likes():
    try:
        def produce():
            liked = client().users_likes_tracks().tracks
            ids = [ts.id for ts in liked]
            return fetch_tracks_by_ids(ids)
        return jsonify(_cached("likes", 60, produce))
    except Exception as e:  # noqa
        return jsonify(error=str(e)), 502


@app.get("/api/search")
def search():
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify([])
    try:
        res = client().search(q, type_="track")
        tracks = res.tracks.results if (res and res.tracks) else []
        return jsonify([serialize(t) for t in tracks[:40]])
    except Exception as e:  # noqa
        return jsonify(error=str(e)), 502


@app.get("/api/recent")
def recent():
    try:
        c = client()
        uid = c.me.account.uid
        data = c.request.get(f"https://api.music.yandex.net/users/{uid}/contexts")
        seen = []
        for ctx in (data.get("contexts") or []):
            for tr in (ctx.get("tracks") or []):
                tid = tr.get("trackId", {}).get("id")
                if tid and tid not in seen:
                    seen.append(tid)
        return jsonify(fetch_tracks_by_ids(seen[:40]))
    except Exception as e:  # noqa
        return jsonify(error=str(e)), 502


@app.get("/api/cover")
def cover():
    uri = request.args.get("uri")
    size = request.args.get("size", "400x400")
    if not uri:
        abort(404)
    url = "https://" + uri.replace("%%", size)
    try:
        r = requests.get(url, timeout=15)
        if r.status_code != 200:
            abort(404)
        return Response(
            r.content,
            content_type=r.headers.get("Content-Type", "image/jpeg"),
            headers={"Cache-Control": "public, max-age=86400"},
        )
    except Exception:  # noqa
        abort(404)


@app.get("/api/track/<tid>/lyrics.vtt")
def lyrics(tid):
    try:
        tracks = client().tracks([tid])
        if not tracks:
            abort(404)
        ly = tracks[0].get_lyrics("LRC")
        raw = ly.fetch_lyrics() if ly else ""
        vtt = lrc_to_vtt(raw or "")
        if not vtt:
            abort(404)
        return Response(vtt, content_type="text/vtt; charset=utf-8")
    except Exception:  # noqa
        abort(404)


@app.get("/api/track/<tid>/stream")
def stream(tid):
    try:
        link = resolve_link(tid)
    except Exception as e:  # noqa
        return Response(f"stream error: {e}", status=502)

    range_header = request.headers.get("Range")
    fwd_headers = {"User-Agent": "Mozilla/5.0"}
    if range_header:
        fwd_headers["Range"] = range_header
    try:
        upstream = requests.get(link, headers=fwd_headers, stream=True, timeout=30)
        # A stale/expired cached link → refetch once.
        if upstream.status_code in (403, 410):
            _link_cache.pop(tid, None)
            link = resolve_link(tid)
            upstream = requests.get(link, headers=fwd_headers, stream=True, timeout=30)
    except Exception as e:  # noqa
        return Response(f"stream error: {e}", status=502)

    def generate():
        for chunk in upstream.iter_content(chunk_size=65536):
            if chunk:
                yield chunk

    resp_headers = {
        "Accept-Ranges": "bytes",
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
    }
    for h in ("Content-Length", "Content-Range"):
        if h in upstream.headers:
            resp_headers[h] = upstream.headers[h]
    return Response(generate(), status=upstream.status_code, headers=resp_headers)


# ── static SPA ─────────────────────────────────────────────────────────────
@app.get("/")
def index():
    return send_from_directory(DIST_DIR, "index.html")


@app.get("/<path:path>")
def static_or_spa(path):
    full = os.path.join(DIST_DIR, path)
    if os.path.isfile(full):
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5050"))
    app.run(host="0.0.0.0", port=port, threaded=True)
