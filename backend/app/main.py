import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, inspections, products, reports, risk, rules, users

logger = logging.getLogger(__name__)

app = FastAPI(title="NIRIKSHA API", version="0.1.0")

allowed_origins = [
    origin.strip()
    for origin in settings.allowed_origins.split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(inspections.router, prefix="/inspections", tags=["inspections"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(rules.router, prefix="/rules", tags=["rules"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(risk.router, prefix="/risk", tags=["risk"])
app.include_router(reports.router, tags=["reports"])


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception while processing %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": "An unexpected error occurred."},
    )
