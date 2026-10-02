from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.pantry import PantryItem, ItemStatus
from app.services.second_life.hub import second_life_service
from app.services.ml.freshness_model import freshness_engine

router = APIRouter(prefix="/second-life", tags=["Second Life Hub"])

@router.get("")
def get_all_second_life_guides():
    return second_life_service.get_all_guides()

@router.get("/for-pantry")
def get_guides_for_user_pantry(db: Session = Depends(get_db)):
    """
    Returns upcycling ideas tailored specifically to items in the pantry that are
    expiring soon (days_remaining <= 4) or marked wasted.
    """
    items = db.query(PantryItem).filter(PantryItem.status.in_([ItemStatus.ACTIVE.value, ItemStatus.WASTED.value])).all()
    
    candidate_names = []
    for it in items:
        pred = freshness_engine.predict_freshness(it.name, it.category, it.location, it.purchase_date, it.expiry_date)
        if pred["days_remaining"] <= 4 or it.status == ItemStatus.WASTED.value:
            candidate_names.append(it.name)

    guides = second_life_service.get_guides_for_items(candidate_names)
    return {
        "matched_items": candidate_names,
        "guides": guides
    }

@router.post("/query")
@router.post("/retrieve")
async def retrieve_second_life_guide(payload: dict):
    """
    LLM Knowledge Retrieval:
    Accepts an ingredient query or description of spoiled goods (e.g., 'spoiled milk', 'citrus peel', 'moldy bread')
    and retrieves/generates structured upcycling instructions.
    """
    query = payload.get("query") or payload.get("item_name") or payload.get("item") or "vegetable scraps"
    guide = await second_life_service.retrieve_or_generate_guide(query)
    return guide

