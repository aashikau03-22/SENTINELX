from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api import api_router
from app.seed.seed_data import seed_database
from app.models.models import Sector

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables in SQLite database
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed initial demo data if database is unseeded
    db = SessionLocal()
    try:
        sectors_count = db.query(Sector).count()
        if sectors_count == 0:
            print("Auto-seeding SentinelX demonstration dataset...")
            seed_database(db)
            print("Initial dataset initialized successfully.")
    except Exception as e:
        print(f"Error during database startup seed: {e}")
    finally:
        db.close()

    yield

app = FastAPI(
    title="SentinelX — Multi-Sector Digital Risk Protection Platform API",
    description="One Platform. Five Sectors. Smarter Digital Protection. Multi-sector brand impersonation, mobile app clone, and digital risk detection REST API.",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes under /api
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "platform": "SentinelX",
        "tagline": "One Platform. Five Sectors. Smarter Digital Protection.",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_prefix": settings.API_V1_STR
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
