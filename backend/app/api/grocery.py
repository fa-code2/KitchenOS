from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from app.core.database import get_db
from app.models.grocery import GroceryItem
from app.models.pantry import PantryItem, ItemStatus
from app.schemas.grocery import GroceryItemCreate, GroceryItemUpdate, GroceryItemOut, RestockRequest
from app.services.ml.freshness_model import freshness_engine

router = APIRouter(prefix="/grocery", tags=["Dynamic Grocery Agent"])

# Essential household staples to monitor for low stock
STAPLE_ITEMS = [
    {"name": "Whole Milk", "category": "Dairy", "unit": "carton", "min_qty": 1.0, "location": "Fridge"},
    {"name": "Pasture-Raised Eggs", "category": "Dairy", "unit": "units", "min_qty": 4.0, "location": "Fridge"},
    {"name": "Sourdough Bread", "category": "Bakery", "unit": "loaf", "min_qty": 1.0, "location": "Pantry"},
    {"name": "Yellow Onions", "category": "Produce", "unit": "units", "min_qty": 2.0, "location": "Pantry"},
    {"name": "Garlic Bulb", "category": "Produce", "unit": "units", "min_qty": 1.0, "location": "Pantry"},
    {"name": "Extra Virgin Olive Oil", "category": "Condiment", "unit": "bottle", "min_qty": 1.0, "location": "Pantry"}
]

@router.get("", response_model=List[GroceryItemOut])
def get_grocery_list(db: Session = Depends(get_db)):
    return db.query(GroceryItem).all()

@router.post("", response_model=GroceryItemOut)
def add_grocery_item(item_in: GroceryItemCreate, db: Session = Depends(get_db)):
    item = GroceryItem(
        name=item_in.name,
        category=item_in.category,
        quantity=item_in.quantity,
        unit=item_in.unit,
        is_purchased=item_in.is_purchased,
        auto_added_reason=item_in.auto_added_reason,
        priority=item_in.priority,
        estimated_price_usd=item_in.estimated_price_usd
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{item_id}", response_model=GroceryItemOut)
def update_grocery_item(item_id: int, item_in: GroceryItemUpdate, db: Session = Depends(get_db)):
    item = db.query(GroceryItem).filter(GroceryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Grocery item not found")
    
    update_data = item_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(item, field, val)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}")
def delete_grocery_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(GroceryItem).filter(GroceryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Grocery item not found")
    db.delete(item)
    db.commit()
    return {"message": "Grocery item deleted"}

@router.post("/auto-generate")
def auto_generate_staples_restock(db: Session = Depends(get_db)):
    """Intelligently checks pantry and adds missing staples to grocery list."""
    active_pantry = db.query(PantryItem).filter(PantryItem.status == ItemStatus.ACTIVE.value).all()
    pantry_dict = {p.name.lower(): p.quantity for p in active_pantry}
    
    added = []
    for staple in STAPLE_ITEMS:
        st_name = staple["name"].lower()
        # Check current stock
        current_qty = 0.0
        for p_name, qty in pantry_dict.items():
            if any(term in p_name for term in staple["name"].lower().split()):
                current_qty += qty
        
        if current_qty < staple["min_qty"]:
            # Check if already on list
            existing = db.query(GroceryItem).filter(
                GroceryItem.name.ilike(f"%{staple['name']}%"),
                GroceryItem.is_purchased == False
            ).first()
            
            if not existing:
                item = GroceryItem(
                    name=staple["name"],
                    category=staple["category"],
                    quantity=staple["min_qty"],
                    unit=staple["unit"],
                    is_purchased=False,
                    auto_added_reason=f"Low Stock Alert (Have {current_qty} {staple['unit']})",
                    priority="High" if current_qty == 0 else "Medium",
                    estimated_price_usd=3.50
                )
                db.add(item)
                added.append(staple["name"])

    db.commit()
    return {"message": f"Added {len(added)} low-stock staple items.", "items": added}

@router.post("/restock")
def restock_purchased_to_pantry(req: RestockRequest, db: Session = Depends(get_db)):
    """
    Move purchased grocery items into active Pantry with fresh ML freshness scores.
    """
    items = db.query(GroceryItem).filter(GroceryItem.id.in_(req.item_ids)).all()
    restocked_names = []

    for g_item in items:
        pred = freshness_engine.predict_freshness(
            item_name=g_item.name,
            category=g_item.category,
            location=req.target_location,
            purchase_date=datetime.now(timezone.utc).replace(tzinfo=None)
        )
        
        # Add to Pantry
        p_item = PantryItem(
            name=g_item.name,
            category=g_item.category,
            quantity=g_item.quantity,
            unit=g_item.unit,
            location=req.target_location,
            purchase_date=datetime.now(timezone.utc).replace(tzinfo=None),
            expiry_date=datetime.fromisoformat(pred["predicted_expiry_date"]),
            freshness_score=pred["freshness_score"],
            shelf_life_days=pred["shelf_life_days"],
            days_remaining=pred["days_remaining"],
            status=ItemStatus.ACTIVE.value
        )
        db.add(p_item)
        restocked_names.append(g_item.name)
        # Remove from grocery list
        db.delete(g_item)

    db.commit()
    return {
        "success": True,
        "message": f"Successfully moved {len(restocked_names)} items from Grocery Agent to Smart Pantry!",
        "items": restocked_names
    }

@router.get("/behavior-suggestions")
def get_behavior_based_suggestions(db: Session = Depends(get_db)):
    """
    Analyzes user eating and consumption behavior (from consumed pantry items & waste metrics)
    to dynamically suggest items to repurchase, with direct search links to purchase in a new window.
    """
    import urllib.parse
    from app.models.analytics import WasteMetric
    from collections import defaultdict

    # 1. Query consumed metrics & consumed pantry items
    consumed_metrics = db.query(WasteMetric).filter(WasteMetric.action_type == "consumed").all()
    consumed_pantry = db.query(PantryItem).filter(PantryItem.status == ItemStatus.CONSUMED.value).all()
    active_pantry = db.query(PantryItem).filter(PantryItem.status == ItemStatus.ACTIVE.value).all()
    existing_grocery = db.query(GroceryItem).filter(GroceryItem.is_purchased == False).all()

    active_names = {p.name.lower(): p.quantity for p in active_pantry}
    grocery_names = {g.name.lower() for g in existing_grocery}

    consumption_counts = defaultdict(int)
    item_categories = {}

    for m in consumed_metrics:
        clean_name = m.item_name.strip().title()
        consumption_counts[clean_name] += 1
        item_categories[clean_name] = "Protein" if any(w in clean_name.lower() for w in ["dal", "egg", "chicken", "tofu", "paneer", "meat"]) else "Produce"

    for p in consumed_pantry:
        clean_name = p.name.strip().title()
        consumption_counts[clean_name] += 1
        item_categories[clean_name] = p.category or "Produce"

    # Default fallback items if new user has few consumed entries
    if not consumption_counts:
        fallback_eaten = ["Cottage Cheese", "Pasture-Raised Eggs", "Greek Yogurt", "Whole Milk", "Spinach", "Yellow Dal"]
        for item in fallback_eaten:
            consumption_counts[item] = 2
            item_categories[item] = "Dairy" if "Milk" in item or "Yogurt" in item or "Cheese" in item else "Produce"

    suggestions = []
    for item_name, count in sorted(consumption_counts.items(), key=lambda x: x[1], reverse=True):
        lower_name = item_name.lower()
        current_stock = active_names.get(lower_name, 0.0)
        on_grocery_list = any(lower_name in g or g in lower_name for g in grocery_names)

        category = item_categories.get(item_name, "Produce")
        encoded_query = urllib.parse.quote(f"buy {item_name} grocery online")
        search_url = f"https://www.google.com/search?q={encoded_query}"

        if current_stock == 0:
            reason = f"Consumed {count}x • Currently 0 in inventory"
            priority = "High"
        elif current_stock < 1.0:
            reason = f"Eaten frequently ({count}x) • Low stock ({current_stock} left)"
            priority = "Medium"
        else:
            reason = f"Regular staple ({count}x consumed)"
            priority = "Low"

        suggestions.append({
            "name": item_name,
            "category": category,
            "times_eaten": count,
            "current_stock": current_stock,
            "already_on_list": on_grocery_list,
            "reason": reason,
            "priority": priority,
            "estimated_price_usd": 3.99 if category == "Dairy" else (4.99 if category == "Protein" else 2.49),
            "search_query": f"buy {item_name} grocery",
            "search_url": search_url
        })

    return {
        "success": True,
        "suggestions": suggestions[:8]
    }

