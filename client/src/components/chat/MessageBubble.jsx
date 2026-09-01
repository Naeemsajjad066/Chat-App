import React, { useState } from "react";
import Avatar from "../ui/Avatar";
import { formatMessageTime } from "../../lib/utills";

// ── Image bubble with fixed container + skeleton loader ───────────────────────
function ImageBubble({ src, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState(false);

  return (
    /*
     * Fixed container: always 220×220px regardless of the image's
     * intrinsic size. The image fills it with object-cover so nothing
     * overflows or stretches the chat layout.
     */
    <div
      onClick={!error ? onClick : undefined}
      className={`
        relative w-[220px] h-[220px] rounded-2xl overflow-hidden
        border border-white/10 flex-shrink-0
        ${!error ? "cursor-pointer" : ""}
      `}
    >
      {/* Skeleton — visible until image loads */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-white/[0.06] animate-pulse flex items-center justify-center">
          <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2
                 l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01
                 M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2
                 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-white/[0.04] flex flex-col items-center justify-center gap-2">
          <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0
                 001.71 3h16.94a2 2 0 001.71-3L13.71
                 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span className="text-[11px] text-gray-600">Failed to load</span>
        </div>
      )}

      {/* Actual image — opacity-0 while loading so skeleton shows */}
      <img
        src={src}
        alt="Shared image"
        onLoad={() => setLoaded(true)}
        onError={() => { setLoaded(true); setError(true); }}
        className={`w-full h-full object-cover transition-opacity duration-300
          hover:opacity-90 active:opacity-75
          ${loaded ? "opacity-100" : "opacity-0"}`}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

// ── Message row ───────────────────────────────────────────────────────────────
const MessageBubble = React.memo(function MessageBubble({
  msg,
  isSender,
  senderPic,
  receiverPic,
  onImageClick,
}) {
  return (
    <div className={`flex items-end gap-2 ${isSender ? "justify-end" : "justify-start"}`}>
      {!isSender && (
        <Avatar src={receiverPic} size="w-7 h-7" className="mb-1 self-end flex-shrink-0" />
      )}

      <div className={`flex flex-col gap-0.5 max-w-[75%] sm:max-w-[65%]
        ${isSender ? "items-end" : "items-start"}`}>

        {msg.image ? (
          <ImageBubble src={msg.image} onClick={() => onImageClick(msg.image)} />
        ) : (
          <p className={`
            px-3.5 py-2.5 text-sm text-white break-words rounded-2xl leading-relaxed
            ${isSender
              ? "bg-violet-600/80 rounded-br-sm"
              : "bg-white/10 rounded-bl-sm"}
          `}>
            {msg.text}
          </p>
        )}

        {/* Timestamp + read receipt */}
        <div className={`flex items-center gap-1 px-1 ${isSender ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] text-gray-600 select-none">
            {formatMessageTime(msg.createdAt)}
          </span>
          {isSender && (
            <span className={`text-[10px] leading-none select-none
              ${msg.seen ? "text-violet-400" : "text-gray-600"}`}>
              {msg.seen ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>

      {isSender && (
        <Avatar src={senderPic} size="w-7 h-7" className="mb-1 self-end flex-shrink-0" />
      )}
    </div>
  );
}, (prev, next) =>
  prev.msg._id    === next.msg._id   &&
  prev.msg.seen   === next.msg.seen  &&
  prev.isSender   === next.isSender
);

export default MessageBubble;
