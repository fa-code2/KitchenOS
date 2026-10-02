from pydantic import BaseModel
from typing import List, Dict, Any

class AnalyticsSummary(BaseModel):
    total_items_tracked: int
    active_items_count: int
    expiring_soon_count: int # 3 days or fewer
    expired_count: int
    freshness_health_avg: float # e.g. 84.5%
    total_waste_prevented_kg: float
    total_money_saved_usd: float
    total_co2_reduced_kg: float
    waste_reduction_rate_pct: float # e.g. 92.4%
    recent_activity: List[Dict[str, Any]]
    category_distribution: Dict[str, int]
    location_distribution: Dict[str, int]
