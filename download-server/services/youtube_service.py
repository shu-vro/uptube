import re
from typing import Any, Dict, Optional, Tuple

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


# Parses quality strings like "1080p", "1080p60", "1440p60", "720p"
# Returns (height, target_fps) where target_fps is None if not specified.
_QUALITY_RE = re.compile(r"^(\d+)p(\d+)?$")


def _parse_quality(quality: str) -> Tuple[Optional[int], Optional[int]]:
    m = _QUALITY_RE.match(quality)
    if not m:
        return None, None
    height = int(m.group(1))
    fps = int(m.group(2)) if m.group(2) else None
    return height, fps


def _pick_by_height(
    candidates: list, target_height: int, target_fps: Optional[int] = None
) -> Dict[str, Any]:
    exact = [f for f in candidates if f.get("height") == target_height]
    pool = exact if exact else None

    if pool is None:
        below = [f for f in candidates if (
            f.get("height") or 0) <= target_height]
        pool = below if below else candidates

    if target_fps is not None:
        # "near fps" threshold: accept within 10 fps of target (covers 50/60, 48/60, etc.)
        threshold = target_fps - 10
        hi_fps = [f for f in pool if (f.get("fps") or 0) >= threshold]
        if hi_fps:
            return max(hi_fps, key=lambda f: (f.get("fps") or 0, f.get("tbr") or 0))
        # no high-fps stream available — return highest fps in pool
        return max(pool, key=lambda f: (f.get("fps") or 0, f.get("tbr") or 0))

    return max(pool, key=lambda f: (f.get("height") or 0, f.get("tbr") or 0))


def _pick_best_efficiency_video(candidates: list) -> Dict[str, Any]:
    def efficiency(f):
        height = f.get("height") or 0
        size = f.get("filesize") or f.get("filesize_approx") or 0
        tbr = f.get("tbr") or 0
        if size > 0:
            return (height * height) / size
        if tbr > 0:
            return height / tbr
        return height
    return max(candidates, key=efficiency)


def _pick_best_efficiency_audio(candidates: list) -> Dict[str, Any]:
    def efficiency(f):
        abr = f.get("abr") or f.get("tbr") or 0
        size = f.get("filesize") or f.get("filesize_approx") or 0
        if size > 0:
            return (abr * abr) / size
        return abr
    return max(candidates, key=efficiency)


def _filter_by_ext(candidates: list, preferred_ext: Optional[str]) -> list:
    if not preferred_ext:
        return candidates
    by_ext = [f for f in candidates if (
        f.get("ext") or "").lower() == preferred_ext.lower()]
    return by_ext if by_ext else candidates


def pick_format(
    info: Dict[str, Any], mode: str, quality: str, preferred_ext: Optional[str]
) -> Dict[str, Any]:
    formats = info.get("formats", [])
    if not formats:
        raise HTTPException(status_code=404, detail="No formats available")

    target_height, target_fps = _parse_quality(quality)

    if mode == "audio":
        candidates = [
            item
            for item in formats
            if item.get("acodec") != "none" and item.get("vcodec") == "none"
        ]
        candidates = _filter_by_ext(candidates, preferred_ext)
        if not candidates:
            raise HTTPException(
                status_code=404, detail="No audio-only format available")
        if quality == "bestefficiency":
            return _pick_best_efficiency_audio(candidates)
        if quality == 'worst':
            return min(candidates, key=lambda f: (f.get("abr") or 0, f.get("tbr") or 0))
        # resolution-based qualities don't apply to audio — fall through to best
        return max(candidates, key=lambda f: (f.get("abr") or 0, f.get("tbr") or 0))

    if mode == "video":
        candidates = [
            item
            for item in formats
            if item.get("vcodec") != "none" and item.get("acodec") == "none"
        ]
        candidates = _filter_by_ext(candidates, preferred_ext)
        if not candidates:
            raise HTTPException(
                status_code=404, detail="No video-only format available")
        if target_height is not None:
            return _pick_by_height(candidates, target_height, target_fps)
        if quality == "bestefficiency":
            return _pick_best_efficiency_video(candidates)
        return max(candidates, key=lambda f: (f.get("height") or 0, f.get("tbr") or 0))

    # video_audio (muxed)
    candidates = [
        item
        for item in formats
        if item.get("vcodec") != "none" and item.get("acodec") != "none"
    ]
    candidates = _filter_by_ext(candidates, preferred_ext)
    if not candidates:
        raise HTTPException(
            status_code=404, detail="No combined video+audio format available")
    if target_height is not None:
        return _pick_by_height(candidates, target_height, target_fps)
    if quality == "bestefficiency":
        return _pick_best_efficiency_video(candidates)
    return max(candidates, key=lambda f: (f.get("height") or 0, f.get("tbr") or 0))
