from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request
from loguru import logger

from config.env import ENV
from constants.app import YOUTUBE_WATCH_URL
from middlewares.rate_limit_middleware import limiter
from services.youtube_service import get_video_info, pick_format

router = APIRouter(prefix="/download", tags=["download"])


@router.get("/video/{video_id}")
@limiter.limit(ENV["RATE_LIMIT"])
async def download_video(
    request: Request,
    video_id: str,
    quality: Optional[str] = Query(
        "best", description="Video quality: best or worst"),
    format: Optional[str] = Query(
        "mp4", description="Preferred container extension"),
) -> dict[str, object]:
    video_url = YOUTUBE_WATCH_URL.format(video_id=video_id)
    logger.info(f"Getting video-only URL for: {video_id} (quality: {quality})")

    try:
        info = get_video_info(video_url)
        selected = pick_format(info, "video", quality, format)
        media_url = selected.get("url")

        if not media_url:
            logger.warning(f"No stream URL found for video: {video_id}")
            raise HTTPException(
                status_code=404, detail="Selected format has no stream URL")

        result = {
            "video_id": video_id,
            "title": info.get("title"),
            "url": media_url,
            "format_id": selected.get("format_id"),
            "ext": selected.get("ext"),
            "resolution": selected.get("resolution"),
            "filesize": selected.get("filesize"),
            "filesize_approx": selected.get("filesize_approx"),
        }
        logger.success(
            f"Got video-only URL for: {info.get('title', 'Unknown')}")
        return result
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"Error getting video URL: {error}")
        raise HTTPException(status_code=500, detail=str(error))


@router.get("/audio/{video_id}")
@limiter.limit(ENV["RATE_LIMIT"])
async def download_audio(
    request: Request,
    video_id: str,
    quality: Optional[str] = Query(
        "best", description="Audio quality: best or worst"),
    format: Optional[str] = Query(
        "m4a", description="Preferred container extension"),
) -> dict[str, object]:
    video_url = YOUTUBE_WATCH_URL.format(video_id=video_id)
    logger.info(f"Getting audio-only URL for: {video_id} (quality: {quality})")

    try:
        info = get_video_info(video_url)
        selected = pick_format(info, "audio", quality, format)
        media_url = selected.get("url")

        if not media_url:
            logger.warning(f"No stream URL found for audio: {video_id}")
            raise HTTPException(
                status_code=404, detail="Selected format has no stream URL")

        result = {
            "video_id": video_id,
            "title": info.get("title"),
            "url": media_url,
            "format_id": selected.get("format_id"),
            "ext": selected.get("ext"),
            "filesize": selected.get("filesize"),
            "filesize_approx": selected.get("filesize_approx"),
            "abr": selected.get("abr"),
        }
        logger.success(
            f"Got audio-only URL for: {info.get('title', 'Unknown')}")
        return result
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"Error getting audio URL: {error}")
        raise HTTPException(status_code=500, detail=str(error))


@router.get("/video-audio/{video_id}")
@limiter.limit(ENV["RATE_LIMIT"])
async def download_video_audio(
    request: Request,
    video_id: str,
    quality: Optional[str] = Query(
        "best", description="Quality: best or worst"),
    format: Optional[str] = Query(
        "mp4", description="Preferred container extension"),
) -> dict[str, object]:
    video_url = YOUTUBE_WATCH_URL.format(video_id=video_id)
    logger.info(
        f"Getting video+audio URL for: {video_id} (quality: {quality})")

    try:
        info = get_video_info(video_url)
        selected = pick_format(info, "video_audio", quality, format)
        media_url = selected.get("url")

        if not media_url:
            logger.warning(f"No combined stream URL found for: {video_id}")
            raise HTTPException(
                status_code=404, detail="Selected format has no stream URL")

        result = {
            "video_id": video_id,
            "title": info.get("title"),
            "url": media_url,
            "format_id": selected.get("format_id"),
            "ext": selected.get("ext"),
            "resolution": selected.get("resolution"),
            "filesize": selected.get("filesize"),
            "filesize_approx": selected.get("filesize_approx"),
        }
        logger.success(
            f"Got video+audio URL for: {info.get('title', 'Unknown')}")
        return result
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"Error getting video+audio URL: {error}")
        raise HTTPException(status_code=500, detail=str(error))
