import { JobSummary } from "../lib/api";
interface JobTableProps {
    jobs: JobSummary[];
    loading: boolean;
    error: string | null;
    onRefresh: () => void;
}
export default function JobTable({ jobs, loading, error, onRefresh }: JobTableProps): import("react/jsx-runtime").JSX.Element;
export {};
