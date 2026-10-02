import json
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings

# Comprehensive Circular Kitchen Knowledge Base (Home Remedies, Vinegar, Compost, Soil, Cleaners)
SECOND_LIFE_KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    {
        "id": "citrus-cleaner",
        "category": "Household & Cleaning",
        "title": "All-Natural Citrus Peel Cleaning Vinegar",
        "target_items": ["Orange", "Lemon", "Lime", "Grapefruit", "Citrus", "Orange Peels", "Lemon Peels"],
        "icon": "Sparkles",
        "difficulty": "Very Easy",
        "time_required": "10 mins prep (2 weeks infuse)",
        "description": "Transform spent citrus rinds into a non-toxic, grease-cutting countertop cleaner that smells amazing.",
        "materials_needed": ["Citrus peels", "White distilled vinegar", "Glass mason jar", "Spray bottle"],
        "instructions": [
            "Pack used citrus peels tightly into a clean glass jar.",
            "Pour white vinegar over the peels until completely submerged.",
            "Seal and store in a cool, dark cabinet for 2 weeks.",
            "Strain the infused liquid into a spray bottle and dilute 1:1 with water for kitchen counters, sinks, and tile."
        ],
        "environmental_impact": "Avoids synthetic chemical cleaners and saves 100% of citrus peel waste."
    },
    {
        "id": "sour-curd-hair-remedy",
        "category": "DIY Personal Care & Garden",
        "title": "Sour Curd & Fenugreek Scalp Rescue Mask",
        "target_items": ["Curd", "Dahi", "Yogurt", "Sour Curd", "Dairy"],
        "icon": "Sparkles",
        "difficulty": "Very Easy",
        "time_required": "5 mins prep (30 mins application)",
        "description": "Sour curd that has turned too acidic for eating is packed with natural lactic acid and zinc, making it the ultimate natural cooling anti-dandruff and deep-conditioning hair pack.",
        "materials_needed": ["1/2 cup sour curd / dahi", "1 tsp honey or fenugreek powder", "1 tsp mustard oil or coconut oil"],
        "instructions": [
            "Whisk sour curd in a bowl until smooth and lump-free.",
            "Mix in 1 tsp honey or oil to balance moisture.",
            "Apply generously to dry scalp and hair strands, gently massaging in circular motions.",
            "Leave for 30 minutes, then rinse with lukewarm water and a mild shampoo."
        ],
        "environmental_impact": "Zero-waste home remedy that replaces expensive chemical salon treatments."
    },
    {
        "id": "apple-scrap-vinegar",
        "category": "Household & Cleaning",
        "title": "Zero-Waste Apple Scrap Cider Vinegar",
        "target_items": ["Apple", "Apples", "Apple Cores", "Apple Peels"],
        "icon": "Sparkles",
        "difficulty": "Easy",
        "time_required": "10 mins prep (3-4 weeks ferment)",
        "description": "Ferment apple peels, cores, and bruised apple halves with sugar water to create raw, probiotic apple cider vinegar.",
        "materials_needed": ["Apple cores & peels", "1 tbsp raw cane sugar per cup of water", "Clean jar", "Breathable cloth & rubber band"],
        "instructions": [
            "Fill a clean glass jar 3/4 full with raw apple scraps and cores.",
            "Dissolve 1 tbsp sugar in 1 cup filtered warm water; pour over scraps until fully submerged.",
            "Cover mouth with breathable cheesecloth or paper towel and secure with a rubber band.",
            "Stir daily for the first week to prevent mold, then let ferment undisturbed for 3-4 weeks until tart and vinegary.",
            "Strain out apple solids into compost and bottle your homemade artisanal vinegar."
        ],
        "environmental_impact": "Replaces factory-produced vinegar and diverts fibrous fruit cores from landfills."
    },
    {
        "id": "banana-fertilizer",
        "category": "Gardening & Soil",
        "title": "Organic Potassium-Rich Banana Peel Tea",
        "target_items": ["Banana", "Banana Peels", "Overripe Banana"],
        "icon": "Sprout",
        "difficulty": "Easy",
        "time_required": "5 mins prep (48 hrs steep)",
        "description": "Feed houseplants, roses, and garden tomatoes with potassium, calcium, and phosphorus extracted naturally from steeped banana peels.",
        "materials_needed": ["2-3 Banana peels", "1 Quart of warm water", "Pitcher or mason jar"],
        "instructions": [
            "Chop spent banana peels into 1-inch strips.",
            "Submerge peels in a pitcher of water and let steep for 48 hours at room temperature.",
            "Strain liquid and water your indoor plants, potted herbs, or tomato plants directly at the soil base.",
            "Add the softened steeped peels into your compost bin or bury directly near plant roots."
        ],
        "environmental_impact": "Replaces chemical synthetic nitrogen/potassium fertilizers with circular organic nutrients."
    },
    {
        "id": "stale-bread-croutons",
        "category": "Culinary Upcycling",
        "title": "Herbed Garlic Sourdough Croutons & Pangrattato",
        "target_items": ["Bread", "Bakery", "Baguette", "Sourdough", "Roti", "Stale Bread"],
        "icon": "Utensils",
        "difficulty": "Easy",
        "time_required": "15 mins",
        "description": "Turn rock-hard, stale bread or dry rotis into crisp, golden garlic croutons or crunchy toasted Italian breadcrumb topping (Pangrattato).",
        "materials_needed": ["Stale bread slices or dried rotis", "Olive oil or ghee", "Garlic powder", "Italian herbs or chaat masala", "Sea salt"],
        "instructions": [
            "Cut stale bread into 1/2-inch cubes (or pulse in a processor into coarse breadcrumbs).",
            "Toss liberally with olive oil, minced garlic, sea salt, and dried rosemary or thyme.",
            "Bake on a sheet at 375°F (190°C) for 10-12 minutes until deeply golden and crunchy.",
            "Store in an airtight mason jar for up to 3 weeks. Incredible on soups, salads, and pasta."
        ],
        "environmental_impact": "Rescues bakery goods from landfills, saving energy, wheat harvest, and water resources."
    },
    {
        "id": "freezer-scrap-stock",
        "category": "Culinary Upcycling",
        "title": "Zero-Waste Golden Vegetable Scraps Broth",
        "target_items": ["Carrot", "Celery", "Onion", "Garlic", "Spinach", "Mushroom", "Produce", "Vegetable Scraps"],
        "icon": "Flame",
        "difficulty": "Easy",
        "time_required": "45 mins simmer",
        "description": "Store all vegetable ends, peels, and herb stems in a freezer gallon bag until full, then simmer into rich, mineral-packed homemade stock.",
        "materials_needed": ["Assorted vegetable trimmings (carrot tops, onion skins, celery ends, mushroom stems)", "8 cups cold water", "Bay leaf", "Peppercorns"],
        "instructions": [
            "Keep a container in your freezer and toss in clean vegetable trimmings whenever you cook.",
            "Once full, dump the scraps into a large stockpot and cover with cold water.",
            "Add a bay leaf and whole black peppercorns. Bring to a rolling boil, then simmer covered for 45-60 minutes.",
            "Strain out the solids into your compost bin and refrigerate or freeze the rich broth for soups and curries."
        ],
        "environmental_impact": "Extracts 100% of trace minerals and aromatic flavor from scraps before composting."
    },
    {
        "id": "scallion-regrowth",
        "category": "Regenerative Kitchen",
        "title": "Perpetual Green Onion & Herb Regrowth",
        "target_items": ["Green Onion", "Scallion", "Celery", "Lettuce", "Romaine", "Curry Leaves"],
        "icon": "Leaf",
        "difficulty": "Effortless",
        "time_required": "2 mins (grows in 5 days)",
        "description": "Don't discard scallion root bases or celery stumps! Place them in water on a windowsill to grow fresh, infinite greens.",
        "materials_needed": ["Root base of green onions / scallions (1-2 inches)", "Small shot glass or jar", "Fresh water"],
        "instructions": [
            "Keep the white root ends of your scallions intact with about 1 inch of pale stem.",
            "Stand them upright in a small glass with enough water to cover the roots.",
            "Place on a sunny windowsill and refresh the water every 2 days.",
            "Snip fresh green shoots as they grow back vigorously within 5 to 7 days!"
        ],
        "environmental_impact": "Creates a perpetual circular food cycle directly on your kitchen counter."
    },
    {
        "id": "coffee-ground-scrub",
        "category": "DIY Personal Care & Garden",
        "title": "Exfoliating Coffee & Brown Sugar Body Polish",
        "target_items": ["Coffee", "Beverage", "Coffee Grounds"],
        "icon": "Coffee",
        "difficulty": "Easy",
        "time_required": "5 mins",
        "description": "Repurpose used coffee grounds into a spa-quality stimulating body scrub rich in caffeine and antioxidants.",
        "materials_needed": ["Used dry coffee grounds", "Coconut oil or Olive oil", "Brown sugar or coarse sea salt"],
        "instructions": [
            "Spread spent coffee grounds on a plate to dry completely in the sun or low oven.",
            "Mix 1/2 cup dried coffee grounds with 1/4 cup coconut oil and 2 tbsp brown sugar.",
            "Store in a clean container and use in the shower for smooth, invigorated skin.",
            "Excess grounds can also be sprinkled around acid-loving garden plants like hydrangeas or tomatoes."
        ],
        "environmental_impact": "Prevents methane emissions generated when organic grounds rot anaerobically in municipal landfills."
    },
    {
        "id": "eggshell-calcium-powder",
        "category": "Gardening & Soil",
        "title": "Crushed Eggshell Calcium Soil Booster & Pest Barrier",
        "target_items": ["Eggs", "Eggshells", "Egg"],
        "icon": "Sprout",
        "difficulty": "Easy",
        "time_required": "10 mins",
        "description": "Pure calcium carbonate from eggshells prevents tomato blossom end rot and creates an abrasive natural barrier against slugs.",
        "materials_needed": ["Used eggshells", "Baking sheet", "Blender or mortar and pestle"],
        "instructions": [
            "Rinse eggshells and bake at 200°F (95°C) for 15 minutes to sterilize and make brittle.",
            "Crush into coarse flakes to sprinkle around plant stems as a slug and snail deterrent.",
            "Alternatively, pulverize in a blender into fine powder and mix into potting soil to deliver sustained calcium."
        ],
        "environmental_impact": "100% organic soil amendment replacing industrial mined lime."
    },
    {
        "id": "curdled-milk-whey",
        "category": "Gardening & Soil",
        "title": "Curdled Milk / Whey Plant Foliar Spray & Soil Acidifier",
        "target_items": ["Milk", "Curdled Milk", "Spoiled Milk", "Whey"],
        "icon": "Sprout",
        "difficulty": "Very Easy",
        "time_required": "5 mins",
        "description": "Milk that has soured naturally can be separated into curds (for compost) and liquid whey, which is a potent natural fungicide against powdery mildew.",
        "materials_needed": ["Soured / curdled milk", "Strainer or cheesecloth", "Water", "Spray bottle"],
        "instructions": [
            "Strain soured milk to separate the watery liquid whey from solid curds.",
            "Dilute 1 part whey with 9 parts water in a garden spray bottle.",
            "Spray leaves of squash, roses, or cucumbers in bright sunlight to prevent powdery mildew and fungal blights.",
            "Dig solid curds deep into your compost pile as a protein and microbe booster."
        ],
        "environmental_impact": "Replaces copper and synthetic chemical fungicides with natural lactobacillus cultures."
    }
]

class SecondLifeHubService:
    def __init__(self):
        self.gemini_api_key = settings.GEMINI_API_KEY
        self.openrouter_api_key = settings.OPENROUTER_API_KEY
        self.openrouter_model = settings.OPENROUTER_MODEL or "openai/gpt-4o-mini"
        self.knowledge_base = SECOND_LIFE_KNOWLEDGE_BASE

    def get_all_guides(self) -> List[Dict[str, Any]]:
        return self.knowledge_base

    def get_guides_for_items(self, item_names: List[str]) -> List[Dict[str, Any]]:
        """Find relevant repurposing guides matching specific ingredients."""
        matched = []
        clean_names = [n.lower() for n in item_names]
        
        for guide in self.knowledge_base:
            is_match = False
            for target in guide["target_items"]:
                for iname in clean_names:
                    if target.lower() in iname or iname in target.lower():
                        is_match = True
                        break
                if is_match:
                    break
            if is_match:
                matched.append(guide)
        
        # If no direct matches, return top universal circular guides
        if not matched:
            return self.knowledge_base[:4]
        return matched

    async def retrieve_or_generate_guide(self, query: str) -> Dict[str, Any]:
        """
        LLM Knowledge Retrieval:
        Takes an ingredient query or spoiled item description and retrieves or dynamically
        generates an actionable upcycling guide (home remedy, cleaning vinegar, compost, or soil booster).
        """
        clean_q = query.strip().lower()
        
        # 1. Check local knowledge base for high-confidence match
        for g in self.knowledge_base:
            if any(t.lower() in clean_q or clean_q in t.lower() for t in g["target_items"]):
                return g
            if clean_q in g["title"].lower() or clean_q in g["description"].lower():
                return g

        # 2. Use Gemini 1.5 Flash LLM knowledge retrieval for custom/exotic spoiled goods
        if self.gemini_api_key and len(self.gemini_api_key.strip()) > 5:
            try:
                ai_guide = await self._query_gemini_second_life(query)
                if ai_guide:
                    return ai_guide
            except Exception as e:
                print(f"[SecondLifeHub] Gemini retrieval error ({e}), trying OpenRouter.")

        # 2.5 Try OpenRouter fallback
        if self.openrouter_api_key and len(self.openrouter_api_key.strip()) > 5:
            try:
                ai_guide = await self._query_openrouter_second_life(query)
                if ai_guide:
                    return ai_guide
            except Exception as e:
                print(f"[SecondLifeHub] OpenRouter retrieval error ({e}), falling back to closest knowledge item.")

        # 3. Fallback: return universal circular guide
        fallback = self.knowledge_base[0].copy()
        fallback["title"] = f"Circular Kitchen Guide: Upcycling {query.title()}"
        fallback["target_items"] = [query.title()]
        return fallback

    async def _query_gemini_second_life(self, item_name: str) -> Optional[Dict[str, Any]]:
        """Query Gemini for circular economy upcycling recipe."""
        prompt = f"""
You are the Kitchen OS Second Life Hub circular culinary engine.
A user has an item that is about to spoil or is slightly past its prime: "{item_name}".
Guide them on how to transform this into a delicious Zero-Waste Recipe or Culinary Upcycling idea (e.g., banana bread, vegetable scrap broth, croutons, jams, pickles).

Output strictly valid JSON object matching:
{{
  "id": "slug-name",
  "category": "Culinary Upcycling",
  "title": "Recipe Title",
  "target_items": ["{item_name}"],
  "icon": "Utensils",
  "difficulty": "Easy" | "Medium",
  "time_required": "String (e.g. 15 mins)",
  "description": "Short appetizing description of this zero-waste recipe.",
  "materials_needed": ["{item_name}", "Ingredient 2", "Ingredient 3"],
  "instructions": [
    "Step 1...",
    "Step 2...",
    "Step 3..."
  ],
  "environmental_impact": "How this recipe prevents food waste."
}}
"""
        model_name = settings.GEMINI_MODEL or "gemini-3.7-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.gemini_api_key.strip()}"
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json", "temperature": 0.4}
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
            if resp.status_code == 200:
                data = resp.json()
                parts = data.get("candidates", [])[0].get("content", {}).get("parts", [])
                if parts:
                    return json.loads(parts[0].get("text", ""))
        return None

    async def _query_openrouter_second_life(self, item_name: str) -> Optional[Dict[str, Any]]:
        """Query OpenRouter for a circular economy upcycling recipe."""
        prompt = f"""
You are the Kitchen OS Second Life Hub circular culinary engine.
A user has an item that is about to spoil or is slightly past its prime: "{item_name}".
Guide them on how to transform this into a delicious Zero-Waste Recipe or Culinary Upcycling idea.

Output strictly valid JSON object matching:
{{
  "id": "slug-name",
  "category": "Culinary Upcycling",
  "title": "Recipe Title",
  "target_items": ["{item_name}"],
  "icon": "Utensils",
  "difficulty": "Easy" | "Medium",
  "time_required": "String (e.g. 15 mins)",
  "description": "Short appetizing description of this zero-waste recipe.",
  "materials_needed": ["{item_name}", "Ingredient 2", "Ingredient 3"],
  "instructions": [
    "Step 1...",
    "Step 2...",
    "Step 3..."
  ],
  "environmental_impact": "How this recipe prevents food waste."
}}
"""
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openrouter_api_key.strip()}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.openrouter_model,
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"},
            "temperature": 0.4
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                if choices:
                    content = choices[0].get("message", {}).get("content", "")
                    return json.loads(content)
        return None

second_life_service = SecondLifeHubService()
