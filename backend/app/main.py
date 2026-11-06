from fastapi import FastAPI

from app.core.config import settings
from app.modules.auth.router import router as auth_router
from app.modules.drivers.router import router as drivers_router
import app.database.models
from app.modules.sessions.router import router as sessions_router
from app.modules.payments.router import router as payments_router
from app.modules.reports.router import router as reports_router
from app.modules.notifications.router import router as notifications_router


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(drivers_router, prefix="/api/v1")
app.include_router(sessions_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")


from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API routers
app.include_router(
    auth_router,
    prefix="/api/v1",
)


@app.get("/")
def root():
    return {
        "message": "Garage Management System API is running",
        "version": settings.APP_VERSION,
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}