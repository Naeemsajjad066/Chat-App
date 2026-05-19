import React from "react";
import Avatar from "../ui/Avatar";
import { formatMessageTime } from "../../lib/utills";

/**
 * Single message row — memoized so it only re-renders when its own
 * `msg` object or `seen` status changes, not on every new message.
 */
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
        <Avatar src={receiverPic} size="w-7 h-7" className="mb-1 self-end" />
      )}

      <div className={`flex flex-col gap-0.5 max-w-[75%] sm:max-w-[65%] ${isSender ? "items-end" : "items-start"}`}>
        {msg.image ? (
          <img
            src={msg.image}
            alt="Shared"
            onClick={() => onImageClick(msg.image)}
            className="max-w-[240px] sm:max-w-[260px] w-full rounded-2xl cursor-pointer
              hover:opacity-90 active:opacity-80 transition border border-white/10 object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <p className={`
            px-3.5 py-2.5 text-sm text-white break-words rounded-2xl leading-relaxed
            ${isSender ? "bg-violet-600/80 rounded-br-sm" : "bg-white/10 rounded-bl-sm"}
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
            <span className={`text-[10px] leading-none select-none ${msg.seen ? "text-violet-400" : "text-gray-600"}`}>
              {msg.seen ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>

      {isSender && (
        <Avatar src={senderPic} size="w-7 h-7" className="mb-1 self-end" />
      )}
    </div>
  );
}, (prev, next) =>
  // Custom comparator — only re-render if seen status or content changed
  prev.msg._id === next.msg._id &&
  prev.msg.seen === next.msg.seen &&
  prev.isSender === next.isSender
);

export default MessageBubble;
