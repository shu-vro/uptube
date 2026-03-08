from typing import Any, Dict, Optional

import yt_dlp
from fastapi import HTTPException
from loguru import logger


def get_video_info(video_url: str) -> Dict[str, Any]:
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
        "socket_timeout": 30,
        "nostyleoutput": True,
        "httpheaders": {
            "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36"
        },
    }

    try:
        logger.info(f"Extracting info for video: {video_url}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            logger.success(
                f"Successfully extracted info for: {info.get('title', 'Unknown')}"
            )
            return info
    except Exception as error:
        logger.error(f"Error extracting info: {error}")
        if "SSL" in str(error) or "certificate" in str(error).lower():
            logger.warning("Retrying with SSL verification disabled...")
            ydl_opts["no_check_certificate"] = True
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(video_url, download=False)
                    logger.success(
                        "Successfully extracted info (no SSL verification): "
                        f"{info.get('title', 'Unknown')}"
                    )
                    return info
            except Exception as retry_error:
                logger.error(f"Error on retry: {retry_error}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to extract video info: {retry_error}",
                )

        raise HTTPException(
            status_code=400,
            detail=f"Failed to extract video info: {error}",
        )


def pick_format(
    info: Dict[str, Any], mode: str, quality: str, preferred_ext: Optional[str]
) -> Dict[str, Any]:
    formats = info.get("formats", [])
    if not formats:
        raise HTTPException(status_code=404, detail="No formats available")

    if mode == "audio":
        candidates = [
            item
            for item in formats
            if item.get("acodec") != "none" and item.get("vcodec") == "none"
        ]
        if preferred_ext:
            by_ext = [
                item
                for item in candidates
                if (item.get("ext") or "").lower() == preferred_ext.lower()
            ]
            if by_ext:
                candidates = by_ext
        if not candidates:
            raise HTTPException(
                status_code=404, detail="No audio-only format available")
        key = min if quality == "worst" else max
        return key(candidates, key=lambda item: (item.get("abr") or 0, item.get("tbr") or 0))

    if mode == "video":
        candidates = [
            item
            for item in formats
            if item.get("vcodec") != "none" and item.get("acodec") == "none"
        ]
        if preferred_ext:
            by_ext = [
                item
                for item in candidates
                if (item.get("ext") or "").lower() == preferred_ext.lower()
            ]
            if by_ext:
                candidates = by_ext
        if not candidates:
            raise HTTPException(
                status_code=404, detail="No video-only format available")
        key = min if quality == "worst" else max
        return key(candidates, key=lambda item: (item.get("height") or 0, item.get("tbr") or 0))

    candidates = [
        item
        for item in formats
        if item.get("vcodec") != "none" and item.get("acodec") != "none"
    ]
    if preferred_ext:
        by_ext = [
            item
            for item in candidates
            if (item.get("ext") or "").lower() == preferred_ext.lower()
        ]
        if by_ext:
            candidates = by_ext
    if not candidates:
        raise HTTPException(
            status_code=404, detail="No combined video+audio format available"
        )
    key = min if quality == "worst" else max
    return key(candidates, key=lambda item: (item.get("height") or 0, item.get("tbr") or 0))
