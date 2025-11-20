import google.generativeai as genai
import os
import re
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class GeminiMusicService:
    def __init__(self):
        self.model = None
        self.available = False
        
        if not GEMINI_API_KEY:
            print("❌ GEMINI_API_KEY is missing in .env file.")
            return
        
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            
            # Using Gemini 2.0 Flash as discovered in your logs
            self.model = genai.GenerativeModel('gemini-2.0-flash')
            
            # Real connectivity test
            test_response = self.model.generate_content("Test connection. Reply with 'OK'.")
            if test_response:
                self.available = True
                print("✓ Gemini 2.0 Flash Connected Successfully")
        except Exception as e:
            print(f"❌ Gemini initialization error: {e}")

    async def _generate_json(self, prompt: str) -> dict:
        """
        Internal helper: Sends prompt to Gemini API and parses the JSON response.
        - Enforces 'application/json' to fix control character errors.
        - Unwraps Lists if the AI returns an array instead of an object.
        """
        if not self.available:
            raise Exception("Gemini API is not available. Check your API Key.")

        try:
            # 1. ACTUAL API CALL WITH JSON ENFORCEMENT
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            if not response.text:
                raise ValueError("Gemini returned an empty response.")

            text = response.text.strip()

            # 2. Parse JSON directly
            try:
                data = json.loads(text)
            except json.JSONDecodeError:
                # Fallback: Try to find JSON structure if extra text exists
                match = re.search(r"\{.*\}", text, re.DOTALL)
                if match:
                    data = json.loads(match.group(0))
                else:
                    raise ValueError(f"Could not parse JSON: {text[:100]}...")

            # 3. CRITICAL FIX: Unwrap List if necessary
            # FastAPI expects a Dict, but Gemini sometimes returns a List like [{...}]
            if isinstance(data, list):
                if len(data) > 0:
                    return data[0]
                else:
                    raise ValueError("Gemini returned an empty list.")
            
            return data
        
        except Exception as e:
            print(f"Error generating content: {e}")
            raise e

    # ---------------------------------------------------------
    # REAL DATA GENERATION METHODS
    # ---------------------------------------------------------

    async def generateSongArrangement(self, request) -> dict:
        """Generates a real song arrangement based on the user's song query."""
        instrument = getattr(request, 'instrument', 'Guitar')
        simplify = "Use only easy open chords" if getattr(request, 'simplify', True) else "Include 7ths and suspended chords"
        
        prompt = f'''
        You are an expert music transcriber. Create a valid JSON song sheet for "{request.songQuery}" on {instrument}.
        Constraint: {simplify}.

        The JSON must follow this exact schema:
        {{
          "songTitle": "Exact Song Title",
          "artist": "Artist Name", 
          "key": "Key (e.g. C Major)",
          "instrument": "{instrument}",
          "tuning": "Standard (E A D G B E)",
          "progressionSummary": ["Chord1", "Chord2"],
          "tablature": [
            {{
              "section": "Verse 1",
              "lines": [
                {{"lyrics": "Line of lyrics with chords aligned above", "isChordLine": true}},
                {{"lyrics": "Line of lyrics text", "isChordLine": false}}
              ]
            }}
          ],
          "chordDiagrams": [
            {{"chord": "C", "frets": [-1,3,2,0,1,0], "fingers": [0,3,2,0,1,0], "capoFret": 0}}
          ],
          "substitutions": [],
          "practiceTips": ["Specific tip 1", "Specific tip 2"]
        }}
        '''
        return await self._generate_json(prompt)

    async def generate_backing_track(self, prompt: str) -> dict:
        """Generates a real backing track structure."""
        full_prompt = f"""
        Act as a music producer. Create a backing track arrangement for this request: "{prompt}".

        Return ONLY valid JSON using this schema:
        {{
          "title": "Track Title",
          "style": "Detected Style", 
          "bpm": 120,
          "key": "Detected Key",
          "tracks": [
            {{
              "instrument": "drums",
              "steps": [
                {{"beat": 1, "notes": ["kick"]}},
                {{"beat": 2, "notes": ["snare"]}}
              ]
            }}
          ],
          "youtubeQueries": ["Search query 1", "Search query 2"],
          "description": "Brief description of the vibe"
        }}
        """
        return await self._generate_json(full_prompt)

    async def generate_lesson(self, skill: str, instrument: str, focus: str) -> dict:
        """Generates a unique lesson plan."""
        prompt = f"""
        You are a music teacher. specific lesson plan for a {skill} level {instrument} player focusing on "{focus}".
        The content must be educational and roughly 600 words.
        
        IMPORTANT: The 'lesson' field must contain the Markdown string. Ensure all newlines and special characters inside the string are properly escaped for JSON.

        Return valid JSON structure:
        {{
          "lesson": "# {focus.title()} Lesson\\n\\n## Introduction\\n[Write actual educational content here using Markdown]...",
          "title": "{focus.title()} Lesson",
          "duration": "30-45 minutes", 
          "goals": ["Specific Goal 1", "Specific Goal 2", "Specific Goal 3"]
        }}
        """
        return await self._generate_json(prompt)

    async def generate_rhythm_pattern(self, time_sig: str, level: str) -> dict:
        """Generates a real rhythm pattern."""
        prompt = f"""
        Create a unique rhythm/strumming pattern for a {level} player in {time_sig} time signature.
        
        Return valid JSON:
        {{
          "name": "Creative Pattern Name",
          "timeSignature": "{time_sig}",
          "description": "Description of how to play it",
          "pattern": [
            {{"beat": 1, "stroke": "Down", "duration": "quarter"}},
            {{"beat": 2, "stroke": "Up", "duration": "eighth"}}
          ]
        }}
        """
        return await self._generate_json(prompt)

    async def generate_melody(self, key: str, style: str) -> dict:
        """Generates actual melody notes."""
        prompt = f"""
        Compose a short melody motif in the key of {key} in the style of {style}.
        
        Return valid JSON:
        {{
          "scale": "Scale Used (e.g. Minor Pentatonic)",
          "key": "{key}",
          "notes": ["Note1", "Note2", "Note3"],
          "intervals": ["Interval1", "Interval2"],
          "suggestion": "Advice on how to phrase this melody"
        }}
        """
        return await self._generate_json(prompt)

    async def generate_improv_tips(self, query: str) -> dict:
        """Generates specific improvisation advice."""
        prompt = f"""
        Provide advanced improvisation tips for this specific context: "{query}".
        
        Return valid JSON:
        {{
            "style": "Identified Style",
            "recommendedScales": ["Scale 1", "Scale 2"],
            "tips": [
                "Specific tip 1",
                "Specific tip 2"
            ],
            "backingTrackSearch": "Youtube search query for backing track"
        }}
        """
        return await self._generate_json(prompt)

    async def generate_lyrics(self, topic: str, genre: str, mood: str) -> dict:
        """Writes original lyrics."""
        prompt = f"""
        Write original song lyrics. 
        Topic: {topic}
        Genre: {genre}
        Mood: {mood}
        
        Return valid JSON:
        {{
            "title": "Creative Title",
            "structure": ["Verse 1", "Chorus", "Verse 2"],
            "lyrics": "Verse 1:\\n[Write actual lyrics here]\\n\\nChorus:\\n[Write actual chorus here]"
        }}
        """
        return await self._generate_json(prompt)

    async def get_practice_advice(self, sessions: list) -> dict:
        """Analyzes the raw session data."""
        prompt = f"""
        Act as a practice coach. Analyze these past practice sessions: {json.dumps(sessions)}.
        
        Return valid JSON:
        {{
            "insight": "Observation about their consistency or focus",
            "recommendation": "Specific thing to do next session",
            "focusArea": "Technical area to improve"
        }}
        """
        return await self._generate_json(prompt)

# Singleton instance
gemini_music_service = GeminiMusicService()