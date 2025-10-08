import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { generateKeyPair } from "../lib/cryptoUtils";

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
        await ensureKeysExist(data.user);
        
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

  // ----------------- ENSURE KEYS EXIST -----------------
  const ensureKeysExist = async (user) => {
    const privateKey = localStorage.getItem("privateKey");
    const publicKey = localStorage.getItem("publicKey");

    // Check if user has public key on server
    if (!user.publicKey || user.publicKey.trim() === "") {
      console.log("User has no public key on server, generating new keypair...");
      try {
        const { publicKey: newPublicKey, privateKey: newPrivateKey } = await generateKeyPair();
        
        localStorage.setItem("privateKey", newPrivateKey);
        localStorage.setItem("publicKey", newPublicKey);

        // Update user's public key on server
        await axios.put("/api/auth/update-profile", { publicKey: newPublicKey });
        
        // Update local authUser state
        setAuthUser(prev => ({ ...prev, publicKey: newPublicKey }));
        
        console.log("Generated and uploaded new public key to server");
        toast.success("Encryption keys setup completed");
      } catch (error) {
        console.error("Failed to generate keypair:", error);
        toast.error("Failed to setup encryption keys. Please try refreshing the page.");
      }
      return;
    }

    // If no private key in localStorage, generate new keypair
    if (!privateKey) {
      try {
        console.log("No private key found, generating new keypair...");
        const { publicKey: newPublicKey, privateKey: newPrivateKey } = await generateKeyPair();
        
        localStorage.setItem("privateKey", newPrivateKey);
        localStorage.setItem("publicKey", newPublicKey);

        // Update user's public key on server if it's different
        if (user.publicKey !== newPublicKey) {
          await axios.put("/api/auth/update-profile", { publicKey: newPublicKey });
          setAuthUser(prev => ({ ...prev, publicKey: newPublicKey }));
          console.log("Updated public key on server");
        }
      } catch (error) {
        console.error("Failed to generate keypair:", error);
        toast.error("Failed to setup encryption keys");
      }
    } else if (!publicKey) {
      // If private key exists but no public key in localStorage, store it
      localStorage.setItem("publicKey", user.publicKey || "");
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

      // Ensure encryption keys exist for the user
      await ensureKeysExist(data.userData);
      
      connectSocket(data.userData);
      toast.success(data.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ----------------- LOGOUT -----------------
  const logout = async () => {
    localStorage.removeItem("token");
    // Don't remove private key on logout - user might want to keep their encryption keys
    // localStorage.removeItem("privateKey");
    // localStorage.removeItem("publicKey");
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
        localStorage.removeItem("privateKey");
        localStorage.removeItem("publicKey");
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
    ensureKeysExist,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
