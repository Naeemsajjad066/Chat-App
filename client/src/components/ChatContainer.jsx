import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { isSameDay } from "../lib/utills";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import { useTyping } from "../hooks/useTyping";
import { useScrollToBottom } from "../hooks/useScrollToBottom";
import MessageBubble from "./chat/MessageBubble";
import DateSeparator from "./chat/DateSeparator";
import TypingIndicator from "./chat/TypingIndicator";
import Lightbox from "./ui/Lightbox";
import Modal from "./ui/Modal";
import toast from "react-hot-toast";

// ── Delete confirmation content ───────────────────────────────────────────────
function DeleteConfirmContent({ onConfirm, onCancel }) {
  return (
    <>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-white font-semibold">Delete conversation</h3>
      </div>
      <p className="text-gray-400 text-sm mb-5">
        Permanently deletes all messages for both people. This cannot be undone.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 active:bg-white/10 transition text-sm font-medium">Cancel</button>
        <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white transition text-sm font-medium">Delete</button>
      </div>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function ChatContainer() {
  const {
    messages, setSelectedUser, selectedUser,
    sendMessage, getMessages, typingUsers, deleteMessages,
  } = useContext(ChatContext);
  const { authUser, onlineUser, socket } = useContext(AuthContext);

  const inputRef = useRef(null);
  const [input, setInput]                     = useState("");
  const [lightboxSrc, setLightboxSrc]         = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sendingImage, setSendingImage]       = useState(false);

  const isTyping = selectedUser && typingUsers.has(selectedUser._id);
  const isOnline = selectedUser && onlineUser.includes(String(selectedUser._id));

  const { onType, stopTyping } = useTyping(socket, selectedUser?._id);
  const scrollRef = useScrollToBottom([messages, isTyping]);

  // ── Load messages when user changes ──────────────────────────────────────
  useEffect(() => {
    if (selectedUser?._id) getMessages(selectedUser._id);
  }, [selectedUser?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send text ─────────────────────────────────────────────────────────────
  const handleSend = useCallback(async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    stopTyping();
    const text = input.trim();
    setInput("");
    await sendMessage({ text });
    inputRef.current?.focus();
  }, [input, sendMessage, stopTyping]);

  // ── Send image ────────────────────────────────────────────────────────────
  const handleImage = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) { toast.error("Select a valid image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
    setSendingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = "";
      setSendingImage(false);
    };
    reader.onerror = () => { toast.error("Failed to read image"); setSendingImage(false); };
    reader.readAsDataURL(file);
  }, [sendMessage]);

  const handleImageClick = useCallback((src) => setLightboxSrc(src), []);

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!selectedUser) {
    return (
      <div className="hidden md:flex flex-col gap-5 items-center justify-center h-full text-center px-8 bg-[#0a0917]">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/15
          flex items-center justify-center shadow-lg shadow-violet-900/20">
          <img src={assets.logo_icon} alt="" className="w-10 h-10 opacity-60" />
        </div>
        {/* Text */}
        <div className="space-y-1.5">
          <p className="text-lg font-bold text-white tracking-tight">Your messages</p>
          <p className="text-sm text-gray-500 max-w-[200px] leading-relaxed">
            Pick a conversation from the left to start chatting
          </p>
        </div>
        {/* Subtle hint pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full
          bg-white/[0.04] border border-white/[0.07] text-xs text-gray-500">
          <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Messages are end-to-end delivered
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0a0917]">

      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] bg-[#0c0b18]">
        <button
          onClick={() => setSelectedUser(null)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/15 transition flex-shrink-0"
          aria-label="Back"
        >
          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="relative flex-shrink-0">
          <img src={selectedUser?.profilePic || assets.avatar_icon} alt="" className="w-9 h-9 rounded-full object-cover" />
          {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0f0e1a]" />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-tight truncate">{selectedUser?.fullName}</p>
          <p className="text-xs leading-tight mt-0.5">
            {isTyping ? <span className="text-violet-400">typing…</span>
              : isOnline ? <span className="text-green-400">Online</span>
              : <span className="text-gray-500">Offline</span>}
          </p>
        </div>

        <button
          onClick={() => setShowDeleteModal(true)}
          title="Delete conversation"
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:text-red-400 hover:bg-red-500/10 active:bg-red-500/15 transition flex-shrink-0"
          aria-label="Delete conversation"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-1" role="log" aria-live="polite" aria-label="Messages">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600 py-10">
            <div className="w-14 h-14 rounded-full bg-violet-500/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-violet-400/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-600">Say hi to {selectedUser.fullName}!</p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isSender = msg.senderId === authUser._id;
          const prevMsg  = messages[index - 1];
          const showDate = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);

          return (
            <React.Fragment key={msg._id || index}>
              {showDate && <DateSeparator date={msg.createdAt} />}
              <MessageBubble
                msg={msg}
                isSender={isSender}
                senderPic={authUser?.profilePic}
                receiverPic={selectedUser?.profilePic}
                onImageClick={handleImageClick}
              />
            </React.Fragment>
          );
        })}

        {isTyping && <TypingIndicator user={selectedUser} />}
        <div ref={scrollRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="flex-shrink-0 px-3 pt-2 pb-3 border-t border-white/[0.07] bg-[#0c0b18]">

        {/* Image uploading indicator */}
        {sendingImage && (
          <div className="flex items-center gap-2 px-4 py-1.5 mb-2 rounded-xl
            bg-violet-500/10 border border-violet-500/20">
            <svg className="w-3.5 h-3.5 text-violet-400 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs text-violet-300">Uploading image…</span>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white/[0.05] border border-white/[0.08]
            rounded-full px-4 focus-within:border-violet-500/50 transition min-w-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); onType(); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSend(e); }}
              type="text"
              placeholder="Message…"
              aria-label="Message input"
              disabled={sendingImage}
              className="flex-1 py-3 bg-transparent outline-none text-white text-base
                placeholder-gray-600 min-w-0 disabled:opacity-50"
            />
            <input onChange={handleImage} type="file" id="chat-image"
              accept="image/png,image/jpeg,image/webp" hidden disabled={sendingImage} />
            <label
              htmlFor={sendingImage ? undefined : "chat-image"}
              className={`flex-shrink-0 p-1 transition
                ${sendingImage
                  ? "text-gray-700 cursor-not-allowed"
                  : "cursor-pointer text-gray-500 hover:text-gray-300 active:text-gray-200"}`}
              aria-label="Attach image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2
                     l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01
                     M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2
                     2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </label>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || sendingImage}
            aria-label="Send message"
            className="w-11 h-11 flex-shrink-0 flex items-center justify-center
              bg-violet-600 hover:bg-violet-500 active:bg-violet-700
              disabled:opacity-30 disabled:cursor-not-allowed
              rounded-full transition-all duration-150 active:scale-95"
          >
            <svg className="w-4 h-4 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <DeleteConfirmContent
          onConfirm={() => { setShowDeleteModal(false); deleteMessages(); }}
          onCancel={() => setShowDeleteModal(false)}
        />
      </Modal>
    </div>
  );
}

export default ChatContainer;
