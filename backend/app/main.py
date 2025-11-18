from __future__ import annotations

from fastapi import FastAPI, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .backgrounds import load_background_presets
from .job_manager import job_manager
from .models import ClipRequest, ClipStrategy, JobDetail, SourceType

app = FastAPI(title="Creavid – Create Clips", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(settings.public_data_prefix, StaticFiles(directory=settings.data_dir), name="media")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/backgrounds")
def background_presets() -> list[dict]:
    return load_background_presets()


@app.get("/jobs", response_model=list[JobDetail])
def list_jobs() -> list[JobDetail]:
    return job_manager.list_jobs()


@app.get("/jobs/{job_id}", response_model=JobDetail)
def job_detail(job_id: str) -> JobDetail:
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job introuvable")
    return job


@app.post("/jobs", response_model=JobDetail)
def create_job(request: ClipRequest) -> JobDetail:
    return job_manager.create_job(request)


@app.post("/jobs/upload", response_model=JobDetail)
def create_job_from_upload(
    file: UploadFile,
    clip_strategy: ClipStrategy = Form(default=ClipStrategy.highlights),
    interval_seconds: int | None = Form(default=None),
    clip_length_seconds: int | None = Form(default=None),
    background_id: str = Form(default="gta-drive"),
    generate_subtitles: bool = Form(default=True),
    max_clips: int | None = Form(default=None),
    request_name: str | None = Form(default=None),
) -> JobDetail:
    request = ClipRequest(
        source_type=SourceType.upload,
        clip_strategy=clip_strategy,
        interval_seconds=interval_seconds,
        clip_length_seconds=clip_length_seconds,
        background_id=background_id,
        generate_subtitles=generate_subtitles,
        max_clips=max_clips,
        request_name=request_name,
    )
    return job_manager.create_job(request, upload=file)
