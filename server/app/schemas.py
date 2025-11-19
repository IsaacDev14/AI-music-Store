from pydantic import BaseModel, Field
from typing import List, Union, Literal, Optional

# --- New Types for Chord and Lyrics Tablature ---

class TabLine(BaseModel):
    lyrics: str
    isChordLine: bool

class TabSection(BaseModel):
    section: str
    lines: List[TabLine]

# --- New Type for Chord Diagrams (Fretboard) ---
# Fret is a number (0-24) for open/fretted, or "X" for muted
# Null/0 finger means no finger/open
FretValue = Union[int, Literal["X"]]

class ChordDiagram(BaseModel):
    chord: str
    frets: List[FretValue] = Field(description="Fret numbers for each string (e.g., [3, 2, 0, 0, 0, 3])")
    fingers: List[Optional[int]] = Field(description="Finger numbers (1-4) or 0/null for open/muted strings")
    capoFret: int = 0
    
# --- Existing Types (Updated/Kept) ---

class Substitution(BaseModel):
    originalChord: str
    substitutedChord: str
    theory: str

class ChordProgressionRequest(BaseModel):
    songQuery: str
    simplify: bool = True
    helpPractice: bool = True
    showSubstitutions: bool = True
    instrument: Literal["Guitar", "Ukulele", "Piano"] = "Guitar" # New field for instrument selection

class FullSongArrangement(BaseModel):
    songTitle: str
    artist: str
    key: str
    instrument: str
    tuning: str
    progressionSummary: List[str]
    tablature: List[TabSection] # NEW: Structured lyrics and chords
    chordDiagrams: List[ChordDiagram] # NEW: Fretboard shapes
    substitutions: List[Substitution] = []
    practiceTips: List[str] = []