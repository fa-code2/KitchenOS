import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine, SessionLocal
from app.core.seed_data import seed_initial_database

@pytest.fixture(scope="session", autouse=True)
def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_initial_database(db)
    db.close()

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_get_pantry_items():
    response = client.get("/api/v1/pantry")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    first = data[0]
    assert "name" in first
    assert "freshness_score" in first
    assert "days_remaining" in first

def test_add_and_consume_pantry_item():
    new_item = {
        "name": "Fresh Organic Strawberries",
        "category": "Produce",
        "quantity": 2.0,
        "unit": "punnet",
        "location": "Fridge"
    }
    create_resp = client.post("/api/v1/pantry", json=new_item)
    assert create_resp.status_code == 200
    created = create_resp.json()
    assert created["name"] == "Fresh Organic Strawberries"
    item_id = created["id"]

    # Consume item
    consume_resp = client.post(f"/api/v1/pantry/{item_id}/consume?quantity=1.0")
    assert consume_resp.status_code == 200
    assert "remaining" in consume_resp.json()

def test_zero_waste_recipes():
    response = client.get("/api/v1/recipes/zero-waste")
    assert response.status_code == 200
    recipes = response.json()
    assert isinstance(recipes, list)
    assert len(recipes) >= 1
    assert "title" in recipes[0]
    assert "ingredients" in recipes[0]

def test_grocery_auto_generate():
    resp = client.post("/api/v1/grocery/auto-generate")
    assert resp.status_code == 200
    assert "items" in resp.json()

def test_second_life_guides():
    resp = client.get("/api/v1/second-life")
    assert resp.status_code == 200
    guides = resp.json()
    assert isinstance(guides, list)
    assert len(guides) > 0

def test_meal_planner():
    resp = client.get("/api/v1/meal-plan")
    assert resp.status_code == 200
    data = resp.json()
    assert "schedule" in data
    assert "pantry_coverage_percentage" in data

def test_analytics_summary():
    resp = client.get("/api/v1/analytics/summary")
    assert resp.status_code == 200
    summary = resp.json()
    assert "total_items_tracked" in summary
    assert "freshness_health_avg" in summary
    assert "waste_reduction_rate_pct" in summary

def test_vision_scan():
    import io
    from PIL import Image, ImageDraw

    # Create a synthetic image of red apple and yellow banana
    img = Image.new("RGB", (400, 300), color=(240, 240, 240))
    draw = ImageDraw.Draw(img)
    # Red apple circle
    draw.ellipse([50, 50, 180, 180], fill=(220, 30, 30))
    # Yellow banana shape
    draw.ellipse([220, 80, 360, 240], fill=(240, 210, 40))

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"file": ("test_fruit.jpg", buf, "image/jpeg")}
    resp = client.post("/api/v1/vision/scan", files=files)
    assert resp.status_code == 200
    data = resp.json()
    assert data["detected_count"] >= 1
    assert "items" in data
    assert len(data["items"]) >= 1
    assert "name" in data["items"][0]
    assert "category" in data["items"][0]
    assert "estimated_shelf_life_days" in data["items"][0]

def test_auth_registration_and_login():
    import uuid
    unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    
    # 1. Register new user
    reg_payload = {
        "email": unique_email,
        "password": "securepassword123",
        "full_name": "Test Chef"
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 200
    reg_data = reg_resp.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == unique_email
    assert reg_data["user"]["full_name"] == "Test Chef"
    token = reg_data["access_token"]

    # 2. Duplicate registration should fail (400)
    dup_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_resp.status_code == 400

    # 3. Login with credentials
    login_resp = client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": "securepassword123"
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "access_token" in login_data
    assert login_data["user"]["email"] == unique_email

    # 4. Login with wrong password should fail (401)
    bad_login = client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": "wrongpassword"
    })
    assert bad_login.status_code == 401

    # 5. Access /me profile endpoint with Bearer token
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == unique_email
    assert me_data["is_active"] is True

