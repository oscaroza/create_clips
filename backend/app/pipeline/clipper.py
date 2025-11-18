from __future__ import annotations

from pathlib import Path
from typing import Iterable

import numpy as np
from moviepy.audio.AudioClip import AudioClip
from moviepy.editor import VideoFileClip

from ..config import settings
from ..models import ClipStrategy, ClipWindow

SAMPLE_RATE = 8000


class ClipDetector:
    def __init__(
        self,
        clip_length_seconds: int | None = None,
        min_clip_length_seconds: int | None = None,
        max_clips: int | None = None,
    ) -> None:
        self.clip_length = clip_length_seconds or settings.clip_length_seconds
        requested_min = min_clip_length_seconds or settings.min_clip_length_seconds
        self.min_clip_length = min(self.clip_length, requested_min)
        self.max_clips = max_clips or settings.max_clips

    def detect(
        self,
        video_path: Path,
        strategy: ClipStrategy,
        interval_seconds: int | None = None,
    ) -> list[ClipWindow]:
        if strategy == ClipStrategy.interval:
            return self._interval_windows(video_path, interval_seconds)
        return self._highlight_windows(video_path)

    def _interval_windows(self, video_path: Path, interval_seconds: int | None) -> list[ClipWindow]:
        interval = interval_seconds or settings.default_interval_seconds
        with VideoFileClip(str(video_path)) as clip:
            duration = clip.duration
        windows: list[ClipWindow] = []
        start = 0.0
        while start < duration and len(windows) < self.max_clips:
            end = min(start + self.clip_length, duration)
            if end - start >= self.min_clip_length:
                windows.append(ClipWindow(start=start, end=end, score=1.0))
            start += interval
        return windows

    def _highlight_windows(self, video_path: Path) -> list[ClipWindow]:
        with VideoFileClip(str(video_path)) as clip:
            duration = clip.duration
            audio = clip.audio
            if audio is None:
                raise ValueError("Aucune piste audio détectée, impossible de calculer les extraits.")
            waveform = _audio_to_waveform(audio)

        if waveform.ndim > 1:
            waveform = np.mean(waveform, axis=1)

        chunk_len = int(SAMPLE_RATE * self.min_clip_length)
        if chunk_len == 0:
            chunk_len = 1

        windows: list[tuple[float, float]] = []
        for offset in range(0, len(waveform), chunk_len):
            chunk = waveform[offset : offset + chunk_len]
            if not len(chunk):
                continue
            # RMS (root mean square) comme proxy d'énergie
            rms = float(np.sqrt(np.mean(np.square(chunk))))
            start = offset / SAMPLE_RATE
            windows.append((rms, start))

        # Tri des fenêtres par énergie décroissante
        windows.sort(key=lambda item: item[0], reverse=True)

        selected: list[ClipWindow] = []
        for score, start_time in windows:
            if len(selected) >= self.max_clips:
                break
            start = min(start_time, max(0.0, duration - self.clip_length))
            end = min(start + self.clip_length, duration)
            if end - start < self.min_clip_length:
                continue
            if _overlaps(start, end, selected):
                continue
            selected.append(ClipWindow(start=start, end=end, score=score))

        selected.sort(key=lambda window: window.start)
        return selected


def _overlaps(start: float, end: float, windows: Iterable[ClipWindow]) -> bool:
    for window in windows:
        if not (end <= window.start or start >= window.end):
            return True
    return False


def _audio_to_waveform(audio: AudioClip) -> np.ndarray:
    chunks: list[np.ndarray] = []
    for frame in audio.iter_frames(fps=SAMPLE_RATE, buffersize=50000):
        chunks.append(frame)
    if not chunks:
        raise ValueError("Impossible de lire l'audio de la vidéo.")
    return np.concatenate(chunks, axis=0)
