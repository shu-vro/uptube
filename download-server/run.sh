#!/bin/bash

# YouTube Download API - Startup Script

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "❌ uv is not installed"
    echo "Install it with: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  Warning: FFmpeg is not installed"
    echo "Some features may not work. Install with: brew install ffmpeg"
fi

# Sync dependencies
echo "📦 Syncing dependencies..."
uv sync

if [[ -f .env ]]; then
    set -a
    source .env
    set +a
fi

HOST=${HOST:-0.0.0.0}
PORT=${PORT:-8000}

# Run the server
echo "🚀 Starting YouTube Download API..."
echo "📍 Server will be available at http://localhost:${PORT}"
echo "📚 API docs at http://localhost:${PORT}/docs"
echo ""
uv run uvicorn main:app --host "$HOST" --port "$PORT" --reload
