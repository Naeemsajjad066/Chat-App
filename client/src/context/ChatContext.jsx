import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

  const { socket, axios } = useContext(AuthContext);



  // ------------------- DELETE MESSAGES -------------------
  const deleteMessages = async () => {
    if (!selectedUser) return;

    const confirmDelete=window.confirm("Are u sure!");

    if(!confirmDelete) return;

    try {
        if(!messages || messages.length===0){
            toast.error("No Messages Found")
            return;
        }
      const { data } = await axios.delete(`/api/messages/delete/${selectedUser._id}`);
      if (data.success) {
        setMessages([]);
        // Notify other user via socket
        socket.emit("messagesDeleted", { withUser: selectedUser._id });
        toast.success("Messages Deleted Successfully");
      } else {
        toast.error(data.message);
      }
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
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ------------------- GET MESSAGES -------------------
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ------------------- SEND MESSAGE -------------------
  const sendMessage = async (messageData) => {
    try {
      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );
      if (data.success) {
        setMessages((prevMessages) => [...prevMessages, data.newMessage]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ------------------- SOCKET SUBSCRIPTION -------------------
  const subscribeToMessages = async () => {
    if (!socket) return;

    // Listen for new messages
    socket.on("newMessage", (newMessage) => {
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        newMessage.seen = true;
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        setUnseenMessages((prevUnseenMessages) => ({
          ...prevUnseenMessages,
          [newMessage.senderId]: prevUnseenMessages[newMessage.senderId]
            ? prevUnseenMessages[newMessage.senderId] + 1
            : 1,
        }));
      }
    });

    // Listen for deleted messages
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

  // ------------------- UNSUBSCRIBE -------------------
  const unsubscribeFromMessages = () => {
    if (socket) {
      socket.off("newMessage");
      socket.off("messagesDeleted");
    }
  };

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [socket, selectedUser]);

  // ------------------- CONTEXT VALUE -------------------
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
