import urllib.request
import json
import sys

base_url = 'http://localhost:8000/api/v1'

def test_endpoint(name, req):
    try:
        response = urllib.request.urlopen(req, timeout=30)
        data = json.loads(response.read().decode('utf-8'))
        print(f'[SUCCESS] {name} - Status {response.status}')
        return data
    except Exception as e:
        print(f'[ERROR] {name} failed: {e}')
        return None

print("Running API tests...")

# 1. Test Pantry
req_pantry = urllib.request.Request(f'{base_url}/pantry')
pantry_data = test_endpoint('GET Pantry', req_pantry)
if pantry_data:
    print(f'   -> Returned {len(pantry_data)} items.')
    if len(pantry_data) > 0:
        print(f'   -> First item: {pantry_data[0].get("name")}')

# 2. Test Analytics
req_analytics = urllib.request.Request(f'{base_url}/analytics/summary')
analytics_data = test_endpoint('GET Analytics', req_analytics)
if analytics_data:
    print(f'   -> Analytics data loaded successfully.')

# 3. Test Zero Waste Recipes (AI)
req_recipes = urllib.request.Request(
    f'{base_url}/recipes/zero-waste',
    data=json.dumps({"items": [{"name": "Eggs", "category": "Protein"}]}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
recipe_data = test_endpoint('POST Zero-Waste Chef (AI)', req_recipes)
if recipe_data and len(recipe_data) > 0:
    print(f'   -> AI Recipe generated: {recipe_data[0].get("title", recipe_data[0])}')

# 4. Test Meal Plan
req_mealplan = urllib.request.Request(f'{base_url}/meal-plan')
mealplan_data = test_endpoint('GET Meal Plan', req_mealplan)
if mealplan_data:
    print(f'   -> Weekly plan fetched successfully.')

# 5. Test Voice Command (AI NLP)
req_voice = urllib.request.Request(
    f'{base_url}/voice/command',
    data=json.dumps({"transcript": "I just finished the milk"}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
voice_data = test_endpoint('POST Voice Command (AI)', req_voice)
if voice_data:
    print(f'   -> AI Voice Parser Output: {voice_data}')

print("Tests completed.")
