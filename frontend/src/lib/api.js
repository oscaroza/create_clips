import axios from "axios";
const client = axios.create({
    baseURL: "/api"
});
export async function fetchJobs() {
    const { data } = await client.get("/jobs");
    return data;
}
export async function fetchBackgroundPresets() {
    const { data } = await client.get("/backgrounds");
    return data;
}
export async function createYoutubeJob(payload) {
    const { data } = await client.post("/jobs", payload);
    return data;
}
export async function createUploadJob(formData) {
    const { data } = await client.post("/jobs/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return data;
}
