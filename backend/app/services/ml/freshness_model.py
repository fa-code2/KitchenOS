import os
from datetime import datetime
from typing import Dict, Any, Tuple

# Baseline shelf lives in days by category and storage location
BASELINE_SHELF_LIFE: Dict[str, Dict[str, int]] = {
    "Produce": {"Fridge": 9, "Pantry": 4, "Freezer": 90},
    "Dairy": {"Fridge": 14, "Pantry": 1, "Freezer": 60},
    "Protein": {"Fridge": 4, "Pantry": 1, "Freezer": 120},
    "Bakery": {"Fridge": 7, "Pantry": 4, "Freezer": 60},
    "Grains": {"Fridge": 60, "Pantry": 180, "Freezer": 365},
    "Canned": {"Fridge": 30, "Pantry": 365, "Freezer": 365},
    "Beverage": {"Fridge": 14, "Pantry": 30, "Freezer": 60},
    "Condiment": {"Fridge": 90, "Pantry": 60, "Freezer": 180},
    "Other": {"Fridge": 14, "Pantry": 14, "Freezer": 90}
}

# Specific ingredient overrides (name lowercase match)
ITEM_SPECIFIC_DAYS: Dict[str, Dict[str, int]] = {
    "spinach": {"Fridge": 5, "Pantry": 2, "Freezer": 60},
    "lettuce": {"Fridge": 6, "Pantry": 2, "Freezer": 30},
    "milk": {"Fridge": 7, "Pantry": 1, "Freezer": 30},
    "yogurt": {"Fridge": 14, "Pantry": 1, "Freezer": 45},
    "chicken": {"Fridge": 3, "Pantry": 1, "Freezer": 180},
    "beef": {"Fridge": 4, "Pantry": 1, "Freezer": 180},
    "fish": {"Fridge": 2, "Pantry": 1, "Freezer": 90},
    "salmon": {"Fridge": 2, "Pantry": 1, "Freezer": 90},
    "banana": {"Fridge": 5, "Pantry": 5, "Freezer": 60},
    "apple": {"Fridge": 28, "Pantry": 14, "Freezer": 180},
    "avocado": {"Fridge": 7, "Pantry": 4, "Freezer": 60},
    "tomato": {"Fridge": 10, "Pantry": 5, "Freezer": 60},
    "bread": {"Fridge": 7, "Pantry": 4, "Freezer": 90},
    "eggs": {"Fridge": 30, "Pantry": 10, "Freezer": 120},
    "cheese": {"Fridge": 21, "Pantry": 2, "Freezer": 90},
    "butter": {"Fridge": 60, "Pantry": 10, "Freezer": 180},
    "carrot": {"Fridge": 21, "Pantry": 7, "Freezer": 180},
    "potato": {"Fridge": 30, "Pantry": 28, "Freezer": 180},
    "onion": {"Fridge": 30, "Pantry": 30, "Freezer": 180},
    "berries": {"Fridge": 4, "Pantry": 1, "Freezer": 180},
    "strawberries": {"Fridge": 4, "Pantry": 1, "Freezer": 180}
}

class FreshnessMLEngine:
    def __init__(self):
        self.categories = ["Produce", "Dairy", "Protein", "Bakery", "Grains", "Canned", "Beverage", "Condiment", "Other"]
        self.locations = ["Fridge", "Pantry", "Freezer"]

    def get_baseline_shelf_life(self, item_name: str, category: str, location: str) -> int:
        clean_name = item_name.strip().lower()
        # Check specific override
        for key, vals in ITEM_SPECIFIC_DAYS.items():
            if key in clean_name:
                return vals.get(location, vals.get("Fridge", 7))
        
        # Fallback to category baseline
        cat_dict = BASELINE_SHELF_LIFE.get(category, BASELINE_SHELF_LIFE["Other"])
        return cat_dict.get(location, 7)

    def predict_freshness(
        self,
        item_name: str,
        category: str,
        location: str,
        purchase_date: datetime = None,
        custom_expiry: datetime = None
    ) -> Dict[str, Any]:
        """
        Calculates real-time freshness % and remaining days using USDA FoodKeeper + Indian Staples
        Deterministic Spoilage Engine with mathematical decay formulas.
        """
        from app.services.spoilage.engine import spoilage_engine
        return spoilage_engine.calculate_spoilage(
            item_name=item_name,
            category=category,
            location=location,
            purchase_date=purchase_date,
            custom_expiry=custom_expiry
        )

freshness_engine = FreshnessMLEngine()
