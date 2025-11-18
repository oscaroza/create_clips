from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from moviepy.editor import CompositeVideoClip, TextClip, VideoFileClip
from moviepy.video.fx import all as vfx
from moviepy.video.tools.subtitles import SubtitlesClip


class VideoCompositor:
    def __init__(self, background_dir: Path):
        self.background_dir = background_dir
        self._presets = self._load_presets()

    def _load_presets(self) -> dict[str, dict[str, Any]]:
        preset_file = self.background_dir / "presets.json"
        if not preset_file.exists():
            return {}
        data = json.loads(preset_file.read_text(encoding="utf-8"))
        return {entry["id"]: entry for entry in data}

    def list_presets(self) -> list[dict[str, Any]]:
        return list(self._presets.values())

    def _preset_file(self, preset_id: str) -> Path | None:
        preset = self._presets.get(preset_id)
        if not preset:
            return None
        return self.background_dir / preset["file"]

    def compose(
        self,
        clip_path: Path,
        output_path: Path,
        subtitle_path: Path | None,
        background_id: str,
    ) -> Path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        target_size = (1080, 1920)
        bg_path = self._preset_file(background_id)

        bg_clip = None
        try:
            with VideoFileClip(str(clip_path)) as base_clip:
                fg = (
                    base_clip.resize(height=target_size[1])
                    .crop(
                        width=target_size[0],
                        height=target_size[1],
                        x_center=base_clip.w / 2,
                        y_center=base_clip.h / 2,
                    )
                    .set_position("center")
                )

                if bg_path and bg_path.exists():
                    bg_clip = VideoFileClip(str(bg_path))
                    background = (
                        bg_clip.fx(vfx.loop, duration=fg.duration)
                        .resize(height=target_size[1])
                        .crop(
                            width=target_size[0],
                            height=target_size[1],
                            x_center=bg_clip.w / 2,
                            y_center=bg_clip.h / 2,
                        )
                    )
                else:
                    background = (
                        fg.fx(vfx.blur, size=25)
                        .resize(height=target_size[1])
                        .crop(
                            width=target_size[0],
                            height=target_size[1],
                            x_center=fg.w / 2,
                            y_center=fg.h / 2,
                        )
                    )

                layers = [background.set_opacity(0.8), fg.set_opacity(1.0)]

                if subtitle_path and subtitle_path.exists():
                    generator = lambda txt: TextClip(
                        txt,
                        fontsize=48,
                        color="white",
                        font="Arial-Bold",
                        stroke_color="black",
                        stroke_width=2,
                    )
                    subtitles = SubtitlesClip(str(subtitle_path), generator).set_position(("center", "bottom"))
                    layers.append(subtitles)

                final = CompositeVideoClip(layers, size=target_size)
                final.write_videofile(
                    str(output_path),
                    fps=max(24, int(base_clip.fps)),
                    codec="libx264",
                    audio_codec="aac",
                    threads=4,
                    preset="medium",
                    temp_audiofile=str(output_path.with_suffix(".temp-audio.m4a")),
                    remove_temp=True,
                )
                final.close()
        finally:
            if bg_clip:
                bg_clip.close()

        return output_path
