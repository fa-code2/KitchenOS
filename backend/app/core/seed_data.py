from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone

from app.models.pantry import PantryItem, ItemStatus
from app.models.meal_plan import MealPlanEntry
from app.models.grocery import GroceryItem
from app.models.analytics import WasteMetric
from app.models.recipe import SavedRecipe
from app.services.ml.freshness_model import freshness_engine

def seed_initial_database(db: Session):
    # Only seed if pantry is empty
    if db.query(PantryItem).count() > 0:
        return

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    
    # Realistic pantry items with varied purchase dates to demonstrate Green, Amber, Red freshness bars
    initial_pantry = [
        {
            "name": "Baby Spinach",
            "category": "Produce",
            "quantity": 1.0,
            "unit": "bag",
            "location": "Fridge",
            "purchase_date": now - timedelta(days=4), # Expiring in ~1 day!
            "notes": "Opened 3 days ago. Needs to be used ASAP."
        },
        {
            "name": "Ripe Avocados",
            "category": "Produce",
            "quantity": 2.0,
            "unit": "units",
            "location": "Fridge",
            "purchase_date": now - timedelta(days=5), # Expiring in ~2 days
            "notes": "Soft and ready to eat."
        },
        {
            "name": "Organic Whole Milk",
            "category": "Dairy",
            "quantity": 1.0,
            "unit": "carton",
            "location": "Fridge",
            "purchase_date": now - timedelta(days=5), # 2 days left
            "notes": "Grade A pasteurized."
        },
        {
            "name": "Roma Tomatoes",
            "category": "Produce",
            "quantity": 4.0,
            "unit": "units",
            "location": "Fridge",
            "purchase_date": now - timedelta(days=2), # ~8 days left (fresh)
            "notes": "Great for salad or pasta sauce."
        },
        {
            "name": "Greek Yogurt (Plain)",
            "category": "Dairy",
            "quantity": 2.0,
            "unit": "tub",
            "location": "Fridge",
            "purchase_date": now - timedelta(days=3), # ~11 days left
            "notes": "High protein 0% fat."
        },
        {
            "name": "Free-Range Eggs",
            "category": "Dairy",
            "quantity": 8.0,
            "unit": "units",
            "location": "Fridge",
            "purchase_date": now - timedelta(days=6), # ~24 days left
            "notes": "Large brown eggs."
        },
        {
            "name": "Fresh Salmon Fillets",
            "category": "Protein",
            "quantity": 2.0,
            "unit": "fillet",
            "location": "Fridge",
            "purchase_date": now - timedelta(days=1), # ~1 day left (urgent!)
            "notes": "Wild-caught Atlantic salmon."
        },
        {
            "name": "Artisan Sourdough Loaf",
            "category": "Bakery",
            "quantity": 1.0,
            "unit": "loaf",
            "location": "Pantry",
            "purchase_date": now - timedelta(days=3), # ~1 day left
            "notes": "Crusty bakery loaf."
        },
        {
            "name": "Rolled Oats",
            "category": "Grains",
            "quantity": 1.0,
            "unit": "kg",
            "location": "Pantry",
            "purchase_date": now - timedelta(days=15),
            "notes": "Organic whole grain."
        },
        {
            "name": "Extra Virgin Olive Oil",
            "category": "Condiment",
            "quantity": 1.0,
            "unit": "bottle",
            "location": "Pantry",
            "purchase_date": now - timedelta(days=20),
            "notes": "Cold pressed Italian."
        },
        {
            "name": "Frozen Blueberries",
            "category": "Produce",
            "quantity": 1.0,
            "unit": "bag",
            "location": "Freezer",
            "purchase_date": now - timedelta(days=20), # ~70 days left
            "notes": "Antioxidant rich for smoothies."
        },
        {
            "name": "Cottage Cheese (Fresh Paneer)",
            "category": "Dairy",
            "quantity": 400.0,
            "unit": "g",
            "location": "Fridge",
            "purchase_date": now - timedelta(days=2), # ~5 days left
            "notes": "Fresh malai paneer for curries or high-protein bhurji."
        },
        {
            "name": "Cooked Yellow Dal",
            "category": "Protein",
            "quantity": 350.0,
            "unit": "g",
            "location": "Fridge",
            "purchase_date": now - timedelta(days=1), # ~3 days left
            "notes": "Spiced yellow lentil dal."
        }
    ]

    for item_data in initial_pantry:
        pred = freshness_engine.predict_freshness(
            item_name=item_data["name"],
            category=item_data["category"],
            location=item_data["location"],
            purchase_date=item_data["purchase_date"]
        )
        p = PantryItem(
            name=item_data["name"],
            category=item_data["category"],
            quantity=item_data["quantity"],
            unit=item_data["unit"],
            location=item_data["location"],
            purchase_date=item_data["purchase_date"],
            expiry_date=datetime.fromisoformat(pred["predicted_expiry_date"]),
            freshness_score=pred["freshness_score"],
            shelf_life_days=pred["shelf_life_days"],
            days_remaining=pred["days_remaining"],
            notes=item_data.get("notes"),
            status=ItemStatus.ACTIVE.value
        )
        db.add(p)

    # Seed initial meal plan
    initial_meals = [
        {"day_of_week": "Monday", "meal_type": "Breakfast", "recipe_name": "Aloo Paratha with Fresh Curd", "description": "Warm and comforting staple breakfast paired perfectly with homemade yogurt", "calories": 410, "protein_g": 12.0, "carbs_g": 55.0, "fat_g": 15.0, "fiber_g": 7.0, "dietary_tags": ["Comfort Food"], "ingredients_used": ["Whole Wheat Flour", "Potatoes", "Curd"]},
        {"day_of_week": "Monday", "meal_type": "Dinner", "recipe_name": "Paneer Bhurji with Phulka", "description": "Scrambled cottage cheese cooked with onions, tomatoes, and aromatic spices", "calories": 480, "protein_g": 22.0, "carbs_g": 40.0, "fat_g": 24.0, "fiber_g": 8.0, "dietary_tags": ["High Protein", "Vegetarian"], "ingredients_used": ["Cottage Cheese (Fresh Paneer)", "Onions", "Roma Tomatoes", "Whole Wheat Flour"]},
        {"day_of_week": "Tuesday", "meal_type": "Breakfast", "recipe_name": "Masala Poha with Peanuts", "description": "A classic, light Indian breakfast that is quick to prepare and easy on the stomach", "calories": 350, "protein_g": 10.0, "carbs_g": 45.0, "fat_g": 12.0, "fiber_g": 6.0, "dietary_tags": ["Light Meal", "Gluten Free"], "ingredients_used": ["Poha (Flattened Rice)", "Peanuts", "Curry Leaves"]},
        {"day_of_week": "Tuesday", "meal_type": "Lunch", "recipe_name": "Dal Chawal with Dry Sabzi", "description": "The ultimate Indian comfort meal providing a complete protein profile", "calories": 520, "protein_g": 18.0, "carbs_g": 75.0, "fat_g": 12.0, "fiber_g": 14.0, "dietary_tags": ["High Fiber", "Plant Protein"], "ingredients_used": ["Cooked Yellow Dal", "Basmati Rice", "Seasonal Veg Sabzi"]},
        {"day_of_week": "Wednesday", "meal_type": "Dinner", "recipe_name": "Comforting Vegetable Khichdi", "description": "A soothing one-pot mix of rice, lentils, and vegetables topped with a dollop of ghee", "calories": 420, "protein_g": 16.0, "carbs_g": 65.0, "fat_g": 10.0, "fiber_g": 11.0, "dietary_tags": ["Gut Health", "Comfort Food"], "ingredients_used": ["Rice", "Moong Dal", "Mixed Vegetables", "Ghee"]}
    ]

    for m in initial_meals:
        entry = MealPlanEntry(
            day_of_week=m["day_of_week"],
            meal_type=m["meal_type"],
            recipe_name=m["recipe_name"],
            description=m["description"],
            calories=m["calories"],
            protein_g=m["protein_g"],
            carbs_g=m["carbs_g"],
            fat_g=m["fat_g"],
            fiber_g=m["fiber_g"],
            dietary_tags=m["dietary_tags"],
            ingredients_used=m["ingredients_used"]
        )

        db.add(entry)

    # Seed initial grocery items
    initial_grocery = [
        {"name": "Organic Chia Seeds", "category": "Grains", "quantity": 1.0, "unit": "pack", "is_purchased": False, "priority": "Medium", "auto_added_reason": "Low Stock Staple", "estimated_price_usd": 4.20},
        {"name": "Fresh Basil", "category": "Produce", "quantity": 1.0, "unit": "bunch", "is_purchased": False, "priority": "High", "auto_added_reason": "Meal Plan: Tomato & Basil Pasta", "estimated_price_usd": 2.50},
        {"name": "Penne Pasta", "category": "Grains", "quantity": 1.0, "unit": "box", "is_purchased": False, "priority": "High", "auto_added_reason": "Meal Plan: Tomato & Basil Pasta", "estimated_price_usd": 1.80}
    ]

    for g in initial_grocery:
        item = GroceryItem(
            name=g["name"],
            category=g["category"],
            quantity=g["quantity"],
            unit=g["unit"],
            is_purchased=g["is_purchased"],
            priority=g["priority"],
            auto_added_reason=g["auto_added_reason"],
            estimated_price_usd=g["estimated_price_usd"]
        )
        db.add(item)

    # Seed waste reduction metrics
    initial_metrics = [
        {"action_type": "cooked_recipe", "item_name": "Spinach & Herb Frittata", "quantity": 3.0, "waste_prevented_kg": 0.9, "money_saved_usd": 8.50, "co2_reduced_kg": 2.1},
        {"action_type": "consumed", "item_name": "Strawberries", "quantity": 1.0, "waste_prevented_kg": 0.4, "money_saved_usd": 4.00, "co2_reduced_kg": 0.9},
        {"action_type": "upcycled_second_life", "item_name": "Citrus Peel Cleaner", "quantity": 2.0, "waste_prevented_kg": 0.6, "money_saved_usd": 5.00, "co2_reduced_kg": 1.5}
    ]

    for met in initial_metrics:
        w = WasteMetric(
            action_type=met["action_type"],
            item_name=met["item_name"],
            quantity=met["quantity"],
            waste_prevented_kg=met["waste_prevented_kg"],
            money_saved_usd=met["money_saved_usd"],
            co2_reduced_kg=met["co2_reduced_kg"]
        )
        db.add(w)

    db.commit()
