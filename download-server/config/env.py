import os
from types import MappingProxyType
from dotenv import load_dotenv

load_dotenv()

_allowed_origins = [origin.strip() for origin in os.getenv(
    "ALLOWED_ORIGINS", "*").split(",") if origin.strip()]

ENV = MappingProxyType({
    "HOST": os.getenv("HOST", "0.0.0.0"),
    "PORT": int(os.getenv("PORT", "8000")),
    "LOG_LEVEL": os.getenv("LOG_LEVEL", "INFO").upper(),
    "ALLOWED_ORIGINS": _allowed_origins or ["*"],
    "RATE_LIMIT_PER_MINUTE": int(os.getenv("RATE_LIMIT_PER_MINUTE", "60")),
    "RATE_LIMIT": f"{int(os.getenv('RATE_LIMIT_PER_MINUTE', '60'))}/minute",
})
