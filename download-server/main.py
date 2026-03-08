from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp
from typing import Optional, Dict, Any
from loguru import logger
import sys

# Configure loguru with formatted output
logger.remove()  # Remove default handler
logger.add(
    sys.stderr,
    format="<level>{level: <8}</level> [{time:YYYY-MM-DD HH:mm:ss.SSS ZZZ}] <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO"
)
logger.add(
    "logs/app.log",
    format="{level: <8} [{time:YYYY-MM-DD HH:mm:ss.SSS ZZZ}] {name}:{function}:{line} - {message}",
    level="DEBUG",
    rotation="500 MB",
    retention="7 days"
)

app = FastAPI(
    title="YouTube Download API",
    description="API for downloading YouTube videos using yt-dlp",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_video_info(video_url: str) -> Dict[str, Any]:
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'socket_timeout': 30,
        'nostyleoutput': True,
        'httpheaders': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
    }

    try:
        logger.info(f"Extracting info for video: {video_url}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            logger.success(
                f"Successfully extracted info for: {info.get('title', 'Unknown')}")
            return info
    except Exception as e:
        logger.error(f"Error extracting info: {str(e)}")
        # Retry without SSL verification if initial attempt fails
        if "SSL" in str(e) or "certificate" in str(e).lower():
            logger.warning("Retrying with SSL verification disabled...")
            ydl_opts['no_check_certificate'] = True
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(video_url, download=False)
                    logger.success(
                        f"Successfully extracted info (no SSL verification): {info.get('title', 'Unknown')}")
                    return info
            except Exception as retry_error:
                logger.error(f"Error on retry: {str(retry_error)}")
                raise HTTPException(
                    status_code=400, detail=f"Failed to extract video info: {str(retry_error)}")
        raise HTTPException(
            status_code=400, detail=f"Failed to extract video info: {str(e)}")


def _pick_format(info: Dict[str, Any], mode: str, quality: str, preferred_ext: Optional[str]) -> Dict[str, Any]:
    formats = info.get("formats", [])
    if not formats:
        raise HTTPException(status_code=404, detail="No formats available")

    if mode == "audio":
        candidates = [f for f in formats if f.get(
            "acodec") != "none" and f.get("vcodec") == "none"]
        if preferred_ext:
            by_ext = [f for f in candidates if (
                f.get("ext") or "").lower() == preferred_ext.lower()]
            if by_ext:
                candidates = by_ext
        if not candidates:
            raise HTTPException(
                status_code=404, detail="No audio-only format available")
        key = min if quality == "worst" else max
        return key(candidates, key=lambda f: (f.get("abr") or 0, f.get("tbr") or 0))

    if mode == "video":
        candidates = [f for f in formats if f.get(
            "vcodec") != "none" and f.get("acodec") == "none"]
        if preferred_ext:
            by_ext = [f for f in candidates if (
                f.get("ext") or "").lower() == preferred_ext.lower()]
            if by_ext:
                candidates = by_ext
        if not candidates:
            raise HTTPException(
                status_code=404, detail="No video-only format available")
        key = min if quality == "worst" else max
        return key(candidates, key=lambda f: (f.get("height") or 0, f.get("tbr") or 0))

    # mode == "video_audio": prefer progressive streams with both codecs
    candidates = [f for f in formats if f.get(
        "vcodec") != "none" and f.get("acodec") != "none"]
    if preferred_ext:
        by_ext = [f for f in candidates if (
            f.get("ext") or "").lower() == preferred_ext.lower()]
        if by_ext:
            candidates = by_ext
    if not candidates:
        raise HTTPException(
            status_code=404, detail="No combined video+audio format available")
    key = min if quality == "worst" else max
    return key(candidates, key=lambda f: (f.get("height") or 0, f.get("tbr") or 0))


@app.get("/")
async def root():
    """Root endpoint"""
    logger.info("Root endpoint accessed")
    return {
        "message": "YouTube Download API",
        "description": "Get direct download URLs for videos",
        "endpoints": {
            "streams": "/streams/{video_id}",
            "download_video": "/download/video/{video_id}",
            "download_audio": "/download/audio/{video_id}",
            "download_video_audio": "/download/video-audio/{video_id}",
            "info": "/info/{video_id}"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    logger.debug("Health check endpoint accessed")
    return {"status": "healthy"}


@app.get("/streams/{video_id}")
async def list_streams(video_id: str):
    """List all available streams for a video"""
    video_url = f"https://www.youtube.com/watch?v={video_id}"
    logger.info(f"Listing streams for video: {video_id}")

    try:
        info = get_video_info(video_url)

        # Extract relevant format information
        formats = []
        for fmt in info.get('formats', []):
            format_info = {
                'format_id': fmt.get('format_id'),
                'ext': fmt.get('ext'),
                'resolution': fmt.get('resolution', 'audio only' if fmt.get('vcodec') == 'none' else 'unknown'),
                'filesize': fmt.get('filesize'),
                'filesize_approx': fmt.get('filesize_approx'),
                'vcodec': fmt.get('vcodec'),
                'acodec': fmt.get('acodec'),
                'fps': fmt.get('fps'),
                'quality': fmt.get('quality'),
                'format_note': fmt.get('format_note'),
                'url': fmt.get('url'),
                'has_video': fmt.get('vcodec') != 'none',
                'has_audio': fmt.get('acodec') != 'none',
            }
            formats.append(format_info)

        result = {
            'video_id': video_id,
            'title': info.get('title'),
            'duration': info.get('duration'),
            'uploader': info.get('uploader'),
            'thumbnail': info.get('thumbnail'),
            'formats': formats,
            'total_formats': len(formats)
        }
        logger.success(
            f"Listed {len(formats)} formats for: {info.get('title', 'Unknown')}")
        return result
    except Exception as e:
        logger.error(f"Error listing streams: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/download/video/{video_id}")
async def download_video(
    video_id: str,
    quality: Optional[str] = Query(
        "best", description="Video quality: best or worst"),
    format: Optional[str] = Query(
        "mp4", description="Preferred container extension")
):
    """Get video-only download URL"""
    video_url = f"https://www.youtube.com/watch?v={video_id}"
    logger.info(f"Getting video-only URL for: {video_id} (quality: {quality})")

    try:
        info = get_video_info(video_url)
        selected = _pick_format(info, "video", quality, format)
        media_url = selected.get("url")

        if not media_url:
            logger.warning(f"No stream URL found for video: {video_id}")
            raise HTTPException(
                status_code=404, detail="Selected format has no stream URL")

        result = {
            'video_id': video_id,
            'title': info.get('title'),
            'url': media_url,
            'format_id': selected.get('format_id'),
            'ext': selected.get('ext'),
            'resolution': selected.get('resolution'),
            'filesize': selected.get('filesize'),
            'filesize_approx': selected.get('filesize_approx'),
        }
        logger.success(
            f"Got video-only URL for: {info.get('title', 'Unknown')}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting video URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/download/audio/{video_id}")
async def download_audio(
    video_id: str,
    quality: Optional[str] = Query(
        "best", description="Audio quality: best or worst"),
    format: Optional[str] = Query(
        "m4a", description="Preferred container extension")
):
    """Get audio-only download URL"""
    video_url = f"https://www.youtube.com/watch?v={video_id}"
    logger.info(f"Getting audio-only URL for: {video_id} (quality: {quality})")

    try:
        info = get_video_info(video_url)
        selected = _pick_format(info, "audio", quality, format)
        media_url = selected.get("url")

        if not media_url:
            logger.warning(f"No stream URL found for audio: {video_id}")
            raise HTTPException(
                status_code=404, detail="Selected format has no stream URL")

        result = {
            'video_id': video_id,
            'title': info.get('title'),
            'url': media_url,
            'format_id': selected.get('format_id'),
            'ext': selected.get('ext'),
            'filesize': selected.get('filesize'),
            'filesize_approx': selected.get('filesize_approx'),
            'abr': selected.get('abr'),
        }
        logger.success(
            f"Got audio-only URL for: {info.get('title', 'Unknown')}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting audio URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/download/video-audio/{video_id}")
async def download_video_audio(
    video_id: str,
    quality: Optional[str] = Query(
        "best", description="Quality: best or worst"),
    format: Optional[str] = Query(
        "mp4", description="Preferred container extension")
):
    """Get video+audio (progressive) download URL"""
    video_url = f"https://www.youtube.com/watch?v={video_id}"
    logger.info(
        f"Getting video+audio URL for: {video_id} (quality: {quality})")

    try:
        info = get_video_info(video_url)
        selected = _pick_format(info, "video_audio", quality, format)
        media_url = selected.get("url")

        if not media_url:
            logger.warning(f"No combined stream URL found for: {video_id}")
            raise HTTPException(
                status_code=404, detail="Selected format has no stream URL")

        result = {
            'video_id': video_id,
            'title': info.get('title'),
            'url': media_url,
            'format_id': selected.get('format_id'),
            'ext': selected.get('ext'),
            'resolution': selected.get('resolution'),
            'filesize': selected.get('filesize'),
            'filesize_approx': selected.get('filesize_approx'),
        }
        logger.success(
            f"Got video+audio URL for: {info.get('title', 'Unknown')}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting video+audio URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/info/{video_id}")
async def get_info(video_id: str):
    """Get detailed video information"""
    video_url = f"https://www.youtube.com/watch?v={video_id}"
    logger.info(f"Getting video info for: {video_id}")

    try:
        info = get_video_info(video_url)

        result = {
            'video_id': video_id,
            'title': info.get('title'),
            'description': info.get('description'),
            'duration': info.get('duration'),
            'uploader': info.get('uploader'),
            'uploader_id': info.get('uploader_id'),
            'upload_date': info.get('upload_date'),
            'view_count': info.get('view_count'),
            'like_count': info.get('like_count'),
            'thumbnail': info.get('thumbnail'),
            'thumbnails': info.get('thumbnails'),
            'categories': info.get('categories'),
            'tags': info.get('tags'),
            'webpage_url': info.get('webpage_url'),
        }
        logger.success(f"Got info for: {info.get('title', 'Unknown')}")
        return result
    except Exception as e:
        logger.error(f"Error getting info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
