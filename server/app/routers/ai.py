# server/app/routers/ai.py
from fastapi import APIRouter, HTTPException
from app.api.grokService import grok_service
from app.api.geminiService import gemini_music_service
from app.schemas import (
    ChordProgressionRequest,
    FullSongArrangement,
    BackingTrackResult,
    RhythmPatternResult,
    MelodySuggestionResult,
    ImprovTipsResult,
    LyricsResult,
    PracticeAdviceResult,
    LessonResult,
)

router = APIRouter(prefix="/ai")


async def _try_gemini_first(gemini_func, grok_func, *args, **kwargs):
    """
    Helper: Try Gemini first → fall back to Grok on any error
    """
    if gemini_music_service.available:
        try:
            print("Trying Gemini first...")
            result = await gemini_func(*args, **kwargs)
            print("Gemini succeeded")
            return result
        except Exception as ge:
            print(f"Gemini failed ({ge}), falling back to Grok...")

    # Gemini unavailable or failed → use Grok
    try:
        print("Using Grok...")
        result = await grok_func(*args, **kwargs)
        print("Grok succeeded")
        return result
    except Exception as e:
        print(f"Grok also failed: {e}")
        raise HTTPException(status_code=503, detail="All AI backends currently unavailable")


@router.post("/chords", response_model=FullSongArrangement)
async def generate_song_arrangement(request: ChordProgressionRequest):
    print(f"Generating song: {request.songQuery}")
    return await _try_gemini_first(
        gemini_music_service.generateSongArrangement,
        grok_service.generate_song_arrangement,
        request
    )


@router.post("/backing-track", response_model=BackingTrackResult)
async def generate_backing_track(data: dict):
    prompt = data.get("prompt", "Create a pop rock backing track in C major")
    return await _try_gemini_first(
        gemini_music_service.generate_backing_track,
        grok_service.generate_backing_track,
        prompt
    )


@router.post("/rhythm", response_model=RhythmPatternResult)
async def generate_rhythm(data: dict):
    time_sig = data.get("timeSignature", "4/4")
    level = data.get("level", "intermediate")
    return await _try_gemini_first(
        lambda: gemini_music_service.generate_rhythm_pattern(time_sig, level),  # Add this method if missing
        grok_service.generate_rhythm_pattern,
        time_sig, level
    )


@router.post("/melody", response_model=MelodySuggestionResult)
async def generate_melody(data: dict):
    key = data.get("key", "C")
    style = data.get("style", "pop")
    return await _try_gemini_first(
        lambda: gemini_music_service.generate_melody(key, style),  # Add if missing
        grok_service.generate_melody,
        key, style
    )


@router.post("/improv", response_model=ImprovTipsResult)
async def get_improv_tips(data: dict):
    query = data.get("query", "blues")
    return await _try_gemini_first(
        lambda: gemini_music_service.generate_improv_tips(query),  # Add if missing
        grok_service.generate_improv_tips,
        query
    )


@router.post("/lyrics", response_model=LyricsResult)
async def generate_lyrics(data: dict):
    topic = data.get("topic", "love")
    genre = data.get("genre", "pop")
    mood = data.get("mood", "hopeful")
    return await _try_gemini_first(
        lambda: gemini_music_service.generate_lyrics(topic, genre, mood),  # Add if missing
        grok_service.generate_lyrics,
        topic, genre, mood
    )


@router.post("/practice-advice", response_model=PracticeAdviceResult)
async def get_practice_advice(data: dict):
    sessions = data.get("sessions", [])
    return await _try_gemini_first(
        lambda: gemini_music_service.get_practice_advice(sessions),  # Add if missing
        grok_service.get_practice_advice,
        sessions
    )


@router.post("/lesson", response_model=LessonResult)
async def generate_lesson(data: dict):
    skill = data.get("skill_level", "intermediate")
    instrument = data.get("instrument", "guitar")
    focus = data.get("focus", "chord transitions")

    print(f"Generating lesson → Skill: {skill}, Instrument: {instrument}, Focus: {focus}")

    return await _try_gemini_first(
        gemini_music_service.generate_lesson,
        grok_service.generate_lesson,
        skill, instrument, focus
    )