"""Merge scripts/recipes/*.json into src/data/recipes.json and check every dish has a recipe.
Run: python3 scripts/build_recipes.py   (add --partial while recipes are still being written)
"""
import json, sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
dishes = [d["id"] for d in json.loads((root / "src/data/dishes.json").read_text(encoding="utf-8"))] + ["steamed-rice"]
merged, problems = {}, []
for f in sorted((root / "scripts/recipes").glob("*.json")):
    for dish_id, r in json.loads(f.read_text(encoding="utf-8")).items():
        if dish_id in merged: problems.append(f"{f.name}: {dish_id} is listed twice")
        if dish_id not in dishes: problems.append(f"{f.name}: unknown dish id {dish_id}")
        en, hi = r.get("en", []), r.get("hi", [])
        if not (3 <= len(en) <= 7): problems.append(f"{dish_id}: {len(en)} English steps")
        if len(hi) != len(en): problems.append(f"{dish_id}: {len(en)} English vs {len(hi)} Hindi steps")
        if any(not s.strip() for s in en + hi): problems.append(f"{dish_id}: empty step")
        merged[dish_id] = {"en": en, "hi": hi}
missing = [d for d in dishes if d not in merged]
if missing and "--partial" not in sys.argv: problems.append(f"missing recipes: {', '.join(missing)}")
if problems: sys.exit("\n".join(problems))
(root / "src/data/recipes.json").write_text(json.dumps(merged, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"wrote {len(merged)} recipes; {len(missing)} still missing")
