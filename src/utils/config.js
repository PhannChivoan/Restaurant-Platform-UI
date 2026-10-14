// Set VITE_API_URL (e.g. https://your-api.example.com/api/v1/) in Vercel; falls back to the local server.
const API = (import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1").replace(/\/+$/, "");

export const Config = {
  BASE_URL: `${API}/`,
  IMAGE_BASE_URL: `${API}/public/assets/images`,
};