import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUser, setOnlineUser] = useState([]);
  const [socket, setSocket] = useState(null);

  // ----------------- CHECK AUTH -----------------
  const checkAuth = async () => {
    if (!token) return; // Don't check auth if no token
    
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        
        // Only connect socket if not already connected
        if (!socket || !socket.connected) {
          connectSocket(data.user);
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      // Don't show toast for auth failures as they're common on startup
    }
  };

  // ----------------- LOGIN / SIGNUP -----------------
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (!data.success) return toast.error(data.message);

      setAuthUser(data.userData);
      setToken(data.token);
      localStorage.setItem("token", data.token);
      axios.defaults.headers.common["token"] = data.token;
      
      connectSocket(data.userData);
      toast.success(data.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ----------------- LOGOUT -----------------
  const logout = async () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUser([]);
    axios.defaults.headers.common["token"] = null;
    socket?.disconnect();
    toast.success("Logged out successfully");
  };

  // ----------------- UPDATE PROFILE -----------------
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ----------------- DELETE PROFILE -----------------
  const deleteProfile = async () => {
    try {
      const { data } = await axios.delete("/api/auth/delete-profile");
      if (data.success) {
        // Clear all user data
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUser([]);
        axios.defaults.headers.common["token"] = null;
        socket?.disconnect();
        toast.success("Profile deleted successfully");
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  // ----------------- SOCKET -----------------
  const connectSocket = (userData) => {
    if (!userData) return;
    
    // Disconnect existing socket if any
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }

    console.log("Connecting socket for user:", userData._id);
    
    const newSocket = io(backendUrl, {
      query: { userId: userData._id },
      transports: ['websocket', 'polling'], // Ensure compatibility
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    newSocket.on("getOnlineUsers", (userIds) => {
      console.log("📱 Online users received:", userIds);
      console.log("📱 Current authUser ID:", userData._id);
      setOnlineUser(userIds);
    });

    setSocket(newSocket);
  };

  useEffect(() => {
    if (token) axios.defaults.headers.common["token"] = token;
    checkAuth();
    
    // Cleanup function to disconnect socket when component unmounts
    return () => {
      if (socket) {
        console.log("Cleaning up socket connection");
        socket.disconnect();
      }
    };
  }, []);

  const value = {
    axios,
    authUser,
    onlineUser,
    socket,
    login,
    logout,
    updateProfile,
    deleteProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
