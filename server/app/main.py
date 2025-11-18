from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users, instruments, lessons, songs, ai
from app.config import FRONTEND_ORIGINS

app = FastAPI()

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(instruments.router, prefix="/instruments", tags=["instruments"])
app.include_router(lessons.router, prefix="/lessons", tags=["lessons"])
app.include_router(songs.router, prefix="/songs", tags=["songs"])
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
