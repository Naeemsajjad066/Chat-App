import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(() => {
    // Initialize from localStorage if available
    const savedUserId = localStorage.getItem("selectedUserId");
    return savedUserId ? { _id: savedUserId } : null;
  });
  const [unseenMessages, setUnseenMessages] = useState({});
  const { socket, axios, authUser } = useContext(AuthContext);

  // ------------------- DELETE MESSAGES -------------------
  const deleteMessages = async () => {
    if (!selectedUser) return;
    const confirmDelete = window.confirm("Are you sure?");
    if (!confirmDelete) return;

    try {
      if (!messages || messages.length === 0) {
        toast.error("No Messages Found");
        return;
      }

      const { data } = await axios.delete(
        `/api/messages/delete/${selectedUser._id}`
      );

      if (data.success) {
        setMessages([]);
        socket?.emit("messagesDeleted", { withUser: selectedUser._id });
        setUnseenMessages((prev) => {
          const newUnseen = { ...prev };
          delete newUnseen[selectedUser._id];
          return newUnseen;
        });
        toast.success("Messages Deleted Successfully");
      } else toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ------------------- GET USERS -------------------
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/user");
      if (data.success) {

        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
        
        // Restore selected user from localStorage if exists
        const savedUserId = localStorage.getItem("selectedUserId");
        if (savedUserId && data.users.length > 0) {
          const savedUser = data.users.find(user => user._id === savedUserId);
          if (savedUser) {
            setSelectedUser(savedUser);
          }
        }
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ------------------- GET MESSAGES -------------------
  const getMessages = async (userId) => {
    if (!userId) return;
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Get messages error:", error);
      toast.error("Failed to load messages");
    }
  };

  // ------------------- SEND MESSAGE -------------------
  const sendMessage = async (messageData) => {
    if (!selectedUser) return;

    try {
      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          data.newMessage
        ]);
      } else toast.error(data.message);
    } catch (error) {
      console.error("Send message error:", error);
      toast.error("Failed to send message");
    }
  };

  // ------------------- SOCKET -------------------
  const subscribeToMessages = () => {
    if (!socket) return;

    socket.on("newMessage", async (newMessage) => {
      if (!authUser) return;

      if (selectedUser && newMessage.senderId === selectedUser._id) {
        newMessage.seen = true;
        setMessages((prev) => [...prev, newMessage]);
        axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
        }));
      }
    });

    socket.on("messagesDeleted", ({ withUser }) => {
      if (selectedUser && withUser === selectedUser._id) {
        setMessages([]);
        setUnseenMessages((prev) => {
          const newUnseen = { ...prev };
          delete newUnseen[withUser];
          return newUnseen;
        });
      }
    });
  };

  const unsubscribeFromMessages = () => {
    socket?.off("newMessage");
    socket?.off("messagesDeleted");
  };

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [socket, selectedUser, authUser]);

  // Save selected user to localStorage whenever it changes
  useEffect(() => {
    if (selectedUser) {
      localStorage.setItem("selectedUserId", selectedUser._id);
    } else {
      localStorage.removeItem("selectedUserId");
    }
  }, [selectedUser]);

  const value = {
    messages,
    users,
    selectedUser,
    getMessages,
    getUsers,
    setMessages,
    sendMessage,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
    deleteMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
