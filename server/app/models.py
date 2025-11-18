# app/models.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Table, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

# Helper for timezone-aware UTC timestamps
def utcnow():
    return datetime.now(timezone.utc)

# ---------------------------
# Association table: User <-> Instruments
# ---------------------------
user_instruments_table = Table(
    "user_instruments",
    Base.metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("instrument_id", Integer, ForeignKey("instruments.id")),
)

# ---------------------------
# Users
# ---------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    skill_level = Column(String)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    instruments = relationship("Instrument", secondary=user_instruments_table, back_populates="users")
    settings = relationship("UserSettings", uselist=False, back_populates="user")
    chord_progressions = relationship("ChordProgression", back_populates="user")
    melodies = relationship("Melody", back_populates="user")
    practice_sessions = relationship("PracticeSession", back_populates="user")
    user_songs = relationship("UserSong", back_populates="user")

# ---------------------------
# Instruments
# ---------------------------
class Instrument(Base):
    __tablename__ = "instruments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String)

    users = relationship("User", secondary=user_instruments_table, back_populates="instruments")
    lessons = relationship("Lesson", back_populates="instrument")
    chord_progressions = relationship("ChordProgression", back_populates="instrument")
    melodies = relationship("Melody", back_populates="instrument")

# ---------------------------
# Lessons
# ---------------------------
class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    lesson_type = Column(String)
    instrument_id = Column(Integer, ForeignKey("instruments.id"))
    difficulty = Column(String)
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    instrument = relationship("Instrument", back_populates="lessons")
    practice_sessions = relationship("PracticeSession", back_populates="lesson")

# ---------------------------
# Songs
# ---------------------------
class Song(Base):
    __tablename__ = "songs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    artist = Column(String)
    genre = Column(String)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    chord_progressions = relationship("ChordProgression", back_populates="song")
    practice_sessions = relationship("PracticeSession", back_populates="song")
    user_songs = relationship("UserSong", back_populates="song")

# ---------------------------
# Chord Progressions
# ---------------------------
class ChordProgression(Base):
    __tablename__ = "chord_progressions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    song_id = Column(Integer, ForeignKey("songs.id"), nullable=True)
    instrument_id = Column(Integer, ForeignKey("instruments.id"))
    progression = Column(Text)
    skill_level = Column(String)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="chord_progressions")
    song = relationship("Song", back_populates="chord_progressions")
    instrument = relationship("Instrument", back_populates="chord_progressions")

# ---------------------------
# Melodies
# ---------------------------
class Melody(Base):
    __tablename__ = "melodies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    instrument_id = Column(Integer, ForeignKey("instruments.id"))
    melody_data = Column(Text)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="melodies")
    instrument = relationship("Instrument", back_populates="melodies")

# ---------------------------
# Practice Sessions
# ---------------------------
class PracticeSession(Base):
    __tablename__ = "practice_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)
    song_id = Column(Integer, ForeignKey("songs.id"), nullable=True)
    duration_minutes = Column(Integer)
    feedback = Column(Text)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="practice_sessions")
    lesson = relationship("Lesson", back_populates="practice_sessions")
    song = relationship("Song", back_populates="practice_sessions")

# ---------------------------
# User Songs
# ---------------------------
class UserSong(Base):
    __tablename__ = "user_songs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    song_id = Column(Integer, ForeignKey("songs.id"))
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="user_songs")
    song = relationship("Song", back_populates="user_songs")

# ---------------------------
# User Settings
# ---------------------------
class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    tuning_reference = Column(String)
    preferred_metronome_tempo = Column(Integer)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="settings")
