from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://pulse:pulse@localhost:5432/pulse"
    redis_url: str = "redis://localhost:6379"
    blob_dir: str = "./data/blobs"
    fanout_threshold: int = 10_000


settings = Settings()
