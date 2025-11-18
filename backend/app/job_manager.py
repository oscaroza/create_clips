from __future__ import annotations

import shutil
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from threading import Lock
from typing import Iterable
from uuid import uuid4

from fastapi import UploadFile

from .config import settings
from .models import ClipOutput, ClipRequest, JobDetail, JobStatus
from .pipeline.context import PipelineContext
from .pipeline.runner import run_pipeline


class JobManager:
    def __init__(self) -> None:
        self._jobs: dict[str, JobDetail] = {}
        self._lock = Lock()
        self._executor = ThreadPoolExecutor(max_workers=settings.max_parallel_jobs)

    def create_job(self, request: ClipRequest, upload: UploadFile | None = None) -> JobDetail:
        job_id = uuid4().hex
        job_dir = settings.jobs_dir() / job_id
        context = PipelineContext(
            job_id=job_id,
            request=request,
            job_dir=job_dir,
            source_dir=job_dir / "source",
            clips_dir=job_dir / "clips",
            exports_dir=job_dir / "exports",
            temp_dir=job_dir / "temp",
        )
        context.ensure_dirs()
        if upload:
            context.uploaded_source = self._save_upload(upload, context.source_dir)

        detail = JobDetail(
            id=job_id,
            status=JobStatus.pending,
            progress=0.0,
            message="En file d'attente",
            request=request,
            outputs=[],
        )
        with self._lock:
            self._jobs[job_id] = detail

        self._executor.submit(self._run_job, job_id, context)
        return detail

    def list_jobs(self) -> list[JobDetail]:
        with self._lock:
            return sorted(self._jobs.values(), key=lambda job: job.created_at, reverse=True)

    def get_job(self, job_id: str) -> JobDetail | None:
        with self._lock:
            return self._jobs.get(job_id)

    def _run_job(self, job_id: str, context: PipelineContext) -> None:
        def progress_cb(value: float, message: str) -> None:
            self._update_job(job_id, status=JobStatus.running, progress=value, message=message)

        self._update_job(job_id, status=JobStatus.running, progress=0.01, message="Préparation…")
        try:
            outputs = run_pipeline(context, progress_cb)
        except Exception as exc:  # noqa: BLE001
            self._update_job(job_id, status=JobStatus.failed, progress=1.0, message=str(exc))
            return

        self._update_job(
            job_id,
            status=JobStatus.completed,
            progress=1.0,
            message="Clips exportés avec succès",
            outputs=outputs,
        )

    def _update_job(
        self,
        job_id: str,
        *,
        status: JobStatus | None = None,
        progress: float | None = None,
        message: str | None = None,
        outputs: Iterable[ClipOutput] | None = None,
    ) -> None:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return
            new_values = job.model_dump()
            if status:
                new_values["status"] = status
            if progress is not None:
                new_values["progress"] = progress
            if message is not None:
                new_values["message"] = message
            if outputs is not None:
                new_values["outputs"] = list(outputs)
            self._jobs[job_id] = JobDetail(**new_values)

    @staticmethod
    def _save_upload(upload: UploadFile, target_dir: Path) -> Path:
        target_dir.mkdir(parents=True, exist_ok=True)
        suffix = Path(upload.filename or "upload.mp4").suffix or ".mp4"
        target_path = target_dir / f"upload{suffix}"
        upload.file.seek(0)
        with target_path.open("wb") as file_obj:
            shutil.copyfileobj(upload.file, file_obj)
        return target_path


job_manager = JobManager()
