import cloudinary from "../config/cloudinary.js";
import Message from "../models/message.js";
import User from "../models/User.js";
import { io, userSocketMap } from "../server.js";

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

    // Mark messages as seen
    await Message.updateMany(
      { senderId: selectedUserId, receiverId: myId },
      { seen: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};





// ✅ Mark individual message as seen
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { seen: true });
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
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", newMessage);
      io.to(senderSocketId).emit("lastMessageUpdate", {
        userId: receiverId,
        lastMessage: lastMsgPayload,
      });
    }

    // ✅ Send response only ONCE
    res.status(200).json({ success: true, newMessage });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
