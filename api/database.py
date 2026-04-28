# Manages the asyncpg connection pool lifecycle and provides a reusable
# dependency for injecting database connections into FastAPI route handlers.

import asyncpg
from asyncpg import Pool
from dotenv import load_dotenv
import os

load_dotenv()

# Module-level pool reference; assigned once during app startup via lifespan
_pool: Pool | None = None


async def create_pool() -> None:
    """
    Initializes the asyncpg connection pool from the DATABASE_URL environment variable.
    Called once at application startup via FastAPI's lifespan handler.

    Raises:
        RuntimeError: If DATABASE_URL is not set in the environment.
    """
    global _pool
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is not set.")
    _pool = await asyncpg.create_pool(database_url)


async def close_pool() -> None:
    """
    Gracefully closes the asyncpg connection pool.
    Called once at application shutdown via FastAPI's lifespan handler.
    """
    global _pool
    if _pool:
        await _pool.close()


async def get_connection():
    """
    FastAPI dependency that yields a single asyncpg Connection from the pool.
    Automatically releases the connection back to the pool after the request completes,
    even if the route handler raises an exception.

    Yields:
        asyncpg.Connection: An active database connection.

    Raises:
        RuntimeError: If the pool has not been initialized.
    """
    if _pool is None:
        raise RuntimeError("Database pool has not been initialized.")
    async with _pool.acquire() as connection:
        yield connection
