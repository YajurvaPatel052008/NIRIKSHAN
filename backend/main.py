import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, inspections, reports, rules

load_dotenv()

app = FastAPI(title="NIRIKSHA API", version="0.1.0")

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,https://your-vercel-app.vercel.app",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(inspections.router, prefix="/api/inspections", tags=["inspections"])
app.include_router(rules.router, prefix="/api/rules", tags=["rules"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
