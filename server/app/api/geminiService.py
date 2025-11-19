# server/services/gemini_service.py  (or wherever your file is)
import google.generativeai as genai
import os
import logging
from typing import Dict, Any
import json
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure logging
logger = logging.getLogger(__name__)

# --- Types (kept for compatibility) ---
class FullSongArrangement(Dict[str, Any]):
    pass

class GeminiMusicService:
    """Service for interacting with Google's Gemini AI for music generation"""
    
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.model = None
        self.available = False
        self.model_name = None
        
        print(f"Initializing Gemini for Music Studio...")
        print(f"   API Key present: {bool(self.api_key)}")
        
        if not self.api_key:
            logger.error("GEMINI_API_KEY not found in environment variables")
            return
        
        try:
            genai.configure(api_key=self.api_key)
            print("Gemini configured successfully")
            
            # BEST FREE MODEL AS OF NOVEMBER 2025
            # Huge free quota, fast, great at music/chords
            working_model = 'gemini-2.5-flash'
            
            print(f"Initializing model: {working_model}")
            self.model = genai.GenerativeModel(
                working_model,
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 8192,
                },
                safety_settings=None  # Adjust if needed
            )
            
            # Quick test
            test_response = self.model.generate_content("Say 'ready' in one word.")
            if test_response and test_response.text and "ready" in test_response.text.lower():
                self.available = True
                self.model_name = working_model
                print(f"Successfully initialized with {working_model} — READY!")
            else:
                print(f"Unexpected response from {working_model}")
                
        except Exception as e:
            logger.error(f"Failed to initialize Gemini AI: {str(e)}")
            print(f"Gemini initialization failed: {str(e)}")

    async def generateSongArrangement(self, request) -> FullSongArrangement:
        if not self.model or not self.available:
            error_msg = "Gemini AI service is currently unavailable"
            print(f"{error_msg}")
            raise Exception(error_msg)
        
        prompt = self._build_song_arrangement_prompt(request)
        
        try:
            print(f"Generating arrangement for: '{request.songQuery}' on {getattr(request, 'instrument', 'Guitar')}")
            print(f"Using model: {self.model_name}")
            
            response = self.model.generate_content(prompt)
            
            if not response.text:
                raise ValueError("Empty response from Gemini")
            
            print("Raw Gemini response received")
            result = self._parse_song_arrangement_response(response.text)
            print("Successfully parsed song arrangement")
            return result
            
        except Exception as e:
            logger.error(f"Song arrangement generation failed: {str(e)}")
            print(f"Error in generateSongArrangement: {str(e)}")
            raise Exception(f"AI service error: {str(e)}")

    def _build_song_arrangement_prompt(self, request) -> str:
        simplify_text = "Simplify chords to basic open shapes" if getattr(request, 'simplify', False) else "Include richer voicings and extensions"
        instrument = getattr(request, 'instrument', 'Guitar')
        
        return f"""
You are a world-class guitar teacher and music arranger.

Song: "{request.songQuery}"
Instrument: {instrument}

Return ONLY a valid JSON object with this exact structure — no markdown, no explanations, no code blocks:

{{
  "songTitle": "Exact song title",
  "artist": "Artist name",
  "key": "e.g. C Major or A Minor",
  "instrument": "{instrument}",
  "tuning": "E A D G B E",
  "progressionSummary": ["C", "Am", "F", "G"],
  "tablature": [
    {{
      "section": "Verse 1",
      "lines": [
        {{"lyrics": "C               G", "isChordLine": true}},
        {{"lyrics": "Imagine there's no heaven", "isChordLine": false}}
      ]
    }}
  ],
  "chordDiagrams": [
    {{
      "chord": "C",
      "frets": ["X", 3, 2, 0, 1, 0],
      "fingers": [null, 3, 2, 0, 1, 0],
      "capoFret": 0
    }}
  ],
  "substitutions": [
    {{
      "originalChord": "C",
      "substitutedChord": "Cmaj7",
      "theory": "Adds dreamy open sound"
    }}
  ],
  "practiceTips": [
    "Strum down-down-up-up-down-up",
    "Focus on clean transitions between C and G"
  ]
}}

CRITICAL:
- Return ONLY the JSON
- Use real chords from the actual song
- {simplify_text}
- Make diagrams playable on {instrument}
- Valid JSON only!
"""

    def _parse_song_arrangement_response(self, response_text: str) -> FullSongArrangement:
        try:
            cleaned = response_text.strip()
            json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
            if not json_match:
                raise ValueError("No JSON found in response")
            
            json_str = json_match.group(0)
            parsed = json.loads(json_str)
            
            required = ['songTitle', 'artist', 'key', 'tablature', 'chordDiagrams']
            for field in required:
                if field not in parsed:
                    raise ValueError(f"Missing field: {field}")
            
            return parsed
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}\nResponse was: {response_text[:500]}")
            raise ValueError("Invalid JSON from AI")
        except Exception as e:
            logger.error(f"Parsing failed: {str(e)}")
            raise

# Global instance
gemini_music_service = GeminiMusicService()

async def generateChordProgression(request) -> FullSongArrangement:
    return await gemini_music_service.generateSongArrangement(request)