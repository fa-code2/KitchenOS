from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.core.database import get_db
from app.models.pantry import PantryItem, ItemStatus
from app.models.recipe import SavedRecipe
from app.models.analytics import WasteMetric
from app.schemas.recipe import RecipeOut, RecipeCreate, CookRecipeRequest
from app.services.recipes.generator import chef_engine
from app.services.ml.freshness_model import freshness_engine

router = APIRouter(prefix="/recipes", tags=["Zero-Waste Chef"])

@router.get("/zero-waste", response_model=List[dict])
async def get_zero_waste_recipes(db: Session = Depends(get_db)):
    """
    Generate 3 smart recipes prioritizing items approaching expiry.
    """
    items = db.query(PantryItem).filter(PantryItem.status == ItemStatus.ACTIVE.value).all()
    
    pantry_data = []
    for item in items:
        pred = freshness_engine.predict_freshness(
            item_name=item.name,
            category=item.category,
            location=item.location,
            purchase_date=item.purchase_date,
            custom_expiry=item.expiry_date
        )
        pantry_data.append({
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "quantity": item.quantity,
            "unit": item.unit,
            "freshness_score": pred["freshness_score"],
            "days_remaining": pred["days_remaining"]
        })
        
    recipes = await chef_engine.generate_recipes_for_pantry(pantry_data)
    return recipes

@router.post("/zero-waste", response_model=List[dict])
@router.post("/generate", response_model=List[dict])
async def generate_recipes_from_inventory(
    payload: Optional[dict] = None,
    db: Session = Depends(get_db)
):
    """
    Accepts current pantry inventory (or pulls active pantry if empty)
    and returns 3 structured JSON zero-waste recipes prioritizing expiring items.
    """
    custom_items = payload.get("items", []) if payload else []
    
    if not custom_items:
        # Pull directly from database
        items = db.query(PantryItem).filter(PantryItem.status == ItemStatus.ACTIVE.value).all()
        pantry_data = []
        for item in items:
            pred = freshness_engine.predict_freshness(
                item_name=item.name,
                category=item.category,
                location=item.location,
                purchase_date=item.purchase_date,
                custom_expiry=item.expiry_date
            )
            pantry_data.append({
                "id": item.id,
                "name": item.name,
                "category": item.category,
                "quantity": item.quantity,
                "unit": item.unit,
                "freshness_score": pred["freshness_score"],
                "days_remaining": pred["days_remaining"]
            })
    else:
        pantry_data = []
        for it in custom_items:
            pred = freshness_engine.predict_freshness(
                item_name=it.get("name", "Item"),
                category=it.get("category", "Produce"),
                location=it.get("location", "Fridge")
            )
            pantry_data.append({
                "name": it.get("name", "Item"),
                "category": it.get("category", "Produce"),
                "quantity": it.get("quantity", 1.0),
                "unit": it.get("unit", "units"),
                "freshness_score": it.get("freshness_score", pred["freshness_score"]),
                "days_remaining": it.get("days_remaining", pred["days_remaining"])
            })

    recipes = await chef_engine.generate_recipes_for_pantry(pantry_data)
    return recipes


@router.post("/cook")
def mark_recipe_cooked(req: CookRecipeRequest, db: Session = Depends(get_db)):
    """
    Mark a recipe as cooked, decrement the used ingredients from the active pantry,
    and log waste reduction impact.
    """
    deducted = []
    for ing_name in req.ingredients_to_deduct:
        clean = ing_name.strip().lower()
        # Find matching pantry item
        pantry_match = db.query(PantryItem).filter(
            PantryItem.status == ItemStatus.ACTIVE.value,
            PantryItem.name.ilike(f"%{clean}%")
        ).first()
        
        if pantry_match:
            pantry_match.quantity -= 1.0
            if pantry_match.quantity <= 0.05:
                pantry_match.status = ItemStatus.CONSUMED.value
                pantry_match.quantity = 0
            deducted.append(pantry_match.name)

    # Record waste prevented analytics
    metric = WasteMetric(
        action_type="cooked_recipe",
        item_name=req.recipe_title,
        quantity=float(len(deducted)),
        waste_prevented_kg=round(len(deducted) * 0.40, 2),
        money_saved_usd=round(len(deducted) * 4.50, 2),
        co2_reduced_kg=round(len(deducted) * 1.10, 2)
    )
    db.add(metric)
    db.commit()

    return {
        "success": True,
        "message": f"Successfully cooked '{req.recipe_title}'! Saved {len(deducted)} pantry ingredients.",
        "deducted_items": deducted
    }

@router.get("/saved", response_model=List[RecipeOut])
def get_saved_recipes(db: Session = Depends(get_db)):
    return db.query(SavedRecipe).all()

@router.post("/save", response_model=RecipeOut)
def save_favorite_recipe(recipe_in: RecipeCreate, db: Session = Depends(get_db)):
    recipe = SavedRecipe(
        title=recipe_in.title,
        description=recipe_in.description,
        prep_time_minutes=recipe_in.prep_time_minutes,
        cook_time_minutes=recipe_in.cook_time_minutes,
        difficulty=recipe_in.difficulty,
        servings=recipe_in.servings,
        calories=recipe_in.calories,
        protein_g=recipe_in.protein_g,
        carbs_g=recipe_in.carbs_g,
        fat_g=recipe_in.fat_g,
        ingredients=[i.dict() for i in recipe_in.ingredients],
        instructions=recipe_in.instructions,
        waste_saved_score=recipe_in.waste_saved_score,
        expiring_ingredients_used=recipe_in.expiring_ingredients_used,
        second_life_tips=recipe_in.second_life_tips,
        is_favorite=True
    )
    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return recipe
