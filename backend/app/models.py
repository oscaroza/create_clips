from __future__ import annotations

from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Optional

from pydantic import BaseModel, Field, model_validator


class SourceType(str, Enum):
    youtube = "youtube"
    upload = "upload"


class ClipStrategy(str, Enum):
    highlights = "highlights"
    interval = "interval"


class JobStatus(str, Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


class ClipWindow(BaseModel):
    start: float = Field(..., ge=0)
    end: float = Field(..., ge=0)
    score: float | None = None


class ClipOutput(BaseModel):
    label: str
    video_path: Path
    subtitle_path: Path | None = None
    video_url: str
    subtitle_url: str | None = None

    class Config:
        arbitrary_types_allowed = True


class ClipRequest(BaseModel):
    source_type: SourceType
    youtube_url: str | None = Field(default=None, description="URL YouTube (si applicable)")
    clip_strategy: ClipStrategy = ClipStrategy.highlights
    interval_seconds: int | None = None
    clip_length_seconds: int | None = None
    background_id: str = "gta-drive"
    generate_subtitles: bool = True
    max_clips: int | None = None
    request_name: str | None = None

    @model_validator(mode="after")
    def validate_source(cls, values: "ClipRequest") -> "ClipRequest":
        if values.source_type == SourceType.youtube and not values.youtube_url:
            raise ValueError("youtube_url est requis quand source_type=youtube")
        return values


class JobSummary(BaseModel):
    id: str
    status: JobStatus
    message: Optional[str] = None
    progress: float = 0.0
    request: ClipRequest
    created_at: datetime = Field(default_factory=datetime.utcnow)


class JobDetail(JobSummary):
    outputs: list[ClipOutput] = Field(default_factory=list)

    class Config:
        arbitrary_types_allowed = True
