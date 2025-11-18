from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", env_prefix="CREACLIPS_")

    project_root: Path = Field(default=BASE_DIR)
    data_dir: Path = Field(default=BASE_DIR / "backend" / "data")
    background_dir: Path = Field(default=BASE_DIR / "shared" / "backgrounds")
    jobs_dir_name: str = Field(default="jobs")

    whisper_model: str = Field(default="small")
    max_parallel_jobs: int = Field(default=2)
    max_clips: int = Field(default=5)
    clip_length_seconds: int = Field(default=35)
    min_clip_length_seconds: int = Field(default=15)
    default_interval_seconds: int = Field(default=30)
    export_targets: tuple[Literal["tiktok", "reels", "shorts"], ...] = Field(
        default=("tiktok", "reels", "shorts")
    )
    public_data_prefix: str = Field(default="/media")

    def jobs_dir(self) -> Path:
        path = self.data_dir / self.jobs_dir_name
        path.mkdir(parents=True, exist_ok=True)
        return path

    def model_post_init(self, __context: dict) -> None:  # type: ignore[override]
        self.data_dir.mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
