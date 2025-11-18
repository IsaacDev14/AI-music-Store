# app/seeders/seed001.py
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import (
    User, Instrument, Lesson, Song, ChordProgression,
    Melody, PracticeSession, UserSong, UserSettings
)
from datetime import datetime, timezone

# Helper for UTC timestamps
def utcnow():
    return datetime.now(timezone.utc)

# Seed function
def seed_data():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # -------------------------------
        # Instruments
        # -------------------------------
        piano = Instrument(name="Piano", type="Keyboard")
        guitar = Instrument(name="Guitar", type="String")
        drums = Instrument(name="Drums", type="Percussion")
        instruments = [piano, guitar, drums]
        db.add_all(instruments)
        db.commit()
        print("✅ Instruments seeded")

        # -------------------------------
        # Users
        # -------------------------------
        user1 = User(
            name="Alice",
            email="alice@example.com",
            password="password123",
            skill_level="Beginner",
            instruments=[piano, guitar]
        )
        user2 = User(
            name="Bob",
            email="bob@example.com",
            password="password456",
            skill_level="Intermediate",
            instruments=[guitar, drums]
        )
        db.add_all([user1, user2])
        db.commit()
        print("✅ Users seeded")

        # -------------------------------
        # Lessons
        # -------------------------------
        lesson1 = Lesson(title="Basic Piano Scales", lesson_type="Theory", instrument=piano, difficulty="Beginner", content="Learn C major scales")
        lesson2 = Lesson(title="Guitar Chords 101", lesson_type="Practice", instrument=guitar, difficulty="Beginner", content="Learn major and minor chords")
        db.add_all([lesson1, lesson2])
        db.commit()
        print("✅ Lessons seeded")

        # -------------------------------
        # Songs
        # -------------------------------
        song1 = Song(title="Imagine", artist="John Lennon", genre="Pop")
        song2 = Song(title="Wonderwall", artist="Oasis", genre="Rock")
        db.add_all([song1, song2])
        db.commit()
        print("✅ Songs seeded")

        # -------------------------------
        # Chord Progressions
        # -------------------------------
        cp1 = ChordProgression(user=user1, instrument=guitar, song=song2, progression="C G Am F", skill_level="Beginner")
        cp2 = ChordProgression(user=user2, instrument=piano, song=song1, progression="C F G C", skill_level="Intermediate")
        db.add_all([cp1, cp2])
        db.commit()
        print("✅ Chord progressions seeded")

        # -------------------------------
        # Melodies
        # -------------------------------
        melody1 = Melody(user=user1, instrument=piano, melody_data="C D E F G")
        melody2 = Melody(user=user2, instrument=guitar, melody_data="G A B C D")
        db.add_all([melody1, melody2])
        db.commit()
        print("✅ Melodies seeded")

        # -------------------------------
        # Practice Sessions
        # -------------------------------
        session1 = PracticeSession(user=user1, lesson=lesson1, duration_minutes=30, feedback="Good progress!")
        session2 = PracticeSession(user=user2, song=song2, duration_minutes=45, feedback="Needs improvement on chords")
        db.add_all([session1, session2])
        db.commit()
        print("✅ Practice sessions seeded")

        # -------------------------------
        # User Songs
        # -------------------------------
        usong1 = UserSong(user=user1, song=song1)
        usong2 = UserSong(user=user2, song=song2)
        db.add_all([usong1, usong2])
        db.commit()
        print("✅ User songs seeded")

        # -------------------------------
        # User Settings
        # -------------------------------
        setting1 = UserSettings(user=user1, tuning_reference="A440", preferred_metronome_tempo=100)
        setting2 = UserSettings(user=user2, tuning_reference="A442", preferred_metronome_tempo=120)
        db.add_all([setting1, setting2])
        db.commit()
        print("✅ User settings seeded")

        print("🎉 Database seeding complete!")

    except Exception as e:
        db.rollback()
        print("❌ Error seeding data:", e)
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
