import axios from "axios";

// In production, set VITE_API_URL to your backend URL (e.g. https://your-app.railway.app).
// Locally, leave it unset — Vite's proxy forwards /api and /media to localhost:8000.
const BASE = import.meta.env.VITE_API_URL || "";

export const api = axios.create({ baseURL: BASE });

// Attach JWT from localStorage automatically on every request
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("hpys_token");
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  } catch {
    // localStorage unavailable — proceed without token
  }
  return config;
});

// YouTube
export const parseYouTubeUrl = (url) =>
  api.post("/api/youtube/parse", { url }).then((r) => r.data);

// Events
export const getEvents = (params) =>
  api.get("/api/events/", { params }).then((r) => r.data);

export const getEvent = (id) =>
  api.get(`/api/events/${id}`).then((r) => r.data);

export const createEvent = (data) =>
  api.post("/api/events/", data).then((r) => r.data);

export const updateEvent = (id, data) =>
  api.put(`/api/events/${id}`, data).then((r) => r.data);

export const deleteEvent = (id) =>
  api.delete(`/api/events/${id}`).then((r) => r.data);

export const downloadAudio = (id) =>
  api.post(`/api/events/${id}/download-audio`).then((r) => r.data);

export const getTopics = () =>
  api.get("/api/events/topics").then((r) => r.data);

// Vakta
export const getVakta = () =>
  api.get("/api/vakta/").then((r) => r.data);

export const getVaktaById = (id) =>
  api.get(`/api/vakta/${id}`).then((r) => r.data);

export const createVakta = (formData) =>
  api.post("/api/vakta/", formData).then((r) => r.data);

export const updateVakta = (id, formData) =>
  api.put(`/api/vakta/${id}`, formData).then((r) => r.data);

export const deleteVakta = (id) =>
  api.delete(`/api/vakta/${id}`).then((r) => r.data);

export const mediaUrl = (path) => (path ? `${BASE}${path}` : null);