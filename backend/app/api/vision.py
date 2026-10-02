from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import base64

from app.schemas.vision import VisionScanResponse
from app.services.vision.detector import vision_detector

router = APIRouter(prefix="/vision", tags=["Vision & OCR"])

@router.post("/scan", response_model=VisionScanResponse)
async def scan_grocery_image(
    file: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None)
):
    """
    Process grocery image via Gemini 1.5 Flash Vision and return detected ingredients.
    """
    image_bytes = None
    
    if file:
        image_bytes = await file.read()
    elif image_base64:
        # Strip header if present
        if "base64," in image_base64:
            image_base64 = image_base64.split("base64,")[1]
        try:
            image_bytes = base64.b64decode(image_base64)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")
            
    if not image_bytes:
        # Fallback test scan
        image_bytes = b""

    result = await vision_detector.detect_grocery_image(image_bytes)
    return result
