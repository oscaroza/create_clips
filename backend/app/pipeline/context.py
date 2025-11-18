from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from ..models import ClipRequest


@dataclass(slots=True)
class PipelineContext:
    job_id: str
    request: ClipRequest
    job_dir: Path
    source_dir: Path
    clips_dir: Path
    exports_dir: Path
    temp_dir: Path
    uploaded_source: Path | None = None

    def ensure_dirs(self) -> None:
        self.job_dir.mkdir(parents=True, exist_ok=True)
        for directory in (self.source_dir, self.clips_dir, self.exports_dir, self.temp_dir):
            directory.mkdir(parents=True, exist_ok=True)

