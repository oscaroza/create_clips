import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
const statusLabels = {
    pending: "En attente",
    running: "En cours",
    completed: "Terminé",
    failed: "Erreur"
};
export default function JobTable({ jobs, loading, error, onRefresh }) {
    const orderedJobs = [...jobs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return (_jsxs("section", { className: "panel", children: [_jsxs("header", { className: "panel__header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Historique" }), _jsx("h2", { children: "Jobs en cours" })] }), _jsx("button", { type: "button", className: "ghost", onClick: onRefresh, disabled: loading, children: "Rafra\u00EEchir" })] }), error && _jsx("p", { className: "error", children: error }), _jsxs("div", { className: "job-table", children: [_jsxs("div", { className: "job-table__head", children: [_jsx("span", { children: "Source" }), _jsx("span", { children: "Strat\u00E9gie" }), _jsx("span", { children: "Progression" }), _jsx("span", { children: "R\u00E9sultats" })] }), orderedJobs.length === 0 && _jsx("p", { children: "Aucun job pour le moment. Lancez un traitement !" }), orderedJobs.map((job) => (_jsxs("article", { className: "job-row", children: [_jsxs("div", { children: [_jsx("strong", { children: job.request.request_name || job.id.slice(0, 6) }), _jsxs("p", { className: "muted", children: [job.request.source_type === "youtube" ? "YouTube" : "Upload", " \u00B7", " ", formatDistanceToNow(new Date(job.created_at), {
                                                addSuffix: true,
                                                locale: fr
                                            })] })] }), _jsxs("div", { children: [_jsx("p", { children: job.request.clip_strategy === "highlights" ? "Moments forts" : "Intervalle" }), job.request.clip_strategy === "interval" && (_jsxs("p", { className: "muted", children: [job.request.interval_seconds, "s"] }))] }), _jsxs("div", { className: "progress", children: [_jsx("div", { className: "progress__bar", children: _jsx("span", { style: { width: `${Math.round(job.progress * 100)}%` } }) }), _jsx("p", { className: clsx("status", job.status), children: statusLabels[job.status] }), job.message && _jsx("p", { className: "muted", children: job.message })] }), _jsxs("div", { className: "results", children: [job.outputs.length === 0 && _jsx("span", { className: "muted", children: "En attente" }), job.outputs.map((output) => (_jsxs("div", { className: "result-group", children: [_jsx("a", { href: output.video_url, target: "_blank", rel: "noopener noreferrer", className: "ghost", children: output.label }), output.subtitle_url && (_jsx("a", { href: output.subtitle_url, target: "_blank", rel: "noopener noreferrer", className: "ghost ghost--secondary", children: "SRT" }))] }, `${job.id}-${output.label}`)))] })] }, job.id)))] })] }));
}
