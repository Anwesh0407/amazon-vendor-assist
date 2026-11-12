"""
AVA Core Configuration
Settings management via environment variables and .env file.
"""

import os
from typing import Optional, List, Any, Union
from pydantic import field_validator, Field, AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow",
    )

    APP_NAME: str = "Amazon Vendor Assist"
    APP_VERSION: str = "0.2.0"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Server
    HOST: str = Field(default="0.0.0.0", validation_alias=AliasChoices("APP_HOST", "HOST"))
    PORT: int = Field(default=8000, validation_alias=AliasChoices("APP_PORT", "PORT"))

    # Database
    DATABASE_URL: str = "sqlite:///./ava.db"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    DB_NAME: str = "amazon_vendor_assist"

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # Compliance & HTTP Client
    BLOCKED_DOMAINS: Union[List[str], str] = [
        "amazon.in",
        "amazon.com",
        "media-amazon.com",
        "images-amazon.com",
        "ssl-images-amazon.com",
        "m.media-amazon.com"
    ]
    USER_AGENT: str = "AVA-Vendor-Assist-Research-Bot/1.0 (+http://example.com/bot)"
    RATE_LIMIT_DELAY: float = 1.0
    REQUEST_TIMEOUT: float = 10.0

    # Creators API (Conditional)
    AMAZON_CREATORS_API_KEY: Optional[str] = None
    AMAZON_CREATORS_API_SECRET: Optional[str] = None
    AMAZON_ASSOCIATE_TAG: Optional[str] = None

    # Ask AVA (Gemini & Fallback)
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.1-flash-lite-preview"
    ASK_AVA_MODE: str = "auto"  # auto | demo | gemini

    # Analytics Guardrails
    MIN_SAMPLE_SIZE: int = 30
    MIN_GROUP_SIZE: int = 5
    MAX_PRICE_CAP_INR: float = 50000.0

    @field_validator("BLOCKED_DOMAINS", mode="after")
    @classmethod
    def parse_blocked_domains(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            clean_v = v.strip().strip("\"").strip("'")
            if clean_v.startswith("[") and clean_v.endswith("]"):
                import json
                try:
                    return json.loads(clean_v)
                except Exception:
                    pass
            return [d.strip().strip("\"").strip("'") for d in clean_v.split(",") if d.strip()]
        return v

    @property
    def database_url(self) -> str:
        return self.DATABASE_URL

settings = Settings()

def get_settings() -> Settings:
    return settings
