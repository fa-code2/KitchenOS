from pydantic import BaseModel
from typing import List, Optional

class DetectedGroceryObject(BaseModel):
    name: str
    category: str
    confidence: float
    estimated_shelf_life_days: int
    recommended_location: str
    suggested_quantity: float = 1.0
    suggested_unit: str = "units"
    storage_tip: Optional[str] = None

class VisionScanResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    detected_count: int
    items: List[DetectedGroceryObject]
    processing_time_ms: float
    model_used: str


