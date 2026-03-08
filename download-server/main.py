from fastapi import FastAPI

from config.env import ENV
from config.logging import configure_logging
from constants.app import APP_METADATA
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

    app.include_router(system_router)
    app.include_router(video_router)
    app.include_router(download_router)
    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=ENV["HOST"], port=ENV["PORT"])
