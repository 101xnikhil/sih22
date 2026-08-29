from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.nodes import router as nodes_router
from app.api.telemetry import router as telemetry_router
from app.api.risk import router as risk_router
from app.api.alerts import router as alerts_router
from app.api.demo import router as demo_router
from app.api.security import router as security_router
from app.api.blynk import router as blynk_router
from app.api.websocket import router as ws_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(nodes_router)
api_router.include_router(telemetry_router)
api_router.include_router(risk_router)
api_router.include_router(alerts_router)
api_router.include_router(demo_router)
api_router.include_router(security_router)
api_router.include_router(blynk_router)

__all__ = ["api_router", "ws_router"]
