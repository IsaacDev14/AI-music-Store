# server/app/api/grokService.py
import os
import httpx
import json
import re
import logging
from dotenv import load_dotenv

load_dotenv()

GROK_API_KEY = os.getenv("GROK_API_KEY")
logger = logging.getLogger(__name__)

class GrokService:
    def __init__(self):
        self.api_key = GROK_API_KEY
        self.available = bool(self.api_key)
        if not self.available:
            print("GROK_API_KEY not set — Grok fallback disabled")

    async def generate_song_arrangement(self, request):
        if not self.available:
            raise Exception("Grok API key not configured")

        simplify = "Use only basic open chords (no barre)" if getattr(request, 'simplify', False) else "Include richer voicings"

        prompt = f"""
You are an expert guitar teacher. Return **only** valid JSON matching this exact structure:

{{
  "songTitle": "Song Name",
  "artist": "Artist Name",
  "key": "C Major",
  "progression": [
    {{"chord": "C", "duration": 4}},
    {{"chord": "Am", "duration": 4}},
    {{"chord": "F", "duration": 4}},
    {{"chord": "G", "duration": 4}}
  ],
  "substitutions": [
    {{"originalChord": "C", "substitutedChord": "Cmaj7", "theory": "Adds dreamy open sound"}}
  ],
  "practiceTips": [
    "Practice at 60 BPM first",
    "Focus on clean changes between F and C"
  ]
}}

Song: {request.songQuery}
Instrument: Guitar
{simplify}
Return ONLY the JSON.
"""

        payload = {
            "model": "grok-beta",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 2000
        }

        headers = {"Authorization": f"Bearer {self.api_key}"}

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://api.x.ai/v1/chat/completions", 
                json=payload, 
                headers=headers
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]

            # Extract JSON from response
            json_match = re.search(r"\{.*\}", content, re.DOTALL)
            if not json_match:
                raise ValueError("No JSON in Grok response")
            return json.loads(json_match.group(0))

# Global instance
grok_service = GrokService()
