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
        if (!privateKey) throw new Error("Private key missing in localStorage");

        const decryptedMessages = await Promise.all(
          data.messages.map(async (msg) => {
            if (msg.text) {
              try {
                // 🔑 Each message stores ciphertext for both participants
                msg.text = await decryptMessage(
                  msg.text,
                  privateKey,
                  authUser._id
                );
              } catch (err) {
                console.error("Decryption failed", err);
              }
            }
            return msg;
          })
        );
        setMessages(decryptedMessages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ------------------- SEND MESSAGE -------------------
  const sendMessage = async (messageData) => {
    if (!selectedUser) return;
    if (!selectedUser.publicKey) {
      toast.error("Recipient has no public key.");
      return;
    }

    try {
      // 🔑 Encrypt separately for both users
      const participants = [
        { userId: selectedUser._id, publicKeyBase64: selectedUser.publicKey },
        { userId: authUser._id, publicKeyBase64: authUser.publicKey },
      ];

      const encryptedText = await encryptMessage(
        messageData.text,
        participants
      );

      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        { ...messageData, text: encryptedText }
      );

      if (data.success) {
        // Show plaintext locally for sender
        setMessages((prev) => [
          ...prev,
          { ...data.newMessage, text: messageData.text },
        ]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
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
          newMessage.text = await decryptMessage(
            newMessage.text,
            privateKey,
            authUser._id
          );
        } catch (err) {
          console.error("Decryption failed", err);
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
