import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utills";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import toast from "react-hot-toast";

function ChatContainer() {
  const { messages, setSlectedUser, selectedUser, sendMessage, getMessages } =
    useContext(ChatContext);
  const { authUser, onlineUser } = useContext(AuthContext);

  const scrollEnd = useRef();
  const [input, setInput] = useState("");

  // handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "") return null;
    await sendMessage({ text: input.trim() });
    setInput("");
  };

  // handle sending image
  const handleSendingImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  // fetch messages when user changes
  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser]);

  // auto scroll to bottom when messages change
  useEffect(() => {
    if (scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ================== UI ==================
  return selectedUser ? (
    <div className="h-full overflow-hidden relative backdrop-blur-lg">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
        <img
          src={selectedUser?.profilePic || assets.avatar_icon}
          alt=""
          className="w-8 h-8 rounded-full object-cover"
        />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser?.fullName}
          {onlineUser.includes(String(selectedUser._id)) ? (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            
          ) : (
            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
          )}
        </p>
        <img
          onClick={() => setSlectedUser(null)}
          src={assets.arrow_icon}
          alt=""
          className="md:hidden w-7 cursor-pointer"
        />
        <img
          src={assets.help_icon}
          alt=""
          className="max-md:hidden w-5 cursor-pointer"
        />
      </div>

      {/* Chat Messages */}
      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6">
        {/* Encryption Warning */}
        {(!selectedUser.publicKey || selectedUser.publicKey.trim() === "") && (
          <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <p className="text-yellow-200 text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>
                <strong>{selectedUser.fullName}</strong> doesn't have encryption keys set up. 
                They need to log in again or update their profile to receive encrypted messages.
              </span>
            </p>
          </div>
        )}
        
        {messages.map((msg, index) => {
          const isSender = msg.senderId === authUser._id;
          return (
            <div
              key={index}
              className={`flex items-end gap-2 mb-4 ${
                isSender ? "justify-end" : "justify-start"
              }`}
            >
              {/* Avatar */}
              <img
                src={
                  isSender
                    ? authUser?.profilePic || assets.avatar_icon
                    : selectedUser?.profilePic || assets.avatar_icon
                }
                alt=""
                className="w-8 h-8 rounded-full object-cover"
              />

              {/* Message Bubble */}
              {msg.image ? (
                <img
                  src={msg.image}
                  alt=""
                  className="max-w-[230px] border border-gray-700 rounded-lg overflow-hidden"
                />
              ) : (
                <p
                  className={`p-2 max-w-[200px] md:text-sm font-light text-white break-words rounded-lg
                  ${isSender ? "bg-violet-500/30 rounded-br-none" : "bg-gray-700/30 rounded-bl-none"}`}
                >
                  {msg.text}
                </p>
              )}

              {/* Timestamp */}
              <span className="text-xs text-gray-500 self-end">
                {formatMessageTime(msg.createdAt)}
              </span>
            </div>
          );
        })}
        <div ref={scrollEnd}></div>
      </div>

      {/* Bottom Input */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3">
        <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            onKeyDown={(e) =>
              e.key === "Enter" ? handleSendMessage(e) : null
            }
            type="text"
            placeholder={
              (!selectedUser.publicKey || selectedUser.publicKey.trim() === "") 
                ? "Cannot send encrypted messages - user needs to setup keys"
                : "Send message"
            }
            disabled={!selectedUser.publicKey || selectedUser.publicKey.trim() === ""}
            className={`flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400 bg-transparent ${
              (!selectedUser.publicKey || selectedUser.publicKey.trim() === "") 
                ? "cursor-not-allowed opacity-50" 
                : ""
            }`}
          />
          <input
            onChange={handleSendingImage}
            type="file"
            id="image"
            accept="image/png, image/jpeg"
            hidden
            disabled={!selectedUser.publicKey || selectedUser.publicKey.trim() === ""}
          />
          <label htmlFor="image">
            <img
              src={assets.gallery_icon}
              alt=""
              className={`w-5 mr-2 ${
                (!selectedUser.publicKey || selectedUser.publicKey.trim() === "") 
                  ? "cursor-not-allowed opacity-50" 
                  : "cursor-pointer"
              }`}
            />
          </label>
        </div>
        <img
          onClick={(!selectedUser.publicKey || selectedUser.publicKey.trim() === "") ? null : handleSendMessage}
          src={assets.send_button}
          alt=""
          className={`w-6 ${
            (!selectedUser.publicKey || selectedUser.publicKey.trim() === "") 
              ? "cursor-not-allowed opacity-50" 
              : "cursor-pointer"
          }`}
        />
      </div>
    </div>
  ) : (
    // Empty Chat State
    <div className="flex flex-col gap-5 items-center justify-center h-full">
      <img src={assets.logo_icon} alt="" className="w-20" />
      <p className="text-lg font-medium text-white">
        Chat anytime, anywhere
      </p>
    </div>
  );
}

export default ChatContainer;
