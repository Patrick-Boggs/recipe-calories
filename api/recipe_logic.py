"""
Recipe Calorie Calculator — Backend Logic
Extracted from the original recipe_calculator.py (lines 1-799).

All parsing, conversion, and USDA lookup logic is preserved unchanged.
"""

import json
import os
import re
from fractions import Fraction

import pint
import cloudscraper
import requests
from ingredient_parser import parse_ingredient
from bs4 import BeautifulSoup
from recipe_scrapers import scrape_html

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

USDA_BASE = "https://api.nal.usda.gov/fdc/v1"
# Nutrient numbers for Energy in kcal (varies by data type)
# 208 = SR Legacy, 957/958 = Foundation (Atwater factors)
ENERGY_NUTRIENT_NUMBERS = ("208", "957", "958")

# Unit registry shared across the app
UREG = pint.UnitRegistry()

# Grams per 1 US cup for common ingredients (used for volume -> weight).
DENSITY_G_PER_CUP = {
    "flour": 120,
    "all-purpose flour": 120,
    "all purpose flour": 120,
    "bread flour": 127,
    "whole wheat flour": 120,
    "cake flour": 114,
    "sugar": 200,
    "granulated sugar": 200,
    "brown sugar": 220,
    "powdered sugar": 120,
    "confectioners sugar": 120,
    "butter": 227,
    "oil": 218,
    "olive oil": 216,
    "vegetable oil": 218,
    "canola oil": 218,
    "coconut oil": 218,
    "water": 237,
    "milk": 244,
    "whole milk": 244,
    "skim milk": 245,
    "buttermilk": 245,
    "heavy cream": 238,
    "sour cream": 230,
    "yogurt": 245,
    "cream cheese": 232,
    "oats": 90,
    "rolled oats": 90,
    "cocoa powder": 85,
    "cocoa": 85,
    "breadcrumbs": 108,
    "rice": 185,
    "white rice": 185,
    "brown rice": 190,
    "honey": 340,
    "maple syrup": 312,
    "corn syrup": 328,
    "molasses": 328,
    "peanut butter": 258,
    "almond flour": 96,
    "cornstarch": 128,
    "corn starch": 128,
    "cornmeal": 156,
    "salt": 288,
    "baking powder": 230,
    "baking soda": 230,
    "chocolate chips": 168,
    "raisins": 145,
    "walnuts": 120,
    "pecans": 109,
    "almonds": 143,
    "shredded coconut": 85,
    "parmesan cheese": 100,
    "cheddar cheese": 113,
    "mozzarella cheese": 113,
    "ricotta cheese": 246,
    "mayonnaise": 220,
    "ketchup": 240,
    "soy sauce": 255,
    "vinegar": 239,
    "lemon juice": 244,
    "tomato sauce": 245,
    "tomato paste": 262,
    "applesauce": 244,
    "pumpkin puree": 245,
    "coconut milk": 226,
    "coconut cream": 240,
    "tahini": 240,
    "miso paste": 275,
    "hot sauce": 240,
    "barbecue sauce": 280,
}

# ML per US cup (for density math)
ML_PER_CUP = 236.588


# Typical weight in grams for count-based ingredients (per item).
# Entries can be a single number or a dict with size keys.
# Values are based on USDA standard reference weights.
WEIGHT_PER_ITEM = {
    "egg": {"small": 40, "medium": 44, "large": 50, "extra-large": 56, "default": 50},
    "eggs": {"small": 40, "medium": 44, "large": 50, "extra-large": 56, "default": 50},
    "onion": {"small": 110, "medium": 150, "large": 285, "default": 150},
    "garlic": 3,        # per clove
    "ginger": 6,        # per inch-piece
    "shallot": 30,
    "carrot": {"small": 50, "medium": 61, "large": 72, "default": 61},
    "celery": 40,       # per stalk
    "potato": {"small": 170, "medium": 213, "large": 369, "default": 213},
    "sweet potato": {"small": 60, "medium": 114, "large": 180, "default": 114},
    "tomato": {"small": 91, "medium": 123, "large": 182, "default": 123},
    "bell pepper": 119,
    "bell peppers": 119,
    "jalapeno": 14,
    "jalapeno pepper": 14,
    "serrano pepper": 6,
    "banana": {"small": 101, "medium": 118, "large": 136, "default": 118},
    "apple": {"small": 149, "medium": 182, "large": 223, "default": 182},
    "lemon": 58,
    "lime": 44,
    "orange": {"small": 96, "medium": 131, "large": 184, "default": 131},
    "avocado": 150,
    "cucumber": 201,
    "zucchini": {"small": 113, "medium": 196, "large": 323, "default": 196},
    "green onion": 15,
    "green onions": 15,
    "scallion": 15,
    "scallions": 15,
    "cilantro": 5,      # per handful/sprig
    "parsley": 5,
    "basil": 3,         # per sprig
    "bay leaf": 1,
    "bay leaves": 1,
    "chicken breast": 174,    # one boneless skinless half-breast (USDA)
    "chicken thigh": 113,     # one boneless skinless thigh
    "chicken drumstick": 95,  # one drumstick
    "chicken wing": 49,       # one wing
    "chicken leg": 264,       # one whole leg (thigh + drumstick, bone-in skin-on, USDA)
    "bread": 30,        # per slice
    "tortilla": 45,
}

# Known kcal per 100g for ingredients that USDA search often mismatches.
# Salt, water, and similar zero/near-zero calorie items are included here
# so we don't rely on a text search that returns "Butter, salted" for "salt".
KNOWN_KCAL_PER_100G = {
    "salt": 0,
    "sea salt": 0,
    "kosher salt": 0,
    "table salt": 0,
    "water": 0,
    "ice": 0,
    "black pepper": 251,
    "red pepper": 31,
    "green pepper": 20,
    "cayenne pepper": 318,
    "chili pepper": 40,
    "jalapeno pepper": 29,
    "vanilla extract": 288,
    "vanilla": 288,
    "baking soda": 0,
    "baking powder": 53,
    "nutmeg": 525,
    "cinnamon": 247,
    "garlic": 149,
    "ginger": 80,
    "butter": 717,
    "unsalted butter": 717,
    "salted butter": 717,
    "egg": 155,
    "eggs": 155,
    "lemon juice": 22,
    "lime juice": 25,
    "soy sauce": 53,
    "vinegar": 18,
    "apple cider vinegar": 22,
    "worcestershire sauce": 78,
    "carrot": 41,
    "carrots": 41,
    "celery": 14,
    "onion": 40,
    "potato": 77,
    "potatoes": 77,
    "sweet potato": 86,
    "tomato": 18,
    "tomatoes": 18,
    "bell pepper": 31,
    "bell peppers": 31,
    "broccoli": 34,
    "spinach": 23,
    "zucchini": 17,
    "cucumber": 15,
    "mushroom": 22,
    "mushrooms": 22,
    "cabbage": 25,
    "cauliflower": 25,
    "green beans": 31,
    "peas": 81,
    "corn": 86,
    "rice": 130,
    "white rice": 130,
    "brown rice": 112,
    "pasta": 131,
    "chicken breast": 165,
    "chicken thigh": 209,
    "chicken": 239,
    "ground beef": 254,
    "salmon": 208,
    "shrimp": 99,
    "tofu": 76,
    "chickpeas": 164,
    "black beans": 132,
    "lentils": 116,
    "black lentils": 116,
    "chicken broth": 4,
    "chicken stock": 7,
    "beef broth": 7,
    "beef stock": 13,
    "vegetable broth": 3,
    "vegetable stock": 5,
    "broth": 5,            # generic broth fallback
    "bone broth": 13,
    "coconut milk": 230,
    "cream cheese": 342,
    "sour cream": 198,
    "heavy cream": 340,
    "whipped cream": 257,
    "olive oil": 884,
    "vegetable oil": 884,
    "coconut oil": 862,
    "sesame oil": 884,
    "flour": 364,
    "all-purpose flour": 364,
    "whole wheat flour": 340,
    "bread flour": 361,
    "sugar": 387,
    "brown sugar": 380,
    "powdered sugar": 389,
    "honey": 304,
    "maple syrup": 260,
    "oats": 389,
    "cocoa powder": 228,
    "cornstarch": 381,
    "corn starch": 381,
    "bay leaf": 313,
    "bay leaves": 313,
    "peppercorn": 251,
    "peppercorns": 251,
    "pork": 242,
    "pork shoulder": 216,
    "pork belly": 518,
    "short ribs": 295,
    "coriander": 23,       # fresh leaves (cilantro), USDA
    "cilantro": 23,        # same as coriander leaves
    "pappardelle": 371,    # dry pasta
    "papardelle": 371,     # alternate spelling
    "ras el hanout": 285,  # Moroccan spice blend, approximate
    "ground ginger": 335,  # dried/ground ginger, USDA
    "pancetta": 393,       # cured pork belly
    "swiss chard": 19,
    "chard": 19,
    "white beans": 114,    # cooked/canned
    "cannellini beans": 114,
    "puff pastry": 558,    # frozen, ready-to-bake
    "pie dough": 366,
    "pie crust": 366,
}

# ---------------------------------------------------------------------------
# Backend functions
# ---------------------------------------------------------------------------


def _fallback_scrape_html(html):
    """Extract recipe data from plain HTML when no Recipe schema is found.

    Looks for ingredient-like <li> elements (lines starting with a number,
    fraction, or common quantity word) and extracts the title from <h1>.
    """
    soup = BeautifulSoup(html, "html.parser")

    # Prefer <title> (strip common " — Site Name" / " | Site Name" suffixes),
    # then fall back to the first <h1> or <h2>.
    title = None
    title_tag = soup.find("title")
    if title_tag:
        raw_title = title_tag.get_text(strip=True)
        # Strip trailing " — Site", " | Site", " - Site" suffixes
        title = re.split(r"\s*(?:\u2014|\||[-\u2013])\s*(?!.*(?:\u2014|\||[-\u2013]))", raw_title, maxsplit=1)[0].strip()
    if not title:
        for tag_name in ("h1", "h2"):
            tag = soup.find(tag_name)
            if tag:
                title = tag.get_text(strip=True)
                break
    if not title:
        title = "Unknown Recipe"

    # Gather all <li> text and keep those that look like ingredients
    _ingredient_re = re.compile(
        r"^[\d\u00BC-\u00BE\u2150-\u215E]"  # starts with digit or unicode fraction
        r"|^(a |one |two |three |four |half )",  # or common quantity words
        re.IGNORECASE,
    )
    ingredients = []
    for li in soup.find_all("li"):
        text = li.get_text(" ", strip=True)
        if text and _ingredient_re.search(text):
            ingredients.append(text)

    # Also try <p> tags with <br>-separated lines (some sites like Smitten
    # Kitchen put ingredients in a single <p> with <br> instead of <li>).
    # If this finds more ingredient-like lines, prefer it over the <li> scan.
    best_p_lines = []
    for p_tag in soup.find_all("p"):
        brs = p_tag.find_all("br")
        if len(brs) < 2:
            continue
        lines = [s.strip() for s in p_tag.stripped_strings if s.strip()]
        matches = [l for l in lines if _ingredient_re.search(l)]
        if len(matches) > len(best_p_lines):
            best_p_lines = matches
    if len(best_p_lines) > len(ingredients):
        ingredients = best_p_lines

    # Look for a servings mention near the recipe
    servings_text = None
    for tag in soup.find_all(string=re.compile(r"serv|portion|yield", re.IGNORECASE)):
        match = re.search(r"(\d+)\s*(?:servings?|portions?)", tag, re.IGNORECASE)
        if match:
            servings_text = match.group(0)
            break

    # Extract instructions: look for <ol> with multiple <li>, or long <p> blocks
    # that read like preparation steps (sentences, not ingredient lines).
    instructions = []
    # Strategy 1: ordered list items (most structured recipe sites)
    for ol in soup.find_all("ol"):
        items = [li.get_text(" ", strip=True) for li in ol.find_all("li")]
        if len(items) > len(instructions):
            instructions = items
    # Strategy 2: <p> tags that look like prose steps (long sentences, verbs)
    if not instructions:
        _step_re = re.compile(
            r"\b(heat|preheat|cook|bake|stir|add|combine|mix|whisk|fold|place|"
            r"pour|bring|simmer|boil|reduce|remove|let|set|serve|season|toss|"
            r"transfer|cover|drain|slice|chop|cut|spread|layer|roll|brush)\b",
            re.IGNORECASE,
        )
        for p_tag in soup.find_all("p"):
            text = p_tag.get_text(" ", strip=True)
            # Must be a real sentence (>40 chars) and contain a cooking verb
            if len(text) > 40 and _step_re.search(text):
                # Skip if it looks like an ingredient line
                if not _ingredient_re.search(text):
                    instructions.append(text)

    return title, servings_text, ingredients, instructions


def scrape_recipe(url):
    """Fetch and parse a recipe from a URL.

    Returns dict with title, servings (int), and ingredients (list of str).
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }
    resp = requests.get(url, headers=headers, timeout=15)
    if resp.status_code == 403:
        # Cloudflare-protected site — retry with cloudscraper
        scraper_session = cloudscraper.create_scraper()
        resp = scraper_session.get(url, timeout=15)
    resp.raise_for_status()

    try:
        scraper = scrape_html(resp.text, org_url=url)
    except Exception:
        try:
            # Site not directly supported - try generic mode (reads JSON-LD / microdata)
            scraper = scrape_html(resp.text, org_url=url, supported_only=False)
        except Exception:
            scraper = None

    title = ingredients = yields_str = None
    if scraper:
        try:
            title = scraper.title()
            yields_str = scraper.yields()
            ingredients = scraper.ingredients()
        except Exception:
            scraper = None

    if not scraper or not ingredients:
        # No schema found — fall back to plain HTML extraction
        title, yields_str, ingredients, _instructions = _fallback_scrape_html(resp.text)

    servings = _parse_servings(yields_str)

    return {
        "title": title,
        "servings": servings,
        "ingredients": ingredients,
    }


def _parse_servings(yields_str):
    """Extract an integer serving count from strings like '24 servings'."""
    if not yields_str:
        return None
    match = re.search(r"(\d+)", str(yields_str))
    return int(match.group(1)) if match else None


def _simplify_alternatives(raw):
    """Simplify 'A or B' ingredient alternatives to just the first option.

    '2 large or 3 medium carrots' -> '2 large carrots'
    '1 cup milk or cream' -> '1 cup milk' (already handled by name cleaning)
    """
    # Match: "NUMBER [words] or NUMBER [words] INGREDIENT"
    match = re.match(
        r"^(\d[\d/.\s]*\S+)\s+or\s+\d[\d/.\s]*\S+\s+(.+)$", raw, re.IGNORECASE
    )
    if match:
        return f"{match.group(1)} {match.group(2)}"
    return raw


UNIT_NORMALIZATIONS = [
    (r"\blb's\b", "lbs"),
    (r"\boz's\b", "oz"),
    (r"\btblsp\b", "tbsp"),
    (r"\btbls\b", "tbsp"),
    (r"\btsps?\.\b", "tsp"),
    (r"\btbsps?\.\b", "tbsp"),
]


def _normalize_raw_ingredient(raw):
    """Fix common unit typos/variants before parsing."""
    # Normalize smart quotes/curly apostrophes to plain apostrophe
    result = raw.replace("\u2019", "'").replace("\u2018", "'")
    # Fix broken hyphens from HTML line-breaks: "sodium- free" → "sodium-free"
    result = re.sub(r"(\w)- (\w)", r"\1-\2", result)
    for pattern, replacement in UNIT_NORMALIZATIONS:
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
    # Strip parenthetical conversion notes: "(115 grams or 3/4 cup)" etc.
    result = re.sub(
        r"\s*\([^)]*(?:grams?|oz|ounces?|cups?|ml|liters?|litres?|lbs?|pounds?|kg|inch|inches|cm)\b[^)]*\)",
        "", result, flags=re.IGNORECASE,
    )
    result = re.sub(r"  +", " ", result).strip()
    # "1 x 400g can ..." → "400g ..."  (multiply out the N × weight)
    match = re.match(
        r"^(\d+)\s*x\s*(\d+)\s*(g|kg|oz|lb|lbs|ml|l)\b\s*(?:can|cans|tin|tins|bag|bags|box|boxes|packet|packets|package|packages|jar|jars|bottle|bottles|carton|cartons|pouch|pouches)?\s*(.*)$",
        result,
        re.IGNORECASE,
    )
    if match:
        multiplier = int(match.group(1))
        weight = int(match.group(2)) * multiplier
        unit = match.group(3)
        rest = match.group(4)
        result = f"{weight} {unit} {rest}".strip()
    # "1 extra-large (about 2 1/2 cups onion, diced)" → "2 1/2 cups onion, diced"
    match = re.match(r"^\d[\d\s/]*\S+\s+\(about\s+(.+)\)\s*$", result, re.IGNORECASE)
    if match:
        result = match.group(1)
    return result


def parse_ingredient_string(raw):
    """Parse a raw ingredient string into structured data.

    Returns dict with keys: raw, name, amounts (list of (quantity, unit) tuples).
    Handles both simple amounts and composite amounts like "2 cups plus 2 tbsp".
    """
    simplified = _simplify_alternatives(raw)
    normalized = _normalize_raw_ingredient(simplified)
    try:
        result = parse_ingredient(normalized)
    except Exception:
        return {"raw": raw, "name": raw, "size": None, "amounts": []}

    name = result.name[0].text if result.name else raw
    size = result.size.text.lower() if result.size else None

    amounts = []
    for amt in result.amount:
        # CompositeIngredientAmount has an 'amounts' list of sub-amounts
        if hasattr(amt, "amounts"):
            for sub in amt.amounts:
                if sub.quantity:
                    try:
                        amounts.append((float(Fraction(sub.quantity)), sub.unit))
                    except (ValueError, ZeroDivisionError):
                        pass
        else:
            if amt.quantity:
                try:
                    amounts.append((float(Fraction(amt.quantity)), amt.unit))
                except (ValueError, ZeroDivisionError):
                    pass

    return {"raw": raw, "name": name, "size": size, "amounts": amounts}


def _lookup_density(ingredient_name):
    """Find grams-per-ml for an ingredient using the density table.

    Uses word-boundary matching and prefers the longest matching key
    so "salted butter" matches "butter" (not "salt") and "rice flour"
    matches "flour" (not "rice").

    Returns grams per ml, or None if not found.
    """
    name_lower = ingredient_name.lower()
    best_key = None
    best_len = 0
    for key in DENSITY_G_PER_CUP:
        if re.search(r"\b" + re.escape(key) + r"\b", name_lower):
            if len(key) > best_len:
                best_key = key
                best_len = len(key)
    if best_key is None:
        return None
    return DENSITY_G_PER_CUP[best_key] / ML_PER_CUP


def _is_weight_unit(unit):
    """Check if a pint Unit is a weight/mass unit."""
    try:
        (1 * unit).to(UREG.gram)
        return True
    except (pint.DimensionalityError, Exception):
        return False


def _is_volume_unit(unit):
    """Check if a pint Unit is a volume unit."""
    try:
        (1 * unit).to(UREG.milliliter)
        return True
    except (pint.DimensionalityError, Exception):
        return False


def _lookup_item_weight(ingredient_name, size=None):
    """Look up grams per item from the WEIGHT_PER_ITEM table.

    Prefers the longest matching key so "green onions" matches before "onion".
    Returns grams per item, or None if not found.
    """
    name_lower = ingredient_name.lower()
    best_key = None
    best_len = 0
    for key in WEIGHT_PER_ITEM:
        # Only match if the table key appears inside the ingredient name
        # (e.g., "onion" in "medium onion"), not the reverse
        if key in name_lower:
            if len(key) > best_len:
                best_key = key
                best_len = len(key)
    if best_key is None:
        return None
    value = WEIGHT_PER_ITEM[best_key]
    if isinstance(value, dict):
        return value.get(size, value.get("default"))
    return value


def convert_to_grams(quantity, unit, ingredient_name, size=None):
    """Convert a quantity+unit into grams.

    Returns (grams, note_string) or (None, reason_string).
    """
    if unit is None or unit == "":
        # No unit - try per-item weight table (e.g., "1 medium onion")
        item_g = _lookup_item_weight(ingredient_name, size)
        if item_g is not None:
            return round(quantity * item_g, 1), "estimated per-item weight"
        return None, "no unit (count-based ingredient)"

    # Normalize unit to a pint Unit object (handles both strings and pint Units)
    try:
        if isinstance(unit, str):
            pint_unit = UREG.parse_expression(unit.lower())
        else:
            pint_unit = unit
    except Exception:
        # Not a recognized unit (e.g., "can", "cloves", "piece")
        item_g = _lookup_item_weight(ingredient_name, size)
        if item_g is not None:
            return round(quantity * item_g, 1), "estimated per-item weight"
        return None, f"unrecognized unit: {unit}"

    if _is_weight_unit(pint_unit):
        grams = (quantity * pint_unit).to(UREG.gram).magnitude
        return round(grams, 1), "weight conversion"

    if _is_volume_unit(pint_unit):
        ml = (quantity * pint_unit).to(UREG.milliliter).magnitude
        density = _lookup_density(ingredient_name)
        if density is not None:
            grams = ml * density
            return round(grams, 1), "density lookup"
        else:
            # Fallback: use water density (1 g/ml)
            grams = ml * 1.0
            return round(grams, 1), "approximate (water density used)"

    # Dimensionless or other — try per-item weight
    item_g = _lookup_item_weight(ingredient_name, size)
    if item_g is not None:
        return round(quantity * item_g, 1), "estimated per-item weight"
    return None, f"unrecognized unit: {unit}"


def _clean_ingredient_name(name):
    """Strip recipe jargon from an ingredient name for a better USDA search.

    Removes adjectives like 'cold', 'fresh', 'well-shaken', and extra clauses
    like 'or whole milk', 'for garnish', 'plus more for rolling'.
    """
    cleaned = name.lower()
    # Remove everything after "or ", "for ", "plus more"
    for splitter in [" or ", " for ", " plus more", ", plus "]:
        cleaned = cleaned.split(splitter)[0]
    # Remove common recipe adjectives that confuse USDA search
    remove_words = [
        "cold", "warm", "hot", "room temperature", "at room temperature",
        "freshly", "fresh", "well-shaken", "well shaken",
        "finely", "fine", "coarsely", "roughly", "thinly",
        "unsalted", "salted", "softened", "melted", "frozen", "thawed",
        "unbleached", "bleached", "sifted", "packed",
        "large", "medium", "small", "extra-large",
        "grated", "shredded", "chopped", "diced", "minced", "sliced",
        # Dietary / label adjectives that obscure the base ingredient
        "low-sodium", "sodium-free", "no-salt-added",
        "low-fat", "reduced-fat", "full-fat", "nonfat", "fat-free",
        "organic", "boneless", "skinless",
    ]
    for word in remove_words:
        cleaned = re.sub(r"\b" + re.escape(word) + r"\b", "", cleaned)
    # Collapse whitespace and strip
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" ,")
    return cleaned


def _extract_energy_kcal(food):
    """Extract energy in kcal from a USDA food result.

    Checks multiple nutrient numbers (208 for SR Legacy, 957/958 for Foundation).
    Returns kcal value or None.
    """
    for nutrient in food.get("foodNutrients", []):
        num = str(nutrient.get("nutrientNumber", ""))
        unit = str(nutrient.get("unitName", "")).upper()
        if num in ENERGY_NUTRIENT_NUMBERS and unit == "KCAL":
            return float(nutrient["value"])
    return None


def _check_known_calories(name):
    """Check the built-in calorie table for common ingredients.

    Returns (kcal_per_100g, description) or (None, None).
    """
    name_lower = name.lower().strip()
    # Exact match first
    if name_lower in KNOWN_KCAL_PER_100G:
        return KNOWN_KCAL_PER_100G[name_lower], f"{name} (built-in value)"
    # Word-boundary match, prefer longest key
    best_key = None
    best_len = 0
    for key, kcal in KNOWN_KCAL_PER_100G.items():
        if re.search(r"\b" + re.escape(key) + r"\b", name_lower):
            if len(key) > best_len:
                best_key = key
                best_len = len(key)
    if best_key is not None:
        return KNOWN_KCAL_PER_100G[best_key], f"{best_key} (built-in value)"
    return None, None


def search_usda_calories(ingredient_name, api_key):
    """Search the USDA FoodData Central API for calorie info.

    Returns (kcal_per_100g, matched_food_name) or (None, reason_string).
    """
    cleaned = _clean_ingredient_name(ingredient_name)

    # Check built-in table first (avoids USDA mismatches for salt, etc.)
    known_kcal, known_desc = _check_known_calories(cleaned)
    if known_kcal is not None:
        return known_kcal, known_desc

    url = f"{USDA_BASE}/foods/search"
    params = {
        "api_key": api_key,
        "query": cleaned,
        "dataType": "SR Legacy,Foundation",
        "pageSize": 5,
    }
    resp = requests.get(url, params=params, timeout=10)

    if resp.status_code == 403:
        raise ValueError("Invalid USDA API key. Please check your key.")
    if resp.status_code == 429:
        raise ValueError("USDA API rate limit reached (1000/hour). Try again later.")
    if resp.status_code == 400:
        return None, "USDA search failed (bad query)"
    if not resp.ok:
        return None, f"USDA API error (HTTP {resp.status_code})"

    data = resp.json()
    foods = data.get("foods", [])

    if not foods:
        return None, "not found in USDA database"

    # Check all returned foods for one with energy data
    for food in foods:
        kcal = _extract_energy_kcal(food)
        if kcal is not None:
            return kcal, food["description"]

    return None, "energy data missing from USDA result"


def calculate_ingredient_calories(parsed, api_key):
    """Full pipeline for one ingredient: parse -> convert -> lookup -> compute."""
    result = {
        "raw": parsed["raw"],
        "name": parsed["name"],
        "amounts": parsed["amounts"],
        "grams": None,
        "kcal_per_100g": None,
        "total_kcal": None,
        "usda_match": None,
        "status": "ok",
        "note": "",
    }

    if not parsed["amounts"]:
        result["status"] = "skipped"
        result["note"] = "no quantity found"
        return result

    # Convert all amounts to grams and sum them.
    # Handles composite amounts ("2 cups plus 2 tbsp") and multiple amounts
    # ("1 can", "14 ounces") by skipping unconvertible ones and using the rest.
    total_grams = 0
    notes = []
    converted_any = False
    for quantity, unit in parsed["amounts"]:
        grams, method = convert_to_grams(quantity, unit, parsed["name"], parsed.get("size"))
        if grams is None:
            # Skip this amount but try others (e.g., skip "1 can", use "14 oz")
            continue
        total_grams += grams
        converted_any = True
        if "approximate" in method or "estimated" in method:
            notes.append(method)

    if not converted_any:
        result["status"] = "skipped"
        result["note"] = "could not convert any amounts to grams"
        return result

    result["grams"] = round(total_grams, 1)
    if notes:
        result["note"] = notes[0]

    kcal_per_100g, usda_match = search_usda_calories(parsed["name"], api_key)

    if kcal_per_100g is None:
        result["status"] = "not found"
        result["note"] = usda_match
        return result

    result["kcal_per_100g"] = round(kcal_per_100g, 1)
    result["total_kcal"] = round((total_grams / 100.0) * kcal_per_100g, 1)
    result["usda_match"] = usda_match
    return result


def calculate_recipe(url, api_key, progress_callback=None):
    """Top-level function: scrape URL, calculate calories for all ingredients."""
    recipe = scrape_recipe(url)
    ingredients_raw = recipe["ingredients"]
    total = len(ingredients_raw)
    results = []

    for i, raw in enumerate(ingredients_raw):
        if progress_callback:
            progress_callback(i + 1, total, raw[:60])

        parsed = parse_ingredient_string(raw)
        result = calculate_ingredient_calories(parsed, api_key)
        results.append(result)

    total_kcal = sum(r["total_kcal"] for r in results if r["total_kcal"])
    servings = recipe["servings"]
    per_serving = round(total_kcal / servings, 1) if servings else None

    return {
        "title": recipe["title"],
        "servings": servings,
        "total_kcal": round(total_kcal, 1),
        "per_serving": per_serving,
        "ingredients": results,
    }
