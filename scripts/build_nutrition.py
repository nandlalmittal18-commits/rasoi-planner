"""Work out nutrition per serving for every dish, and how much of each ingredient one serving uses.
Reads scripts/nutrition/ingredients.psv (values per 100 g) and scripts/nutrition/servings.psv
(one serving per dish in grams) and writes src/data/nutrition.json and src/data/amounts.json
(grams per serving for each ingredient named in the dish list, used for shopping quantities).
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
# Ingredient names in the dish list -> the serving key that holds their weight.
KEY_FOR = {
    "rice": ["rice", "basmati rice", "cooked rice"], "atta": ["wheat flour", "whole wheat flour", "multigrain flour"],
    "maida": ["maida"], "sooji": ["semolina"], "besan": ["gram flour", "gram flour dumplings"], "sattu": ["sattu"],
    "poha": ["flattened rice"], "oats": ["oats"], "dalia": ["broken wheat"], "vermicelli": ["vermicelli", "roasted vermicelli"],
    "ricevermicelli": ["rice vermicelli", "rice noodles"], "noodles": ["noodles"], "pasta": ["pasta", "lasagne sheets"],
    "wwpasta": ["whole wheat spaghetti"], "bread": ["bread", "pav", "burger buns", "pizza base"], "flatbread": ["pita", "tortilla"],
    "tacoshell": ["taco shells", "nachos"], "maize": ["maize flour"], "bajra": ["pearl millet flour"], "jowar": ["sorghum flour"],
    "ragi": ["finger millet flour"], "kuttu": ["buckwheat flour"], "rajgira": ["amaranth flour"], "sabudana": ["sago"],
    "samak": ["barnyard millet"], "singhara": ["water chestnut flour"], "riceflour": ["rice flour"], "puffedrice": ["puffed rice"],
    "makhana": ["fox nuts"], "cornflour": ["cornflour"], "toor": ["toor dal", "mixed dal"], "moongdal": ["moong dal", "yellow moong dal"],
    "wholemoong": ["green moong"], "masoor": ["masoor dal", "red lentils"], "urad": ["urad dal", "whole urad"], "chanadal": ["chana dal"],
    "chickpea": ["chickpeas", "boiled chickpeas", "black chana", "black chickpeas"], "roastedchana": ["roasted chana"],
    "rajma": ["kidney beans", "rajma"], "lobia": ["black-eyed beans"], "soya": ["soya chunks", "soya granules"],
    "sprouts": ["sprouted moong", "sprouted moth beans"], "beansprouts": ["bean sprouts"], "tofu": ["tofu"],
    "peanut": ["peanuts", "boiled peanuts"], "peanutbutter": ["peanut butter"], "almond": ["almonds"], "cashew": ["cashew"],
    "nuts": ["dry fruits"], "sesame": ["sesame"], "poppy": ["poppy seeds"], "coconut": ["coconut", "grated coconut"],
    "coconutmilk": ["coconut milk"], "milk": ["milk"], "curd": ["curd", "buttermilk"], "hungcurd": ["hung curd"], "paneer": ["paneer"],
    "cheese": ["cheese"], "mozzarella": ["mozzarella"], "khoya": ["khoya"], "cream": ["cream"], "butter": ["butter"], "ghee": ["ghee"],
    "mayonnaise": ["mayonnaise"], "potato": ["potato", "baby potatoes", "sweet potato"], "yam": ["yam"], "arbi": ["colocasia"],
    "onion": ["onion"], "tomato": ["tomato"], "veg": ["mixed vegetables", "mixed veg", "vegetables"], "peas": ["peas", "green peas"],
    "leafy": ["spinach", "fenugreek leaves", "mustard greens"], "gourd": ["bottle gourd", "ridge gourd", "apple gourd", "bitter gourd"],
    "pumpkin": ["pumpkin"], "cauliflower": ["cauliflower"], "brinjal": ["brinjal"], "bhindi": ["okra"], "cabbage": ["cabbage"],
    "carrot": ["carrot"], "beans": ["beans", "french beans", "surti papdi"], "mushroom": ["mushroom"], "corn": ["sweet corn"],
    "capsicum": ["capsicum"], "cucumber": ["cucumber"], "rawpapaya": ["raw papaya"], "banana": ["banana", "raw banana"],
    "pineapple": ["pineapple"], "fruit": ["apple", "papaya", "pomegranate"], "farsan": ["sev", "boondi", "farsan"],
    "sugar": ["sugar", "sugar syrup"], "jaggery": ["jaggery"], "honey": ["honey"], "khakhra": ["khakhra"], "khari": ["khari biscuits"], "jam": ["jam"],
}
KEY_OF = {name: key for key, names in KEY_FOR.items() for name in names}
for key in KEY_FOR:
    if key not in ingredients: problems.append(f"build_nutrition.py: KEY_FOR uses unknown key {key}")
dish_ings = {d["id"]: [i.strip().lower() for i in d["ingredients"]] for d in json.loads((root / "src/data/dishes.json").read_text(encoding="utf-8"))}

out = {}
amounts = {}
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
    grams = {k: float(g) for k, _, g in (x.partition(":") for x in parts.split()) if k in ingredients}
    # Share each serving weight between the dish's named ingredients that use that key.
    names = dish_ings.get(dish_id, [])
    by_key = {}
    for name in names:
        if KEY_OF.get(name) in grams: by_key.setdefault(KEY_OF[name], []).append(name)
    amounts[dish_id] = {name: round(grams[key] / len(group), 1) for key, group in by_key.items() for name in group}
    kcal, protein, carbs, fat, fibre = total
    out[dish_id] = {"serving": serving, "kcal": round(kcal), "protein": round(protein, 1),
                    "carbs": round(carbs, 1), "fat": round(fat, 1), "fibre": round(fibre, 1)}

missing = [d for d in dishes if d not in out]
if missing: problems.append("no serving for: " + ", ".join(missing))
if problems: sys.exit("\n".join(problems))
(root / "src/data/nutrition.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
(root / "src/data/amounts.json").write_text(json.dumps(amounts, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
covered = sum(len(v) for v in amounts.values())
print(f"wrote nutrition for {len(out)} dishes; shopping amounts for {covered} ingredients")
