import { createContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { authApi } from "../api/auth.api.js";
import api from "../api/client.js";

// AuthContext and AuthProvider are exported from the same file.
// The react-refresh rule flags this but it's the standard React context pattern.
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authUser,       setAuthUser]       = useState(null);
  const [onlineUser,     setOnlineUser]     = useState([]);
  const [socket,         setSocket]         = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const socketRef = useRef(null);

  // ── Global 401 interceptor ────────────────────────────────────────────────
  useEffect(() => {
    const id = api.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401 && authUser) {
          _clearSession();
          toast.error("Session expired. Please log in again.");
        }
        return Promise.reject(err);
      }
    );
    return () => api.interceptors.response.eject(id);
  }, [authUser]);

  // ── Check auth on mount ───────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) { setIsCheckingAuth(false); return; }
      try {
        const { data } = await authApi.checkAuth();
        if (data.success) {
          setAuthUser(data.user);
          _connectSocket(data.user);
        } else {
          _clearSession();
        }
      } catch {
        _clearSession();
      } finally {
        setIsCheckingAuth(false);
      }
    })();
    return () => socketRef.current?.disconnect();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function _clearSession(showToast = false) {
    localStorage.removeItem("token");
    setAuthUser(null);
    setOnlineUser([]);
    socketRef.current?.disconnect();
    socketRef.current = null;
    setSocket(null);
    if (showToast) toast.success("Logged out successfully.");
  }

  function _connectSocket(user) {
    if (!user?._id) return;
    socketRef.current?.disconnect();

    const s = io(import.meta.env.VITE_BACKEND_URL, {
      query: { userId: user._id },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    s.on("getOnlineUsers", setOnlineUser);
    socketRef.current = s;
    setSocket(s);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  const login = async (state, credentials) => {
    try {
      const { data } = await authApi[state](credentials);
      if (!data.success) { toast.error(data.message); return false; }
      localStorage.setItem("token", data.token);
      setAuthUser(data.userData);
      _connectSocket(data.userData);
      toast.success(data.message);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Network error.");
      return false;
    }
  };

  const logout = () => _clearSession(true);

  const updateProfile = async (body) => {
    try {
      const { data } = await authApi.updateProfile(body);
      if (data.success) { setAuthUser(data.user); toast.success("Profile updated."); return true; }
      toast.error(data.message);
      return false;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
      return false;
    }
  };

  const deleteProfile = async () => {
    try {
      const { data } = await authApi.deleteProfile();
      if (data.success) { _clearSession(); toast.success("Account deleted."); return true; }
      toast.error(data.message);
      return false;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete account.");
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      authUser, onlineUser, socket, isCheckingAuth,
      login, logout, updateProfile, deleteProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
