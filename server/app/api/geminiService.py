import httpx
import json
import re
from typing import Dict, Any
from app.config import GOOGLE_API_KEY
from app.schemas import ChordProgressionRequest


GEMINI_API_URLS = [
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
]

async def generateChordProgression(request: ChordProgressionRequest) -> Dict[str, Any]:
    prompt = f"""
You are a world-class music theory teacher and professional guitarist.

Analyze the song "{request.songQuery}" and return ONLY valid JSON (no explanations) with this exact structure:

{{
  "songTitle": "Exact song title",
  "artist": "Artist name",
  "key": "e.g. C Major or A Minor",
  "progression": [{{"chord": "C", "duration": 4}}, {{"chord": "Am", "duration": 4}}],
  "substitutions": {[] if not request.showSubstitutions else '[{"originalChord": "C", "substitutedChord": "Cmaj7", "theory": "Adds color..."}]'},
  "practiceTips": {[] if not request.helpPractice else '["Slow practice first", "Focus on clean changes"]'}
}}

Rules:
- Use standard chord notation (C, Am, G7, Fmaj7, etc.)
- Keep durations realistic (2, 4, or 8 beats)
- {"Use only basic open chords (no barre chords or complex voicings)" if request.simplify else "Include richer voicings and extensions"}
- Respond with JSON only — nothing before or after
"""

    last_error = None
    for api_url in GEMINI_API_URLS:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{api_url}?key={GOOGLE_API_KEY}",
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": 0.7,
                            "topP": 0.95,
                            "maxOutputTokens": 1024,
                        },
                    },
                    timeout=30.0
                )

                response.raise_for_status()
                data = response.json()
                candidates = data.get("candidates", [])
                if candidates:
                    text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    json_match = re.search(r'\{.*\}', text, re.DOTALL)
                    if json_match:
                        parsed = json.loads(json_match.group())
                        return {
                            "songTitle": parsed.get("songTitle", request.songQuery),
                            "artist": parsed.get("artist", "Unknown Artist"),
                            "key": parsed.get("key", "C Major"),
                            "progression": parsed.get("progression", []),
                            "substitutions": parsed.get("substitutions", []),
                            "practiceTips": parsed.get("practiceTips", [])
                        }
        except Exception as e:
            last_error = str(e)
            continue

    # Fallback if all API calls fail
    return {
        "songTitle": request.songQuery,
        "artist": "Various Artists",
        "key": "C Major",
        "progression": [
            {"chord": "C", "duration": 4},
            {"chord": "G", "duration": 4},
            {"chord": "Am", "duration": 4},
            {"chord": "F", "duration": 4}
        ],
        "substitutions": [
            {"originalChord": "C", "substitutedChord": "Cmaj7", "theory": "Adds a dreamy, sophisticated color"}
        ] if request.showSubstitutions else [],
        "practiceTips": [
            "Practice changes slowly at first",
            "Count out loud to stay in rhythm",
            "Try different strumming patterns"
        ] if request.helpPractice else []
    }
