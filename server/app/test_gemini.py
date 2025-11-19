# test_service_directly.py
import sys
import os
sys.path.append(os.path.dirname(__file__))

from api.geminiService import gemini_music_service
import asyncio

async def test_service():
    print("Testing Gemini Music Service...")
    
    # Check if service is available
    if not gemini_music_service.available:
        print("❌ Service not available")
        print(f"   Model: {gemini_music_service.model}")
        print(f"   Model Name: {gemini_music_service.model_name}")
        return
    
    print("✅ Service is available")
    print(f"   Using model: {gemini_music_service.model_name}")
    
    # Test with a simple request
    class MockRequest:
        def __init__(self, song_query, simplify=False):
            self.songQuery = song_query
            self.simplify = simplify
    
    try:
        request = MockRequest("Let It Be", simplify=True)
        result = await gemini_music_service.generateChordProgression(request)
        print("✅ Chord progression generated successfully!")
        print(f"   Song: {result['songTitle']}")
        print(f"   Artist: {result['artist']}")
        print(f"   Key: {result['key']}")
        print(f"   Progression: {result['progression']}")
    except Exception as e:
        print(f"❌ Error generating chords: {e}")

if __name__ == "__main__":
    asyncio.run(test_service())