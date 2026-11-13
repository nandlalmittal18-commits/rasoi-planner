"""Convert scripts/dishes.psv (exported from the Rasoi Planner dish sheet) into src/data/dishes.json.
Run: python3 scripts/build_dishes.py
"""
import json, re, sys, unicodedata
from pathlib import Path

root = Path(__file__).resolve().parent.parent
lines = [l.rstrip("\n") for l in (root / "scripts/dishes.psv").open(encoding="utf-8") if l.strip()]
header, rows = lines[0].split("|"), [l.split("|") for l in lines[1:]]
errors, out, seen = [], [], set()
for i, r in enumerate(rows, start=2):
    if len(r) != len(header):
        errors.append(f"line {i}: {len(r)} fields"); continue
    d = dict(zip(header, r))
    plain = unicodedata.normalize("NFKD", d["Dish"]).encode("ascii", "ignore").decode()
    slug = re.sub(r"[^a-z0-9]+", "-", plain.lower()).strip("-")
    if slug in seen: errors.append(f"duplicate {slug}")
    seen.add(slug)
    yn = lambda k: d[k] == "Y"
    split = lambda s: [x.strip() for x in s.split(",") if x.strip()]
    out.append({
        "id": slug, "name": d["Dish"], "hindi": d["Hindi"],
        "slots": [s.strip() for s in d["Meal Slot"].split("/")],
        "category": d["Category"], "diet": d["Diet"], "region": d["Region"],
        "cookTime": int(d["Cook Time (min)"]), "difficulty": d["Difficulty"],
        "ingredients": split(d["Key Ingredients"]),
        "jain": yn("Jain OK"), "noOnionGarlic": yn("No Onion-Garlic OK"), "vrat": yn("Vrat OK"),
        "tiffin": yn("Tiffin OK"), "kidFavourite": yn("Kid Favourite"),
        "season": d["Best Season"], "heaviness": d["Heaviness"],
        "prepAhead": d["Prep Ahead"] or None, "pairsWith": split(d["Pairs With"]),
    })
if errors: sys.exit("\n".join(errors))
(root / "src/data/dishes.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"wrote {len(out)} dishes")
