from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class PantryItemBase(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Organic Spinach"})
    category: str = Field("Produce", json_schema_extra={"example": "Produce"})
    quantity: float = Field(1.0, json_schema_extra={"example": 1.0})
    unit: str = Field("units", json_schema_extra={"example": "bag"})
    location: str = Field("Fridge", json_schema_extra={"example": "Fridge"})
    purchase_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    notes: Optional[str] = None
    status: str = "active"

class PantryItemCreate(PantryItemBase):
    pass

class PantryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    location: Optional[str] = None
    purchase_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    freshness_score: Optional[float] = None
    days_remaining: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class PantryItemOut(PantryItemBase):
    id: int
    freshness_score: float
    shelf_life_days: int
    days_remaining: float
    detected_confidence: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BulkScanItem(BaseModel):
    name: str
    category: str
    quantity: float = 1.0
    unit: str = "units"
    location: str = "Fridge"
    confidence: Optional[float] = 0.95
    bounding_box: Optional[List[float]] = None

class BulkScanImportRequest(BaseModel):
    items: List[BulkScanItem]

class SpoilageSimulationRequest(BaseModel):
    item_name: str
    category: Optional[str] = "Produce"
    location: Optional[str] = "Fridge"
    temp_factor: Optional[float] = 1.0
    days_ahead: Optional[int] = None

