from __future__ import annotations

from pathlib import Path
from typing import Optional

from yt_dlp import YoutubeDL

from ..models import SourceType
from .context import PipelineContext


def _youtube_options(target_dir: Path) -> dict:
    target_dir.mkdir(parents=True, exist_ok=True)
    return {
        "outtmpl": str(target_dir / "source.%(ext)s"),
        "format": "bestvideo+bestaudio/best",
        "merge_output_format": "mp4",
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
    }


def download_source(context: PipelineContext) -> Path:
    if context.request.source_type == SourceType.upload:
        if not context.uploaded_source:
            raise ValueError("Aucun fichier uploadé reçu")
        return context.uploaded_source

    if not context.request.youtube_url:
        raise ValueError("URL YouTube manquante")

    options = _youtube_options(context.source_dir)
    with YoutubeDL(options) as ydl:
        info = ydl.extract_info(context.request.youtube_url, download=True)
        downloaded_path = Path(ydl.prepare_filename(info))

    if downloaded_path.suffix != ".mp4":
        target = downloaded_path.with_suffix(".mp4")
        downloaded_path.rename(target)
        downloaded_path = target

    return downloaded_path
