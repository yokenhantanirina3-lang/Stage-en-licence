from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api.router import api_router

from app.tasks.echeances import _check_echeances_async


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Demarrage de {settings.PROJECT_NAME}...")
    try:
        resultat = await _check_echeances_async()
        print(f"[Echeances] {resultat}")
    except Exception as exc:
        print(f"[Echeances] Verification au demarrage impossible: {exc}")
    yield
    print("Arret propre...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    # localhost ET 127.0.0.1 : le workflow E2E sert le frontend sur 127.0.0.1
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}
