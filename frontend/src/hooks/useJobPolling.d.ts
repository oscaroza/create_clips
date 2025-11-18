export declare function useJobPolling(pollInterval?: number): {
    jobs: import("../lib/api").JobDetail[];
    refresh: () => Promise<void>;
    loading: boolean;
    error: string | null;
};
