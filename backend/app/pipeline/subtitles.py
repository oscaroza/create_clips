from __future__ import annotations

from pathlib import Path
from typing import Any

import whisper

from ..config import settings


class SubtitleGenerator:
    def __init__(self, model_name: str | None = None) -> None:
        self.model_name = model_name or settings.whisper_model
        self._model: whisper.Whisper | None = None

    def _load_model(self) -> whisper.Whisper:
        if self._model is None:
            self._model = whisper.load_model(self.model_name)
        return self._model

    def generate(self, video_path: Path, output_path: Path) -> Path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        model = self._load_model()
        result: dict[str, Any] = model.transcribe(str(video_path), verbose=False, language="fr")
        segments = result.get("segments", [])
        srt_content = _segments_to_srt(segments)
        output_path.write_text(srt_content, encoding="utf-8")
        return output_path


def _segments_to_srt(segments: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for idx, segment in enumerate(segments, start=1):
        start = _format_timestamp(segment.get("start", 0.0))
        end = _format_timestamp(segment.get("end", 0.0))
        text = segment.get("text", "").strip()
        if not text:
            continue
        lines.append(str(idx))
        lines.append(f"{start} --> {end}")
        lines.append(text)
        lines.append("")
    return "\n".join(lines).strip() + "\n"


def _format_timestamp(seconds: float) -> str:
    millis = int((seconds - int(seconds)) * 1000)
    seconds = int(seconds)
    mins, secs = divmod(seconds, 60)
    hours, mins = divmod(mins, 60)
    return f"{hours:02}:{mins:02}:{secs:02},{millis:03}"
