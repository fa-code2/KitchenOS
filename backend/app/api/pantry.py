from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.models.pantry import PantryItem, ItemStatus
from app.models.analytics import WasteMetric
from app.schemas.pantry import (
    PantryItemCreate,
    PantryItemUpdate,
    PantryItemOut,
    BulkScanImportRequest,
    SpoilageSimulationRequest
)
from app.services.ml.freshness_model import freshness_engine

router = APIRouter(prefix="/pantry", tags=["Pantry"])

def enrich_item_freshness(item: PantryItem) -> PantryItem:
    """Recalculate dynamic freshness score using ML model."""
    pred = freshness_engine.predict_freshness(
        item_name=item.name,
        category=item.category,
        location=item.location,
        purchase_date=item.purchase_date,
        custom_expiry=item.expiry_date
    )
    item.freshness_score = pred["freshness_score"]
    item.days_remaining = pred["days_remaining"]
    item.shelf_life_days = pred["shelf_life_days"]
    return item

@router.get("", response_model=List[PantryItemOut])
def get_pantry_items(
    location: Optional[str] = None,
    category: Optional[str] = None,
    urgency: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(PantryItem).filter(PantryItem.status == ItemStatus.ACTIVE.value)
    
    if location and location.lower() != "all":
        query = query.filter(PantryItem.location == location)
    if category and category.lower() != "all":
        query = query.filter(PantryItem.category == category)
    if search:
        query = query.filter(PantryItem.name.ilike(f"%{search}%"))

    items = query.all()
    # Enrich with ML freshness calculation
    for item in items:
        enrich_item_freshness(item)
    
    # Sort by days remaining (most urgent first)
    items.sort(key=lambda x: (x.days_remaining, x.freshness_score))
    
    if urgency:
        if urgency == "critical":
            items = [i for i in items if i.days_remaining <= 3]
        elif urgency == "moderate":
            items = [i for i in items if 3 < i.days_remaining <= 7]
        elif urgency == "fresh":
            items = [i for i in items if i.days_remaining > 7]
    return items

@router.get("/freshness-status")
def get_pantry_freshness_status(db: Session = Depends(get_db)):
    """
    Deterministic Spoilage Engine:
    Returns real-time expiration countdowns (days & hours) and non-linear freshness decay statuses
    for all active pantry items using USDA FoodKeeper + Indian Staples data.
    """
    from app.services.spoilage.engine import spoilage_engine
    items = db.query(PantryItem).filter(PantryItem.status == ItemStatus.ACTIVE.value).all()
    
    analyzed_items = []
    total_freshness = 0.0
    critical_count = 0
    moderate_count = 0
    fresh_count = 0
    expired_count = 0

    for it in items:
        spoilage = spoilage_engine.calculate_spoilage(
            item_name=it.name,
            category=it.category,
            location=it.location,
            purchase_date=it.purchase_date,
            custom_expiry=it.expiry_date
        )
        total_freshness += spoilage["freshness_score"]
        
        if spoilage["urgency"] == "critical":
            critical_count += 1
        elif spoilage["urgency"] == "moderate":
            moderate_count += 1
        elif spoilage["urgency"] == "fresh":
            fresh_count += 1
        elif spoilage["urgency"] == "expired":
            expired_count += 1

        analyzed_items.append({
            "id": it.id,
            "name": it.name,
            "category": it.category,
            "quantity": it.quantity,
            "unit": it.unit,
            "location": it.location,
            "purchase_date": it.purchase_date,
            "expiry_date": it.expiry_date,
            "freshness_score": spoilage["freshness_score"],
            "days_remaining": spoilage["days_remaining"],
            "hours_remaining": spoilage["hours_remaining"],
            "shelf_life_days": spoilage["shelf_life_days"],
            "urgency": spoilage["urgency"],
            "status_badge": spoilage["status_badge"],
            "color_hex": spoilage["color_hex"],
            "matched_standard": spoilage["matched_standard"],
            "storage_tips": spoilage["storage_tips"]
        })

    # Sort urgent items first
    analyzed_items.sort(key=lambda x: (x["days_remaining"], x["freshness_score"]))
    avg_freshness = round(total_freshness / len(items), 1) if items else 100.0

    return {
        "engine": "Deterministic Spoilage Engine (USDA FoodKeeper + Indian Staples)",
        "pantry_freshness_average": avg_freshness,
        "total_active_items": len(items),
        "critical_count": critical_count,
        "moderate_count": moderate_count,
        "fresh_count": fresh_count,
        "expired_count": expired_count,
        "items": analyzed_items
    }

@router.post("/simulate-spoilage")
def simulate_item_spoilage(req: SpoilageSimulationRequest):
    """
    Deterministic Spoilage Simulator:
    Generates non-linear degradation curves based on USDA + Indian staples decay formulas
    for varying storage locations (Fridge/Pantry/Freezer) and temperature factors.
    """
    from app.services.spoilage.engine import spoilage_engine
    return spoilage_engine.generate_simulation_curve(
        item_name=req.item_name,
        category=req.category or "Produce",
        location=req.location or "Fridge",
        temp_factor=req.temp_factor or 1.0,
        days_ahead=req.days_ahead
    )

@router.post("", response_model=PantryItemOut)
def create_pantry_item(item_in: PantryItemCreate, db: Session = Depends(get_db)):
    pred = freshness_engine.predict_freshness(
        item_name=item_in.name,
        category=item_in.category,
        location=item_in.location,
        purchase_date=item_in.purchase_date or datetime.now(timezone.utc).replace(tzinfo=None),
        custom_expiry=item_in.expiry_date
    )
    
    item = PantryItem(
        name=item_in.name,
        category=item_in.category,
        quantity=item_in.quantity,
        unit=item_in.unit,
        location=item_in.location,
        purchase_date=item_in.purchase_date or datetime.now(timezone.utc).replace(tzinfo=None),
        expiry_date=item_in.expiry_date or datetime.fromisoformat(pred["predicted_expiry_date"]),
        freshness_score=pred["freshness_score"],
        shelf_life_days=pred["shelf_life_days"],
        days_remaining=pred["days_remaining"],
        barcode=item_in.barcode,
        image_url=item_in.image_url,
        notes=item_in.notes,
        status=ItemStatus.ACTIVE.value
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.post("/bulk-import", response_model=List[PantryItemOut])
def bulk_import_scanned_items(req: BulkScanImportRequest, db: Session = Depends(get_db)):
    created = []
    for bi in req.items:
        pred = freshness_engine.predict_freshness(
            item_name=bi.name,
            category=bi.category,
            location=bi.location,
            purchase_date=datetime.now(timezone.utc).replace(tzinfo=None)
        )
        item = PantryItem(
            name=bi.name,
            category=bi.category,
            quantity=bi.quantity,
            unit=bi.unit,
            location=bi.location,
            purchase_date=datetime.now(timezone.utc).replace(tzinfo=None),
            expiry_date=datetime.fromisoformat(pred["predicted_expiry_date"]),
            freshness_score=pred["freshness_score"],
            shelf_life_days=pred["shelf_life_days"],
            days_remaining=pred["days_remaining"],
            detected_confidence=bi.confidence,
            status=ItemStatus.ACTIVE.value
        )
        db.add(item)
        created.append(item)
    
    db.commit()
    for item in created:
        db.refresh(item)
    return created

@router.get("/{item_id}", response_model=PantryItemOut)
def get_pantry_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(PantryItem).filter(PantryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Pantry item not found")
    enrich_item_freshness(item)
    return item

@router.get("/{item_id}/freshness")
def get_item_freshness_detail(item_id: int, db: Session = Depends(get_db)):
    """
    Returns real-time mathematical decay details and projected degradation curve for a specific pantry item.
    """
    from app.services.spoilage.engine import spoilage_engine
    item = db.query(PantryItem).filter(PantryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Pantry item not found")
    
    spoilage = spoilage_engine.calculate_spoilage(
        item_name=item.name,
        category=item.category,
        location=item.location,
        purchase_date=item.purchase_date,
        custom_expiry=item.expiry_date
    )
    simulation = spoilage_engine.generate_simulation_curve(
        item_name=item.name,
        category=item.category,
        location=item.location
    )
    return {
        "item_id": item.id,
        "name": item.name,
        "category": item.category,
        "location": item.location,
        **spoilage,
        "simulation_curve": simulation["simulation_curve"]
    }


@router.put("/{item_id}", response_model=PantryItemOut)
def update_pantry_item(item_id: int, item_in: PantryItemUpdate, db: Session = Depends(get_db)):
    item = db.query(PantryItem).filter(PantryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Pantry item not found")
    
    update_data = item_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
        
    db.commit()
    db.refresh(item)
    enrich_item_freshness(item)
    return item

@router.delete("/{item_id}")
def delete_pantry_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(PantryItem).filter(PantryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Pantry item not found")
    db.delete(item)
    db.commit()
    return {"message": f"Item '{item.name}' removed from pantry."}

@router.post("/{item_id}/consume")
def consume_pantry_item(item_id: int, quantity: Optional[float] = None, db: Session = Depends(get_db)):
    item = db.query(PantryItem).filter(PantryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Pantry item not found")
    
    consume_qty = quantity if (quantity and quantity <= item.quantity) else item.quantity
    item.quantity -= consume_qty
    
    if item.quantity <= 0.05:
        item.status = ItemStatus.CONSUMED.value
        item.quantity = 0

    # Record waste prevented metric
    metric = WasteMetric(
        action_type="consumed",
        item_name=item.name,
        quantity=consume_qty,
        waste_prevented_kg=round(consume_qty * 0.35, 2),
        money_saved_usd=round(consume_qty * 3.20, 2),
        co2_reduced_kg=round(consume_qty * 0.85, 2)
    )
    db.add(metric)
    db.commit()
    return {"message": f"Consumed {consume_qty} {item.unit} of '{item.name}'. Waste prevented!", "remaining": item.quantity}

@router.post("/{item_id}/waste")
def mark_pantry_item_wasted(item_id: int, db: Session = Depends(get_db)):
    item = db.query(PantryItem).filter(PantryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Pantry item not found")
    
    item.status = ItemStatus.WASTED.value
    metric = WasteMetric(
        action_type="wasted",
        item_name=item.name,
        quantity=item.quantity,
        waste_prevented_kg=0.0,
        money_saved_usd=0.0,
        co2_reduced_kg=0.0
    )
    db.add(metric)
    db.commit()
    return {"message": f"Marked '{item.name}' as wasted."}
