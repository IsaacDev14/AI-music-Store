# app/routers/ai.py
from fastapi import APIRouter, HTTPException
from app.api.geminiService import generateChordProgression
from app.schemas import ChordProgressionRequest, ChordProgression

router = APIRouter()

@router.post("/chords", response_model=ChordProgression)
async def generate_chord(request: ChordProgressionRequest):
    """
    Generate a chord progression for a given song query.
    """
    try:
        result = await generateChordProgression(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
