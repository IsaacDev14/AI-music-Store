# app/api/geminiService.py
import google.generativeai as genai
import os
import logging
from typing import Dict, Any
import json
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key directly from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure logging
logger = logging.getLogger(__name__)

class GeminiMusicService:
    """Service for interacting with Google's Gemini AI for music generation"""
    
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.model = None
        self.available = False
        self.model_name = None
        
        print(f"🔑 Initializing Gemini for Music Studio...")
        print(f"   API Key present: {bool(self.api_key)}")
        
        if not self.api_key:
            logger.error("GEMINI_API_KEY not found in environment variables")
            return
        
        try:
            genai.configure(api_key=self.api_key)
            print("✅ Gemini configured successfully")
            
            # Use only the working model we confirmed
            working_model = 'models/gemini-2.0-flash'
            
            try:
                print(f"🔍 Initializing model: {working_model}")
                self.model = genai.GenerativeModel(working_model)
                
                # Test with a simple prompt
                test_response = self.model.generate_content("Say 'Hello' in one word.")
                if test_response and test_response.text:
                    self.available = True
                    self.model_name = working_model
                    print(f"✅ Successfully initialized with {working_model}")
                else:
                    print(f"❌ No response from {working_model}")
                    return
                    
            except Exception as model_error:
                print(f"❌ {working_model} failed: {str(model_error)}")
                return
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Gemini AI: {str(e)}")
            print(f"❌ Gemini initialization failed: {str(e)}")

    async def generateChordProgression(self, request) -> Dict[str, Any]:
        """Generate chord progression using Gemini AI"""
        if not self.model or not self.available:
            error_msg = "Gemini AI service is currently unavailable"
            print(f"❌ {error_msg}")
            raise Exception(error_msg)
        
        prompt = self._build_chord_progression_prompt(request)
        
        try:
            print(f"🎵 Generating chord progression for: '{request.songQuery}'")
            print(f"📤 Using model: {self.model_name}")
            
            response = self.model.generate_content(prompt)
            
            if not response.text:
                error_msg = "No response generated from Gemini AI"
                print(f"❌ {error_msg}")
                raise ValueError(error_msg)
            
            print(f"📥 Raw Gemini response received")
            
            # Extract and parse JSON from response - NO FALLBACKS
            result = self._parse_chord_progression_response(response.text)
            print(f"✅ Successfully parsed chord progression")
            return result
            
        except Exception as e:
            logger.error(f"Chord progression generation failed: {str(e)}")
            print(f"💥 Error in generateChordProgression: {str(e)}")
            raise Exception(f"AI service error: {str(e)}")

    def _build_chord_progression_prompt(self, request) -> str:
        """Build prompt for chord progression generation"""
        simplify_text = "Use only basic open chords (C, G, D, Am, Em, etc.)" if getattr(request, 'simplify', False) else "Include richer voicings and extensions when appropriate"
        
        return f"""
You are a world-class music theory teacher and professional guitarist.

Analyze the song "{request.songQuery}" and return ONLY valid JSON (no explanations, no markdown, no code blocks) with this exact structure:

{{
  "songTitle": "Exact song title",
  "artist": "Artist name",
  "key": "e.g. C Major or A Minor",
  "progression": [
    {{"chord": "C", "duration": 4}},
    {{"chord": "G", "duration": 4}},
    {{"chord": "Am", "duration": 4}},
    {{"chord": "F", "duration": 4}}
  ],
  "substitutions": [
    {{
      "originalChord": "C",
      "substitutedChord": "Cmaj7", 
      "theory": "Adds a more sophisticated, jazzy sound"
    }}
  ],
  "practiceTips": [
    "Practice slowly with a metronome",
    "Focus on smooth chord transitions",
    "Memorize the progression before adding rhythm"
  ]
}}

CRITICAL RULES:
- Return ONLY the JSON object, nothing else
- Use standard chord notation
- Keep durations realistic (2, 4, or 8 beats)
- {simplify_text}
- Make sure the JSON is valid and properly formatted
- Provide accurate information based on actual music theory
- Do not make up or invent chord progressions - use real musical analysis
"""

    def _parse_chord_progression_response(self, response_text: str) -> Dict[str, Any]:
        """Parse the Gemini response into structured chord progression data - NO FALLBACKS"""
        try:
            # Clean the response text
            cleaned_text = response_text.strip()
            
            # Extract JSON from response using regex
            json_match = re.search(r'\{.*\}', cleaned_text, re.DOTALL)
            if not json_match:
                raise ValueError("No JSON found in Gemini response")
            
            json_str = json_match.group()
            parsed = json.loads(json_str)
            
            # Validate required fields - raise error if missing instead of using fallbacks
            required_fields = ['songTitle', 'artist', 'key', 'progression']
            for field in required_fields:
                if field not in parsed:
                    raise ValueError(f"Missing required field in response: {field}")
            
            # Validate progression structure
            progression = parsed['progression']
            if not isinstance(progression, list):
                raise ValueError("Progression must be an array")
            
            for i, chord in enumerate(progression):
                if not isinstance(chord, dict) or 'chord' not in chord or 'duration' not in chord:
                    raise ValueError(f"Invalid chord object at position {i}")
            
            # Return ONLY what came from the API - no fallback values
            return {
                "songTitle": parsed["songTitle"],
                "artist": parsed["artist"],
                "key": parsed["key"],
                "progression": parsed["progression"],
                "substitutions": parsed.get("substitutions", []),
                "practiceTips": parsed.get("practiceTips", [])
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}")
            raise ValueError(f"Failed to parse JSON response: {str(e)}")
        except Exception as e:
            logger.error(f"Response parsing failed: {str(e)}")
            raise

# Create global instance
gemini_music_service = GeminiMusicService()

async def generateChordProgression(request) -> Dict[str, Any]:
    return await gemini_music_service.generateChordProgression(request)