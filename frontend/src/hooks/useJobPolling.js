import { useCallback, useEffect, useRef, useState } from "react";
import { fetchJobs } from "../lib/api";
export function useJobPolling(pollInterval = 5000) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const timerRef = useRef(null);
    const load = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchJobs();
            setJobs(data);
            setError(null);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Impossible de charger les jobs");
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        load();
        timerRef.current = setInterval(load, pollInterval);
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [load, pollInterval]);
    return { jobs, refresh: load, loading, error };
}
