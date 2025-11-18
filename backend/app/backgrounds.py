from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from .config import settings


@lru_cache
def load_background_presets() -> list[dict[str, Any]]:
    preset_file = settings.background_dir / "presets.json"
    if not preset_file.exists():
        return []
    return json.loads(preset_file.read_text(encoding="utf-8"))

