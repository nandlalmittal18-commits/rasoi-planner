"""Check scripts/videos.json and write src/data/videos.json.
Every video must belong to a real dish or drink, name its creator, and be a YouTube id or an Instagram link.
Run: python3 scripts/build_videos.py
"""
import json, re, sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
raw = json.loads((root / "scripts/videos.json").read_text(encoding="utf-8"))
known = {d["id"] for d in json.loads((root / "src/data/dishes.json").read_text(encoding="utf-8"))}
known |= {d["id"] for d in json.loads((root / "src/data/drinks.json").read_text(encoding="utf-8"))}
LANGS = {"Hindi", "English"}

out, problems = {}, []
for dish_id, videos in raw.items():
    if dish_id.startswith("_"): continue
    if dish_id not in known: problems.append(f"{dish_id}: no dish or drink with this id")
    if not isinstance(videos, list) or not videos: problems.append(f"{dish_id}: needs a list of videos"); continue
    clean = []
    for n, v in enumerate(videos, 1):
        where = f"{dish_id} video {n}"
        p = v.get("platform")
        if p == "youtube":
            if not re.fullmatch(r"[A-Za-z0-9_-]{11}", v.get("id", "")): problems.append(f"{where}: youtube id must be the 11 letters after watch?v=")
        elif p == "instagram":
            if not re.fullmatch(r"https://www\.instagram\.com/(p|reel)/[A-Za-z0-9_-]+/?", v.get("url", "")): problems.append(f"{where}: instagram url must look like https://www.instagram.com/reel/ABC123/")
        else:
            problems.append(f"{where}: platform must be youtube or instagram")
        if not v.get("creator", "").strip(): problems.append(f"{where}: name the creator (we always credit them)")
        if "lang" in v and v["lang"] not in LANGS: problems.append(f"{where}: lang must be one of {sorted(LANGS)}")
        clean.append({k: v[k] for k in ("platform", "id", "url", "creator", "lang", "short") if k in v})
    out[dish_id] = clean

if problems: sys.exit("\n".join(problems))
(root / "src/data/videos.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print(f"wrote videos for {len(out)} dishes and drinks")
