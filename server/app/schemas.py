# server/app/schemas.py
from pydantic import BaseModel
from typing import List, Dict

# ----------------
# AI / Chord Progression
# ----------------

class Chord(BaseModel):
    chord: str
    duration: int  # in beats

class Substitution(BaseModel):
    originalChord: str
    substitutedChord: str
    theory: str

class ChordProgression(BaseModel):
    songTitle: str
    artist: str
    key: str
    progression: List[Chord]
    substitutions: List[Substitution]
    practiceTips: List[str]

class ChordProgressionRequest(BaseModel):
    songQuery: str
    simplify: bool = True
    helpPractice: bool = True
    showSubstitutions: bool = True

# ----------------
# Users
# ----------------

class User(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str  # assuming you'll add hashing

# ----------------
# Instruments
# ----------------

class Instrument(BaseModel):
    id: int
    name: str
    type: str

class InstrumentCreate(BaseModel):
    name: str
    type: str

# ----------------
# Lessons
# ----------------

class Lesson(BaseModel):
    id: int
    title: str
    description: str
    instrument_id: int

class LessonCreate(BaseModel):
    title: str
    description: str
    instrument_id: int

# ----------------
# Songs
# ----------------

class Song(BaseModel):
    id: int
    title: str
    artist: str
    key: str

class SongCreate(BaseModel):
    title: str
    artist: str
    key: str
