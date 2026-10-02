from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class GroceryItemBase(BaseModel):
    name: str
    category: str = "Produce"
    quantity: float = 1.0
    unit: str = "units"
    is_purchased: bool = False
    auto_added_reason: Optional[str] = "Manual"
    priority: str = "Medium"
    estimated_price_usd: float = 2.50

class GroceryItemCreate(GroceryItemBase):
    pass

class GroceryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    is_purchased: Optional[bool] = None
    priority: Optional[str] = None

class GroceryItemOut(GroceryItemBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RestockRequest(BaseModel):
    item_ids: list[int]
    target_location: str = "Fridge"
