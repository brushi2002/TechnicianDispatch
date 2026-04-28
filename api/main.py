# FastAPI application entrypoint. Configures the async lifespan for connection pool
# startup/shutdown, registers all feature routers, and exposes the app instance.

from contextlib import asynccontextmanager
from fastapi import FastAPI

from database import create_pool, close_pool
from routers import technicians, jobs, job_assignments, technician_availability


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.
    Initializes the asyncpg connection pool before the app starts accepting requests
    and gracefully closes it on shutdown.

    Args:
        app: The FastAPI application instance.
    """
    await create_pool()
    yield
    await close_pool()


app = FastAPI(
    title="Technician Dispatch Management API",
    version="1.0.0",
    description="REST API for managing technicians, jobs, scheduling, and availability.",
    lifespan=lifespan,
)

app.include_router(technicians.router,             prefix="/api/v1/technicians",             tags=["Technicians"])
app.include_router(jobs.router,                    prefix="/api/v1/jobs",                    tags=["Jobs"])
app.include_router(job_assignments.router,         prefix="/api/v1/job-assignments",         tags=["Job Assignments"])
app.include_router(technician_availability.router, prefix="/api/v1/technician-availability", tags=["Technician Availability"])
