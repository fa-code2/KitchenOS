import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine, SessionLocal
from app.core.seed_data import seed_initial_database
from app.services.spoilage.engine import spoilage_engine

@pytest.fixture(scope="session", autouse=True)
def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_initial_database(db)
    db.close()

client = TestClient(app)

# ============================================================================
# 1. Deterministic Spoilage Engine Tests
# ============================================================================

def test_spoilage_engine_baselines():
    # Test Indian staples
    paneer_meta = spoilage_engine.get_baseline_shelf_life("Fresh Paneer", "Dairy", "Fridge")
    assert paneer_meta["baseline_days"] == 7.0
    
    dal_meta = spoilage_engine.get_baseline_shelf_life("Cooked Yellow Dal", "Protein", "Fridge")
    assert dal_meta["baseline_days"] == 4.0

    curd_meta = spoilage_engine.get_baseline_shelf_life("Dahi / Curd", "Dairy", "Fridge")
    assert curd_meta["baseline_days"] == 7.0

    # Test USDA FoodKeeper staples
    spinach_meta = spoilage_engine.get_baseline_shelf_life("Baby Spinach", "Produce", "Fridge")
    assert spinach_meta["baseline_days"] == 5.0

    salmon_meta = spoilage_engine.get_baseline_shelf_life("Salmon", "Protein", "Fridge")
    assert salmon_meta["baseline_days"] == 2.0

def test_spoilage_engine_decay_formula():
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    # Item purchased 2 days ago with 5 day baseline
    decay = spoilage_engine.calculate_spoilage(
        item_name="Baby Spinach",
        category="Produce",
        location="Fridge",
        purchase_date=now - timedelta(days=2)
    )
    assert decay["days_remaining"] == 3.0
    assert decay["hours_remaining"] == 72.0
    assert 0 < decay["freshness_score"] < 100
    assert decay["urgency"] in ["fresh", "moderate"]

def test_pantry_freshness_status_endpoint():
    resp = client.get("/api/v1/pantry/freshness-status")
    assert resp.status_code == 200
    data = resp.json()
    assert "pantry_freshness_average" in data
    assert "items" in data
    assert len(data["items"]) > 0
    first = data["items"][0]
    assert "freshness_score" in first
    assert "days_remaining" in first
    assert "hours_remaining" in first
    assert "status_badge" in first
    assert "color_hex" in first

def test_pantry_simulate_spoilage_endpoint():
    payload = {
        "item_name": "Paneer",
        "category": "Dairy",
        "location": "Fridge",
        "temp_factor": 1.0,
        "days_ahead": 10
    }
    resp = client.post("/api/v1/pantry/simulate-spoilage", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "simulation_curve" in data
    assert len(data["simulation_curve"]) > 5
    first_point = data["simulation_curve"][0]
    assert first_point["freshness"] == 100.0

def test_pantry_item_freshness_detail_endpoint():
    # Get any item from pantry
    items_resp = client.get("/api/v1/pantry")
    assert items_resp.status_code == 200
    items = items_resp.json()
    assert len(items) > 0
    item_id = items[0]["id"]

    resp = client.get(f"/api/v1/pantry/{item_id}/freshness")
    assert resp.status_code == 200
    data = resp.json()
    assert data["item_id"] == item_id
    assert "simulation_curve" in data
    assert "hours_remaining" in data

# ============================================================================
# 2. Zero-Waste Chef Tests
# ============================================================================

def test_zero_waste_recipes_get():
    resp = client.get("/api/v1/recipes/zero-waste")
    assert resp.status_code == 200
    recipes = resp.json()
    assert isinstance(recipes, list)
    assert len(recipes) == 3
    for r in recipes:
        assert "title" in r
        assert "description" in r
        assert "ingredients" in r
        assert "instructions" in r
        assert "waste_saved_score" in r
        assert "calories" in r
        assert "protein_g" in r

def test_zero_waste_recipes_post_inventory():
    custom_inventory = {
        "items": [
            {"name": "Paneer (Cottage Cheese)", "category": "Dairy", "location": "Fridge", "days_remaining": 1.0, "freshness_score": 25.0},
            {"name": "Cooked Dal", "category": "Protein", "location": "Fridge", "days_remaining": 1.5, "freshness_score": 30.0},
            {"name": "Baby Spinach", "category": "Produce", "location": "Fridge", "days_remaining": 2.0, "freshness_score": 40.0}
        ]
    }
    resp = client.post("/api/v1/recipes/zero-waste", json=custom_inventory)
    assert resp.status_code == 200
    recipes = resp.json()
    assert len(recipes) == 3

def test_recipe_cook_deduct():
    cook_payload = {
        "recipe_title": "Zero-Waste Veggie Skillet",
        "ingredients_to_deduct": ["Baby Spinach"]
    }
    resp = client.post("/api/v1/recipes/cook", json=cook_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True

# ============================================================================
# 3. Second Life Hub Tests
# ============================================================================

def test_second_life_all_guides():
    resp = client.get("/api/v1/second-life")
    assert resp.status_code == 200
    guides = resp.json()
    assert len(guides) >= 5
    # Verify categories: Household & Cleaning, Gardening & Soil, DIY Personal Care, etc.
    categories = [g["category"] for g in guides]
    assert "Household & Cleaning" in categories
    assert "Gardening & Soil" in categories

def test_second_life_for_pantry():
    resp = client.get("/api/v1/second-life/for-pantry")
    assert resp.status_code == 200
    data = resp.json()
    assert "matched_items" in data
    assert "guides" in data

def test_second_life_query_retrieval():
    resp = client.post("/api/v1/second-life/query", json={"query": "sour curd"})
    assert resp.status_code == 200
    guide = resp.json()
    assert "title" in guide
    assert "instructions" in guide
    assert "environmental_impact" in guide

    resp2 = client.post("/api/v1/second-life/query", json={"query": "citrus peel"})
    assert resp2.status_code == 200
    assert "Citrus" in resp2.json()["title"] or "Vinegar" in resp2.json()["title"]

# ============================================================================
# 4. Voice Inventory Logging Tests
# ============================================================================

def test_voice_command_logging_and_audio():
    # Spoken kitchen command
    voice_input = {
        "transcript": "Hey Kitchen OS, I just used half the cottage cheese and put 200g of cooked dal in the fridge"
    }
    resp = client.post("/api/v1/voice/command", json=voice_input)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert len(data["actions_parsed"]) >= 2
    assert "spoken_confirmation" in data
    assert "audio_base64" in data
    assert data["audio_base64"].startswith("data:audio/")

def test_voice_tts_endpoint():
    resp = client.post("/api/v1/voice/tts", json={"text": "Pantry updated successfully."})
    assert resp.status_code == 200
    assert resp.headers["content-type"] in ["audio/mpeg", "audio/wav"]
    assert len(resp.content) > 100

# ============================================================================
# 5. Family Meal Planner & Macro Analytics Tests
# ============================================================================

def test_generate_family_meal_plan_high_protein_high_fiber():
    payload = {
        "dietary_goals": ["high_protein", "high_fiber"],
        "plan_type": "weekly",
        "target_calories_per_day": 2000,
        "family_size": 3,
        "save_to_schedule": True
    }
    resp = client.post("/api/v1/meal-plan/generate-family-plan", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["plan_type"] == "weekly"
    assert data["daily_average_calories"] > 1000
    assert data["daily_average_protein_g"] >= 40.0
    assert data["daily_average_fiber_g"] >= 15.0
    assert "macro_split_pct" in data
    assert "protein_pct" in data["macro_split_pct"]
    assert "pantry_coverage_percentage" in data
    assert len(data["schedule"]) >= 14 # 2-3 meals/day for 7 days

def test_generate_weekend_meal_plan():
    payload = {
        "dietary_goals": ["high_protein"],
        "plan_type": "weekend",
        "save_to_schedule": False
    }
    resp = client.post("/api/v1/meal-plan/generate-family-plan", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["plan_type"] == "weekend"
    assert len(data["schedule"]) >= 4

def test_meal_plan_macro_analytics_get():
    resp = client.get("/api/v1/meal-plan/macro-analytics")
    assert resp.status_code == 200
    data = resp.json()
    assert "macro_split_pct" in data
    assert "daily_average_protein_g" in data
    assert "dietary_goals_adherence" in data

def test_existing_frontend_meal_plan_contract():
    # Existing frontend MealPlanner.jsx calls GET /api/v1/meal-plan
    resp = client.get("/api/v1/meal-plan")
    assert resp.status_code == 200
    data = resp.json()
    # Expected contract fields
    assert "schedule" in data
    assert "total_weekly_calories" in data
    assert "pantry_coverage_percentage" in data
    assert "missing_ingredients" in data
    assert isinstance(data["schedule"], list)
    if len(data["schedule"]) > 0:
        first = data["schedule"][0]
        assert "day_of_week" in first
        assert "meal_type" in first
        assert "recipe_name" in first
        assert "calories" in first

def test_voice_command_consume_and_reject():
    # 1. Voice consume
    resp1 = client.post("/api/v1/voice/command", json={"transcript": "Hey Kitchen OS, I just used half the cottage cheese"})
    assert resp1.status_code == 200
    d1 = resp1.json()
    assert d1["success"] is True
    assert len(d1["actions_parsed"]) > 0
    assert any(a["action"] == "consume" for a in d1["actions_parsed"])

    # 2. Voice update
    resp2 = client.post("/api/v1/voice/command", json={"transcript": "update the cooked dal to 200g"})
    assert resp2.status_code == 200
    d2 = resp2.json()
    assert d2["success"] is True
    assert any(a["action"] == "update" for a in d2["actions_parsed"])

    # 3. Voice add (must be rejected)
    resp3 = client.post("/api/v1/voice/command", json={"transcript": "I bought paneer and added it to fridge"})
    assert resp3.status_code == 200
    d3 = resp3.json()
    assert any(a["action"] == "add_rejected" for a in d3["actions_parsed"])
    assert any("can't add items by voice" in a.get("message", "") for a in d3["actions_parsed"])

def test_grocery_behavior_suggestions():
    resp = client.get("/api/v1/grocery/behavior-suggestions")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "suggestions" in data
    assert len(data["suggestions"]) > 0
    first = data["suggestions"][0]
    assert "name" in first
    assert "reason" in first
    assert "search_url" in first

