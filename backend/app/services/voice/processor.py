import re
import json
import base64
import math
import struct
import httpx
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.pantry import PantryItem, ItemStatus
from app.models.analytics import WasteMetric
from app.services.spoilage.engine import spoilage_engine

class VoiceKitchenAgent:
    def __init__(self):
        self.gemini_api_key = settings.GEMINI_API_KEY
        self.gemini_model = settings.GEMINI_MODEL or "gemini-3.7-flash"
        self.groq_api_key = settings.GROQ_API_KEY or ""
        self.groq_model = settings.GROQ_MODEL or "llama-3.1-8b-instant"
        self.elevenlabs_api_key = settings.ELEVENLABS_API_KEY
        self.voice_id = settings.ELEVENLABS_VOICE_ID or "21m00Tcm4TlvDq8ikWAM"
        self.model_id = settings.ELEVENLABS_MODEL_ID or "eleven_multilingual_v2"
        self.openrouter_api_key = settings.OPENROUTER_API_KEY or ""
        self.openrouter_model = settings.OPENROUTER_MODEL or "openai/gpt-4o-mini"


    async def transcribe_audio(self, audio_bytes: bytes, filename: str = "audio.webm") -> str:
        """
        Convert spoken kitchen audio to text using Gemini 1.5 Flash or Groq Whisper (whisper-large-v3).
        Accurately detects MIME type from audio magic bytes to ensure compatibility.
        """
        if not audio_bytes or len(audio_bytes) < 10:
            return ""

        # Detect real audio MIME type from binary headers
        mime_type = "audio/webm"
        ext = "webm"
        if audio_bytes.startswith(b"RIFF"):
            mime_type = "audio/wav"
            ext = "wav"
        elif audio_bytes.startswith(b"\x1a\x45\xdf\xa3"):
            mime_type = "audio/webm"
            ext = "webm"
        elif audio_bytes.startswith(b"OggS"):
            mime_type = "audio/ogg"
            ext = "ogg"
        elif audio_bytes.startswith(b"ID3") or audio_bytes[:2] in [b"\xff\xfb", b"\xff\xf3", b"\xff\xf2"]:
            mime_type = "audio/mp3"
            ext = "mp3"
        elif b"ftyp" in audio_bytes[:16]:
            mime_type = "audio/mp4"
            ext = "mp4"

        # 1. Try Gemini 1.5 Flash Multimodal Audio transcription
        if self.gemini_api_key and len(self.gemini_api_key.strip()) > 5:
            try:
                audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
                clean_key = self.gemini_api_key.strip()
                headers = {"Content-Type": "application/json"}
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={clean_key}"

                payload = {
                    "contents": [
                        {
                            "role": "user",
                            "parts": [
                                {"text": "Transcribe the following kitchen speech accurately verbatim without extra commentary:"},
                                {
                                    "inline_data": {
                                        "mime_type": mime_type,
                                        "data": audio_b64
                                    }
                                }
                            ]
                        }
                    ]
                }
                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post(url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                transcript = parts[0].get("text", "").strip()
                                if transcript:
                                    return transcript
            except Exception as e:
                print(f"[VoiceAgent] Gemini STT exception: {e}")

        # 2. Try Groq Whisper (ultra-fast whisper-large-v3)
        if self.groq_api_key and len(self.groq_api_key.strip()) > 5:
            try:
                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post(
                        "https://api.groq.com/openai/v1/audio/transcriptions",
                        headers={"Authorization": f"Bearer {self.groq_api_key.strip()}"},
                        files={"file": (f"audio.{ext}", audio_bytes, mime_type)},
                        data={"model": "whisper-large-v3"}
                    )
                    if resp.status_code == 200:
                        transcript = resp.json().get("text", "").strip()
                        if transcript:
                            return transcript
                    else:
                        print(f"[Groq Whisper Status {resp.status_code}]: {resp.text}")
            except Exception as e:
                print(f"[VoiceAgent] Groq Whisper error: {e}")

        return ""

    async def parse_natural_speech_commands(self, text: str) -> List[Dict[str, Any]]:
        """
        Parse natural kitchen command into structured actions (consume, add, update).
        Example: "Hey Kitchen OS, I just used half the cottage cheese and put 200g of cooked dal in the fridge"
        """
        clean_text = text.strip()
        clean_text = re.sub(r'^(hey|hi|hello)?\s*kitchen\s*os,?\s*', '', clean_text, flags=re.IGNORECASE)

        if not clean_text:
            return []

        # 1. Try Gemini 1.5 Flash structured parser
        if self.gemini_api_key and len(self.gemini_api_key.strip()) > 5:
            try:
                ai_parsed = await self._query_gemini_parser(clean_text)
                if ai_parsed and isinstance(ai_parsed, list) and len(ai_parsed) > 0:
                    return ai_parsed
            except Exception as e:
                print(f"[VoiceAgent] Gemini NLP error ({e}), trying Groq parser.")

        # 2. Try Groq LLM parser (llama-3.1-8b-instant / llama-3.3-70b-versatile)
        if self.groq_api_key and len(self.groq_api_key.strip()) > 5:
            try:
                groq_parsed = await self._query_groq_parser(clean_text)
                if groq_parsed and isinstance(groq_parsed, list) and len(groq_parsed) > 0:
                    return groq_parsed
            except Exception as e:
                print(f"[VoiceAgent] Groq NLP error: {e}")

        # 3. Try OpenRouter LLM parser
        if self.openrouter_api_key and len(self.openrouter_api_key.strip()) > 5:
            try:
                openrouter_parsed = await self._query_openrouter_parser(clean_text)
                if openrouter_parsed and isinstance(openrouter_parsed, list) and len(openrouter_parsed) > 0:
                    return openrouter_parsed
            except Exception as e:
                print(f"[VoiceAgent] OpenRouter NLP error: {e}")

        # 4. Heuristic Spoken Kitchen Parser fallback
        return self._heuristic_speech_parser(clean_text)

    async def _query_gemini_parser(self, text: str) -> Optional[List[Dict[str, Any]]]:
        """Query Gemini with JSON schema for speech command extraction."""
        prompt = f"""
Parse a natural kitchen command into structured actions.

Supported actions:
- consume: reduce the quantity of an existing item
  e.g. "Hey Kitchen OS, I just used half the cottage cheese", "used 2 eggs", "ate an apple"
- update: set a new quantity for an existing item
  e.g. "Hey Kitchen OS, update the cooked dal to 200g", "set milk to 500ml", "change eggs to 6"

Not supported (never create an item from voice):
- add / bought / put / got new items
  e.g. "add paneer", "I bought paneer", "put 500g chicken in the fridge"
  -> return {{"action": "add_rejected",
             "message": "I can't add items by voice. Please use Scan Image or the Add section in the menu.",
             "item_name": "Paneer"}}

Rules:
- Only act on items that already exist in the inventory.

Instruction: "{text}"

For each action, return an object matching:
- "action": One of ["consume", "update", "add_rejected"]
- "item_name": Standardized ingredient name (e.g. "Cottage Cheese", "Cooked Dal", "Milk", "Eggs")
- "quantity": Numeric float (e.g. 0.5 for "half", 200.0, 1.0, 2.0)
- "unit": String unit (e.g. "g", "grams", "portion", "liters", "units", "tub", "carton")
- "fraction_of_total": Float or null (e.g. 0.5 if user says "half the ...", 1.0 for "all" / "finished")
- "message": Optional rejection message when action is "add_rejected"

Return ONLY a valid JSON object with an "actions" array: {{"actions": [...]}}
"""
        clean_key = self.gemini_api_key.strip()
        headers = {"Content-Type": "application/json"}
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={clean_key}"

        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json", "temperature": 0.1}
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        parsed = json.loads(parts[0].get("text", "[]"))
                        if isinstance(parsed, list):
                            return parsed
                        elif isinstance(parsed, dict) and "actions" in parsed:
                            return parsed["actions"]
        return None

    async def _query_groq_parser(self, text: str) -> Optional[List[Dict[str, Any]]]:
        """Query Groq LLM for natural speech extraction."""
        prompt = f"""
Parse a natural kitchen command into structured actions.

Supported actions:
- consume: reduce the quantity of an existing item
  e.g. "Hey Kitchen OS, I just used half the cottage cheese", "used 2 eggs"
- update: set a new quantity for an existing item
  e.g. "Hey Kitchen OS, update the cooked dal to 200g", "set milk to 500ml"

Not supported (never create an item from voice):
- add / bought / put / got new items
  e.g. "add paneer", "I bought paneer"
  -> return {{"action": "add_rejected",
             "message": "I can't add items by voice. Please use Scan Image or the Add section in the menu.",
             "item_name": "Paneer"}}

Rules:
- Only act on items that already exist in the inventory.

Instruction: "{text}"

Return a JSON object with key "actions" containing array of objects matching:
- "action": One of ["consume", "update", "add_rejected"]
- "item_name": Standardized ingredient name
- "quantity": Numeric float (e.g. 0.5, 200.0, 1.0)
- "unit": String unit (e.g. "g", "grams", "portion", "units", "tub")
- "fraction_of_total": Float or null (e.g. 0.5 for "half", 1.0 for "all")
- "message": String rejection message if action is "add_rejected"

Example: {{"actions": [{{"action": "consume", "item_name": "Cottage Cheese", "quantity": 0.5, "unit": "tub", "fraction_of_total": 0.5}}]}}
"""
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.groq_api_key.strip()}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.groq_model,
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                if choices:
                    content_str = choices[0].get("message", {}).get("content", "")
                    parsed = json.loads(content_str)
                    if isinstance(parsed, dict) and "actions" in parsed:
                        return parsed["actions"]
                    elif isinstance(parsed, list):
                        return parsed
        return None

    async def _query_openrouter_parser(self, text: str) -> Optional[List[Dict[str, Any]]]:
        """Query OpenRouter for natural speech extraction."""
        prompt = f"""
Parse a natural kitchen command into structured actions.

Supported actions:
- consume: reduce the quantity of an existing item
  e.g. "Hey Kitchen OS, I just used half the cottage cheese"
- update: set a new quantity for an existing item
  e.g. "Hey Kitchen OS, update the cooked dal to 200g"

Not supported (never create an item from voice):
- add / bought / put / got new items
  e.g. "add paneer", "I bought paneer"
  -> return {{"action": "add_rejected",
             "message": "I can't add items by voice. Please use Scan Image or the Add section in the menu.",
             "item_name": "Paneer"}}

Rules:
- Only act on items that already exist in the inventory.

Instruction: "{text}"

Return a JSON object with key "actions" containing array of objects.
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
            "temperature": 0.1
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                if choices:
                    content_str = choices[0].get("message", {}).get("content", "")
                    parsed = json.loads(content_str)
                    if isinstance(parsed, dict) and "actions" in parsed:
                        return parsed["actions"]
                    elif isinstance(parsed, list):
                        return parsed
        return None

    def _heuristic_speech_parser(self, text: str) -> List[Dict[str, Any]]:
        """Fast fallback NLP parser that strictly supports consume and update, and rejects add."""
        actions = []
        lower = text.lower()

        clauses = re.split(r'\band\b|\bthen\b|,|\.', lower)

        for clause in clauses:
            clause = clause.strip()
            if not clause:
                continue

            # Check for adding new items -> NOT SUPPORTED
            if any(w in clause for w in ["add", "bought", "buy", "put", "got", "store", "stored", "place", "saved", "restock", "restocked", "bring", "purchased", "brought"]):
                clean_item = clause
                for verb in ["i just", "i", "just", "put", "added", "add", "bought", "got", "stored", "in the fridge", "in fridge", "in the pantry", "in pantry", "in the freezer", "in freezer", "some", "a bit of"]:
                    clean_item = clean_item.replace(verb, "")
                clean_item = re.sub(r'\d+(?:\.\d+)?\s*(?:grams?|g|kg|cups?|bottles?|units?|lbs?|cartons?|slices?|heads?|pieces?)?', '', clean_item)
                clean_item = re.sub(r'\b(of|the|a|an|into|in|to)\b', '', clean_item).strip().title()
                actions.append({
                    "action": "add_rejected",
                    "item_name": clean_item or "Item",
                    "message": "I can't add items by voice. Please use Scan Image or the Add section in the menu."
                })
                continue

            # Check for updating quantity
            is_update = any(w in clause for w in ["update", "set", "change", "now have", "corrected to", "make it", "adjust"])
            action = "update" if is_update else "consume"

            fraction = None
            if "half" in clause:
                fraction = 0.5
            elif "quarter" in clause:
                fraction = 0.25
            elif "all" in clause or "rest" in clause or "entire" in clause or "out of" in clause or "empty" in clause:
                fraction = 1.0

            qty_match = re.search(r'(\d+(?:\.\d+)?)\s*(grams?|g|kg|cups?|bottles?|units?|lbs?|cartons?|slices?|heads?|pieces?|ml|l|liters?)?', clause)
            quantity = 1.0
            unit = "units"
            if qty_match:
                quantity = float(qty_match.group(1))
                if qty_match.group(2):
                    unit = qty_match.group(2)

            clean_item = clause
            for verb in ["i just", "i", "just", "used", "consumed", "ate", "drank", "cooked", "update", "set", "change", "to", "now have", "in the fridge", "in fridge", "in the pantry", "in pantry", "half the", "quarter of", "some", "a bit of", "a lot of"]:
                clean_item = clean_item.replace(verb, "")
            
            clean_item = re.sub(r'\d+(?:\.\d+)?\s*(?:grams?|g|kg|cups?|bottles?|units?|lbs?|cartons?|slices?|heads?|pieces?|ml|l|liters?)?', '', clean_item)
            clean_item = re.sub(r'\b(of|the|a|an|into|in|to)\b', '', clean_item).strip()

            if not clean_item:
                clean_item = "Kitchen Item"

            clean_item = " ".join(w.capitalize() for w in clean_item.split())

            actions.append({
                "action": action,
                "item_name": clean_item,
                "quantity": quantity,
                "unit": unit,
                "fraction_of_total": fraction
            })

        return actions

    def execute_inventory_updates(self, actions: List[Dict[str, Any]], db: Session) -> Tuple[List[str], str]:
        """
        Execute parsed inventory actions on the database.
        Rules:
        - Only act on items that already exist in the inventory.
        - Reject voice item creation attempts.
        - Supports consume and update.
        """
        logs = []
        speech_parts = []

        for act in actions:
            action_type = act.get("action", "consume")
            item_name = act.get("item_name", "Item")
            qty = float(act.get("quantity", 1.0))
            unit = act.get("unit", "units")
            fraction = act.get("fraction_of_total")

            if action_type == "add_rejected" or action_type == "add":
                msg = act.get("message") or "I can't add items by voice. Please use Scan Image or the Add section in the menu."
                logs.append(f"Rejected adding '{item_name}': {msg}")
                speech_parts.append(msg)
                continue

            if action_type == "consume":
                query = db.query(PantryItem).filter(
                    PantryItem.status == ItemStatus.ACTIVE.value,
                    PantryItem.name.ilike(f"%{item_name}%")
                )
                match = query.first()

                if match:
                    if fraction is not None:
                        consumed_amount = round(match.quantity * fraction, 2)
                        match.quantity = max(0.0, round(match.quantity - consumed_amount, 2))
                    else:
                        consumed_amount = min(match.quantity, qty)
                        match.quantity = max(0.0, round(match.quantity - qty, 2))

                    if match.quantity <= 0.05:
                        match.status = ItemStatus.CONSUMED.value
                        logs.append(f"Finished {match.name} (marked consumed)")
                        speech_parts.append(f"marked your {match.name} as finished")
                    else:
                        logs.append(f"Deducted {consumed_amount} {match.unit} of {match.name} ({match.quantity} {match.unit} remaining)")
                        speech_parts.append(f"used {consumed_amount} {match.unit} of {match.name}, leaving {match.quantity} {match.unit}")

                    db.add(WasteMetric(
                        item_name=match.name,
                        action_type="consumed",
                        quantity=consumed_amount,
                        waste_prevented_kg=round(consumed_amount * 0.25, 2),
                        co2_reduced_kg=round(consumed_amount * 0.45, 2),
                        money_saved_usd=round(consumed_amount * 1.50, 2),
                        date=datetime.now(timezone.utc).replace(tzinfo=None)
                    ))
                else:
                    logs.append(f"Could not find '{item_name}' in your active pantry to deduct")
                    speech_parts.append(f"could not find {item_name} in your inventory")

            elif action_type == "update":
                query = db.query(PantryItem).filter(
                    PantryItem.status == ItemStatus.ACTIVE.value,
                    PantryItem.name.ilike(f"%{item_name}%")
                )
                match = query.first()

                if match:
                    old_qty = match.quantity
                    match.quantity = max(0.0, round(qty, 2))
                    if unit and unit not in ["units", "portion"]:
                        match.unit = unit

                    if match.quantity <= 0.05:
                        match.status = ItemStatus.CONSUMED.value
                        logs.append(f"Updated {match.name} to 0 (marked consumed)")
                        speech_parts.append(f"updated {match.name} to 0 and marked it consumed")
                    else:
                        logs.append(f"Updated {match.name} quantity to {match.quantity} {match.unit} (was {old_qty} {match.unit})")
                        speech_parts.append(f"updated {match.name} to {match.quantity} {match.unit}")
                else:
                    logs.append(f"Could not find '{item_name}' in your active pantry to update")
                    speech_parts.append(f"could not find {item_name} in your inventory to update")

            elif action_type == "discard":
                query = db.query(PantryItem).filter(
                    PantryItem.status == ItemStatus.ACTIVE.value,
                    PantryItem.name.ilike(f"%{item_name}%")
                )
                match = query.first()
                if match:
                    match.status = ItemStatus.WASTED.value
                    logs.append(f"Marked {match.name} as wasted/discarded")
                    speech_parts.append(f"marked {match.name} as discarded")
                else:
                    logs.append(f"Could not find '{item_name}' in your active pantry to discard")
                    speech_parts.append(f"could not find {item_name} in your inventory")

        try:
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[DB Update Error] {e}")
            logs.append(f"DB Error: {e}")

        if speech_parts:
            spoken_confirmation = f"Got it! {' and '.join(speech_parts)}."
        else:
            spoken_confirmation = "Kitchen OS processed your voice command."

        return logs, spoken_confirmation

    async def generate_dynamic_spoken_confirmation(self, actions: List[Dict[str, Any]], logs: List[str], base_confirmation: str) -> str:
        """
        Uses Gemini or Groq to generate a natural conversational voice confirmation.
        """
        prompt = f"""
You are the voice of Kitchen OS, an AI culinary and pantry assistant.
The following pantry inventory operations were just executed in real-time:
{json.dumps(logs, indent=2)}

Generate a friendly, natural 1-2 sentence spoken confirmation summarizing what was done.
Keep it conversational, lively, and suitable for ElevenLabs text-to-speech audio output.
Do not use markdown, emojis, asterisks, or lists. Return ONLY the plain text sentence.
"""
        # 1. Try Gemini
        if self.gemini_api_key and len(self.gemini_api_key.strip()) > 5:
            clean_key = self.gemini_api_key.strip()
            headers = {"Content-Type": "application/json"}
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={clean_key}"

            payload = {
                "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.3}
            }
            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.post(url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                text = parts[0].get("text", "").strip()
                                text = text.replace('"', '').replace('*', '').strip()
                                if text:
                                    return text
            except Exception as e:
                print(f"[VoiceAgent] Dynamic confirmation Gemini error: {e}")

        # 2. Try Groq
        if self.groq_api_key and len(self.groq_api_key.strip()) > 5:
            try:
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {self.groq_api_key.strip()}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": self.groq_model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3
                }
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.post(url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        choices = data.get("choices", [])
                        if choices:
                            text = choices[0].get("message", {}).get("content", "").strip()
                            text = text.replace('"', '').replace('*', '').strip()
                            if text:
                                return text
            except Exception as e:
                print(f"[VoiceAgent] Dynamic confirmation Groq error: {e}")

        # 3. Try OpenRouter
        if self.openrouter_api_key and len(self.openrouter_api_key.strip()) > 5:
            try:
                url = "https://openrouter.ai/api/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {self.openrouter_api_key.strip()}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": self.openrouter_model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3
                }
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.post(url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        choices = data.get("choices", [])
                        if choices:
                            text = choices[0].get("message", {}).get("content", "").strip()
                            text = text.replace('"', '').replace('*', '').strip()
                            if text:
                                return text
            except Exception as e:
                print(f"[VoiceAgent] Dynamic confirmation OpenRouter error: {e}")

        return base_confirmation

    async def generate_elevenlabs_audio(self, text: str) -> Optional[bytes]:
        """
        Synthesize natural voice response via ElevenLabs API using dynamic text.
        Gracefully falls back across models (eleven_turbo_v2_5, eleven_multilingual_v2, eleven_monolingual_v1).
        """
        if not self.elevenlabs_api_key or len(self.elevenlabs_api_key.strip()) < 5:
            return None

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.voice_id}"
        headers = {
            "xi-api-key": self.elevenlabs_api_key.strip(),
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
        }

        candidate_models = [self.model_id, "eleven_turbo_v2_5", "eleven_monolingual_v1"]
        candidate_models = list(dict.fromkeys(candidate_models))

        for model in candidate_models:
            payload = {
                "text": text,
                "model_id": model,
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                    "style": 0.35,
                    "use_speaker_boost": True
                }
            }

            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        return resp.content
                    else:
                        print(f"[ElevenLabs] Model {model} status {resp.status_code}: {resp.text}")
            except Exception as e:
                print(f"[ElevenLabs] Connection error for {model}: {e}")

        return None

    def create_fallback_audio_wav(self) -> bytes:
        """
        Generate lightweight audible WAV chime/beep as fallback.
        """
        sample_rate = 16000
        duration_s = 0.4
        freq = 660.0
        num_samples = int(sample_rate * duration_s)
        wav_header = bytearray()
        data = bytearray()
        
        for i in range(num_samples):
            val = int(32767.0 * 0.25 * math.sin(2.0 * math.pi * freq * (i / sample_rate)))
            data.extend(struct.pack('<h', val))
            
        byte_rate = sample_rate * 2
        block_align = 2
        data_size = len(data)
        chunk_size = 36 + data_size
        
        wav_header.extend(b'RIFF')
        wav_header.extend(struct.pack('<I', chunk_size))
        wav_header.extend(b'WAVEfmt ')
        wav_header.extend(struct.pack('<I', 16))
        wav_header.extend(struct.pack('<H', 1))
        wav_header.extend(struct.pack('<H', 1))
        wav_header.extend(struct.pack('<I', sample_rate))
        wav_header.extend(struct.pack('<I', byte_rate))
        wav_header.extend(struct.pack('<H', block_align))
        wav_header.extend(struct.pack('<H', 16))
        wav_header.extend(b'data')
        wav_header.extend(struct.pack('<I', data_size))
        
        return bytes(wav_header + data)

voice_agent = VoiceKitchenAgent()
