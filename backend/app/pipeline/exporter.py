from __future__ import annotations

import shutil
from pathlib import Path

from ..config import settings
from ..models import ClipOutput

EXPORT_LABELS = {
    "tiktok": "TikTok 1080x1920 (60s)",
    "reels": "Instagram Reels",
    "shorts": "YouTube Shorts",
}


def export_variants(master_path: Path, subtitle_path: Path | None) -> list[ClipOutput]:
    master_path.parents[0].mkdir(parents=True, exist_ok=True)
    outputs: list[ClipOutput] = []
    for target in settings.export_targets:
        target_path = master_path.with_name(f"{master_path.stem}_{target}{master_path.suffix}")
        shutil.copyfile(master_path, target_path)
        outputs.append(
            ClipOutput(
                label=EXPORT_LABELS.get(target, target),
                video_path=target_path,
                subtitle_path=subtitle_path,
                video_url=_public_url(target_path),
                subtitle_url=_public_url(subtitle_path) if subtitle_path else None,
            )
        )
    return outputs


def _public_url(path: Path) -> str:
    try:
        relative = path.relative_to(settings.data_dir)
        return f"{settings.public_data_prefix}/{relative.as_posix()}"
    except ValueError:
        return str(path)
