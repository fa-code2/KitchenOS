from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Response
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
import base64

from app.core.database import get_db
from app.services.voice.processor import voice_agent

router = APIRouter(prefix="/voice", tags=["Voice Inventory Logging"])

@router.post("/command")
async def process_voice_text_command(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Process spoken kitchen updates verbally or via transcript:
    Example: 'Hey Kitchen OS, I just used half the cottage cheese and put 200g of cooked dal in the fridge'
    Executes pantry mutations, records waste saved, and synthesizes dynamic Gemini ElevenLabs voice confirmation.
    """
    transcript = payload.get("transcript") or payload.get("text") or payload.get("command") or ""
    if not transcript or not transcript.strip():
        raise HTTPException(status_code=400, detail="Missing command text or transcript")

    # 1. Parse natural speech into structured inventory operations
    actions = await voice_agent.parse_natural_speech_commands(transcript)

    # 2. Execute database operations
    logs, base_confirmation = voice_agent.execute_inventory_updates(actions, db)

    # 3. Generate dynamic conversational spoken confirmation from Gemini
    spoken_confirmation = await voice_agent.generate_dynamic_spoken_confirmation(actions, logs, base_confirmation)

    # 4. Generate natural ElevenLabs audio response for the dynamic confirmation
    audio_bytes = await voice_agent.generate_elevenlabs_audio(spoken_confirmation)
    audio_base64 = None
    has_elevenlabs = False

    if audio_bytes:
        audio_base64 = f"data:audio/mp3;base64,{base64.b64encode(audio_bytes).decode('utf-8')}"
        has_elevenlabs = True
    else:
        # Fallback chime audio so frontend can always play audible confirmation
        fallback_wav = voice_agent.create_fallback_audio_wav()
        audio_base64 = f"data:audio/wav;base64,{base64.b64encode(fallback_wav).decode('utf-8')}"

    return {
        "success": True,
        "transcript_received": transcript,
        "actions_parsed": actions,
        "database_logs": logs,
        "spoken_confirmation": spoken_confirmation,
        "audio_base64": audio_base64,
        "voice_engine": "ElevenLabs Natural Audio" if has_elevenlabs else "Kitchen OS Audio Engine"
    }

@router.post("/audio-command")
async def process_voice_audio_command(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload recorded voice audio (WAV, MP3, WEBM, M4A).
    Transcribes audio via Speech-to-Text, processes inventory updates, and returns dynamic Gemini voice confirmation.
    """
    audio_content = await file.read()
    if not audio_content:
        raise HTTPException(status_code=400, detail="Audio file is empty")

    # 1. Speech-to-Text
    transcript = await voice_agent.transcribe_audio(audio_content, filename=file.filename or "audio.wav")
    if not transcript or not transcript.strip():
        raise HTTPException(status_code=422, detail="Could not transcribe voice audio. Please speak clearly or enter command as text.")

    # 2. Parse actions
    actions = await voice_agent.parse_natural_speech_commands(transcript)

    # 3. Execute DB updates
    logs, base_confirmation = voice_agent.execute_inventory_updates(actions, db)

    # 4. Generate dynamic conversational spoken confirmation from Gemini
    spoken_confirmation = await voice_agent.generate_dynamic_spoken_confirmation(actions, logs, base_confirmation)

    # 5. Generate natural ElevenLabs audio
    audio_bytes = await voice_agent.generate_elevenlabs_audio(spoken_confirmation)
    audio_base64 = None
    has_elevenlabs = False

    if audio_bytes:
        audio_base64 = f"data:audio/mp3;base64,{base64.b64encode(audio_bytes).decode('utf-8')}"
        has_elevenlabs = True
    else:
        fallback_wav = voice_agent.create_fallback_audio_wav()
        audio_base64 = f"data:audio/wav;base64,{base64.b64encode(fallback_wav).decode('utf-8')}"

    return {
        "success": True,
        "transcript": transcript,
        "actions_parsed": actions,
        "database_logs": logs,
        "spoken_confirmation": spoken_confirmation,
        "audio_base64": audio_base64,
        "voice_engine": "ElevenLabs Natural Audio" if has_elevenlabs else "Kitchen OS Audio Engine"
    }

@router.post("/tts")
async def synthesize_speech(payload: Dict[str, str]):
    """
    Convert dynamic text to ElevenLabs natural speech.
    """
    text = payload.get("text", "Kitchen OS operational.")
    audio_bytes = await voice_agent.generate_elevenlabs_audio(text)
    if audio_bytes:
        return Response(content=audio_bytes, media_type="audio/mpeg")
    
    fallback_wav = voice_agent.create_fallback_audio_wav()
    return Response(content=fallback_wav, media_type="audio/wav")
