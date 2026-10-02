# Kitchen OS – The Intelligent Food Management System

> **Vision:** Honour the effort behind food production by eliminating household food waste through intelligent software.

Kitchen OS is an end-to-end intelligent food management platform combining **Google Gemini Vision Intelligence**, **Machine Learning Freshness Decay Engine**, **Zero-Waste Culinary AI**, and **ElevenLabs Natural Voice Processing** with a modern **React + Tailwind CSS** frontend and **FastAPI** backend.

---

## ✨ Core Features & Modules

### 🥕 Smart Pantry
- Real-time inventory tracking with category & storage location tagging (`Fridge`, `Pantry`, `Freezer`).
- **Dynamic Freshness Bar:** Powered by mathematical decay models predicting degradation curves and remaining shelf life days.
- Urgency indicators: **Peak Freshness (Green)**, **Moderate / Use Soon (Amber)**, and **Expiring Soon (Red)**.
- Quick **Eat / Consume** action that decrements quantity and logs environmental & cost savings.

### 📷 AI Vision & Grocery Scanner
- Snap or upload photos of grocery hauls, produce, or receipts.
- Powered by **Google Gemini Vision** (with OpenRouter vision-model fallback).
- Clean, direct food item detection with shelf life estimates, storage tips, and 1-click Smart Pantry import.
- Zero bounding box clutter—clean, fast, and structured AI results.

### 🎙️ ElevenLabs Voice Inventory Assistant
- Speak natural kitchen updates hands-free while cooking (e.g. *"Used half the cottage cheese and put 200g of cooked dal in the fridge"*).
- Uses **Gemini 1.5 Flash** for natural speech parsing and dynamic conversational confirmation generation.
- Speaks dynamic confirmations aloud via **ElevenLabs Natural Audio** with native Web Speech synthesis fallback.

### 👨‍🍳 Zero-Waste Chef
- Analyzes active pantry inventory and crafts **3 personalized recipes** prioritizing expiring ingredients:
  1. *Quick & Easy Weeknight Save*
  2. *Chef's Signature Zero-Waste Feast*
  3. *Batch-Cook & Preserve / Rescue*
- Interactive **Step-by-Step Cooking Mode** with macro breakdowns (calories, protein, carbs, fat) and second-life scrap tips.
- **Cooked It! Auto-Deduct:** Automatically decrements used ingredients from the active pantry and logs carbon/dollar savings.

### ⏳ Freshness Radar & Spoilage Simulator
- Real-time degradation curve visualizing non-linear quality loss over time.
- **Interactive Shelf-Life Simulator:** Test storage locations (`Fridge` vs `Pantry` vs `Freezer`) and temperature stress factors to see projected shelf life.
- Scientific food storage best practices based on USDA FoodKeeper standards.

### ♻️ Second Life Hub
- Circular kitchen guides for food scraps and items past prime:
  - *All-Natural Citrus Peel Cleaning Vinegar*
  - *Organic Banana Peel Fertilizer Tea*
  - *Herbed Garlic Sourdough Croutons*
  - *Zero-Waste Vegetable Scraps Broth*
  - *Perpetual Green Onion & Herb Regrowth*
  - *Exfoliating Coffee & Brown Sugar Body Polish*
- Automatically matches guides to items currently in your pantry.

### 🍽️ Meal Planner & Macro Analytics
- 7-Day visual weekly meal schedule (Breakfast, Lunch, Dinner, Snack).
- Real-time **Pantry Coverage % Meter** calculating how many recipe ingredients you already own.
- **1-Click Sync:** Automatically detects missing ingredients in planned meals and pushes them to your Grocery Agent.

### 🛒 Dynamic Grocery Agent
- Smart categorized shopping list with aisle grouping and priority tags.
- **Auto-Scan Low Stock:** Automatically checks pantry staples and adds low-stock items.
- **1-Click Restock:** Move checked-off purchased groceries directly into the Smart Pantry.

---

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 18, Tailwind CSS, Lucide Icons, Vite |
| **Backend** | FastAPI, Python 3.11+, SQLAlchemy, Pydantic v2 |
| **AI / Vision** | Google Gemini, Groq, OpenRouter |
| **Voice / Speech** | ElevenLabs Text-to-Speech, Web Speech API |
| **Database** | SQLite (local dev) / PostgreSQL (production) |
| **Deployment** | Vercel (Frontend & Serverless Python API), Docker |

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js 18+ and npm
- Python 3.10+

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will be live at `http://localhost:3000`.

### 4. Running Tests
```bash
cd backend
pytest
```

---

## 🌐 Production Deployment (Vercel)

This repository is pre-configured for seamless 1-click deployment on **Vercel**:
1. Push this repository to GitHub.
2. Import the project into your Vercel dashboard.
3. Configure environment variables in the Vercel project settings:
   - `GEMINI_API_KEY` (Google AI Studio API key)
   - `GEMINI_VISION_API_KEY` (Optional dedicated key for vision)
  - `OPENROUTER_API_KEY` (Optional OpenRouter key for LLM and vision fallback)
  - `OPENROUTER_MODEL` (Optional model ID; defaults to `openai/gpt-4o-mini`)
  - `OPENROUTER_VISION_MODEL` (Optional vision model ID; defaults to `openai/gpt-4o-mini`)
   - `ELEVENLABS_API_KEY` (ElevenLabs API key)
   - `SECRET_KEY` (Random secret for JWT tokens)
4. Deploy!
