import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { messageApi } from "../api/message.api.js";
import { AuthContext } from "./AuthContext.jsx";

export const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { socket, authUser } = useContext(AuthContext);

  const [messages,       setMessages]       = useState([]);
  const [users,          setUsers]          = useState([]);
  const [selectedUser,   setSelectedUser]   = useState(() => {
    const id = localStorage.getItem("selectedUserId");
    return id ? { _id: id } : null;
  });
  const [unseenMessages, setUnseenMessages] = useState({});
  const [lastMessages,   setLastMessages]   = useState({});
  const [typingUsers,    setTypingUsers]    = useState(new Set());

  const typingTimers = useRef({});

  // ── Persist selected user ─────────────────────────────────────────────────
  useEffect(() => {
    if (selectedUser?._id) localStorage.setItem("selectedUserId", selectedUser._id);
    else localStorage.removeItem("selectedUserId");
  }, [selectedUser]);

  // ── Socket subscriptions ──────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (msg) => {
      // Update last message for the conversation
      setLastMessages((prev) => ({ ...prev, [msg.senderId]: msg }));

      if (selectedUser?._id === msg.senderId) {
        msg.seen = true;
        setMessages((prev) => [...prev, msg]);
        messageApi.markSeen(msg._id).catch(() => {});
      } else {
        setUnseenMessages((prev) => ({
          ...prev,
          [msg.senderId]: (prev[msg.senderId] || 0) + 1,
        }));
      }
    };

    const onMessagesDeleted = ({ withUser }) => {
      if (selectedUser?._id === withUser) setMessages([]);
      setLastMessages((p) => { const n = { ...p }; delete n[withUser]; return n; });
      setUnseenMessages((p) => { const n = { ...p }; delete n[withUser]; return n; });
    };

    const onUserTyping = ({ fromUserId }) => {
      setTypingUsers((prev) => new Set([...prev, fromUserId]));
      clearTimeout(typingTimers.current[fromUserId]);
      typingTimers.current[fromUserId] = setTimeout(() => {
        setTypingUsers((prev) => { const n = new Set(prev); n.delete(fromUserId); return n; });
      }, 3000);
    };

    const onUserStopTyping = ({ fromUserId }) => {
      clearTimeout(typingTimers.current[fromUserId]);
      setTypingUsers((prev) => { const n = new Set(prev); n.delete(fromUserId); return n; });
    };

    socket.on("newMessage",      onNewMessage);
    socket.on("messagesDeleted", onMessagesDeleted);
    socket.on("userTyping",      onUserTyping);
    socket.on("userStopTyping",  onUserStopTyping);

    return () => {
      socket.off("newMessage",      onNewMessage);
      socket.off("messagesDeleted", onMessagesDeleted);
      socket.off("userTyping",      onUserTyping);
      socket.off("userStopTyping",  onUserStopTyping);
    };
  }, [socket, selectedUser]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const getUsers = useCallback(async () => {
    try {
      const { data } = await messageApi.getUsers();
      if (!data.success) return;
      setUsers(data.users);
      setUnseenMessages(data.unseenMessages || {});
      if (data.lastMessages) setLastMessages(data.lastMessages);

      // Restore full selected user object from fresh data
      const savedId = localStorage.getItem("selectedUserId");
      if (savedId) {
        const found = data.users.find((u) => u._id === savedId);
        if (found) setSelectedUser(found);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load users.");
    }
  }, []);

  const getMessages = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const { data } = await messageApi.getMessages(userId);
      if (!data.success) return;
      setMessages(data.messages);
      if (data.messages.length > 0) {
        const last = data.messages[data.messages.length - 1];
        setLastMessages((prev) => ({ ...prev, [userId]: last }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load messages.");
    }
  }, []);

  const sendMessage = useCallback(async (messageData) => {
    if (!selectedUser) return;
    try {
      const { data } = await messageApi.sendMessage(selectedUser._id, messageData);
      if (!data.success) { toast.error(data.message); return; }
      setMessages((prev) => [...prev, data.newMessage]);
      setLastMessages((prev) => ({ ...prev, [selectedUser._id]: data.newMessage }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message.");
    }
  }, [selectedUser]);

  const deleteMessages = useCallback(async () => {
    if (!selectedUser) return;
    if (!messages.length) { toast.error("No messages to delete."); return; }
    try {
      const { data } = await messageApi.deleteMessages(selectedUser._id);
      if (!data.success) { toast.error(data.message); return; }
      setMessages([]);
      setLastMessages((p) => { const n = { ...p }; delete n[selectedUser._id]; return n; });
      setUnseenMessages((p) => { const n = { ...p }; delete n[selectedUser._id]; return n; });
      toast.success("Conversation deleted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete messages.");
    }
  }, [selectedUser, messages]);

  return (
    <ChatContext.Provider value={{
      messages, users, selectedUser, unseenMessages,
      lastMessages, typingUsers,
      setSelectedUser, setUnseenMessages,
      getUsers, getMessages, sendMessage, deleteMessages,
    }}>
      {children}
    </ChatContext.Provider>
  );
}
