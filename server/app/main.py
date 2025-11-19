# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow frontend requests - make sure this is correct
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from app.routers import ai

app.include_router(ai.router, prefix="/ai", tags=["ai"])

@app.on_event("startup")
async def startup_event():
    print("🚀 FastAPI app is starting up...")

@app.on_event("shutdown")
async def shutdown_event():
    print("🛑 FastAPI app is shutting down...")

@app.get("/")
async def root():
    return {"message": "Chord Progression API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is running successfully"}

# Add a test endpoint to verify CORS is working
@app.get("/test-cors")
async def test_cors():
    return {"message": "CORS is working!"}