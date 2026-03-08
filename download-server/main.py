from fastapi import APIRouter, FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from config.env import ENV
from config.logging import configure_logging
from constants.app import APP_METADATA
from lib.utils.format_response import format_error
from middlewares.cors_middleware import setup_cors_middleware
from middlewares.rate_limit_middleware import setup_rate_limit_middleware
from routes.download_routes import router as download_router
from routes.system_routes import router as system_router
from routes.video_routes import router as video_router


def create_app() -> FastAPI:
    configure_logging(ENV["LOG_LEVEL"])

    app = FastAPI(**APP_METADATA)
    setup_rate_limit_middleware(app)
    setup_cors_middleware(app, ENV["ALLOWED_ORIGINS"])

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content=format_error(str(exc.detail), exc.status_code),
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content=format_error(str(exc), 500),
        )

    routes_v1 = APIRouter(tags=["v1"], prefix="/api/v1")

    routes_v1.include_router(system_router)
    routes_v1.include_router(video_router)
    routes_v1.include_router(download_router)

    app.include_router(routes_v1)
    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=ENV["HOST"], port=ENV["PORT"])
