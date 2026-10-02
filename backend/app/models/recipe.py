from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON, Boolean
from datetime import datetime
from app.core.database import Base

class SavedRecipe(Base):
    __tablename__ = "saved_recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    prep_time_minutes = Column(Integer, default=20)
    cook_time_minutes = Column(Integer, default=20)
    difficulty = Column(String(50), default="Easy") # Easy, Medium, Hard
    servings = Column(Integer, default=2)
    
    # Nutrition & Macros
    calories = Column(Integer, default=350)
    protein_g = Column(Float, default=15.0)
    carbs_g = Column(Float, default=40.0)
    fat_g = Column(Float, default=12.0)
    
    # Ingredients and Instructions (JSON structured)
    ingredients = Column(JSON, default=list) # [{name, amount, unit, from_pantry: bool, expiring: bool}]
    instructions = Column(JSON, default=list) # ["Step 1", "Step 2", ...]
    
    # Zero-Waste Impact
    waste_saved_score = Column(Float, default=90.0) # Waste prevention score percentage
    expiring_ingredients_used = Column(JSON, default=list) # List of expiring item names used
    second_life_tips = Column(Text, nullable=True) # Tips on how to use leftovers/scraps from this recipe
    
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
