"""Configuration management for MetaPilot AI using Pydantic Settings."""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_NAME: str = "MetaPilot AI Engine"
    PORT: int = 8000
    DEBUG: bool = True
    EXECUTION_MODE: str = "demo"  # "demo" or "connected"

    # Supabase
    SUPABASE_URL: str = "https://demo.supabase.co"
    SUPABASE_ANON_KEY: str = "demo-anon-key"
    SUPABASE_SERVICE_ROLE_KEY: str = "demo-service-role-key"
    SUPABASE_JWT_SECRET: str = "demo-jwt-secret-min-32-characters-for-testing"

    # Meta Ads
    META_APP_ID: str = "demo_meta_app_id"
    META_APP_SECRET: str = "demo_meta_app_secret"
    META_ACCESS_TOKEN: str = "demo_meta_access_token"
    META_AD_ACCOUNT_ID: str = "act_demo123456"
    META_INSTAGRAM_ACCOUNT_ID: str = "17841400000000000"

    # OpenAI & Agent
    OPENAI_API_KEY: str = "sk-demo"
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Guardrails
    REQUIRE_EXPLICIT_APPROVAL: bool = True
    DEFAULT_CAMPAIGN_STATUS: str = "PAUSED"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def is_demo_mode(self) -> bool:
        return self.EXECUTION_MODE.lower() == "demo"


settings = Settings()
