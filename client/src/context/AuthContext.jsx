import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { generateKeyPair } from "../lib/cryptoUtils"; // <-- Web Crypto functions

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUsr] = useState(null);
  const [onlineUser, setOnlineUser] = useState([]);
  const [socket, setSocket] = useState(null);

  // ----------------- CHECK AUTH -----------------
  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUsr(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ----------------- LOGIN -----------------
  const login = async (state, credentials) => {
    
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);

      if (data.success) {
        setAuthUsr(data.userData);
        connectSocket(data.userData);
        axios.defaults.headers.common["token"] = data.token;
        setToken(data.token);
        localStorage.setItem("token", data.token);
        // ✅ Generate keypair only if user doesn’t already have one
        if (!localStorage.getItem("privateKey") || !data.userData.publickey) {
          const { publicKey, privateKey } = await generateKeyPair();
          localStorage.setItem("privateKey", privateKey);
          await axios.put("/api/auth/update-profile", { publickey: publicKey });
          console.log("Generated NEW keypair");
          console.log("Public key sent to server:", publicKey.slice(0, 100));
          console.log("Private key stored locally:", privateKey.slice(0, 100));
        } else {
          console.log("Using EXISTING keypair");
          console.log("Public key in DB:", data.userData.publickey?.slice(0, 100));
          console.log("Private key in localStorage:", localStorage.getItem("privateKey")?.slice(0, 100));
        }
        

        // ✅ Generate keypair only if user doesn’t already have one
        if (!localStorage.getItem("privateKey") || !data.userData.publickey) {
          const { publicKey, privateKey } = await generateKeyPair();
          localStorage.setItem("privateKey", privateKey);

          // send public key to backend (update user profile)
          await axios.put("/api/auth/update-profile", { publickey: publicKey });
        }

        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ----------------- LOGOUT -----------------
  const logout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("privateKey"); // clear keys on logout
    setToken(null);
    setAuthUsr(null);
    setOnlineUser([]);
    axios.defaults.headers.common["token"] = null;
    toast.success("Logged out successfully");
    socket?.disconnect();
  };

  // ----------------- UPDATE PROFILE -----------------
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUsr(data.user);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ----------------- CONNECT SOCKET -----------------
  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;

    const newSocket = io(backendUrl, {
      query: { userId: userData._id },
    });
    newSocket.connect();
    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUser(userIds);
    });
  };

  // ----------------- EFFECT -----------------
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["token"] = token;
    }
    checkAuth();
  }, []);

  const value = {
    axios,
    authUser,
    onlineUser,
    socket,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
