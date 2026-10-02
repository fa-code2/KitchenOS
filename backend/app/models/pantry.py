from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, Text
from datetime import datetime, timezone
import enum
from app.core.database import Base

class StorageLocation(str, enum.Enum):
    FRIDGE = "Fridge"
    PANTRY = "Pantry"
    FREEZER = "Freezer"

class ItemCategory(str, enum.Enum):
    PRODUCE = "Produce"
    DAIRY = "Dairy"
    PROTEIN = "Protein"
    BAKERY = "Bakery"
    GRAINS = "Grains"
    CANNED = "Canned"
    BEVERAGE = "Beverage"
    CONDIMENT = "Condiment"
    OTHER = "Other"

class ItemStatus(str, enum.Enum):
    ACTIVE = "active"
    CONSUMED = "consumed"
    WASTED = "wasted"

class PantryItem(Base):
    __tablename__ = "pantry_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    category = Column(String(50), default=ItemCategory.PRODUCE.value)
    quantity = Column(Float, default=1.0)
    unit = Column(String(20), default="units") # units, g, kg, ml, lbs, bunch, oz
    location = Column(String(50), default=StorageLocation.FRIDGE.value)
    
    # Freshness & Tracking
    purchase_date = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(DateTime, nullable=True)
    freshness_score = Column(Float, default=100.0) # 0 to 100%
    shelf_life_days = Column(Integer, default=7)
    days_remaining = Column(Float, default=7.0)
    
    # ML / Vision Metadata
    detected_confidence = Column(Float, nullable=True) # Confidence from YOLO if scanned
    barcode = Column(String(50), nullable=True)
    image_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(20), default=ItemStatus.ACTIVE.value)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
