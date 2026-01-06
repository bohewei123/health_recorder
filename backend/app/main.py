from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import records, exercises

app = FastAPI(
    title="Health Recorder API",
    description="API for Health Recorder Application",
    version="1.0.0"
)

# CORS
origins = [
    "http://localhost:3000",
    "http://localhost:5173", # Vite default
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(records.router, prefix="/api/records", tags=["Records"])
app.include_router(exercises.router, prefix="/api/exercises", tags=["Exercises"])

@app.get("/")
def read_root():
    return {"message": "Health Recorder API is running"}
