# Load environment variables
import os
from dotenv import load_dotenv

load_dotenv()

# --------------------
# API KEYS
# --------------------
GOOGLE_API_KEY = os.getenv("VITE_GEMINI_API_KEY", "")
AUDD_API_KEY = os.getenv("VITE_AUDD_API_KEY", "")

# --------------------
# CORS SETTINGS
# --------------------
FRONTEND_ORIGINS = [
    "http://localhost:5173",
]

# --------------------
# DEFAULT SETTINGS
# --------------------
DEFAULT_CHORD_KEY = "C"
