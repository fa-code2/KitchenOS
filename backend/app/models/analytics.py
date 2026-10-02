from sqlalchemy import Column, Integer, Float, DateTime, String
from datetime import datetime
from app.core.database import Base

class WasteMetric(Base):
    __tablename__ = "waste_metrics"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    action_type = Column(String(50), default="consumed") # consumed, cooked_recipe, upcycled_second_life, wasted
    item_name = Column(String(100), nullable=False)
    quantity = Column(Float, default=1.0)
    waste_prevented_kg = Column(Float, default=0.25)
    money_saved_usd = Column(Float, default=2.00)
    co2_reduced_kg = Column(Float, default=0.60)
