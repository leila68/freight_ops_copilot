"""
Central application settings.

All configuration is read from environment variables (via a .env file in
local dev, or real environment variables in production/Docker). Never
hardcode secrets here — this file only defines *how* settings are loaded,
not their actual values.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Database ---
    POSTGRES_USER: str = "freight_user"
    POSTGRES_PASSWORD: str = "freight_pass"
    POSTGRES_DB: str = "freight_ops"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    # --- Auth (used starting next phase) ---
    JWT_SECRET_KEY: str = "change-me-in-env-file"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


# Single shared settings instance, imported wherever config is needed
settings = Settings()