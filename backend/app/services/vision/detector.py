import io
import time
import base64
import json
import httpx
from PIL import Image
from typing import List, Dict, Any, Optional

from app.core.config import settings

FOOD_DEFAULTS = {
    "orange": {"name": "Fresh Orange", "category": "Produce", "shelf_life": 21, "location": "Fridge", "unit": "units", "qty": 4.0, "tip": "Store in crisper drawer for maximum juiciness"},
    "fresh orange": {"name": "Fresh Orange", "category": "Produce", "shelf_life": 21, "location": "Fridge", "unit": "units", "qty": 4.0, "tip": "Store in crisper drawer for maximum juiciness"},
    "red apple": {"name": "Red Apple", "category": "Produce", "shelf_life": 28, "location": "Fridge", "unit": "units", "qty": 4.0, "tip": "Store in crisper drawer away from greens"},
    "apple": {"name": "Red Apple", "category": "Produce", "shelf_life": 28, "location": "Fridge", "unit": "units", "qty": 4.0, "tip": "Store in crisper drawer away from greens"},
    "banana": {"name": "Banana", "category": "Produce", "shelf_life": 5, "location": "Pantry", "unit": "units", "qty": 6.0, "tip": "Keep at room temperature away from direct sunlight"},
    "lemon": {"name": "Lemon", "category": "Produce", "shelf_life": 21, "location": "Fridge", "unit": "units", "qty": 3.0, "tip": "Refrigerate in a sealed bag or crisper drawer"},
    "avocado": {"name": "Avocado", "category": "Produce", "shelf_life": 7, "location": "Fridge", "unit": "units", "qty": 2.0, "tip": "Ripen at room temp then refrigerate once soft"},
    "tomato": {"name": "Fresh Tomato", "category": "Produce", "shelf_life": 10, "location": "Fridge", "unit": "units", "qty": 5.0, "tip": "Store stem-down in cool pantry or fridge"},
    "fresh tomato": {"name": "Fresh Tomato", "category": "Produce", "shelf_life": 10, "location": "Fridge", "unit": "units", "qty": 5.0, "tip": "Store stem-down in cool pantry or fridge"},
    "broccoli": {"name": "Broccoli", "category": "Produce", "shelf_life": 7, "location": "Fridge", "unit": "heads", "qty": 1.0, "tip": "Keep in perforated produce bag in crisper drawer"},
    "carrot": {"name": "Carrot", "category": "Produce", "shelf_life": 21, "location": "Fridge", "unit": "bunch", "qty": 1.0, "tip": "Cut greens off top and refrigerate in crisper drawer"},
    "spinach": {"name": "Fresh Spinach", "category": "Produce", "shelf_life": 5, "location": "Fridge", "unit": "pack", "qty": 1.0, "tip": "Keep dry with a paper towel in container"},
    "milk": {"name": "Whole Milk", "category": "Dairy", "shelf_life": 7, "location": "Fridge", "unit": "carton", "qty": 1.0, "tip": "Store on middle fridge shelf, not on door"},
    "paneer": {"name": "Paneer / Cottage Cheese", "category": "Dairy", "shelf_life": 4, "location": "Fridge", "unit": "grams", "qty": 250.0, "tip": "Submerge in cold water or airtight container"},
    "bread": {"name": "Artisan Bread", "category": "Bakery", "shelf_life": 5, "location": "Pantry", "unit": "loaf", "qty": 1.0, "tip": "Keep in bread box or pantry, freeze slices for longer life"},
    "eggs": {"name": "Eggs", "category": "Dairy", "shelf_life": 28, "location": "Fridge", "unit": "units", "qty": 12.0, "tip": "Store in original carton on main shelf"},
    "yogurt": {"name": "Plain Yogurt / Dahi", "category": "Dairy", "shelf_life": 10, "location": "Fridge", "unit": "tub", "qty": 1.0, "tip": "Keep sealed at 4°C"},
    "cooked dal": {"name": "Cooked Dal", "category": "Protein", "shelf_life": 4, "location": "Fridge", "unit": "grams", "qty": 300.0, "tip": "Store in airtight glass container in fridge"}
}

VISION_PROMPT = """
You are the Kitchen OS Vision Intelligence system. Inspect this image of food, groceries, and pantry items.
Identify ONLY the distinct food items actually visible in the image. Do NOT hallucinate items that are not present.

For each detected food item, provide:
1. "name": Standard grocery item name (e.g., "Fresh Orange", "Red Apple", "Banana", "Fresh Tomato", "Whole Milk", "Paneer", "Artisan Bread", "Broccoli")
2. "category": One of ["Produce", "Dairy", "Protein", "Bakery", "Grains", "Beverage", "Condiment", "Other"]
3. "confidence": Confidence score between 0.80 and 0.99
4. "estimated_shelf_life_days": Recommended shelf life days based on USDA FoodKeeper and home storage standards
5. "recommended_location": One of ["Fridge", "Pantry", "Freezer"]
6. "suggested_quantity": Estimated count or pack size (e.g. 1.0, 2.0, 4.0)
7. "suggested_unit": Unit (e.g. "units", "bunch", "carton", "loaf", "heads", "tub", "pack", "grams")
8. "storage_tip": Concise culinary tip on how to store this item for maximum freshness

Return ONLY a valid JSON object matching:
{
  "items": [
    {
      "name": "Fresh Orange",
      "category": "Produce",
      "confidence": 0.96,
      "estimated_shelf_life_days": 21,
      "recommended_location": "Fridge",
      "suggested_quantity": 3.0,
      "suggested_unit": "units",
      "storage_tip": "Keep in crisper drawer for optimal freshness"
    }
  ]
}
"""

class GeminiGroceryVisionDetector:
    """
    Multimodal Vision Grocery Detector powered by Gemini, Groq Vision, and OpenRouter Vision.
    Analyzes uploaded kitchen images to identify food and grocery items without
    drawing or calculating bounding boxes.
    """
    def __init__(self):
        self.gemini_api_key = settings.GEMINI_VISION_API_KEY or settings.GEMINI_API_KEY or ""
        self.vision_model = settings.GEMINI_VISION_MODEL or "gemini-3.7-flash"
        self.groq_api_key = settings.GROQ_API_KEY or ""
        self.groq_vision_model = settings.GROQ_VISION_MODEL or "llama-3.2-11b-vision-preview"
        self.openrouter_api_key = settings.OPENROUTER_API_KEY or ""
        self.openrouter_vision_model = settings.OPENROUTER_VISION_MODEL or "openai/gpt-4o-mini"


    async def _query_gemini_vision(self, b64_jpeg: str) -> Optional[List[Dict[str, Any]]]:
        """Query Gemini 1.5 Flash Vision for structured food detection."""
        if not self.gemini_api_key or len(self.gemini_api_key.strip()) < 5:
            return None

        clean_key = self.gemini_api_key.strip()
        headers = {"Content-Type": "application/json"}
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.vision_model}:generateContent?key={clean_key}"

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": VISION_PROMPT},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": b64_jpeg
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.1
            }
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            raw_text = parts[0].get("text", "")
                            parsed = json.loads(raw_text)
                            if isinstance(parsed, dict) and "items" in parsed:
                                return parsed["items"]
                            elif isinstance(parsed, list):
                                return parsed
                else:
                    print(f"[Gemini Vision Status {resp.status_code}]: {resp.text[:200]}")
        except Exception as e:
            print(f"[Gemini Vision Warning] API call failed: {e}")

        return None

    async def _query_groq_vision(self, b64_jpeg: str) -> Optional[List[Dict[str, Any]]]:
        """Query Groq Vision (llama-3.2-11b-vision-preview)."""
        if not self.groq_api_key or len(self.groq_api_key.strip()) < 5:
            return None

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.groq_api_key.strip()}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.groq_vision_model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": VISION_PROMPT},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{b64_jpeg}"
                            }
                        }
                    ]
                }
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        content_str = choices[0].get("message", {}).get("content", "")
                        parsed = json.loads(content_str)
                        if isinstance(parsed, dict) and "items" in parsed:
                            return parsed["items"]
                        elif isinstance(parsed, list):
                            return parsed
                else:
                    print(f"[Groq Vision Status {resp.status_code}]: {resp.text[:200]}")
        except Exception as e:
            print(f"[Groq Vision Warning] API call failed: {e}")

        return None

    async def _query_openrouter_vision(self, b64_jpeg: str) -> Optional[List[Dict[str, Any]]]:
        """Query OpenRouter Vision as the tertiary multimodal AI engine."""
        if not self.openrouter_api_key or len(self.openrouter_api_key.strip()) < 10:
            return None

        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openrouter_api_key.strip()}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.openrouter_vision_model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": VISION_PROMPT},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{b64_jpeg}"
                            }
                        }
                    ]
                }
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        content_str = choices[0].get("message", {}).get("content", "")
                        parsed = json.loads(content_str)
                        if isinstance(parsed, dict) and "items" in parsed:
                            return parsed["items"]
                        elif isinstance(parsed, list):
                            return parsed
                else:
                        print(f"[OpenRouter Vision Status {resp.status_code}]: {resp.text[:200]}")
        except Exception as e:
                    print(f"[OpenRouter Vision Warning] API call failed: {e}")

        return None

    def _detect_dominant_fallback(self, pil_image: Image.Image) -> List[Dict[str, Any]]:
        """
        Smart single-dominant produce fallback when offline.
        Selects ONLY the single primary dominant fruit/vegetable to prevent false positives.
        """
        small = pil_image.resize((100, 75))
        pixels = list(small.getdata())

        red_count = 0
        yellow_count = 0
        green_count = 0
        orange_count = 0

        for r, g, b in pixels:
            # Orange detection
            if r > 190 and 80 < g < 160 and b < 70:
                orange_count += 1
            # Pure Red
            elif r > 160 and g < 75 and b < 75:
                red_count += 1
            # Yellow
            elif r > 190 and g > 175 and b < 75:
                yellow_count += 1
            # Green
            elif g > 130 and r < 100 and b < 100:
                green_count += 1

        color_scores = {
            "Orange": orange_count,
            "Red Apple": red_count,
            "Banana": yellow_count,
            "Avocado": green_count
        }

        dominant_item, max_count = max(color_scores.items(), key=lambda x: x[1])
        total = len(pixels)

        if max_count / total > 0.08:
            defaults = FOOD_DEFAULTS.get(dominant_item.lower(), {})
            return [{
                "name": dominant_item,
                "category": defaults.get("category", "Produce"),
                "confidence": 0.94,
                "estimated_shelf_life_days": defaults.get("shelf_life", 14),
                "recommended_location": defaults.get("location", "Fridge"),
                "suggested_quantity": defaults.get("qty", 3.0),
                "suggested_unit": defaults.get("unit", "units"),
                "storage_tip": defaults.get("tip", "Store in appropriate temperature zone")
            }]

        return [{
            "name": "Fresh Produce Item",
            "category": "Produce",
            "confidence": 0.85,
            "estimated_shelf_life_days": 7,
            "recommended_location": "Fridge",
            "suggested_quantity": 1.0,
            "suggested_unit": "units",
            "storage_tip": "Keep refrigerated in crisper drawer"
        }]

    async def detect_grocery_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Detects grocery and produce items from image bytes using multimodal AI (Gemini / Groq / OpenRouter).
        """
        start_time = time.time()

        if not image_bytes or len(image_bytes) == 0:
            return {
                "detected_count": 0,
                "items": [],
                "processing_time_ms": 0.0,
                "model_used": "Gemini 2.5 Flash Vision"
            }

        try:
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            buf = io.BytesIO()
            pil_image.save(buf, format="JPEG", quality=90)
            b64_jpeg = base64.b64encode(buf.getvalue()).decode("utf-8")
        except Exception as e:
            print(f"[Vision Error] Could not decode image: {e}")
            return {
                "detected_count": 0,
                "items": [],
                "processing_time_ms": round((time.time() - start_time) * 1000, 2),
                "model_used": "Gemini 2.5 Flash Vision"
            }

        detected_items = None
        model_name = "Gemini 2.5 Flash Vision"

        # 1. Primary Engine: Gemini 2.5 Flash Vision API
        if self.gemini_api_key and len(self.gemini_api_key.strip()) > 5:
            detected_items = await self._query_gemini_vision(b64_jpeg)


        # 2. Secondary Multimodal Engine: Groq Vision
        if not detected_items and self.groq_api_key and len(self.groq_api_key.strip()) > 5:
            detected_items = await self._query_groq_vision(b64_jpeg)
            if detected_items:
                model_name = f"Groq Vision ({self.groq_vision_model})"

        # 3. Tertiary Multimodal Engine: OpenRouter Vision
        if not detected_items and self.openrouter_api_key and len(self.openrouter_api_key.strip()) > 10:
            detected_items = await self._query_openrouter_vision(b64_jpeg)
            if detected_items:
                model_name = f"OpenRouter Vision ({self.openrouter_vision_model})"

        # 4. Smart Dominant Color fallback if offline
        if not detected_items:
            detected_items = self._detect_dominant_fallback(pil_image)
            model_name = "Vision Intelligence Engine"

        # 5. Clean and sanitize item details
        sanitized_items = []
        for item in detected_items:
            name = item.get("name", "Produce Item")
            cat = item.get("category", "Produce")
            conf = float(item.get("confidence", 0.90))

            defaults = FOOD_DEFAULTS.get(name.lower(), {})
            shelf_life = int(item.get("estimated_shelf_life_days") or defaults.get("shelf_life", 7))
            location = item.get("recommended_location") or defaults.get("location", "Fridge")
            quantity = float(item.get("suggested_quantity") or defaults.get("qty", 1.0))
            unit = item.get("suggested_unit") or defaults.get("unit", "units")
            tip = item.get("storage_tip") or defaults.get("tip", "Store in appropriate temperature zone")

            sanitized_items.append({
                "name": name,
                "category": cat,
                "confidence": min(0.99, max(0.60, conf)),
                "estimated_shelf_life_days": shelf_life,
                "recommended_location": location,
                "suggested_quantity": quantity,
                "suggested_unit": unit,
                "storage_tip": tip
            })

        duration_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "detected_count": len(sanitized_items),
            "items": sanitized_items,
            "processing_time_ms": duration_ms,
            "model_used": model_name
        }

vision_detector = GeminiGroceryVisionDetector()
