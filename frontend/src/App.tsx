import ClipForm from "./components/ClipForm";
import JobTable from "./components/JobTable";
import { JobDetail } from "./lib/api";
import { useJobPolling } from "./hooks/useJobPolling";

export default function App() {
  const { jobs, loading, error, refresh } = useJobPolling();

  const handleJobCreated = (job: JobDetail) => {
    refresh();
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Creavid Studio</p>
          <h1>Automatisez vos clips viraux</h1>
          <p className="muted">
            Téléchargez, détectez, sous-titrez et formatez vos meilleurs moments en un clic. Exportez pour
            TikTok, Reels et Shorts.
          </p>
        </div>
      </header>

      <main className="layout">
        <ClipForm onJobCreated={handleJobCreated} />
        <JobTable jobs={jobs} loading={loading} error={error} onRefresh={refresh} />
      </main>
    </div>
  );
}
