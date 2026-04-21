from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import get_settings
from backend.app.db import Base, engine
from backend.app.routers import check_ins, connected_apps, family, health, insights, me, settings, wellness


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


settings = get_settings()
app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(me.router, prefix=settings.api_prefix)
app.include_router(check_ins.router, prefix=settings.api_prefix)
app.include_router(settings.router, prefix=settings.api_prefix)
app.include_router(family.router, prefix=settings.api_prefix)
app.include_router(connected_apps.router, prefix=settings.api_prefix)
app.include_router(insights.router, prefix=settings.api_prefix)
app.include_router(wellness.router, prefix=settings.api_prefix)
