import httpx
import json
import re
import os
import time
from dotenv import load_dotenv

load_dotenv()
GROK_API_KEY = os.getenv("GROK_API_KEY")

class GrokService:
    def __init__(self):
        self.api_key = GROK_API_KEY
        self.headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else None
        self.available = bool(self.headers)

    async def _call_grok(self, prompt: str, max_tokens: int = 3000, retries: int = 2):
        if not self.headers:
            raise Exception("GROK_API_KEY missing")

        payload = {
            "model": "grok-beta",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.75,
            "max_tokens": max_tokens,
            "top_p": 0.92
        }

        for attempt in range(retries + 1):
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    resp = await client.post(
                        "https://api.x.ai/v1/chat/completions",
                        json=payload,
                        headers=self.headers
                    )
                    if resp.status_code == 429:
                        wait = 2 ** attempt
                        print(f"Grok rate limited — retrying in {wait}s (attempt {attempt + 1})")
                        time.sleep(wait)
                        continue
                    resp.raise_for_status()
                    return resp.json()["choices"][0]["message"]["content"]
            except Exception as e:
                if attempt == retries:
                    raise e
                wait = 2 ** attempt
                print(f"Grok request failed — retrying in {wait}s (attempt {attempt + 1})")
                time.sleep(wait)

    def _extract_json(self, text: str):
        if not text:
            return None
        match = re.search(r"\{(?:[^{}]|(?:\{[^{}]*\}))*\}", text, re.DOTALL)
        if not match:
            return None
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None

    async def generate_song_arrangement(self, request):
        if not self.available:
            raise Exception("Grok service not available")

        instrument = getattr(request, 'instrument', 'Guitar')
        simplify = "Use only easy open chords" if getattr(request, 'simplify', True) else "Include richer voicings"

        prompt = f"""
You are UltimateGuitar.com's best transcriber.
Song: "{request.songQuery}"
Instrument: {instrument}
{simplify}

Return ONLY valid JSON — no markdown:
{{
  "songTitle": "Exact title",
  "artist": "Artist name",
  "key": "e.g. C Major",
  "instrument": "{instrument}",
  "tuning": "E A D G B E",
  "progressionSummary": ["C", "Am", "F", "G"],
  "tablature": [
    {{
      "section": "Verse 1",
      "lines": [
        {{"lyrics": "C               Am", "isChordLine": true}},
        {{"lyrics": "Fly me to the moon", "isChordLine": false}}
      ]
    }}
  ],
  "chordDiagrams": [
    {{"chord": "C", "frets": [-1,3,2,0,1,0], "fingers": [0,3,2,0,1,0], "capoFret": 0}}
  ],
  "substitutions": [],
  "practiceTips": ["Practice at 70 BPM", "Focus on clean changes"]
}}
Use real chords & lyrics. Return ONLY JSON.
"""

        text = await self._call_grok(prompt)
        if not text:
            raise ValueError("Empty response from Grok")
            
        data = self._extract_json(text)
        if not data:
            raise ValueError("Grok did not return valid JSON")
        return data

    async def generate_backing_track(self, prompt: str):
        if not self.available:
            raise Exception("Grok service not available")

        full_prompt = f"""
Create a backing track arrangement based on: {prompt}

Return ONLY valid JSON with this structure:
{{
  "title": "Track Title",
  "style": "pop rock",
  "bpm": 120,
  "key": "C major",
  "tracks": [
    {{
      "instrument": "drums",
      "steps": [
        {{"beat": 1, "notes": ["kick"]}},
        {{"beat": 2, "notes": ["snare"]}}
      ]
    }}
  ],
  "youtubeQueries": ["search term 1", "search term 2"],
  "description": "Brief description"
}}
"""
        text = await self._call_grok(full_prompt)
        if not text:
            raise ValueError("Empty response from Grok")
            
        data = self._extract_json(text)
        if not data:
            raise ValueError("Grok did not return valid JSON for backing track")
        return data

    async def generate_rhythm_pattern(self, time_sig: str, level: str):
        if not self.available:
            raise Exception("Grok service not available")

        prompt = f"Generate a {level} {time_sig} drum pattern in 16th notes. Return ONLY JSON: {{'pattern': 'x--x--x--x--x--x-', 'description': 'brief description', 'difficulty': '{level}'}}"
        text = await self._call_grok(prompt)
        if not text:
            raise ValueError("Empty response from Grok")
            
        data = self._extract_json(text)
        if not data or "pattern" not in data:
            raise ValueError("Grok did not return valid rhythm pattern")
        return data

    async def generate_melody(self, key: str, style: str):
        if not self.available:
            raise Exception("Grok service not available")

        prompt = f"Write a short {style} melody in {key} using note names and durations (e.g. C4/4 E4/4 G4/2). Return ONLY JSON: {{'melody': 'C4 E4 G4', 'description': 'brief description', 'style': '{style}'}}"
        text = await self._call_grok(prompt)
        if not text:
            raise ValueError("Empty response from Grok")
            
        data = self._extract_json(text)
        if not data or "melody" not in data:
            raise ValueError("Grok did not return valid melody")
        return data

    async def generate_improv_tips(self, query: str):
        if not self.available:
            raise Exception("Grok service not available")

        prompt = f"Give 3 concise improv tips for {query}. Return ONLY valid JSON with 'response', 'scales', 'targetNotes', 'techniques'."
        text = await self._call_grok(prompt)
        if not text:
            raise ValueError("Empty response from Grok")
            
        data = self._extract_json(text)
        if not data:
            raise ValueError("Grok did not return valid improv tips")
        return data

    async def generate_lyrics(self, topic: str, genre: str, mood: str):
        if not self.available:
            raise Exception("Grok service not available")

        prompt = f"Write original lyrics about {topic} in {genre} style, {mood} mood. Verse-Chorus structure. Return ONLY JSON: {{'lyrics': 'full lyrics here', 'title': 'optional title', 'structure': 'verse-chorus'}}"
        text = await self._call_grok(prompt)
        if not text:
            raise ValueError("Empty response from Grok")
            
        data = self._extract_json(text)
        if not data or "lyrics" not in data:
            raise ValueError("Grok did not return valid lyrics")
        return data

    async def get_practice_advice(self, sessions):
        if not self.available:
            raise Exception("Grok service not available")

        prompt = f"Analyze these practice sessions and give personalized advice: {json.dumps(sessions[:3])}. Return ONLY JSON: {{'advice': 'main advice', 'insights': ['insight1', 'insight2'], 'nextGoals': ['goal1', 'goal2']}}"
        text = await self._call_grok(prompt)
        if not text:
            raise ValueError("Empty response from Grok")
            
        data = self._extract_json(text)
        if not data or "advice" not in data:
            raise ValueError("Grok did not return valid practice advice")
        return data

    async def generate_lesson(self, skill: str, instrument: str, focus: str):
        if not self.available:
            raise Exception("Grok service not available")

        prompt = f"""
You are an excellent, patient {instrument} teacher.
Write a clear, detailed, and encouraging lesson for a {skill.title()} player focusing on {focus}.
Use Markdown. Aim for 600–900 words — thorough but readable.

Return ONLY valid JSON with this structure:
{{
  "lesson": "# Full markdown lesson content here...",
  "title": "{focus.title()} Lesson",
  "duration": "30-45 minutes",
  "goals": ["Goal 1", "Goal 2", "Goal 3"]
}}

Structure the lesson with:
# {focus.title()} – {skill.title()} Level Lesson

## Goals Today
- Goal 1
- Goal 2
- Goal 3

## Warm-Up (5 mins)
Brief warm-up with tempo

## Core Idea
Explain the concept clearly with 1–2 examples

## 3 Exercises
Include tabs/fingerings

Return ONLY the JSON, no other text.
"""

        text = await self._call_grok(prompt, max_tokens=4000)
        if not text:
            raise ValueError("Empty response from Grok")
            
        data = self._extract_json(text)
        if not data or "lesson" not in data:
            raise ValueError("Grok did not return valid lesson")
        
        return data

grok_service = GrokService()