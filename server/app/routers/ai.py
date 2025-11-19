# app/routers/ai.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.api.geminiService import gemini_music_service

router = APIRouter()

class ChordRequest(BaseModel):
    songQuery: str
    simplify: bool = False

@router.post("/chords")
async def generate_chords(request: ChordRequest):
    """Generate chord progression for a song"""
    try:
        print(f"🎹 Received chord request for: {request.songQuery}")
        result = await gemini_music_service.generateChordProgression(request)
        return result
    except Exception as e:
        print(f"💥 Error in /chords endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))