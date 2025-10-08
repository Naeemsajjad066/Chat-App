import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import { encryptMessage, decryptMessage } from "../lib/cryptoUtils";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
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
        const privateKey = localStorage.getItem("privateKey");
        
        if (!privateKey) {
          console.warn("Private key missing - cannot decrypt messages");
          toast.error("Encryption keys missing. Please refresh the page or contact support.");
          setMessages(data.messages.map(msg => ({
            ...msg,
            text: msg.text ? "[Encrypted - Keys Missing]" : msg.text
          })));
          return;
        }

        const decryptedMessages = await Promise.all(
          data.messages.map(async (msg) => {
            if (msg.text) {
              try {
                // Decrypt message with appropriate key based on sender
                const isCurrentUser = msg.senderId === authUser?._id;
                msg.text = await decryptMessage(msg.text, privateKey, isCurrentUser);
              } catch (err) {
                console.error("Decryption failed for message:", err);
                msg.text = "[Decryption Failed]";
              }
            }
            return msg;
          })
        );
        setMessages(decryptedMessages);
      }
    } catch (error) {
      console.error("Get messages error:", error);
      toast.error("Failed to load messages");
    }
  };

  // ------------------- SEND MESSAGE -------------------
  const sendMessage = async (messageData) => {
    if (!selectedUser) return;
    
    const privateKey = localStorage.getItem("privateKey");
    if (!privateKey) {
      toast.error("Encryption keys missing. Please refresh the page.");
      return;
    }
    
    if (!selectedUser.publicKey) {
      toast.error("Recipient has no public key for encryption.");
      return;
    }

    try {
      // Encrypt message for both sender and recipient
      const encryptedText = await encryptMessage(
        messageData.text,
        selectedUser.publicKey
      );

      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        { ...messageData, text: encryptedText }
      );

      if (data.success) {
        // For real-time update, show the original text (it will be properly encrypted in DB)
        setMessages((prev) => [
          ...prev,
          { ...data.newMessage, text: messageData.text }
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

      const privateKey = localStorage.getItem("privateKey");
      if (newMessage.text && privateKey) {
        try {
          const isCurrentUser = newMessage.senderId === authUser._id;
          newMessage.text = await decryptMessage(newMessage.text, privateKey, isCurrentUser);
        } catch (err) {
          console.error("Decryption failed", err);
          newMessage.text = "[Decryption Failed]";
        }
      }

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
