# server/app/schemas.py
from pydantic import BaseModel
from typing import List

class Chord(BaseModel):
    chord: str
    duration: int = 4

class Substitution(BaseModel):
    originalChord: str
    substitutedChord: str
    theory: str

class ChordProgressionRequest(BaseModel):
    songQuery: str
    simplify: bool = True
    helpPractice: bool = True
    showSubstitutions: bool = True

class ChordProgression(BaseModel):
    songTitle: str
    artist: str
    key: str
    progression: List[Chord]
    substitutions: List[Substitution] = []
    practiceTips: List[str] = []