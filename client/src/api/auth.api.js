/**
 * Auth API — all auth-related HTTP calls in one place.
 * Controllers (context) call these functions; they never call axios directly.
 */
import api from "./client.js";

export const authApi = {
  signup:        (data)  => api.post("/api/auth/signup", data),
  login:         (data)  => api.post("/api/auth/login", data),
  checkAuth:     ()      => api.get("/api/auth/check"),
  updateProfile: (data)  => api.put("/api/auth/update-profile", data),
  deleteProfile: ()      => api.delete("/api/auth/delete-profile"),
};
