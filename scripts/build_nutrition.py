"""Work out nutrition per serving for every dish.
Reads scripts/nutrition/ingredients.psv (values per 100 g) and scripts/nutrition/servings.psv
(one serving per dish in grams) and writes src/data/nutrition.json.
Run: python3 scripts/build_nutrition.py
"""
import json, sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
here = root / "scripts/nutrition"

def rows(name):
    for n, line in enumerate((here / name).read_text(encoding="utf-8").splitlines(), 1):
        if line.strip() and not line.startswith("#"):
            yield n, [p.strip() for p in line.split("|")]

problems = []
ingredients = {}
for n, p in rows("ingredients.psv"):
    try:
        ingredients[p[0]] = [float(x) for x in p[1:6]]
    except (ValueError, IndexError):
        problems.append(f"ingredients.psv line {n}: needs key|kcal|protein|carbs|fat|fibre")

dishes = [d["id"] for d in json.loads((root / "src/data/dishes.json").read_text(encoding="utf-8"))] + ["steamed-rice"]
out = {}
for n, p in rows("servings.psv"):
    if len(p) != 3:
        problems.append(f"servings.psv line {n}: needs id|serving|ingredient:grams ..."); continue
    dish_id, serving, parts = p
    if dish_id in out: problems.append(f"servings.psv line {n}: {dish_id} listed twice")
    if dish_id not in dishes: problems.append(f"servings.psv line {n}: unknown dish {dish_id}")
    total = [0.0] * 5
    for part in parts.split():
        key, _, grams = part.partition(":")
        if key not in ingredients or not grams.replace(".", "").isdigit():
            problems.append(f"servings.psv line {n}: bad ingredient '{part}'"); continue
        for i, v in enumerate(ingredients[key]):
            total[i] += v * float(grams) / 100
    kcal, protein, carbs, fat, fibre = total
    out[dish_id] = {"serving": serving, "kcal": round(kcal), "protein": round(protein, 1),
                    "carbs": round(carbs, 1), "fat": round(fat, 1), "fibre": round(fibre, 1)}

missing = [d for d in dishes if d not in out]
if missing: problems.append("no serving for: " + ", ".join(missing))
if problems: sys.exit("\n".join(problems))
(root / "src/data/nutrition.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"wrote nutrition for {len(out)} dishes")
