import os
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from loguru import logger
import asyncio

from config.env import ENV
from constants.app import YOUTUBE_WATCH_URL
from lib.utils.format_response import format_response
from middlewares.rate_limit_middleware import limiter
from services.youtube_service import get_video_info, pick_format

router = APIRouter(prefix="/download", tags=["download"])


@router.get("/video/{video_id}")
@limiter.limit(ENV["RATE_LIMIT"])
async def download_video(
    request: Request,
    video_id: str,
    quality: Optional[str] = Query(
        "best", description="Video quality: 1440p60, 1080p60, 1080p, 720p60, 720p, 480p, 360p, 240p, 144p, best, or bestefficiency"),
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
        return format_response(result)
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
        "best", description="Audio quality: best, worst, or bestefficiency"),
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
        return format_response(result)
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"Error getting audio URL: {error}")
        raise HTTPException(status_code=500, detail=str(error))


# can't digest it, can't throw it off. that's the only way for me now.
@router.get("/video-audio/separate/{video_id}")
@limiter.limit(ENV["RATE_LIMIT"])
async def stream_video_audio(
    request: Request,
    video_id: str,
    quality: Optional[str] = Query(
        "best", description="Video quality: 1440p60, 1080p60, 1080p, 720p60, 720p, 480p, 360p, 240p, 144p, best, or bestefficiency"),
    video_format: Optional[str] = Query(
        "mp4", description="Preferred video container extension"),
) -> dict[str, object]:
    video_url = YOUTUBE_WATCH_URL.format(video_id=video_id)
    logger.info(
        f"Streaming merged video+audio for: {video_id} (quality: {quality})")

    try:
        info = get_video_info(video_url)
        video_fmt = pick_format(info, "video", quality, video_format)
        audio_fmt = pick_format(info, "audio", "worst", None)

        video_stream_url = video_fmt.get("url")
        audio_stream_url = audio_fmt.get("url")

        if not video_stream_url:
            raise HTTPException(
                status_code=404, detail="No video stream URL found")
        if not audio_stream_url:
            raise HTTPException(
                status_code=404, detail="No audio stream URL found")

        # send two info
        result = {
            "video_fmt": video_fmt,
            "audio_fmt": audio_fmt,
        }
        logger.success(
            f"Got video+audio URLs for: {info.get('title', 'Unknown')}")
        return format_response(result)
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"Error streaming video+audio: {error}")
        raise HTTPException(status_code=500, detail=str(error))


# this one is for downloading. It merges video and audio on the fly using ffmpeg, so it can be a bit unstable if the source streams are not reliable.
@router.get("/video-audio/stream/{video_id}")
@limiter.limit(ENV["RATE_LIMIT"])
async def stream_video_audio(
    request: Request,
    video_id: str,
    quality: Optional[str] = Query(
        "best", description="Video quality: 1440p60, 1080p60, 1080p, 720p60, 720p, 480p, 360p, 240p, 144p, best, or bestefficiency"),
    video_format: Optional[str] = Query(
        "mp4", description="Preferred video container extension"),
) -> StreamingResponse:
    video_url = YOUTUBE_WATCH_URL.format(video_id=video_id)
    logger.info(
        f"Streaming merged video+audio for: {video_id} (quality: {quality})")

    try:
        info = get_video_info(video_url)
        video_fmt = pick_format(info, "video", quality, video_format)
        audio_fmt = pick_format(info, "audio", "worst", None)

        video_stream_url = video_fmt.get("url")
        audio_stream_url = audio_fmt.get("url")

        if not video_stream_url:
            raise HTTPException(
                status_code=404, detail="No video stream URL found")
        if not audio_stream_url:
            raise HTTPException(
                status_code=404, detail="No audio stream URL found")

        ffmpeg_cmd = [
            "ffmpeg", "-y",
            "-i", video_stream_url,
            "-i", audio_stream_url,
            "-c:v", "copy",
            "-c:a", "aac",
            "-f", "mp4",
            "-movflags", "frag_keyframe+empty_moov+default_base_moof",
            "pipe:1",
        ]

        async def generate():
            process = await asyncio.create_subprocess_exec(
                *ffmpeg_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL,
            )
            try:
                while True:
                    chunk = await process.stdout.read(65536)
                    if not chunk:
                        break
                    yield chunk
            finally:
                if process.returncode is None:
                    process.kill()
                await process.wait()

        title = info.get("title", video_id)
        logger.success(f"Starting ffmpeg stream for: {title}")
        return StreamingResponse(
            generate(),
            media_type="video/mp4",
            headers={
                "Content-Disposition": f'inline; filename="{video_id}.mp4"',
                "X-Video-Title": title,
                "X-Video-Quality": video_fmt.get("resolution") or quality,
            },
        )
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"Error streaming video+audio: {error}")
        raise HTTPException(status_code=500, detail=str(error))


# this one is pretty stable, returns only one url.
@router.get("/video-audio/{video_id}")
@limiter.limit(ENV["RATE_LIMIT"])
async def download_video_audio(
    request: Request,
    video_id: str,
    quality: Optional[str] = Query(
        "best", description="Quality: 1440p60, 1080p60, 1080p, 720p60, 720p, 480p, 360p, 240p, 144p, best, or bestefficiency"),
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
        return format_response(result)
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"Error getting video+audio URL: {error}")
        raise HTTPException(status_code=500, detail=str(error))
