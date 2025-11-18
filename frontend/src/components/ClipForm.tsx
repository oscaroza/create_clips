import { useEffect, useState } from "react";
import {
  BackgroundPreset,
  ClipRequestPayload,
  ClipStrategy,
  createUploadJob,
  createYoutubeJob,
  fetchBackgroundPresets,
  JobDetail
} from "../lib/api";

interface ClipFormProps {
  onJobCreated: (job: JobDetail) => void;
}

const defaultPayload: ClipRequestPayload = {
  source_type: "youtube",
  youtube_url: "",
  clip_strategy: "highlights",
  interval_seconds: 30,
  clip_length_seconds: 35,
  background_id: "gta-drive",
  generate_subtitles: true,
  max_clips: 4,
  request_name: null
};

export default function ClipForm({ onJobCreated }: ClipFormProps) {
  const [form, setForm] = useState<ClipRequestPayload>(() => ({ ...defaultPayload }));
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backgrounds, setBackgrounds] = useState<BackgroundPreset[]>([]);

  useEffect(() => {
    fetchBackgroundPresets().then(setBackgrounds).catch(() => {
      setBackgrounds([]);
    });
  }, []);

  const update = (key: keyof ClipRequestPayload, value: ClipRequestPayload[typeof key]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (form.source_type === "youtube") {
        const youtubeUrl = form.youtube_url?.trim();
        if (!youtubeUrl) {
          setError("Merci d'ajouter l'URL YouTube.");
          return;
        }
        const payload: ClipRequestPayload = { ...form, source_type: "youtube", youtube_url: youtubeUrl };
        const job = await createYoutubeJob(payload);
        onJobCreated(job);
        setForm({ ...defaultPayload, source_type: "youtube" });
      } else {
        if (!file) {
          setError("Ajoutez un fichier vidéo local.");
          return;
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("clip_strategy", form.clip_strategy);
        if (form.interval_seconds) formData.append("interval_seconds", String(form.interval_seconds));
        if (form.clip_length_seconds)
          formData.append("clip_length_seconds", String(form.clip_length_seconds));
        formData.append("background_id", form.background_id);
        formData.append("generate_subtitles", String(form.generate_subtitles));
        if (form.max_clips) formData.append("max_clips", String(form.max_clips));
        if (form.request_name) formData.append("request_name", form.request_name);

        const job = await createUploadJob(formData);
        onJobCreated(job);
        setFile(null);
        setForm({ ...defaultPayload, source_type: "upload" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de lancer le job.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <div className="panel__header">
        <div>
          <p className="eyebrow">Nouvelle mission</p>
          <h2>Créer des clips viraux</h2>
        </div>
        <div className="source-toggle">
          <button
            type="button"
            className={form.source_type === "youtube" ? "active" : ""}
            onClick={() => update("source_type", "youtube")}
          >
            YouTube
          </button>
          <button
            type="button"
            className={form.source_type === "upload" ? "active" : ""}
            onClick={() => update("source_type", "upload")}
          >
            Fichier
          </button>
        </div>
      </div>

      {form.source_type === "youtube" ? (
        <label className="field">
          <span>URL YouTube</span>
          <input
            type="url"
            value={form.youtube_url}
            placeholder="https://www.youtube.com/watch?v=..."
            onChange={(event) => update("youtube_url", event.target.value)}
            required
          />
        </label>
      ) : (
        <label className="field">
          <span>Fichier local</span>
          <input type="file" accept="video/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </label>
      )}

      <label className="field">
        <span>Nom du projet (optionnel)</span>
        <input
          type="text"
          value={form.request_name ?? ""}
          placeholder="Ex: Highlights podcast #12"
          onChange={(event) => update("request_name", event.target.value || null)}
        />
      </label>

      <div className="grid">
        <label className="field">
          <span>Stratégie</span>
          <select
            value={form.clip_strategy}
            onChange={(event) => update("clip_strategy", event.target.value as ClipStrategy)}
          >
            <option value="highlights">Moments forts (auto)</option>
            <option value="interval">Coupe régulière</option>
          </select>
        </label>

        {form.clip_strategy === "interval" && (
          <label className="field">
            <span>Intervalle (s)</span>
            <input
              type="number"
              min={10}
              value={form.interval_seconds ?? 30}
              onChange={(event) => update("interval_seconds", event.target.value ? Number(event.target.value) : null)}
            />
          </label>
        )}

        <label className="field">
          <span>Durée clip (s)</span>
          <input
            type="number"
            min={10}
            max={90}
            value={form.clip_length_seconds ?? 35}
            onChange={(event) => update("clip_length_seconds", event.target.value ? Number(event.target.value) : null)}
          />
        </label>

        <label className="field">
          <span>Max clips</span>
          <input
            type="number"
            min={1}
            max={10}
            value={form.max_clips ?? 4}
            onChange={(event) => update("max_clips", event.target.value ? Number(event.target.value) : null)}
          />
        </label>
      </div>

      <div className="grid">
        <label className="field">
          <span>Preset vidéo de fond</span>
          <select value={form.background_id} onChange={(event) => update("background_id", event.target.value)}>
            {backgrounds.length === 0 && <option value="gta-drive">GTA Drive</option>}
            {backgrounds.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field checkbox">
          <input
            type="checkbox"
            checked={form.generate_subtitles}
            onChange={(event) => update("generate_subtitles", event.target.checked)}
          />
          <span>Générer les sous-titres</span>
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      <button type="submit" className="primary" disabled={isSubmitting}>
        {isSubmitting ? "Analyse en cours..." : "Lancer la génération"}
      </button>
    </form>
  );
}
