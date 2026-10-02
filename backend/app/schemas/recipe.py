from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any

class IngredientItem(BaseModel):
    name: str
    amount: str
    unit: Optional[str] = "units"
    from_pantry: bool = True
    expiring: bool = False

class RecipeBase(BaseModel):
    title: str
    description: Optional[str] = None
    prep_time_minutes: int = 15
    cook_time_minutes: int = 20
    difficulty: str = "Easy"
    servings: int = 2
    calories: int = 350
    protein_g: float = 15.0
    carbs_g: float = 40.0
    fat_g: float = 12.0
    ingredients: List[IngredientItem]
    instructions: List[str]
    waste_saved_score: float = 95.0
    expiring_ingredients_used: List[str] = []
    second_life_tips: Optional[str] = None

class RecipeCreate(RecipeBase):
    pass

class RecipeOut(RecipeBase):
    id: Optional[int] = None
    is_favorite: bool = False

    model_config = ConfigDict(from_attributes=True)

class CookRecipeRequest(BaseModel):
    recipe_id: Optional[int] = None
    recipe_title: str
    ingredients_to_deduct: List[str] # names of ingredients to deduct or consume from pantry
