import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { createUploadJob, createYoutubeJob, fetchBackgroundPresets } from "../lib/api";
const defaultPayload = {
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
export default function ClipForm({ onJobCreated }) {
    const [form, setForm] = useState(() => ({ ...defaultPayload }));
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [backgrounds, setBackgrounds] = useState([]);
    useEffect(() => {
        fetchBackgroundPresets().then(setBackgrounds).catch(() => {
            setBackgrounds([]);
        });
    }, []);
    const update = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };
    const handleSubmit = async (event) => {
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
                const payload = { ...form, source_type: "youtube", youtube_url: youtubeUrl };
                const job = await createYoutubeJob(payload);
                onJobCreated(job);
                setForm({ ...defaultPayload, source_type: "youtube" });
            }
            else {
                if (!file) {
                    setError("Ajoutez un fichier vidéo local.");
                    return;
                }
                const formData = new FormData();
                formData.append("file", file);
                formData.append("clip_strategy", form.clip_strategy);
                if (form.interval_seconds)
                    formData.append("interval_seconds", String(form.interval_seconds));
                if (form.clip_length_seconds)
                    formData.append("clip_length_seconds", String(form.clip_length_seconds));
                formData.append("background_id", form.background_id);
                formData.append("generate_subtitles", String(form.generate_subtitles));
                if (form.max_clips)
                    formData.append("max_clips", String(form.max_clips));
                if (form.request_name)
                    formData.append("request_name", form.request_name);
                const job = await createUploadJob(formData);
                onJobCreated(job);
                setFile(null);
                setForm({ ...defaultPayload, source_type: "upload" });
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Impossible de lancer le job.");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsxs("form", { className: "panel", onSubmit: handleSubmit, children: [_jsxs("div", { className: "panel__header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Nouvelle mission" }), _jsx("h2", { children: "Cr\u00E9er des clips viraux" })] }), _jsxs("div", { className: "source-toggle", children: [_jsx("button", { type: "button", className: form.source_type === "youtube" ? "active" : "", onClick: () => update("source_type", "youtube"), children: "YouTube" }), _jsx("button", { type: "button", className: form.source_type === "upload" ? "active" : "", onClick: () => update("source_type", "upload"), children: "Fichier" })] })] }), form.source_type === "youtube" ? (_jsxs("label", { className: "field", children: [_jsx("span", { children: "URL YouTube" }), _jsx("input", { type: "url", value: form.youtube_url, placeholder: "https://www.youtube.com/watch?v=...", onChange: (event) => update("youtube_url", event.target.value), required: true })] })) : (_jsxs("label", { className: "field", children: [_jsx("span", { children: "Fichier local" }), _jsx("input", { type: "file", accept: "video/*", onChange: (event) => setFile(event.target.files?.[0] ?? null) })] })), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Nom du projet (optionnel)" }), _jsx("input", { type: "text", value: form.request_name ?? "", placeholder: "Ex: Highlights podcast #12", onChange: (event) => update("request_name", event.target.value || null) })] }), _jsxs("div", { className: "grid", children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "Strat\u00E9gie" }), _jsxs("select", { value: form.clip_strategy, onChange: (event) => update("clip_strategy", event.target.value), children: [_jsx("option", { value: "highlights", children: "Moments forts (auto)" }), _jsx("option", { value: "interval", children: "Coupe r\u00E9guli\u00E8re" })] })] }), form.clip_strategy === "interval" && (_jsxs("label", { className: "field", children: [_jsx("span", { children: "Intervalle (s)" }), _jsx("input", { type: "number", min: 10, value: form.interval_seconds ?? 30, onChange: (event) => update("interval_seconds", event.target.value ? Number(event.target.value) : null) })] })), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Dur\u00E9e clip (s)" }), _jsx("input", { type: "number", min: 10, max: 90, value: form.clip_length_seconds ?? 35, onChange: (event) => update("clip_length_seconds", event.target.value ? Number(event.target.value) : null) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Max clips" }), _jsx("input", { type: "number", min: 1, max: 10, value: form.max_clips ?? 4, onChange: (event) => update("max_clips", event.target.value ? Number(event.target.value) : null) })] })] }), _jsxs("div", { className: "grid", children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "Preset vid\u00E9o de fond" }), _jsxs("select", { value: form.background_id, onChange: (event) => update("background_id", event.target.value), children: [backgrounds.length === 0 && _jsx("option", { value: "gta-drive", children: "GTA Drive" }), backgrounds.map((preset) => (_jsx("option", { value: preset.id, children: preset.label }, preset.id)))] })] }), _jsxs("label", { className: "field checkbox", children: [_jsx("input", { type: "checkbox", checked: form.generate_subtitles, onChange: (event) => update("generate_subtitles", event.target.checked) }), _jsx("span", { children: "G\u00E9n\u00E9rer les sous-titres" })] })] }), error && _jsx("p", { className: "error", children: error }), _jsx("button", { type: "submit", className: "primary", disabled: isSubmitting, children: isSubmitting ? "Analyse en cours..." : "Lancer la génération" })] }));
}
