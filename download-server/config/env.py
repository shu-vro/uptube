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
    "QUERY_PUBLIC_KEY": os.getenv("QUERY_PUBLIC_KEY"),
    "QUERY_PRIVATE_KEY": os.getenv("QUERY_PRIVATE_KEY"),
    "ALLOW_UNENCRYPTED_REQUESTS": os.getenv("ALLOW_UNENCRYPTED_REQUESTS", "true").lower() == "true",
})
