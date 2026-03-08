# YouTube Download API

A FastAPI-based server for downloading YouTube videos using yt-dlp.

## Quick Start

The easiest way to get started:

```bash
cd experimental/download
./run.sh
```

This script will:

- Check if uv and FFmpeg are installed
- Install dependencies automatically
- Start the server at http://localhost:8000

## Why uv?

This project uses [uv](https://github.com/astral-sh/uv) for dependency management:

- ⚡ **10-100x faster** than pip
- 🔒 **Reproducible** - generates lock files
- 📦 **Simple** - single tool for virtual envs and packages
- 🚀 **Modern** - written in Rust, actively maintained

You can still use pip if you prefer (see Installation section).

## Features

- List all available video streams
- Stream video-only bytes
- Stream audio-only bytes
- Stream video+audio bytes (progressive formats)
- Stream videos directly
- Get video information

## Installation

### Prerequisites

- Python 3.11+
- FFmpeg (required for audio extraction and format conversion)
- uv (recommended for fast dependency management)

### Install uv

**macOS/Linux:**

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Or with Homebrew:

```bash
brew install uv
```

**Windows:**

```bash
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Install FFmpeg

**macOS:**

```bash
brew install ffmpeg
```

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html)

### Install Python Dependencies

**Using uv (recommended - much faster):**

```bash
cd experimental/download
uv sync
```

**Or using pip (traditional method):**

```bash
pip install -r requirements.txt
```

## Usage

### Start the Server

**Using uv (recommended):**

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Or directly with Python:**

```bash
python main.py
```

**Or with uvicorn:**

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`

### API Documentation

Once the server is running, visit:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### 1. List Available Streams

Get all available formats/streams for a video.

```bash
GET /streams/{video_id}
```

**Example:**

```bash
curl http://localhost:8000/streams/dQw4w9WgXcQ
```

**Response:**

```json
{
  "video_id": "dQw4w9WgXcQ",
  "title": "Video Title",
  "duration": 213,
  "formats": [
    {
      "format_id": "137",
      "ext": "mp4",
      "resolution": "1920x1080",
      "filesize": 52428800,
      "has_video": true,
      "has_audio": false
    }
  ]
}
```

### 2. Download Video Only

Returns actual video bytes (or redirects to source URL).

```bash
GET /download/video/{video_id}?quality=best&format=mp4&proxy=true
```

**Parameters:**

- `quality`: `best`, `worst`, or specific `format_id`
- `format`: Preferred container extension (default: `mp4`)
- `proxy`: `true` streams bytes via API, `false` returns HTTP redirect to upstream media URL
- `download`: `true` forces attachment download, `false` uses inline playback

**Example:**

```bash
curl "http://localhost:8000/download/video/dQw4w9WgXcQ?quality=best&format=mp4"
```

### 3. Download Audio Only

Returns actual audio bytes (or redirects to source URL).

```bash
GET /download/audio/{video_id}?quality=best&format=m4a&proxy=true
```

**Parameters:**

- `quality`: Audio quality (`best` or `worst`)
- `format`: Preferred container extension (default: `m4a`)
- `proxy`: `true` streams bytes via API, `false` returns HTTP redirect to upstream media URL
- `download`: `true` forces attachment download, `false` uses inline playback

**Example:**

```bash
curl "http://localhost:8000/download/audio/dQw4w9WgXcQ?format=mp3"
```

### 4. Download Video with Audio

Returns progressive video+audio bytes (or redirects to source URL).

```bash
GET /download/video-audio/{video_id}?quality=best&format=mp4&proxy=true
```

**Parameters:**

- `quality`: `best` or `worst`
- `format`: Preferred container extension (default: `mp4`)
- `proxy`: `true` streams bytes via API, `false` returns HTTP redirect to upstream media URL
- `download`: `true` forces attachment download, `false` uses inline playback

**Example:**

```bash
curl "http://localhost:8000/download/video-audio/dQw4w9WgXcQ?quality=1080p"
```

### 5. Get Stream URL

Get direct stream URL for playback without downloading.

```bash
GET /stream/{video_id}?quality=best
```

**Parameters:**

- `quality`: Video quality preference
- `format_id`: (optional) Specific format ID to stream

**Example:**

```bash
curl "http://localhost:8000/stream/dQw4w9WgXcQ?quality=best"
```

**Response:**

```json
{
  "video_id": "dQw4w9WgXcQ",
  "title": "Video Title",
  "stream_url": "https://...",
  "format_id": "137",
  "resolution": "1920x1080",
  "has_audio": true,
  "has_video": true
}
```

### 6. Get Video Information

Get detailed video metadata.

```bash
GET /info/{video_id}
```

**Example:**

```bash
curl http://localhost:8000/info/dQw4w9WgXcQ
```

## Development

### Quick Start (uv)

```bash
# Clone and navigate to directory
cd experimental/download

# Sync dependencies
uv sync

# Run in development mode
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Run in Development Mode

**With uv:**

```bash
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Traditional:**

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Run Tests

```bash
uv run pytest
```

### Add Dependencies

```bash
# Add a new dependency
uv add <package-name>

# Add a dev dependency
uv add --dev <package-name>

# Update dependencies
uv sync --upgrade
```

## Docker Support

### Build Docker Image

```bash
docker build -t youtube-download-api .
```

### Run Docker Container

```bash
docker run -p 8000:8000 youtube-download-api
```

## Environment Variables

- `HOST`: Server host (default: `0.0.0.0`)
- `PORT`: Server port (default: `8000`)
- `LOG_LEVEL`: Logging level (default: `INFO`)

## Notes

- The server uses yt-dlp to extract video information and download videos
- FFmpeg is required for audio extraction and format conversion
- Some operations may take time depending on video size and internet speed
- For production use, consider implementing rate limiting and authentication

## Troubleshooting

### "FFmpeg not found" Error

Make sure FFmpeg is installed and available in your PATH.

### Slow Downloads

Consider implementing caching or using CDN for frequently accessed videos.

### Format Not Available

Use the `/streams/{video_id}` endpoint to see all available formats before requesting a specific one.

## License

MIT
