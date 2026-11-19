"""Write one AI photo prompt per dish to scripts/photo-prompts.csv.

Each prompt describes the dish, a fitting serving vessel, a camera angle, and one of
several different backgrounds, so the photos look real and don't all look alike.
Run: python3 scripts/photo_prompts.py
"""
import csv, json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
dishes = json.loads((root / "src/data/dishes.json").read_text(encoding="utf-8"))
dishes.append({"id": "steamed-rice", "name": "Steamed Rice", "category": "Rice", "diet": "Veg",
               "ingredients": ["rice"], "pairsWith": [], "region": "Pan-India", "heaviness": "Light"})

SETTINGS = [
    "on a dark walnut wooden table, warm side light from a window, a softly blurred home kitchen behind",
    "on a white marble counter in bright, soft morning daylight",
    "on an indigo block-printed cotton cloth, soft daylight from the left",
    "on rustic terracotta tiles in warm golden late-afternoon sun",
    "on a fresh green banana leaf laid over a dark wooden table, soft daylight",
    "on a dark slate board, moody low-key light with a single soft window light",
    "on a light oak dining table beside a sunny window, airy natural light",
    "on a carved antique wooden table next to a small brass lota, warm cosy light",
    "on a woven jute mat in soft, diffused daylight",
    "on a crisp white linen tablecloth in soft, bright daylight",
    "on hand-painted blue-and-white ceramic tiles in clean daylight",
    "on a grey granite kitchen counter with a steel kadhai softly blurred behind, natural light",
    "on a mustard-yellow surface with soft leaf shadows, warm daylight",
    "on a weathered teak table in a shaded courtyard, soft open shade",
]
BOWLS = ["a brass katori", "a white ceramic bowl", "a steel katori", "a small copper handi",
         "a black clay pot", "a hand-thrown earthenware bowl", "a hammered copper bowl", "a speckled stoneware bowl"]
PLATES = ["a white ceramic plate", "a brass plate", "a steel plate", "a matte stoneware plate",
          "a hand-painted ceramic plate", "a round wooden board"]

# How tricky dishes should look (the model may not know them well).
LOOKS = {
    "poha": "fluffy yellow flattened rice with peanuts, curry leaves, green chilli, onion and a lemon wedge, topped with fine sev and coriander",
    "thalipeeth": "two round, rustic multigrain flatbreads with small holes in the middle, crisp golden-brown spots, a dollop of white butter on top",
    "handvo": "square slices of a savoury baked rice-and-lentil cake with a crisp brown sesame-speckled crust and a soft yellow inside",
    "pesarattu": "a thin green moong dal crepe folded in half, flecked with ginger and chilli, with coconut chutney",
    "akki-roti": "two thin rice-flour flatbreads with onion, dill and coconut pressed in, crisp brown spots",
    "puttu-kadala-curry": "a white steamed cylinder of rice flour and coconut layers beside a bowl of dark brown black-chickpea curry",
    "appam-with-veg-stew": "two lacy bowl-shaped rice pancakes with soft spongy centres and crisp edges, with a creamy white coconut vegetable stew",
    "idiyappam-with-veg-stew": "a few nests of thin white steamed rice noodles with a creamy white coconut vegetable stew",
    "misal-pav": "a bowl of spicy red sprouted-moth curry topped with crunchy yellow farsan, chopped onion and coriander, with two soft pav buns and a lemon wedge",
    "luchi-with-cholar-dal": "small puffed white deep-fried luchis with a bowl of golden chana dal with coconut pieces",
    "dal-pakwan": "crisp flaky round fried pakwan crackers with a bowl of thick chana dal topped with onion and tamarind chutney",
    "khaman-dhokla": "soft, spongy yellow squares of steamed gram-flour cake topped with mustard seeds, green chillies, curry leaves and grated coconut",
    "khandvi": "neat, soft pale-yellow gram-flour rolls topped with mustard seeds, sesame, grated coconut and coriander",
    "sabudana-khichdi": "glossy, separate translucent sago pearls with peanuts, potato cubes, green chilli and coriander",
    "sabudana-vada": "crisp golden round sago and potato fritters with green chutney",
    "kuttu-puri-with-aloo": "dark brown puffed buckwheat puris with a bowl of simple potato curry",
    "rajgira-paratha": "soft amaranth-flour flatbreads, light brown, with a bowl of curd",
    "dal-baati-churma": "round golden baked wheat dumplings dipped in ghee, a bowl of yellow dal and a mound of sweet crumbly churma",
    "litti-chokha": "round charred wheat balls stuffed with sattu, cracked open, with smoky mashed brinjal-potato chokha and ghee",
    "undhiyu": "a rich green Gujarati mixed-vegetable dish with purple yam, sweet potato, flat beans and small fenugreek dumplings",
    "shukto": "a light, creamy Bengali mixed vegetable stew with bitter gourd, raw banana and drumsticks",
    "avial": "mixed vegetables cut into batons in a thick coconut-curd coating with curry leaves",
    "dalma": "thick yellow lentils cooked with pumpkin, raw banana and papaya pieces, topped with a cumin and red chilli tadka",
    "gatte-ki-sabzi": "gram-flour dumplings in a tangy orange curd gravy",
    "sev-tamatar": "a tangy red tomato curry topped generously with crunchy yellow sev",
    "lauki-kofta": "round bottle-gourd koftas in a smooth tomato-onion gravy, with a swirl of cream",
    "malai-kofta": "soft paneer-potato koftas in a creamy pale orange cashew gravy with a swirl of cream",
    "arbi-fry": "crisp, spiced colocasia pieces with ajwain and coriander",
    "khatta-meetha-kaddu": "soft orange pumpkin pieces in a sweet-sour masala with fenugreek seeds",
    "aloo-posto": "potato cubes coated in a pale poppy-seed paste with green chilli",
    "karela-fry": "crisp brown rings of bitter gourd with onion and amchur",
    "tinda-masala": "round apple gourds halved and cooked in a light tomato masala",
    "turai-sabzi": "soft green ridge gourd pieces with tomato and cumin",
    "lauki-sabzi": "soft pale-green bottle gourd cubes with tomato and cumin",
    "chana-dal-lauki": "thick yellow chana dal with soft bottle gourd pieces and a ghee tadka",
    "ragi-mudde": "two smooth round dark brown finger-millet balls with a bowl of sambar",
    "jowar-bhakri": "two rustic round sorghum flatbreads with light char spots, with thecha and onion",
    "bajra-roti": "two thick round pearl-millet rotis with white butter and jaggery",
    "makki-ki-roti": "two golden-yellow cornmeal rotis with white butter",
    "missi-roti": "two spiced gram-flour rotis with onion and coriander flecks, brushed with ghee",
    "neer-dosa": "three soft, thin, lacy white rice crepes folded into triangles",
    "medu-vada": "three crisp golden doughnut-shaped lentil fritters with sambar and coconut chutney",
    "ven-pongal": "creamy rice and moong dal with black pepper, cashews, ghee and curry leaves",
    "bisi-bele-bath": "a hot, saucy reddish-brown rice, lentil and vegetable mix topped with ghee and crisp boondi",
    "puliyogare-tamarind-rice": "brown tamarind rice with peanuts and curry leaves",
    "samak-rice-pulao": "fluffy barnyard millet cooked with potato and peanuts",
    "singhara-atta-halwa": "glossy dark brown water-chestnut flour halwa with ghee",
    "makhana-kheer": "creamy milk pudding with soft fox nuts, cardamom and chopped pistachios",
    "shrikhand": "thick, smooth saffron-yellow sweet hung curd topped with pistachios and saffron strands",
    "chaas-masala-buttermilk": "a tall glass of frothy spiced buttermilk with roasted cumin and mint",
    "badam-lassi": "a tall glass of thick creamy almond lassi with slivered almonds and saffron on top",
    "sattu-shake": "a tall glass of thick light-brown sattu shake made with banana and milk, chopped dry fruits on top, a banana beside it",
    "peanut-banana-smoothie": "a tall glass of creamy peanut-butter banana smoothie with oats, banana slices beside it",
    "sattu-paratha": "two golden stuffed parathas, one torn to show the spiced sattu filling, with curd and pickle",
    "chana-sundal": "boiled chickpeas tossed with grated coconut, mustard seeds and curry leaves",
    "roasted-chana-chaat": "crunchy roasted chana tossed with onion, tomato, coriander and lemon",
    "peanut-chaat": "boiled peanuts tossed with onion, tomato, green chilli and coriander",
    "moong-usal": "sprouted moong cooked in a light coconut-tomato gravy, topped with farsan and coriander, with pav",
    "masoor-dal-tikki": "four round, flat, crisp golden lentil patties with green mint chutney",
    "egg-white-bhurji": "soft white scrambled egg whites with onion, tomato, capsicum and coriander",
    "tofu-bhurji": "crumbled scrambled tofu with onion, tomato, capsicum and turmeric",
    "soya-keema": "minced soya granules cooked with green peas in a rich onion-tomato masala (it must clearly look vegetarian)",
    "soya-chunks-curry": "soft soya chunks and potato pieces in a red onion-tomato gravy (it must clearly look vegetarian)",
    "paneer-stuffed-besan-chilla": "a golden gram-flour pancake folded over a soft paneer filling, with green chutney",
    "fruit-chaat": "a colourful bowl of cut banana, apple, papaya and pomegranate seeds sprinkled with chaat masala",
    "shakarkandi-chaat": "roasted sweet potato cubes with lemon, roasted cumin and coriander",
    "masala-oats": "savoury oats cooked with onion, tomato, peas and turmeric, soft porridge texture (no fruit, not sweet)",
    "mix-veg": "dry North Indian mixed vegetables: carrot, beans, peas, potato and cauliflower in light masala",
    "veg-pulao": "fluffy basmati rice with carrot, peas and beans and whole spices",
    "dal-dhokli": "a thin, sweet-sour Gujarati dal with soft diamond-shaped wheat dumplings and peanuts",
    "gujarati-kadhi": "a smooth, thin, pale yellow sweet-and-sour yogurt curry with curry leaves",
    "gujarati-dal": "a thin, sweet-tangy yellow toor dal with peanuts and kokum",
    "rasam": "a thin, peppery, reddish tamarind-tomato soup with curry leaves and coriander",
    "steamed-rice": "a mound of fluffy, separate long-grain white rice",
    "phulka-roti": "a small stack of soft puffed whole-wheat phulkas with brown spots, one brushed with ghee",
    "plain-paratha": "two layered golden whole-wheat parathas with flaky layers",
    "kulhad-pizza": "small clay kulhad cups filled with layers of bread cubes, corn, capsicum and paneer, topped with bubbling golden melted mozzarella and oregano",
    "bread-pizza": "slices of toasted bread topped with pizza sauce, onion, capsicum, sweet corn and melted stretchy mozzarella with chilli flakes",
    "pink-sauce-pasta": "penne pasta in a creamy pale-pink tomato and white sauce with capsicum and sweet corn, topped with grated cheese",
    "chilli-cheese-toast": "golden toast triangles topped with bubbling browned cheese flecked with green chilli, capsicum and coriander",
    "bombay-masala-toast": "a Mumbai street-style grilled sandwich cut into four, golden with grill marks, showing layers of yellow potato masala, cucumber, tomato and green chutney",
    "dabeli": "two soft buttered pav buns stuffed with sweet-spicy potato filling, masala peanuts and pomegranate seeds, edges coated in fine yellow sev",
    "tandoori-momos": "steamed dumplings coated in a red-orange tandoori marinade with charred spots, with onion rings and green mint mayo",
    "kurkure-momos": "dumplings coated in crushed cornflakes and fried till golden and very crunchy, with red chutney and mayonnaise",
    "peri-peri-fries": "a heap of crisp golden French fries dusted with red peri peri masala, with a small bowl of mayonnaise",
    "cheese-corn-balls": "crisp golden breaded balls, one broken open to show melted stretchy cheese and sweet corn inside, with ketchup",
    "paneer-popcorn": "small bite-sized golden crumb-coated paneer cubes, crisp outside and white inside, sprinkled with chaat masala",
    "crispy-corn": "crisp fried golden sweet corn kernels tossed with onion, capsicum, chilli flakes and spring onion",
    "honey-chilli-potato": "crisp potato fingers in a glossy sticky red honey-chilli sauce, topped with sesame seeds and spring onion",
    "chilli-garlic-noodles": "stir-fried noodles with lots of golden fried garlic, red chilli flakes, cabbage, capsicum and spring onion",
    "paneer-kathi-roll": "a paratha roll wrapped in paper and cut in half, showing charred paneer tikka, onion and capsicum filling with green chutney",
    "korean-cream-cheese-garlic-bun": "a large round golden bun cut into six wedges, the cuts filled with white cream cheese, glistening with garlic-herb butter",
    "korean-cheese-corn-dog": "two golden crunchy battered sticks on skewers, coated in sugar with ketchup and mustard drizzle, one bitten to show a long stretchy mozzarella cheese pull (cheese only, no sausage)",
    "cheese-masala-noodles": "spicy instant masala noodles with onion, tomato and capsicum, topped with melting grated cheese",
    "pani-puri": "a plate of small round crisp hollow puris filled with potato and chickpeas, with a bowl of green mint water and sweet tamarind chutney",
    "dubai-chocolate-bar": "a thick dark chocolate bar broken in half to show a bright green pistachio filling packed with crisp golden kunafa strands",
    "biscoff-cheesecake-jar": "a small glass jar with a crumbly brown biscuit base, a layer of white cheesecake cream and a glossy caramel biscuit spread on top with crumbs",
    "rasmalai-tres-leches": "a square of soft milk-soaked sponge cake in a pool of saffron milk, topped with whipped cream, chopped pistachios and saffron strands",
    "chocolate-lava-cake": "a small dark chocolate cake cut open with molten chocolate flowing out, beside a scoop of vanilla ice cream",
    "tiramisu-cups": "a glass cup with layers of coffee-soaked biscuits and white cream, dusted thickly with cocoa powder",
}

def looks(d):
    if d["id"] in LOOKS:
        return LOOKS[d["id"]]
    ing = ", ".join(i.lower() for i in d.get("ingredients", [])[:5])
    where = d.get("region", "")
    region = {"North": "North Indian", "South": "South Indian", "East": "East Indian", "West": "West Indian",
              "Indo-Chinese": "Indo-Chinese", "Italian": "Italian", "Continental": "continental", "Mexican": "Mexican",
              "Thai": "Thai", "Middle Eastern": "Middle Eastern"}.get(where)
    if region:
        kind = f"a home-style {region} dish"
    elif where and where not in ("Pan-India", "Modern"):
        kind = f"a home-style dish from {where}"
    else:
        kind = "a home-style dish"
    return f"{kind} made with {ing}" if ing else kind

VESSEL = {
    "kulhad-pizza": "a wooden board, in small clay kulhad cups",
    "dubai-chocolate-bar": "a piece of parchment paper on a board",
    "biscoff-cheesecake-jar": "a small glass jar",
    "tiramisu-cups": "a small glass cup",
    "pani-puri": "a steel plate",
    "korean-cheese-corn-dog": "a piece of parchment paper on a board",
    "korean-cream-cheese-garlic-bun": "a wooden board",
}

def vessel(d, i):
    t, c = d["id"], d["category"]
    if t in VESSEL:
        return VESSEL[t]
    if any(k in t for k in ("shake", "lassi", "smoothie", "chaas")):
        return "a tall glass"
    if "pizza" in t:
        return "a wooden pizza peel, sliced"
    if any(k in t for k in ("burger", "sandwich", "bruschetta", "garlic-bread", "quesadilla")):
        return "a wooden board"
    if any(k in t for k in ("wrap", "shawarma", "roll", "burrito")) and "bowl" not in t:
        return "parchment paper on a board, cut in half to show the filling"
    if "noodles" in t or "pad-thai" in t:
        return "a deep bowl with a pair of chopsticks resting on it"
    if "pasta" in t or "lasagne" in t or "risotto" in t:
        return "a wide shallow pasta bowl"
    if "soup" in t or t == "tom-yum-soup":
        return "a soup bowl"
    if "bhel" in t:
        return "a newspaper cone placed on a plate"
    if c == "Bread":
        return ["a cloth-lined cane basket", "an iron tawa", "a brass plate"][i % 3]
    if c in ("Breakfast", "Combo Meal", "World Main") or "chilla" in t or "dosa" in t or "paratha" in t:
        return PLATES[i % len(PLATES)]
    if c in ("Rice", "One-Pot Meal"):
        return ["a copper handi", "a white ceramic bowl", "a brass plate", "a banana leaf", "a clay pot"][i % 5]
    if c == "Sweet":
        return ["a small silver bowl", "a brass katori", "a white ceramic bowl"][i % 3]
    if c in ("Snack", "Side", "World Side"):
        return [PLATES[i % len(PLATES)], BOWLS[i % len(BOWLS)]][i % 2]
    return BOWLS[i % len(BOWLS)]

def angle(d):
    t, c = d["id"], d["category"]
    if any(k in t for k in ("shake", "lassi", "smoothie", "chaas", "burger", "sandwich", "wrap", "roll", "shawarma", "burrito", "dhokla")):
        return "Shot at eye level from the side"
    if c == "Bread" or any(k in t for k in ("pizza", "salad", "thepla", "paratha", "bhakri", "roti", "thalipeeth", "chaat")):
        return "Shot from directly above as a flat lay"
    return "Shot from a 45-degree angle"

def served(v):
    on = ("plate", "board", "peel", "leaf", "tawa", "parchment")
    return ("on " if any(w in v for w in on) else "in ") + v

COLD = ("chaat", "salad", "raita", "lassi", "shake", "smoothie", "chaas", "shrikhand", "kachumber", "bhel", "fruit")

def prompt(d, i):
    name = d["name"]
    hot = not any(k in d["id"] for k in COLD + ("wrap", "roll", "shawarma", "burrito", "sandwich", "burger", "tacos", "nachos", "pizza", "bruschetta")) and d["category"] not in ("Sweet",)
    side = ""
    pw = [p for p in d.get("pairsWith", []) if p and p.lower() not in ("any",)]
    if pw and d["category"] not in ("Bread", "Side"):
        first = pw[0].lower()
        side = f" A small cup of {first} sits just behind it." if first in ("tea", "coffee", "chai") else f" A small side of {first} sits just behind it."
    skip = ("masala", "flour", "batter", "flattened", "cooked", "sauce", "paste", "powder", "seeds", "leaves", "oil", "ghee", "sugar", "salt", "water", "spices", "base", "sheets", "shells", "bread", "pav", "buns", "noodles", "pasta", "rice", "chicken", "mutton", "fish", "prawn", "egg", "paneer", "pita", "tortilla", "keema", "minced", "soya", "tofu", "khoya", "curd", "milk", "cream")
    props = [x.lower() for x in d.get("ingredients", [])[:5] if len(x) < 20 and not any(k in x.lower() for k in skip)][:2]
    prop = f" A few fresh {' and '.join(props)} are placed casually nearby, slightly out of focus." if props and d["category"] not in ("Sweet",) else ""
    diet = {"Veg": " This is a vegetarian dish: no meat, fish or egg anywhere.",
            "Egg": " No meat or fish."}.get(d["diet"], "")
    steam = " A thin wisp of steam rises from it." if hot and d["category"] not in ("Bread", "Snack") else ""
    look = looks(d)
    return (
        f"Realistic, mouth-watering food photograph of {name}: {look}. "
        f"Served {served(vessel(d, i))}, {SETTINGS[(i * 5) % len(SETTINGS)]}.{side}{prop}{steam} "
        f"{angle(d)} on a full-frame camera with a 50mm lens, shallow depth of field, "
        f"natural true-to-life colours and textures (glossy ghee or sauce, visible spices, fresh herbs), "
        f"small natural imperfections like a real home-cooked meal, inviting and appetising, not cartoonish, "
        f"not plastic-looking, not over-saturated.{diet} "
        f"Landscape 3:2 (1536 x 1024). Keep the dish in the centre with some empty space on all sides; "
        f"nothing important near the edges. No text, no labels, no logos, no hands, no people."
    )

out = root / "scripts/photo-prompts.csv"
done = set(json.loads((root / "src/data/photos.json").read_text()).keys())
with out.open("w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["Dish", "File name", "Prompt"])
    for i, d in enumerate(dishes):
        if d["id"] in done:
            continue
        w.writerow([d["name"], f"{d['id']}.jpg", prompt(d, i)])
print(f"wrote {sum(1 for _ in out.open()) - 1} prompts to {out.relative_to(root)}")
