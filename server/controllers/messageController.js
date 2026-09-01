import cloudinary from "../config/cloudinary.js";
import Message from "../models/message.js";
import User from "../models/User.js";
import { io, userSocketMap, receiverCurrentChat } from "../server.js";

// ✅ Get all users except logged in user
export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: userId } }).select(
      "-password"
    );

    const unseenMessages = {};
    const lastMessages = {};

    const promises = filteredUsers.map(async (user) => {
      // Count unseen messages from this user
      const unseenCount = await Message.countDocuments({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      });
      if (unseenCount > 0) {
        unseenMessages[user._id] = unseenCount;
      }

      // Get the last message in the conversation
      const lastMsg = await Message.findOne({
        $or: [
          { senderId: userId, receiverId: user._id },
          { senderId: user._id, receiverId: userId },
        ],
      }).sort({ createdAt: -1 });

      if (lastMsg) {
        lastMessages[user._id] = {
          text: lastMsg.text || null,
          image: lastMsg.image ? true : false,
          createdAt: lastMsg.createdAt,
          senderId: lastMsg.senderId,
        };
      }
    });

    await Promise.all(promises);

    res.json({ success: true, users: filteredUsers, unseenMessages, lastMessages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};



// ✅ Get all messages between logged-in user & selected user
export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    });

    // Mark all incoming messages as seen
    const unseenIds = messages
      .filter((m) => String(m.senderId) === String(selectedUserId) && !m.seen)
      .map((m) => m._id);

    if (unseenIds.length > 0) {
      await Message.updateMany({ _id: { $in: unseenIds } }, { seen: true });

      // Tell the sender their messages have been seen
      const senderSocketId = userSocketMap[String(selectedUserId)];
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesSeen", {
          byUserId: String(myId),
          messageIds: unseenIds.map(String),
        });
      }
    }

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};





// ✅ Mark individual message as seen (called when receiver is already in the chat)
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await Message.findByIdAndUpdate(id, { seen: true }, { new: true });
    if (!msg) return res.json({ success: false, message: "Message not found." });

    // Tell the sender immediately
    const senderSocketId = userSocketMap[String(msg.senderId)];
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", {
        byUserId: String(msg.receiverId),
        messageIds: [String(msg._id)],
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};




//delete messages of selectedUser
export const deleteMessages = async (req, res) => {
  try {
    const myId = req.user._id;
    const selectedUserId = req.params.id;

    await Message.deleteMany({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    });

    const senderSocketId = userSocketMap[myId];
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesDeleted", {
        withUser: selectedUserId,
      });
    }

    // Notify the other user
    const receiverSocketId = userSocketMap[selectedUserId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messagesDeleted", { withUser: myId });
    }

    res.json({ success: true, message: "Deleted Messages successfully" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};






// ✅ Send message (with optional image upload)
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    let imageUrl = null;

    if (image) {
      // If frontend is sending base64 string, this works fine
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "chat_app",
      });
      imageUrl = uploadResponse.secure_url;
    }

    // Save message to DB
    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      seen: false,
    });

    // Emit message to both sender & receiver in real-time
    const receiverSocketId = userSocketMap[receiverId];
    const senderSocketId = userSocketMap[senderId];

    const lastMsgPayload = {
      text: newMessage.text || null,
      image: newMessage.image ? true : false,
      createdAt: newMessage.createdAt,
      senderId: newMessage.senderId,
    };

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
      io.to(receiverSocketId).emit("lastMessageUpdate", {
        userId: senderId,
        lastMessage: lastMsgPayload,
      });
    }
    // Do NOT echo newMessage back to the sender — they already have it
    // from the HTTP response. Just update their sidebar last-message.
    if (senderSocketId) {
      io.to(senderSocketId).emit("lastMessageUpdate", {
        userId: receiverId,
        lastMessage: lastMsgPayload,
      });
    }

    // If receiver is online and already viewing this conversation,
    // mark as seen immediately and notify sender
    if (receiverSocketId) {
      const receiverOpenChat = receiverCurrentChat[String(receiverId)];
      console.log(`[sendMessage] receiverId=${receiverId} receiverOpenChat=${receiverOpenChat} senderId=${senderId}`);
      if (receiverOpenChat && String(receiverOpenChat) === String(senderId)) {
        await Message.findByIdAndUpdate(newMessage._id, { seen: true });
        if (senderSocketId) {
          io.to(senderSocketId).emit("messagesSeen", {
            byUserId: String(receiverId),
            messageIds: [String(newMessage._id)],
          });
        }
        console.log(`[sendMessage] auto-marked seen, notified sender=${senderId}`);
      }
    }
    // ✅ Send response only ONCE
    res.status(200).json({ success: true, newMessage });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
