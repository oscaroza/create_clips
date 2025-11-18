import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import ClipForm from "./components/ClipForm";
import JobTable from "./components/JobTable";
import { useJobPolling } from "./hooks/useJobPolling";
export default function App() {
    const { jobs, loading, error, refresh } = useJobPolling();
    const handleJobCreated = (job) => {
        refresh();
    };
    return (_jsxs("div", { className: "app-shell", children: [_jsx("header", { className: "hero", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Creavid Studio" }), _jsx("h1", { children: "Automatisez vos clips viraux" }), _jsx("p", { className: "muted", children: "T\u00E9l\u00E9chargez, d\u00E9tectez, sous-titrez et formatez vos meilleurs moments en un clic. Exportez pour TikTok, Reels et Shorts." })] }) }), _jsxs("main", { className: "layout", children: [_jsx(ClipForm, { onJobCreated: handleJobCreated }), _jsx(JobTable, { jobs: jobs, loading: loading, error: error, onRefresh: refresh })] })] }));
}
