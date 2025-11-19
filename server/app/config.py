# app/config.py
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
AUDD_API_KEY = os.getenv("AUDD_API_KEY")

FRONTEND_ORIGINS = [
    "http://localhost:5173"
]

DEFAULT_CHORD_KEY = "C"
