import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { JobSummary } from "../lib/api";

interface JobTableProps {
  jobs: JobSummary[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const statusLabels: Record<JobSummary["status"], string> = {
  pending: "En attente",
  running: "En cours",
  completed: "Terminé",
  failed: "Erreur"
};

export default function JobTable({ jobs, loading, error, onRefresh }: JobTableProps) {
  const orderedJobs = [...jobs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <p className="eyebrow">Historique</p>
          <h2>Jobs en cours</h2>
        </div>
        <button type="button" className="ghost" onClick={onRefresh} disabled={loading}>
          Rafraîchir
        </button>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="job-table">
        <div className="job-table__head">
          <span>Source</span>
          <span>Stratégie</span>
          <span>Progression</span>
          <span>Résultats</span>
        </div>

        {orderedJobs.length === 0 && <p>Aucun job pour le moment. Lancez un traitement !</p>}

        {orderedJobs.map((job) => (
          <article key={job.id} className="job-row">
            <div>
              <strong>{job.request.request_name || job.id.slice(0, 6)}</strong>
              <p className="muted">
                {job.request.source_type === "youtube" ? "YouTube" : "Upload"} ·{" "}
                {formatDistanceToNow(new Date(job.created_at), {
                  addSuffix: true,
                  locale: fr
                })}
              </p>
            </div>

            <div>
              <p>{job.request.clip_strategy === "highlights" ? "Moments forts" : "Intervalle"}</p>
              {job.request.clip_strategy === "interval" && (
                <p className="muted">{job.request.interval_seconds}s</p>
              )}
            </div>

            <div className="progress">
              <div className="progress__bar">
                <span style={{ width: `${Math.round(job.progress * 100)}%` }} />
              </div>
              <p className={clsx("status", job.status)}>{statusLabels[job.status]}</p>
              {job.message && <p className="muted">{job.message}</p>}
            </div>

            <div className="results">
              {job.outputs.length === 0 && <span className="muted">En attente</span>}
              {job.outputs.map((output) => (
                <div key={`${job.id}-${output.label}`} className="result-group">
                  <a href={output.video_url} target="_blank" rel="noopener noreferrer" className="ghost">
                    {output.label}
                  </a>
                  {output.subtitle_url && (
                    <a
                      href={output.subtitle_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ghost ghost--secondary"
                    >
                      SRT
                    </a>
                  )}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
