from fastapi import APIRouter, HTTPException, Request
from loguru import logger

from config.env import ENV
from constants.app import YOUTUBE_WATCH_URL
from middlewares.rate_limit_middleware import limiter
from services.youtube_service import get_video_info

router = APIRouter(tags=["video"])


@router.get("/streams/{video_id}")
@limiter.limit(ENV["RATE_LIMIT"])
async def list_streams(request: Request, video_id: str) -> dict[str, object]:
    video_url = YOUTUBE_WATCH_URL.format(video_id=video_id)
    logger.info(f"Listing streams for video: {video_id}")

    try:
        info = get_video_info(video_url)

        formats = []
        for fmt in info.get("formats", []):
            format_info = {
                "format_id": fmt.get("format_id"),
                "ext": fmt.get("ext"),
                "resolution": fmt.get(
                    "resolution",
                    "audio only" if fmt.get("vcodec") == "none" else "unknown",
                ),
                "filesize": fmt.get("filesize"),
                "filesize_approx": fmt.get("filesize_approx"),
                "vcodec": fmt.get("vcodec"),
                "acodec": fmt.get("acodec"),
                "fps": fmt.get("fps"),
                "quality": fmt.get("quality"),
                "format_note": fmt.get("format_note"),
                "url": fmt.get("url"),
                "has_video": fmt.get("vcodec") != "none",
                "has_audio": fmt.get("acodec") != "none",
            }
            formats.append(format_info)

        result = {
            "video_id": video_id,
            "title": info.get("title"),
            "duration": info.get("duration"),
            "uploader": info.get("uploader"),
            "thumbnail": info.get("thumbnail"),
            "formats": formats,
            "total_formats": len(formats),
        }
        logger.success(
            f"Listed {len(formats)} formats for: {info.get('title', 'Unknown')}"
        )
        return result
    except Exception as error:
        logger.error(f"Error listing streams: {error}")
        raise HTTPException(status_code=500, detail=str(error))


@router.get("/info/{video_id}")
@limiter.limit(ENV["RATE_LIMIT"])
async def get_info(request: Request, video_id: str) -> dict[str, object]:
    video_url = YOUTUBE_WATCH_URL.format(video_id=video_id)
    logger.info(f"Getting video info for: {video_id}")

    try:
        info = get_video_info(video_url)
        result = {
            "video_id": video_id,
            "title": info.get("title"),
            "description": info.get("description"),
            "duration": info.get("duration"),
            "uploader": info.get("uploader"),
            "uploader_id": info.get("uploader_id"),
            "upload_date": info.get("upload_date"),
            "view_count": info.get("view_count"),
            "like_count": info.get("like_count"),
            "thumbnail": info.get("thumbnail"),
            "thumbnails": info.get("thumbnails"),
            "categories": info.get("categories"),
            "tags": info.get("tags"),
            "webpage_url": info.get("webpage_url"),
        }
        logger.success(f"Got info for: {info.get('title', 'Unknown')}")
        return result
    except Exception as error:
        logger.error(f"Error getting info: {error}")
        raise HTTPException(status_code=500, detail=str(error))
