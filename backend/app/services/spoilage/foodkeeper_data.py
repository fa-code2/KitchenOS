"""
USDA FoodKeeper Data + Common Indian Staples Shelf-Life Knowledge Base
Provides standardized baseline shelf-life values (in days) across Fridge, Pantry, and Freezer storage conditions.
"""

from typing import Dict, Any

# Category Defaults based on USDA FoodKeeper guidelines
CATEGORY_BASELINES: Dict[str, Dict[str, float]] = {
    "Produce": {"Fridge": 8.0, "Pantry": 3.0, "Freezer": 90.0},
    "Dairy": {"Fridge": 10.0, "Pantry": 0.5, "Freezer": 60.0},
    "Protein": {"Fridge": 3.0, "Pantry": 0.5, "Freezer": 120.0},
    "Bakery": {"Fridge": 7.0, "Pantry": 3.5, "Freezer": 60.0},
    "Grains": {"Fridge": 60.0, "Pantry": 180.0, "Freezer": 365.0},
    "Canned": {"Fridge": 30.0, "Pantry": 365.0, "Freezer": 365.0},
    "Beverage": {"Fridge": 14.0, "Pantry": 30.0, "Freezer": 60.0},
    "Condiment": {"Fridge": 90.0, "Pantry": 60.0, "Freezer": 180.0},
    "Other": {"Fridge": 10.0, "Pantry": 7.0, "Freezer": 90.0}
}

# USDA FoodKeeper Data + Common Indian Staples Database
# Key is lowercase substring for matching
ITEM_SHELF_LIFE_DB: Dict[str, Dict[str, Any]] = {
    # ==========================================
    # Common Indian Staples
    # ==========================================
    "paneer": {
        "name": "Paneer (Cottage Cheese)",
        "category": "Dairy",
        "Fridge": 7.0,
        "Pantry": 0.5,
        "Freezer": 90.0,
        "notes": "Keep immersed in water in fridge and change water every 2 days to maintain freshness."
    },
    "cottage cheese": {
        "name": "Cottage Cheese / Paneer",
        "category": "Dairy",
        "Fridge": 7.0,
        "Pantry": 0.5,
        "Freezer": 90.0,
        "notes": "Keep sealed and chilled."
    },
    "dal": {
        "name": "Cooked Dal (Lentil Curry)",
        "category": "Protein",
        "Fridge": 4.0,
        "Pantry": 0.5,
        "Freezer": 60.0,
        "notes": "Refrigerate within 2 hours of cooking."
    },
    "cooked dal": {
        "name": "Cooked Dal",
        "category": "Protein",
        "Fridge": 4.0,
        "Pantry": 0.5,
        "Freezer": 60.0,
        "notes": "Store in an airtight container."
    },
    "lentils": {
        "name": "Dry Lentils / Dal",
        "category": "Grains",
        "Fridge": 365.0,
        "Pantry": 365.0,
        "Freezer": 730.0,
        "notes": "Keep in an airtight jar in a cool, dark pantry."
    },
    "curd": {
        "name": "Curd / Dahi",
        "category": "Dairy",
        "Fridge": 7.0,
        "Pantry": 1.0,
        "Freezer": 30.0,
        "notes": "Naturally ferments faster at room temperature."
    },
    "dahi": {
        "name": "Dahi / Yogurt",
        "category": "Dairy",
        "Fridge": 7.0,
        "Pantry": 1.0,
        "Freezer": 30.0,
        "notes": "Sour dahi can be upcycled into kadhi or hair packs."
    },
    "atta": {
        "name": "Atta (Whole Wheat Flour)",
        "category": "Grains",
        "Fridge": 180.0,
        "Pantry": 90.0,
        "Freezer": 365.0,
        "notes": "Protect from moisture and humidity."
    },
    "dough": {
        "name": "Kneaded Atta / Dough",
        "category": "Bakery",
        "Fridge": 3.0,
        "Pantry": 0.5,
        "Freezer": 30.0,
        "notes": "Lightly oil surface and store in an airtight container."
    },
    "roti": {
        "name": "Roti / Chapati (Cooked)",
        "category": "Bakery",
        "Fridge": 3.0,
        "Pantry": 1.5,
        "Freezer": 30.0,
        "notes": "Wrap in foil or cloth."
    },
    "chapati": {
        "name": "Chapati",
        "category": "Bakery",
        "Fridge": 3.0,
        "Pantry": 1.5,
        "Freezer": 30.0,
        "notes": "Stale rotis can be converted to poha style upma or chips."
    },
    "idli batter": {
        "name": "Idli / Dosa Batter",
        "category": "Grains",
        "Fridge": 6.0,
        "Pantry": 1.0,
        "Freezer": 30.0,
        "notes": "Ferments and sours gradually after day 4."
    },
    "dosa batter": {
        "name": "Dosa Batter",
        "category": "Grains",
        "Fridge": 6.0,
        "Pantry": 1.0,
        "Freezer": 30.0,
        "notes": "Keep refrigerated to control fermentation."
    },
    "ghee": {
        "name": "Pure Desi Ghee",
        "category": "Condiment",
        "Fridge": 180.0,
        "Pantry": 180.0,
        "Freezer": 365.0,
        "notes": "Store in a dry glass jar away from sunlight."
    },
    "ginger garlic paste": {
        "name": "Ginger-Garlic Paste",
        "category": "Condiment",
        "Fridge": 30.0,
        "Pantry": 3.0,
        "Freezer": 90.0,
        "notes": "Add a pinch of salt and oil to preserve in fridge."
    },
    "green chillies": {
        "name": "Green Chillies (Hari Mirch)",
        "category": "Produce",
        "Fridge": 14.0,
        "Pantry": 4.0,
        "Freezer": 60.0,
        "notes": "Remove stems before storing in an airtight container lined with tissue."
    },
    "coriander": {
        "name": "Fresh Coriander (Dhaniya)",
        "category": "Produce",
        "Fridge": 7.0,
        "Pantry": 2.0,
        "Freezer": 30.0,
        "notes": "Wrap roots in a damp paper towel or place stems in a glass of water."
    },
    "cilantro": {
        "name": "Fresh Cilantro",
        "category": "Produce",
        "Fridge": 7.0,
        "Pantry": 2.0,
        "Freezer": 30.0,
        "notes": "Store upright in water or airtight box with dry tissue."
    },
    "curry leaves": {
        "name": "Curry Leaves (Kadi Patta)",
        "category": "Produce",
        "Fridge": 14.0,
        "Pantry": 3.0,
        "Freezer": 60.0,
        "notes": "Dry thoroughly and store in an airtight box."
    },
    "besan": {
        "name": "Besan (Gram Flour)",
        "category": "Grains",
        "Fridge": 180.0,
        "Pantry": 120.0,
        "Freezer": 365.0,
        "notes": "Keep dry and airtight."
    },
    "cooked rice": {
        "name": "Cooked Rice / Biryani / Pulao",
        "category": "Grains",
        "Fridge": 4.0,
        "Pantry": 0.5,
        "Freezer": 60.0,
        "notes": "Refrigerate quickly to avoid Bacillus cereus bacteria."
    },
    "rice": {
        "name": "Dry Basmati Rice",
        "category": "Grains",
        "Fridge": 365.0,
        "Pantry": 365.0,
        "Freezer": 730.0,
        "notes": "Dry pantry staple."
    },
    "sabzi": {
        "name": "Cooked Sabzi (Vegetables)",
        "category": "Produce",
        "Fridge": 3.5,
        "Pantry": 0.5,
        "Freezer": 45.0,
        "notes": "Refrigerate in a covered container."
    },

    # ==========================================
    # USDA FoodKeeper Data (Produce)
    # ==========================================
    "spinach": {
        "name": "Fresh Spinach / Leafy Greens",
        "category": "Produce",
        "Fridge": 5.0,
        "Pantry": 1.5,
        "Freezer": 60.0,
        "notes": "Keep moisture-free in crisper drawer."
    },
    "lettuce": {
        "name": "Lettuce / Salad Greens",
        "category": "Produce",
        "Fridge": 6.0,
        "Pantry": 1.5,
        "Freezer": 30.0,
        "notes": "Store dry in paper towel."
    },
    "tomato": {
        "name": "Tomatoes",
        "category": "Produce",
        "Fridge": 10.0,
        "Pantry": 6.0,
        "Freezer": 60.0,
        "notes": "Ripe tomatoes can be refrigerated; keep unripe at room temp."
    },
    "potato": {
        "name": "Potatoes (Raw)",
        "category": "Produce",
        "Fridge": 30.0,
        "Pantry": 28.0,
        "Freezer": 180.0,
        "notes": "Keep in a cool, dark, well-ventilated pantry away from onions."
    },
    "onion": {
        "name": "Onions (Raw)",
        "category": "Produce",
        "Fridge": 30.0,
        "Pantry": 30.0,
        "Freezer": 180.0,
        "notes": "Store in a cool, dry place with good air circulation."
    },
    "garlic": {
        "name": "Garlic (Whole)",
        "category": "Produce",
        "Fridge": 60.0,
        "Pantry": 90.0,
        "Freezer": 180.0,
        "notes": "Do not refrigerate whole unpeeled bulbs; store at room temp."
    },
    "ginger": {
        "name": "Fresh Ginger Root",
        "category": "Produce",
        "Fridge": 28.0,
        "Pantry": 14.0,
        "Freezer": 180.0,
        "notes": "Can be frozen whole and grated while frozen."
    },
    "banana": {
        "name": "Bananas",
        "category": "Produce",
        "Fridge": 5.0,
        "Pantry": 5.0,
        "Freezer": 60.0,
        "notes": "Skin darkens in fridge but fruit remains firm."
    },
    "apple": {
        "name": "Apples",
        "category": "Produce",
        "Fridge": 28.0,
        "Pantry": 14.0,
        "Freezer": 180.0,
        "notes": "Store in crisper drawer to maintain crunch."
    },
    "avocado": {
        "name": "Avocados",
        "category": "Produce",
        "Fridge": 7.0,
        "Pantry": 4.0,
        "Freezer": 60.0,
        "notes": "Refrigerate once fully ripe to halt over-ripening."
    },
    "berries": {
        "name": "Fresh Berries / Strawberries",
        "category": "Produce",
        "Fridge": 4.0,
        "Pantry": 1.0,
        "Freezer": 180.0,
        "notes": "Do not wash until immediately prior to consumption."
    },
    "strawberry": {
        "name": "Strawberries",
        "category": "Produce",
        "Fridge": 4.0,
        "Pantry": 1.0,
        "Freezer": 180.0,
        "notes": "Keep dry and stem intact."
    },
    "carrot": {
        "name": "Carrots",
        "category": "Produce",
        "Fridge": 21.0,
        "Pantry": 7.0,
        "Freezer": 180.0,
        "notes": "Trim leafy tops before storing."
    },
    "broccoli": {
        "name": "Broccoli",
        "category": "Produce",
        "Fridge": 7.0,
        "Pantry": 2.0,
        "Freezer": 180.0,
        "notes": "Keep loose in perforated bag."
    },
    "lemon": {
        "name": "Lemons & Limes",
        "category": "Produce",
        "Fridge": 28.0,
        "Pantry": 10.0,
        "Freezer": 90.0,
        "notes": "Crisper drawer preserves juiciness."
    },
    "orange": {
        "name": "Oranges / Citrus",
        "category": "Produce",
        "Fridge": 21.0,
        "Pantry": 10.0,
        "Freezer": 90.0,
        "notes": "Peels can be upcycled into all-natural vinegar cleaner."
    },
    "cucumber": {
        "name": "Cucumber",
        "category": "Produce",
        "Fridge": 7.0,
        "Pantry": 3.0,
        "Freezer": 30.0,
        "notes": "Sensitive to chilling injury below 10°C; wrap in paper."
    },
    "capsicum": {
        "name": "Bell Pepper / Capsicum",
        "category": "Produce",
        "Fridge": 10.0,
        "Pantry": 4.0,
        "Freezer": 90.0,
        "notes": "Store dry in crisper drawer."
    },
    "mushroom": {
        "name": "Mushrooms",
        "category": "Produce",
        "Fridge": 6.0,
        "Pantry": 1.5,
        "Freezer": 60.0,
        "notes": "Store in a breathable brown paper bag."
    },

    # ==========================================
    # USDA FoodKeeper Data (Dairy & Eggs)
    # ==========================================
    "milk": {
        "name": "Milk (Pasteurized)",
        "category": "Dairy",
        "Fridge": 7.0,
        "Pantry": 0.5,
        "Freezer": 30.0,
        "notes": "Keep on inner fridge shelf, not door shelf."
    },
    "yogurt": {
        "name": "Yogurt",
        "category": "Dairy",
        "Fridge": 14.0,
        "Pantry": 0.5,
        "Freezer": 45.0,
        "notes": "Keep tightly sealed."
    },
    "cheese": {
        "name": "Cheddar / Hard Cheese",
        "category": "Dairy",
        "Fridge": 28.0,
        "Pantry": 2.0,
        "Freezer": 180.0,
        "notes": "Wrap tightly in wax paper or airtight container."
    },
    "butter": {
        "name": "Butter",
        "category": "Dairy",
        "Fridge": 60.0,
        "Pantry": 5.0,
        "Freezer": 180.0,
        "notes": "Freeze extra sticks until needed."
    },
    "eggs": {
        "name": "Eggs (Raw Shell)",
        "category": "Dairy",
        "Fridge": 30.0,
        "Pantry": 10.0,
        "Freezer": 120.0,
        "notes": "Store in original carton on main shelf."
    },

    # ==========================================
    # USDA FoodKeeper Data (Proteins & Meats)
    # ==========================================
    "chicken": {
        "name": "Chicken (Raw)",
        "category": "Protein",
        "Fridge": 2.5,
        "Pantry": 0.2,
        "Freezer": 180.0,
        "notes": "Cook or freeze within 2 days of purchase."
    },
    "beef": {
        "name": "Beef (Raw Steak / Roast)",
        "category": "Protein",
        "Fridge": 4.0,
        "Pantry": 0.2,
        "Freezer": 180.0,
        "notes": "Freeze if not cooking within 3-4 days."
    },
    "salmon": {
        "name": "Salmon / Fresh Fish",
        "category": "Protein",
        "Fridge": 2.0,
        "Pantry": 0.2,
        "Freezer": 90.0,
        "notes": "Highly perishable; store on ice or coldest shelf."
    },
    "fish": {
        "name": "White Fish / Seafood",
        "category": "Protein",
        "Fridge": 2.0,
        "Pantry": 0.2,
        "Freezer": 90.0,
        "notes": "Consume promptly."
    },
    "tofu": {
        "name": "Tofu",
        "category": "Protein",
        "Fridge": 7.0,
        "Pantry": 0.5,
        "Freezer": 90.0,
        "notes": "Change soaking water daily after opening."
    },

    # ==========================================
    # USDA FoodKeeper Data (Bakery, Grains, Pantry)
    # ==========================================
    "bread": {
        "name": "Sliced Bread",
        "category": "Bakery",
        "Fridge": 7.0,
        "Pantry": 4.0,
        "Freezer": 90.0,
        "notes": "Freeze slices directly; toast directly from frozen."
    },
    "sourdough": {
        "name": "Artisan Sourdough",
        "category": "Bakery",
        "Fridge": 8.0,
        "Pantry": 5.0,
        "Freezer": 90.0,
        "notes": "Stale crusts make premier croutons."
    },
    "pasta": {
        "name": "Dry Pasta",
        "category": "Grains",
        "Fridge": 365.0,
        "Pantry": 365.0,
        "Freezer": 730.0,
        "notes": "Keep dry."
    },
    "oats": {
        "name": "Rolled Oats",
        "category": "Grains",
        "Fridge": 180.0,
        "Pantry": 180.0,
        "Freezer": 365.0,
        "notes": "Store in an airtight jar."
    },
    "olive oil": {
        "name": "Olive Oil / Cooking Oil",
        "category": "Condiment",
        "Fridge": 180.0,
        "Pantry": 180.0,
        "Freezer": 365.0,
        "notes": "Store away from heat and direct sunlight."
    }
}
