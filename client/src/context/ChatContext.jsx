import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { messageApi } from "../api/message.api.js";
import { AuthContext } from "./AuthContext.jsx";

// ChatContext and ChatProvider are exported from the same file.
// eslint-disable-next-line react-refresh/only-export-components
export const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { socket } = useContext(AuthContext);

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

  // ── Persist selected user + notify server which chat is open ─────────────
  // Use a ref so the socket-connect effect can read the latest selectedUser
  const selectedUserRef = useRef(selectedUser);
  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

  // Emit openChat whenever selectedUser changes
  useEffect(() => {
    if (!socket) return;
    if (selectedUser?._id) {
      localStorage.setItem("selectedUserId", selectedUser._id);
      socket.emit("openChat", { withUserId: selectedUser._id });
    } else {
      localStorage.removeItem("selectedUserId");
      socket.emit("closeChat");
    }
  }, [selectedUser, socket]);

  // Also emit openChat when socket first connects (page load race condition fix)
  useEffect(() => {
    if (!socket) return;
    const onConnect = () => {
      if (selectedUserRef.current?._id) {
        socket.emit("openChat", { withUserId: selectedUserRef.current._id });
      }
    };
    socket.on("connect", onConnect);
    // If already connected, fire immediately
    if (socket.connected && selectedUserRef.current?._id) {
      socket.emit("openChat", { withUserId: selectedUserRef.current._id });
    }
    return () => socket.off("connect", onConnect);
  }, [socket]);

  // ── Socket subscriptions ──────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (msg) => {
      setLastMessages((prev) => ({ ...prev, [msg.senderId]: msg }));

      if (selectedUser?._id === msg.senderId) {
        // Mark as seen locally without mutating the original socket object
        setMessages((prev) => [...prev, { ...msg, seen: true }]);
        messageApi.markSeen(msg._id).catch(() => {});
      } else {
        setUnseenMessages((prev) => ({
          ...prev,
          [msg.senderId]: (prev[msg.senderId] || 0) + 1,
        }));
      }
    };

    // Server pushes sidebar last-message updates without sending full newMessage to sender
    const onLastMessageUpdate = ({ userId, lastMessage }) => {
      setLastMessages((prev) => ({ ...prev, [userId]: lastMessage }));
    };

    const onMessagesDeleted = ({ withUser }) => {
      if (selectedUser?._id === withUser) setMessages([]);
      setLastMessages((p) => { const n = { ...p }; delete n[withUser]; return n; });
      setUnseenMessages((p) => { const n = { ...p }; delete n[withUser]; return n; });
    };

    // Receiver opened the chat — mark our sent messages as seen immediately
    const onMessagesSeen = ({ byUserId, messageIds }) => {
      console.log("[messagesSeen] byUserId=", byUserId, "messageIds=", messageIds);
      const idSet = new Set(messageIds.map(String));
      setMessages((prev) =>
        prev.map((m) =>
          idSet.has(String(m._id)) ? { ...m, seen: true } : m
        )
      );
      // Also update the last message seen status in the sidebar
      setLastMessages((prev) => {
        const entry = prev[byUserId];
        if (!entry) return prev;
        return { ...prev, [byUserId]: { ...entry, seen: true } };
      });
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

    socket.on("newMessage",        onNewMessage);
    socket.on("lastMessageUpdate", onLastMessageUpdate);
    socket.on("messagesDeleted",   onMessagesDeleted);
    socket.on("messagesSeen",      onMessagesSeen);
    socket.on("userTyping",        onUserTyping);
    socket.on("userStopTyping",    onUserStopTyping);

    return () => {
      socket.off("newMessage",        onNewMessage);
      socket.off("lastMessageUpdate", onLastMessageUpdate);
      socket.off("messagesDeleted",   onMessagesDeleted);
      socket.off("messagesSeen",      onMessagesSeen);
      socket.off("userTyping",        onUserTyping);
      socket.off("userStopTyping",    onUserStopTyping);
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
