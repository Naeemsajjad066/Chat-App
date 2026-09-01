import React, { useContext, useEffect, useState } from "react";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";
import Avatar from "./ui/Avatar";
import Lightbox from "./ui/Lightbox";

function RightSideBar() {
  const { selectedUser, messages, isLoadingMessages } = useContext(ChatContext);
  const { onlineUser } = useContext(AuthContext);

  const [msgImages, setMsgImages] = useState([]);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  useEffect(() => {
    setMsgImages(messages.filter((m) => m.image).map((m) => m.image));
  }, [messages]);

  if (!selectedUser) return null;

  const isOnline = onlineUser.includes(String(selectedUser._id));

  return (
    <div className="hidden xl:flex flex-col h-full bg-[#0c0b18] border-l border-white/[0.07]">

      {/* Profile — fixed, never scrolls */}
      <div className="flex-shrink-0 flex flex-col items-center pt-8 pb-5 px-5 gap-3">
        <Avatar
          src={selectedUser?.profilePic}
          alt={selectedUser.fullName}
          size="w-20 h-20"
          online={isOnline}
          dotSize="w-3.5 h-3.5"
          className="ring-2 ring-violet-500/30 rounded-full"
        />
        <div className="text-center">
          <h2 className="text-base font-semibold text-white">{selectedUser.fullName}</h2>
          <p className={`text-xs mt-0.5 ${isOnline ? "text-green-400" : "text-gray-500"}`}>
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
        {selectedUser.bio && (
          <p className="text-xs text-gray-400 text-center leading-relaxed px-2">{selectedUser.bio}</p>
        )}
      </div>

      <hr className="border-white/[0.07] mx-5 flex-shrink-0" />

      {/* Media — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Shared Media</p>
          <span className="text-xs text-gray-600">{isLoadingMessages ? "—" : msgImages.length}</span>
        </div>

        {isLoadingMessages ? (
          <div className="grid grid-cols-2 gap-2" aria-busy="true" aria-label="Loading media">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-white/[0.07] animate-pulse" aria-hidden="true" />
            ))}
          </div>
        ) : msgImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-700 gap-2">
            <svg className="w-7 h-7 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs">No media yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {msgImages.map((url, i) => (
              <button key={i} onClick={() => setLightboxSrc(url)} className="aspect-square rounded-lg overflow-hidden hover:opacity-80 active:opacity-70 transition">
                <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        )}
      </div>

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}

export default RightSideBar;
