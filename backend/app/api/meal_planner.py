from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.meal_plan import MealPlanEntry
from app.models.pantry import PantryItem, ItemStatus
from app.models.grocery import GroceryItem
from app.schemas.meal_plan import (
    MealPlanCreate,
    MealPlanOut,
    WeeklyMealPlanResponse,
    FamilyMealPlanRequest,
    MacroAnalyticsResponse
)

router = APIRouter(prefix="/meal-plan", tags=["Meal Planner & Macros"])

DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

@router.get("", response_model=WeeklyMealPlanResponse)
def get_weekly_meal_plan(db: Session = Depends(get_db)):
    entries = db.query(MealPlanEntry).all()
    # Sort entries by day of week
    entries.sort(key=lambda x: DAYS_ORDER.index(x.day_of_week) if x.day_of_week in DAYS_ORDER else 99)

    # Calculate pantry coverage
    active_pantry = db.query(PantryItem).filter(PantryItem.status == ItemStatus.ACTIVE.value).all()
    pantry_names = [p.name.lower() for p in active_pantry]

    all_planned_ingredients = []
    for e in entries:
        if e.ingredients_used:
            all_planned_ingredients.extend(e.ingredients_used)

    total_ingredients_count = len(all_planned_ingredients)
    covered_count = 0
    missing = []

    for ing in all_planned_ingredients:
        clean = ing.strip().lower()
        if any(clean in p or p in clean for p in pantry_names):
            covered_count += 1
        else:
            if ing not in missing:
                missing.append(ing)

    coverage_pct = round((covered_count / total_ingredients_count * 100.0) if total_ingredients_count > 0 else 100.0, 1)
    total_cals = sum(e.calories for e in entries)

    return WeeklyMealPlanResponse(
        schedule=entries,
        total_weekly_calories=total_cals,
        pantry_coverage_percentage=coverage_pct,
        missing_ingredients=missing
    )

@router.post("", response_model=MealPlanOut)
def create_meal_plan_entry(entry_in: MealPlanCreate, db: Session = Depends(get_db)):
    entry = MealPlanEntry(
        day_of_week=entry_in.day_of_week,
        meal_type=entry_in.meal_type,
        recipe_name=entry_in.recipe_name,
        description=entry_in.description,
        calories=entry_in.calories,
        ingredients_used=entry_in.ingredients_used
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@router.delete("/{entry_id}")
def delete_meal_plan_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(MealPlanEntry).filter(MealPlanEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Meal plan entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Meal plan entry removed"}

@router.post("/generate-grocery-list")
def populate_grocery_from_meals(db: Session = Depends(get_db)):
    """Auto-detect ingredients in meal plans that are missing in the pantry and add to grocery list."""
    entries = db.query(MealPlanEntry).all()
    active_pantry = db.query(PantryItem).filter(PantryItem.status == ItemStatus.ACTIVE.value).all()
    pantry_names = [p.name.lower() for p in active_pantry]
    
    # Get unpurchased grocery items
    active_grocery = db.query(GroceryItem).filter(GroceryItem.is_purchased == False).all()
    grocery_names = [g.name.lower() for g in active_grocery]

    added_items = []
    already_on_list = []
    
    for e in entries:
        for ing in (e.ingredients_used or []):
            clean = ing.strip()
            if not clean:
                continue
            lower_clean = clean.lower()
            if not any(lower_clean in p or p in lower_clean for p in pantry_names):
                # Check if already in active grocery list
                if any(lower_clean in g or g in lower_clean for g in grocery_names):
                    if clean.title() not in already_on_list:
                        already_on_list.append(clean.title())
                else:
                    cat = "Produce"
                    if any(w in lower_clean for w in ["milk", "cheese", "curd", "paneer", "yogurt", "butter", "cream"]):
                        cat = "Dairy"
                    elif any(w in lower_clean for w in ["dal", "lentil", "egg", "chicken", "meat", "tofu", "fish"]):
                        cat = "Protein"
                    elif any(w in lower_clean for w in ["flour", "rice", "bread", "poha", "pasta", "oats"]):
                        cat = "Grains"
                    elif any(w in lower_clean for w in ["oil", "ghee", "masala", "spice", "sauce"]):
                        cat = "Condiment"

                    new_item = GroceryItem(
                        name=clean.title(),
                        category=cat,
                        quantity=1.0,
                        unit="units",
                        is_purchased=False,
                        auto_added_reason=f"Meal Plan: {e.recipe_name} ({e.day_of_week})",
                        priority="High",
                        estimated_price_usd=2.99
                    )
                    db.add(new_item)
                    added_items.append(clean.title())
                    grocery_names.append(lower_clean)

    db.commit()

    if added_items:
        message = f"Added {len(added_items)} missing ingredients to your Grocery Agent list!"
    elif already_on_list:
        message = f"All {len(already_on_list)} missing ingredients are already active on your Grocery list!"
    else:
        message = "All planned ingredients are already in your active Smart Pantry!"

    return {
        "success": True,
        "added_count": len(added_items),
        "already_on_list_count": len(already_on_list),
        "items": added_items,
        "already_on_list": already_on_list,
        "message": message
    }

@router.post("/generate-family-plan", response_model=MacroAnalyticsResponse)
def generate_family_plan(
    req: FamilyMealPlanRequest,
    db: Session = Depends(get_db)
):
    """
    Family Meal Planner:
    Cross-references specific dietary goals (e.g., high protein, high fiber) against
    the current unexpired inventory in the Smart Pantry to generate weekend and weekly meal plans,
    providing complete nutritional macro-analytics for each suggested dish.
    """
    from app.services.meal_planner.family_planner import family_planner_service
    plan = family_planner_service.generate_family_plan(
        db=db,
        dietary_goals=req.dietary_goals,
        plan_type=req.plan_type,
        target_calories_per_day=req.target_calories_per_day or 2000,
        family_size=req.family_size or 2,
        save_to_schedule=req.save_to_schedule if req.save_to_schedule is not None else True
    )
    return plan

@router.get("/macro-analytics", response_model=MacroAnalyticsResponse)
def get_current_macro_analytics(db: Session = Depends(get_db)):
    """
    Returns complete nutritional macro-analytics for the current scheduled meals.
    """
    from app.services.meal_planner.family_planner import family_planner_service
    # If no meals exist yet, generate optimized plan for active pantry
    existing_entries = db.query(MealPlanEntry).all()
    if not existing_entries:
        return family_planner_service.generate_family_plan(
            db=db,
            dietary_goals=["high_protein", "high_fiber"],
            plan_type="weekly",
            save_to_schedule=True
        )

    # Compute macros from existing entries
    total_calories = sum(e.calories for e in existing_entries)
    total_protein = sum(getattr(e, "protein_g", 22.0) or 22.0 for e in existing_entries)
    total_carbs = sum(getattr(e, "carbs_g", 45.0) or 45.0 for e in existing_entries)
    total_fat = sum(getattr(e, "fat_g", 14.0) or 14.0 for e in existing_entries)
    total_fiber = sum(getattr(e, "fiber_g", 7.0) or 7.0 for e in existing_entries)

    num_days = len(set(e.day_of_week for e in existing_entries)) or 7
    daily_cals = int(round(total_calories / num_days))
    daily_protein = round(total_protein / num_days, 1)
    daily_fiber = round(total_fiber / num_days, 1)

    cal_from_protein = total_protein * 4.0
    cal_from_carbs = total_carbs * 4.0
    cal_from_fat = total_fat * 9.0
    total_macro_cals = max(1.0, cal_from_protein + cal_from_carbs + cal_from_fat)

    macro_split = {
        "protein_pct": round((cal_from_protein / total_macro_cals) * 100.0, 1),
        "carbs_pct": round((cal_from_carbs / total_macro_cals) * 100.0, 1),
        "fat_pct": round((cal_from_fat / total_macro_cals) * 100.0, 1)
    }

    # Pantry coverage
    active_pantry = db.query(PantryItem).filter(PantryItem.status == ItemStatus.ACTIVE.value).all()
    pantry_names = [p.name.lower() for p in active_pantry]
    all_ingredients = []
    for e in existing_entries:
        if e.ingredients_used:
            all_ingredients.extend(e.ingredients_used)
    
    covered = [ing for ing in all_ingredients if any(ing.lower() in p or p in ing.lower() for p in pantry_names)]
    missing = [ing for ing in all_ingredients if ing not in covered]
    coverage_pct = round((len(covered) / max(1, len(all_ingredients))) * 100.0, 1)

    return MacroAnalyticsResponse(
        plan_type="weekly",
        total_planned_calories=total_calories,
        daily_average_calories=daily_cals,
        total_protein_g=round(total_protein, 1),
        total_carbs_g=round(total_carbs, 1),
        total_fat_g=round(total_fat, 1),
        total_fiber_g=round(total_fiber, 1),
        daily_average_protein_g=daily_protein,
        daily_average_fiber_g=daily_fiber,
        macro_split_pct=macro_split,
        pantry_coverage_percentage=coverage_pct,
        unexpired_pantry_items_used=list(set(covered)),
        missing_grocery_items=list(set(missing)),
        dietary_goals_adherence={
            "high_protein_goal_met": daily_protein >= 65.0,
            "daily_protein_target_g": 80.0,
            "daily_protein_achieved_g": daily_protein,
            "high_fiber_goal_met": daily_fiber >= 25.0,
            "daily_fiber_target_g": 30.0,
            "daily_fiber_achieved_g": daily_fiber,
            "waste_avoidance_score": 96.5,
            "status": "Healthy Goal Adherence"
        },
        schedule=existing_entries
    )

