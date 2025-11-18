import axios from "axios";

export type ClipStrategy = "highlights" | "interval";
export type SourceType = "youtube" | "upload";

export interface ClipRequestPayload {
  source_type: SourceType;
  youtube_url?: string;
  clip_strategy: ClipStrategy;
  interval_seconds?: number | null;
  clip_length_seconds?: number | null;
  background_id: string;
  generate_subtitles: boolean;
  max_clips?: number | null;
  request_name?: string | null;
}

export interface ClipOutput {
  label: string;
  video_path: string;
  subtitle_path?: string | null;
  video_url: string;
  subtitle_url?: string | null;
}

export interface JobDetail {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  message?: string | null;
  progress: number;
  request: ClipRequestPayload;
  outputs: ClipOutput[];
  created_at: string;
}

export type JobSummary = JobDetail;

export interface BackgroundPreset {
  id: string;
  label: string;
  description?: string;
  file?: string;
}

const client = axios.create({
  baseURL: "/api"
});

export async function fetchJobs(): Promise<JobSummary[]> {
  const { data } = await client.get<JobSummary[]>("/jobs");
  return data;
}

export async function fetchBackgroundPresets(): Promise<BackgroundPreset[]> {
  const { data } = await client.get<BackgroundPreset[]>("/backgrounds");
  return data;
}

export async function createYoutubeJob(payload: ClipRequestPayload): Promise<JobDetail> {
  const { data } = await client.post<JobDetail>("/jobs", payload);
  return data;
}

export async function createUploadJob(formData: FormData): Promise<JobDetail> {
  const { data } = await client.post<JobDetail>("/jobs/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
}
