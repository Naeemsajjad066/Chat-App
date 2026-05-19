/**
 * Shared Axios instance.
 * All API modules import from here — one place to change base URL,
 * headers, interceptors, and retry logic.
 */
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  timeout: 15000,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers["token"] = token;
  return config;
});

export default api;
