from fastapi import APIRouter, Request
from loguru import logger

from config.env import ENV
from middlewares.rate_limit_middleware import limiter

router = APIRouter(tags=["system"])


@router.get("/")
@limiter.limit(ENV["RATE_LIMIT"])
async def root(request: Request) -> dict[str, object]:
    logger.info("Root endpoint accessed")
    return {
        "message": "YouTube Download API",
        "description": "Get direct download URLs for videos",
        "endpoints": {
            "streams": "/streams/{video_id}",
            "download_video": "/download/video/{video_id}",
            "download_audio": "/download/audio/{video_id}",
            "download_video_audio": "/download/video-audio/{video_id}",
            "info": "/info/{video_id}",
        },
    }


@router.get("/health")
@limiter.limit(ENV["RATE_LIMIT"])
async def health_check(request: Request) -> dict[str, str]:
    logger.debug("Health check endpoint accessed")
    return {"status": "healthy"}
