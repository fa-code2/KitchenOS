from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime
from app.core.database import Base

class GroceryItem(Base):
    __tablename__ = "grocery_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), default="Produce")
    quantity = Column(Float, default=1.0)
    unit = Column(String(20), default="units")
    is_purchased = Column(Boolean, default=False)
    auto_added_reason = Column(String(200), nullable=True) # "Low Stock", "Recipe: Tomato Pasta", "Manual"
    priority = Column(String(20), default="Medium") # High, Medium, Low
    estimated_price_usd = Column(Float, default=2.50)
    created_at = Column(DateTime, default=datetime.utcnow)
