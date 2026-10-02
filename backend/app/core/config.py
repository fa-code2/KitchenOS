import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Kitchen OS"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "sqlite:////tmp/kitchen_os.db" if os.getenv("VERCEL") and not os.getenv("DATABASE_URL") else os.getenv("DATABASE_URL", "sqlite:///./kitchen_os.db")
    
    # Redis / Celery (Optional for local dev)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Auth & Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "kitchen-os-super-secret-jwt-token-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # -------------------------------------------------------------
    # 1. Vision & Image Input Model (Grocery & Produce Detection)
    # Distinct token quota / model for processing camera photos
    # -------------------------------------------------------------
    GEMINI_VISION_API_KEY: str = os.getenv("GEMINI_VISION_API_KEY", os.getenv("VISION_API_KEY", os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", ""))))
    GEMINI_VISION_MODEL: str = os.getenv("GEMINI_VISION_MODEL", "gemini-3.7-flash")

    # -------------------------------------------------------------
    # 2. Primary LLM (Zero-Waste Recipes, Voice Parsing, Meal Planning)
    # Distinct token quota / model for text generation & JSON schemas
    # -------------------------------------------------------------
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("LLM_API_KEY", os.getenv("GOOGLE_API_KEY", "")))
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.7-flash")


    # Secondary / Fallback Providers (Groq & OpenRouter)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    GROQ_VISION_MODEL: str = os.getenv("GROQ_VISION_MODEL", "llama-3.2-11b-vision-preview")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
    OPENROUTER_VISION_MODEL: str = os.getenv("OPENROUTER_VISION_MODEL", "openai/gpt-4o-mini")



    # -------------------------------------------------------------
    # 3. ElevenLabs Natural Voice Text-to-Speech (Kitchen Audio Confirmations)
    # -------------------------------------------------------------
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY", "")
    ELEVENLABS_VOICE_ID: str = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Rachel voice default
    ELEVENLABS_MODEL_ID: str = os.getenv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

    class Config:
        env_file = (".env", "../.env")
        extra = "ignore"

settings = Settings()
