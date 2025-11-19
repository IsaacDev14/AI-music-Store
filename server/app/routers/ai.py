# server/app/routers/ai.py
from fastapi import APIRouter, HTTPException
from app.api.grokService import grok_service      # ← NOW FIRST PRIORITY
from app.api.geminiService import gemini_music_service
from app.schemas import ChordProgressionRequest, FullSongArrangement

router = APIRouter()

@router.post("/chords", response_model=FullSongArrangement)
async def generate_chords(request: ChordProgressionRequest):
    """
    Generate song arrangement
    → Grok first (free, unlimited, fast)
    → Falls back to Gemini only if Grok is down (rare)
    """
    print(f"Received request: '{request.songQuery}' → Trying Grok first (free & unlimited)")

    # PRIORITY 1: Grok (free forever, no rate limits)
    try:
        grok_raw = await grok_service.generate_song_arrangement(request)

        # Normalize to match your frontend's expected format
        normalized = {
            "songTitle": grok_raw.get("songTitle", request.songQuery.title()),
            "artist": grok_raw.get("artist", "Unknown Artist"),
            "key": grok_raw.get("key", "C Major"),
            "progression": grok_raw.get("progression", []),
            "substitutions": grok_raw.get("substitutions", []),
            "practiceTips": grok_raw.get("practiceTips", grok_raw.get("tips", [])),
            **grok_raw  # safely pass through any extra data
        }

        print("Generated with Grok (free & fast)")
        return normalized

    except Exception as grok_error:
        print(f"Grok unavailable ({str(grok_error)}), falling back to Gemini...")

        # PRIORITY 2: Gemini (higher quality when quota allows)
        try:
            gemini_result = await gemini_music_service.generateSongArrangement(request)
            print("Generated with Gemini (fallback)")
            return gemini_result

        except Exception as gemini_error:
            error_msg = "All AI services currently unavailable. Please try again in a moment."
            print(f"Both Grok and Gemini failed: {gemini_error}")
            raise HTTPException(status_code=503, detail=error_msg)