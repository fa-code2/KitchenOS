import json
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings

class ZeroWasteChefEngine:
    def __init__(self):
        self.gemini_api_key = settings.GEMINI_API_KEY
        self.gemini_model = settings.GEMINI_MODEL or "gemini-3.7-flash"
        self.groq_api_key = settings.GROQ_API_KEY
        self.groq_model = settings.GROQ_MODEL or "llama-3.1-8b-instant"
        self.openrouter_api_key = settings.OPENROUTER_API_KEY
        self.openrouter_model = settings.OPENROUTER_MODEL or "openai/gpt-4o-mini"


    async def generate_recipes_for_pantry(self, pantry_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Inverts meal planning by monitoring active inventory and prioritizing items closest to expiration.
        Uses Gemini 1.5 Flash configured for structured JSON output with Groq LLM fallback.
        """
        if not pantry_items:
            return self._get_fallback_recipes([])

        # Sort items by days remaining / freshness score ascending (most urgent first)
        urgent_items = sorted(
            pantry_items,
            key=lambda x: (x.get("days_remaining", 99.0), x.get("freshness_score", 100.0))
        )

        # 1. Primary Engine: Gemini 1.5 Flash with structured JSON output
        if self.gemini_api_key and len(self.gemini_api_key.strip()) > 5:
            try:
                gemini_recipes = await self._query_gemini(urgent_items)
                if gemini_recipes and len(gemini_recipes) >= 3:
                    return gemini_recipes[:3]
            except Exception as e:
                print(f"[ZeroWasteChef] Gemini 1.5 Flash query failed ({e}), checking Groq.")

        # 2. Secondary Engine: Groq LLM
        if self.groq_api_key and len(self.groq_api_key.strip()) > 5:
            try:
                ai_recipes = await self._query_groq(urgent_items)
                if ai_recipes and len(ai_recipes) >= 3:
                    return ai_recipes[:3]
            except Exception as e:
                print(f"[ZeroWasteChef] Groq query failed ({e}), using culinary heuristics.")

        # 3. Third Engine: OpenRouter LLM fallback
        if self.openrouter_api_key and len(self.openrouter_api_key.strip()) > 5:
            try:
                ai_recipes = await self._query_openrouter(urgent_items)
                if ai_recipes and len(ai_recipes) >= 3:
                    return ai_recipes[:3]
            except Exception as e:
                print(f"[ZeroWasteChef] OpenRouter query failed ({e}), using culinary heuristics.")

        # 4. Deterministic Inverted Culinary Engine (supports Indian staples + USDA FoodKeeper)
        return self._get_fallback_recipes(urgent_items)

    async def _query_gemini(self, items: List[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
        """Call Gemini 1.5 Flash configured for structured JSON output."""
        ingredient_lines = [
            f"- {i['name']} (Quantity: {i.get('quantity', 1)} {i.get('unit', 'units')}, Category: {i.get('category', 'Produce')}, Freshness: {i.get('freshness_score', 100)}%, {i.get('days_remaining', 5)} days remaining)"
            for i in items[:12]
        ]
        ingredient_summary = "\n".join(ingredient_lines)

        prompt = f"""
You are the Kitchen OS Zero-Waste Chef culinary AI. Your mission is to invert meal planning: instead of shopping for ingredients to match recipes, you inspect the active pantry inventory and craft 3 delicious recipes designed specifically to rescue ingredients closest to expiration.

CURRENT PANTRY INVENTORY (Sorted by Expiry Urgency - prioritize top items):
{ingredient_summary}

REQUIREMENTS:
Generate exactly 3 diverse, enticing recipes:
1. "Quick & Easy Weeknight Save" (under 20 minutes)
2. "Chef's Signature Zero-Waste Feast" (vibrant, gourmet, high waste recovery)
3. "Batch-Cook & Preserve / Rescue" (casserole, stew, stir-fry, or soup that freezes/stores well)

Return a strictly valid JSON array of 3 objects matching this exact structure:
[
  {{
    "title": "String",
    "description": "Short appetizing 2-sentence description highlighting waste saved",
    "prep_time_minutes": 15,
    "cook_time_minutes": 20,
    "difficulty": "Easy",
    "servings": 2,
    "calories": 420,
    "protein_g": 24.0,
    "carbs_g": 42.0,
    "fat_g": 14.0,
    "waste_saved_score": 95.0,
    "expiring_ingredients_used": ["Item1", "Item2"],
    "ingredients": [
      {{"name": "Item1", "amount": "1 cup", "unit": "cup", "from_pantry": true, "expiring": true}},
      {{"name": "Olive oil / Spices", "amount": "1 tbsp", "unit": "tbsp", "from_pantry": false, "expiring": false}}
    ],
    "instructions": [
      "Step 1...",
      "Step 2...",
      "Step 3..."
    ],
    "second_life_tips": "Advice for scraps or leftovers from this dish (e.g. peel broths or compost tips)"
  }}
]
"""
        clean_key = self.gemini_api_key.strip()
        headers = {"Content-Type": "application/json"}
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={clean_key}"

        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.4
            }
        }

        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        raw_text = parts[0].get("text", "")
                        parsed = json.loads(raw_text)
                        if isinstance(parsed, list):
                            return parsed
                        elif isinstance(parsed, dict) and "recipes" in parsed:
                            return parsed["recipes"]
            else:
                print(f"[Gemini 1.5 Flash] HTTP Error {resp.status_code}: {resp.text}")
        return None

    async def _query_groq(self, items: List[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
        """Call Groq API for customized zero-waste recipes."""
        ingredient_summary = ", ".join([
            f"{i['name']} ({i.get('days_remaining', 5)}d left)"
            for i in items[:8]
        ])

        system_prompt = (
            "You are the Kitchen OS Zero-Waste Chef. Create 3 delicious recipes prioritizing expiring pantry ingredients. "
            "Return JSON object with key 'recipes' containing array of 3 recipe objects."
        )

        user_prompt = f"""
Available ingredients: {ingredient_summary}.
Generate 3 recipes:
1. 'Quick & Easy Weeknight Save'
2. 'Chef's Signature Zero-Waste Feast'
3. 'Batch-Cook & Preserve / Rescue'

Structure each recipe with: title, description, prep_time_minutes, cook_time_minutes, difficulty, servings, calories, protein_g, carbs_g, fat_g, waste_saved_score, expiring_ingredients_used, ingredients (array of {{name, amount, unit, from_pantry, expiring}}), instructions (array of strings), second_life_tips.
"""
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.groq_api_key.strip()}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.groq_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.4,
                    "response_format": {"type": "json_object"}
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                if isinstance(parsed, list):
                    return parsed
                elif isinstance(parsed, dict) and "recipes" in parsed:
                    return parsed["recipes"]
                elif isinstance(parsed, dict):
                    for k, v in parsed.items():
                        if isinstance(v, list) and len(v) >= 1:
                            return v
        return None

    async def _query_openrouter(self, items: List[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
        """Call OpenRouter for customized zero-waste recipes."""
        ingredient_summary = ", ".join([
            f"{i['name']} ({i.get('days_remaining', 5)}d left)"
            for i in items[:8]
        ])

        system_prompt = (
            "You are the Kitchen OS Zero-Waste Chef. Create 3 delicious recipes prioritizing expiring pantry ingredients. "
            "Return JSON object with key 'recipes' containing array of 3 recipe objects."
        )

        user_prompt = f"""
Available ingredients: {ingredient_summary}.
Generate 3 recipes:
1. 'Quick & Easy Weeknight Save'
2. 'Chef's Signature Zero-Waste Feast'
3. 'Batch-Cook & Preserve / Rescue'

Structure each recipe with: title, description, prep_time_minutes, cook_time_minutes, difficulty, servings, calories, protein_g, carbs_g, fat_g, waste_saved_score, expiring_ingredients_used, ingredients (array of {{name, amount, unit, from_pantry, expiring}}), instructions (array of strings), second_life_tips.
"""
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openrouter_api_key.strip()}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.openrouter_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.4,
                    "response_format": {"type": "json_object"}
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                if isinstance(parsed, list):
                    return parsed
                elif isinstance(parsed, dict) and "recipes" in parsed:
                    return parsed["recipes"]
                elif isinstance(parsed, dict):
                    for k, v in parsed.items():
                        if isinstance(v, list) and len(v) >= 1:
                            return v
            else:
                print(f"[OpenRouter] HTTP Error {resp.status_code}: {resp.text}")
        return None

    def _get_fallback_recipes(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Intelligent culinary heuristic recipe builder that tailors recipes."""
        names = [i.get("name", "").lower() for i in items]
        has_spinach = any("spinach" in n or "palak" in n or "green" in n for n in names)
        has_dairy = any("paneer" in n or "cheese" in n or "curd" in n or "dahi" in n or "milk" in n for n in names)
        has_bread = any("bread" in n or "roti" in n or "loaf" in n for n in names)

        recipes = []

        # 1. Quick Weeknight Save
        if has_spinach and has_dairy:
            recipes.append({
                "title": "Quick Sautéed Garlic Greens & Golden Paneer",
                "description": "Crisp golden paneer cubes tossed with flash-sautéed spinach and roasted garlic. Rescues delicate greens before they wilt.",
                "prep_time_minutes": 10,
                "cook_time_minutes": 10,
                "difficulty": "Easy",
                "servings": 2,
                "calories": 340,
                "protein_g": 22.0,
                "carbs_g": 12.0,
                "fat_g": 24.0,
                "waste_saved_score": 95.0,
                "expiring_ingredients_used": ["Baby Spinach", "Paneer"],
                "ingredients": [
                    {"name": "Baby Spinach", "amount": "200g", "unit": "grams", "from_pantry": True, "expiring": True},
                    {"name": "Fresh Paneer", "amount": "150g", "unit": "grams", "from_pantry": True, "expiring": True},
                    {"name": "Garlic & Cumin", "amount": "1 tbsp", "unit": "tbsp", "from_pantry": False, "expiring": False}
                ],
                "instructions": [
                    "Dice paneer into 1-inch cubes and pan-sear in 1 tsp oil until golden-crusted on all sides (3-4 mins).",
                    "Add crushed garlic and cumin seeds to the pan until fragrant.",
                    "Fold in the washed baby spinach and flash-sauté on high heat for 90 seconds until wilted.",
                    "Season with sea salt, lemon juice, and black pepper. Serve warm."
                ],
                "second_life_tips": "Save tough spinach stems in a freezer container to simmer in your weekend vegetable stock broth."
            })
        else:
            recipes.append({
                "title": "15-Minute Pantry Rescue Stir-Fry",
                "description": "High-heat colorful wok toss capturing maximum crunch and nutrients from your urgent produce items.",
                "prep_time_minutes": 10,
                "cook_time_minutes": 8,
                "difficulty": "Easy",
                "servings": 2,
                "calories": 280,
                "protein_g": 14.0,
                "carbs_g": 32.0,
                "fat_g": 10.0,
                "waste_saved_score": 92.0,
                "expiring_ingredients_used": [i.get("name", "Produce") for i in items[:2]],
                "ingredients": [
                    {"name": items[0].get("name", "Vegetable") if items else "Produce Item", "amount": "1 cup", "unit": "cup", "from_pantry": True, "expiring": True},
                    {"name": items[1].get("name", "Staple") if len(items) > 1 else "Tofu/Egg", "amount": "1 portion", "unit": "portion", "from_pantry": True, "expiring": True},
                    {"name": "Soy Sauce & Sesame Oil", "amount": "1 tbsp", "unit": "tbsp", "from_pantry": False, "expiring": False}
                ],
                "instructions": [
                    "Slice all vegetables into uniform thin strips for rapid cooking.",
                    "Heat oil in a wok or heavy skillet until smoking hot.",
                    "Flash fry hearty ingredients first (carrots, onions), then add tender greens.",
                    "Deglaze with soy sauce, garlic, and a splash of vinegar."
                ],
                "second_life_tips": "Vegetable peels and offcuts make nutrient-dense compost tea or scrap broth."
            })

        # 2. Chef's Signature Feast
        recipes.append({
            "title": "Rustic Zero-Waste Shakshuka / Skillet Bake",
            "description": "Rich simmered tomato, pepper, and pantry bean skillet topped with herbs. The ultimate culinary canvas for clearing crisper drawers.",
            "prep_time_minutes": 15,
            "cook_time_minutes": 20,
            "difficulty": "Easy",
            "servings": 3,
            "calories": 390,
            "protein_g": 18.0,
            "carbs_g": 38.0,
            "fat_g": 18.0,
            "waste_saved_score": 98.0,
            "expiring_ingredients_used": [i.get("name", "Pantry Item") for i in items[:3]],
            "ingredients": [
                {"name": "Tomatoes / Tomato Sauce", "amount": "2 cups", "unit": "cups", "from_pantry": True, "expiring": True},
                {"name": "Eggs or Paneer", "amount": "3 units", "unit": "units", "from_pantry": True, "expiring": True},
                {"name": "Bell Peppers & Onions", "amount": "1 cup", "unit": "cup", "from_pantry": True, "expiring": True},
                {"name": "Smoked Paprika & Cumin", "amount": "1 tsp", "unit": "tsp", "from_pantry": False, "expiring": False}
            ],
            "instructions": [
                "Sauté diced onions, peppers, and garlic in olive oil until caramelized.",
                "Pour in chopped tomatoes, paprika, and cumin; simmer gently for 10 minutes into a rich sauce.",
                "Make small wells in the simmering sauce and crack eggs or crumble paneer into each well.",
                "Cover and cook on low heat for 5-7 minutes until whites are set but yolks remain soft.",
                "Garnish with cilantro or parsley and serve directly from the skillet with crusty bread."
            ],
            "second_life_tips": "Use stale bread ends to make oven-toasted garlic croutons or savory breadcrumbs."
        })

        # 3. Batch-Cook & Preserve / Rescue
        recipes.append({
            "title": "Golden Roasted Scraps & Root Veggie Bisque",
            "description": "Velvety, deeply comforting soup that blends miscellaneous vegetables into a luxurious, freezer-friendly meal.",
            "prep_time_minutes": 15,
            "cook_time_minutes": 25,
            "difficulty": "Easy",
            "servings": 4,
            "calories": 240,
            "protein_g": 8.0,
            "carbs_g": 34.0,
            "fat_g": 9.0,
            "waste_saved_score": 96.0,
            "expiring_ingredients_used": [i.get("name", "Root Vegetable") for i in items[:4]],
            "ingredients": [
                {"name": "Mixed Crisp Vegetables", "amount": "4 cups", "unit": "cups", "from_pantry": True, "expiring": True},
                {"name": "Vegetable or Dal Broth", "amount": "3 cups", "unit": "cups", "from_pantry": True, "expiring": False},
                {"name": "Olive Oil & Thyme", "amount": "2 tbsp", "unit": "tbsp", "from_pantry": False, "expiring": False}
            ],
            "instructions": [
                "Chop all vegetables into rough chunks; toss with olive oil, salt, and thyme.",
                "Roast at 200°C (400°F) for 20 minutes until caramelized with blistered edges.",
                "Transfer roasted veggies to a soup pot with hot broth; simmer for 5 minutes.",
                "Blend with an immersion blender until silky smooth.",
                "Portion into jars: enjoy half now and freeze the rest for up to 3 months."
            ],
            "second_life_tips": "Freeze any leftover soup in silicone muffin trays for instant individual lunch portions."
        })

        return recipes

chef_engine = ZeroWasteChefEngine()
zero_waste_chef = chef_engine

