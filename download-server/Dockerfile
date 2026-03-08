FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

# Install FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml .
COPY .python-version .

# Install dependencies using uv
RUN uv sync --frozen --no-dev

# Copy application
COPY main.py .

# Expose port
EXPOSE 8000

# Run the application with uv
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
