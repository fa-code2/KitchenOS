from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class MealPlanBase(BaseModel):
    day_of_week: str # Monday, Tuesday, etc.
    meal_type: str # Breakfast, Lunch, Dinner, Snack
    recipe_name: str
    description: Optional[str] = None
    calories: int = 450
    protein_g: Optional[float] = 20.0
    carbs_g: Optional[float] = 45.0
    fat_g: Optional[float] = 14.0
    fiber_g: Optional[float] = 7.0
    dietary_tags: Optional[List[str]] = []
    ingredients_used: List[str] = []

class MealPlanCreate(MealPlanBase):
    pass

class MealPlanOut(MealPlanBase):
    id: Optional[int] = None
    created_at: Optional[datetime] = None


    model_config = ConfigDict(from_attributes=True)

class WeeklyMealPlanResponse(BaseModel):
    schedule: List[MealPlanOut]
    total_weekly_calories: int
    pantry_coverage_percentage: float
    missing_ingredients: List[str]

class FamilyMealPlanRequest(BaseModel):
    dietary_goals: List[str] = Field(default_factory=lambda: ["high_protein", "high_fiber"])
    plan_type: str = "weekly" # "weekly" (Mon-Sun) or "weekend" (Sat-Sun)
    target_calories_per_day: Optional[int] = 2000
    family_size: Optional[int] = 2
    save_to_schedule: Optional[bool] = True

class MacroAnalyticsResponse(BaseModel):
    plan_type: str
    total_planned_calories: int
    daily_average_calories: int
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    total_fiber_g: float
    daily_average_protein_g: float
    daily_average_fiber_g: float
    macro_split_pct: Dict[str, float]
    pantry_coverage_percentage: float
    unexpired_pantry_items_used: List[str]
    missing_grocery_items: List[str]
    dietary_goals_adherence: Dict[str, Any]
    schedule: List[MealPlanOut]
