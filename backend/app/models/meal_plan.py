from sqlalchemy import Column, Integer, String, DateTime, JSON, Float
from datetime import datetime
from app.core.database import Base

class MealPlanEntry(Base):
    __tablename__ = "meal_plan_entries"

    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(String(20), nullable=False) # Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
    meal_type = Column(String(20), nullable=False) # Breakfast, Lunch, Dinner, Snack
    recipe_name = Column(String(200), nullable=False)
    description = Column(String(500), nullable=True)
    calories = Column(Integer, default=400)
    protein_g = Column(Float, default=20.0)
    carbs_g = Column(Float, default=45.0)
    fat_g = Column(Float, default=14.0)
    fiber_g = Column(Float, default=7.0)
    dietary_tags = Column(JSON, default=list) # ["High Protein", "High Fiber"]
    ingredients_used = Column(JSON, default=list) # ["Tomato", "Egg", "Cheese"]
    created_at = Column(DateTime, default=datetime.utcnow)

