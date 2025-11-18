from __future__ import annotations

from typing import Callable, Iterable

from moviepy.editor import VideoFileClip

from ..config import settings
from ..models import ClipOutput
from .clipper import ClipDetector
from .compositor import VideoCompositor
from .context import PipelineContext
from .downloader import download_source
from .exporter import export_variants
from .subtitles import SubtitleGenerator

ProgressCallback = Callable[[float, str], None]


def run_pipeline(context: PipelineContext, progress_cb: ProgressCallback | None = None) -> list[ClipOutput]:
    progress = _progress_updater(progress_cb)
    progress(0.05, "Téléchargement en cours…")
    source_path = download_source(context)
    progress(0.15, "Détection des meilleurs moments…")

    detector = ClipDetector(
        clip_length_seconds=context.request.clip_length_seconds,
        max_clips=context.request.max_clips,
    )
    windows = detector.detect(
        source_path,
        strategy=context.request.clip_strategy,
        interval_seconds=context.request.interval_seconds,
    )
    if not windows:
        raise ValueError("Aucun extrait détecté. Ajustez les paramètres.")

    subtitle_generator = SubtitleGenerator() if context.request.generate_subtitles else None
    compositor = VideoCompositor(settings.background_dir)

    outputs: list[ClipOutput] = []
    with VideoFileClip(str(source_path)) as video:
        total = len(windows)
        for index, window in enumerate(windows, start=1):
            clip_file = context.clips_dir / f"clip_{index:02}.mp4"
            temp_audio = clip_file.with_suffix(".temp.m4a")

            subclip = video.subclip(window.start, window.end)
            subclip.write_videofile(
                str(clip_file),
                codec="libx264",
                audio_codec="aac",
                temp_audiofile=str(temp_audio),
                remove_temp=True,
                threads=4,
            )
            subclip.close()

            subtitle_path = None
            if subtitle_generator:
                subtitle_path = context.clips_dir / f"clip_{index:02}.srt"
                subtitle_path = subtitle_generator.generate(clip_file, subtitle_path)

            master_output = context.exports_dir / f"clip_{index:02}_master.mp4"
            compositor.compose(clip_file, master_output, subtitle_path, context.request.background_id)
            outputs.extend(export_variants(master_output, subtitle_path))

            progress(0.2 + 0.7 * (index / total), f"Clip {index}/{total} exporté.")

    progress(1.0, "Pipeline terminé ✅")
    return outputs


def _progress_updater(cb: ProgressCallback | None) -> ProgressCallback:
    def update(value: float, message: str) -> None:
        if cb:
            cb(min(1.0, value), message)

    return update
