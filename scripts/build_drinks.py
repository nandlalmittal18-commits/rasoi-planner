"""Check the drinks list and write src/data/drinks.json.
Edit scripts/drinks/drinks.json, then run: python3 scripts/build_drinks.py
Every drink needs benefits, at least one caution or tip, ingredients in English and Hindi,
and the same number of English and Hindi steps.
"""
import json, re, sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
drinks = json.loads((root / "scripts/drinks/drinks.json").read_text(encoding="utf-8"))

KINDS = {"Juice", "Cooler", "Milk drink", "Warm drink", "Fermented", "Water"}
TAGS = {"Immunity", "Hydration", "Digestion", "Energy", "Protein", "Calcium", "Cooling", "Warming",
        "Low sugar", "Kids", "Heart", "Eyes & skin", "Sleep"}
SEASONS = {"All", "Winter", "Summer", "Monsoon"}
TIMES = {"Morning", "Any time", "Evening", "Night", "After meals", "Before meals"}

problems, seen = [], set()
for n, d in enumerate(drinks, 1):
    where = f"drink {n} ({d.get('id', '?')})"
    if not re.fullmatch(r"[a-z0-9-]+", d.get("id", "")): problems.append(f"{where}: id must be lower-case words joined by -")
    if d["id"] in seen: problems.append(f"{where}: id used twice")
    seen.add(d["id"])
    for key in ("name", "hindi", "serving"):
        if not d.get(key): problems.append(f"{where}: missing {key}")
    if d.get("kind") not in KINDS: problems.append(f"{where}: kind must be one of {sorted(KINDS)}")
    if d.get("season") not in SEASONS: problems.append(f"{where}: season must be one of {sorted(SEASONS)}")
    if d.get("time") not in TIMES: problems.append(f"{where}: time must be one of {sorted(TIMES)}")
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", d.get("color", "")): problems.append(f"{where}: color must look like #a1b2c3")
    bad = [t for t in d.get("tags", []) if t not in TAGS]
    if bad or not d.get("tags"): problems.append(f"{where}: tags must be from {sorted(TAGS)} (bad: {bad})")
    if len(d.get("benefits", [])) < 2: problems.append(f"{where}: needs at least 2 benefits")
    if not d.get("caution"): problems.append(f"{where}: needs at least one caution or tip")
    for i in d.get("ingredients", []):
        if not i.get("en") or not i.get("hi"): problems.append(f"{where}: every ingredient needs en and hi")
    en, hi = d.get("steps", {}).get("en", []), d.get("steps", {}).get("hi", [])
    if not en or len(en) != len(hi): problems.append(f"{where}: needs the same number of English and Hindi steps")
    for flag in ("vrat", "jain", "noOnionGarlic"):
        if not isinstance(d.get(flag), bool): problems.append(f"{where}: {flag} must be true or false")
    if not isinstance(d.get("minutes"), int): problems.append(f"{where}: minutes must be a whole number")

if problems: sys.exit("\n".join(problems))
(root / "src/data/drinks.json").write_text(json.dumps(drinks, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"wrote {len(drinks)} drinks")

# Picture prompts for drinks that don't have our own photo yet (same style as the dish prompts).
import csv
photos = json.loads((root / "src/data/photos.json").read_text(encoding="utf-8"))
SETTINGS = [
    "on a weathered wooden table by a window in soft morning light",
    "on a white marble counter with soft daylight",
    "on a rustic stone surface with warm afternoon light",
    "on a light linen cloth on a wooden table, bright and airy",
    "on a dark slate surface with gentle side light",
    "on a terracotta-tiled kitchen counter in natural light",
    "on a sunny balcony table with green plants softly blurred behind",
]
def vessel(d):
    if d["kind"] == "Warm drink" or d["id"] == "haldi-doodh": return "a ceramic cup with a little steam rising"
    if d["id"] in ("masala-chaas", "sweet-lassi", "jaljeera", "thandai", "sol-kadhi"): return "a traditional steel or brass tumbler"
    if d["id"] == "coconut-water": return "a fresh green tender coconut with a paper straw, plus a glass of coconut water beside it"
    if d["id"] == "ragi-malt": return "a steel tumbler"
    return "a tall clear glass"
rows = []
for i, d in enumerate(drinks):
    if d["id"] in photos: continue
    def clean(t):
        t = re.sub(r"\(.*?\)", "", t.lower())
        t = re.sub(r"^[\d½¼¾\-–\s]+", "", t)
        t = re.sub(r"^(tbsp|tsp|cups?|glass(es)?|litre|inch|inch piece of|small piece of|a small piece of|a pinch of|a few|a handful of|a little|large|medium|small|fresh|ripe|tender|dried)\s+", "", t)
        t = re.sub(r"^(of\s+)", "", t)
        return t.split(",")[0].strip()
    skip = ("water", "salt", "sugar", "jaggery", "ice")
    picks = [clean(x["en"]) for x in d["ingredients"]]
    picks = [p for p in picks if p and not any(w in p for w in skip)][:2]
    props = " and ".join(picks) if picks else "a few fresh ingredients"
    cold = "with condensation on the glass, " if "Cooling" in d["tags"] and d["kind"] != "Warm drink" else ""
    prompt = (f"Realistic, refreshing food photograph of {d['name']} ({d['hindi']}), an Indian drink, served in {vessel(d)} {SETTINGS[(i * 3) % len(SETTINGS)]}, "
              f"{cold}the drink's true natural colour, with {props} placed casually nearby, slightly out of focus. "
              "Shot at a 30-degree angle with a 50mm lens, shallow depth of field, natural colours, looks home-made and real, not glossy or artificial. "
              "Landscape 3:2 (1536 x 1024). Keep the drink in the centre with empty space around it. No text, no labels, no logos, no hands, no people.")
    rows.append([d["name"], f"{d['id']}.jpg", prompt])
with open(root / "scripts/drink-photo-prompts.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["Drink", "File name", "Prompt"]); w.writerows(rows)
print(f"wrote {len(rows)} drink photo prompts to scripts/drink-photo-prompts.csv")
