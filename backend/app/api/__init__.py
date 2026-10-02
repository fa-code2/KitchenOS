from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.pantry import router as pantry_router
from app.api.vision import router as vision_router
from app.api.recipes import router as recipes_router
from app.api.meal_planner import router as meal_planner_router
from app.api.grocery import router as grocery_router
from app.api.second_life import router as second_life_router
from app.api.analytics import router as analytics_router
from app.api.voice import router as voice_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(pantry_router)
api_router.include_router(vision_router)
api_router.include_router(recipes_router)
api_router.include_router(meal_planner_router)
api_router.include_router(grocery_router)
api_router.include_router(second_life_router)
api_router.include_router(analytics_router)
api_router.include_router(voice_router)

