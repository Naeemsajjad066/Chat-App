import React from "react";
import Avatar from "../ui/Avatar";
import { formatLastMessageTime } from "../../lib/utills";

/**
 * Single user row in the sidebar — memoized.
 */
const UserRow = React.memo(function UserRow({
  user,
  isActive,
  isOnline,
  isTyping,
  preview,
  lastTime,
  badge,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
        transition-all duration-150 text-left active:scale-[0.98]
        ${isActive
          ? "bg-violet-600/15 border border-violet-500/25 shadow-sm"
          : "hover:bg-white/[0.05] border border-transparent"
        }
      `}
    >
      {/* Avatar */}
      <Avatar src={user.profilePic} alt={user.fullName} size="w-11 h-11" online={isOnline} />

      {/* Name + preview */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate leading-snug
          ${isActive ? "text-white" : "text-gray-100"}`}>
          {user.fullName}
        </p>

        <div className="mt-0.5 h-[18px] flex items-center">
          {isTyping ? (
            <span className="text-violet-400 text-xs flex items-center gap-1">
              <span className="flex gap-0.5 items-end h-3">
                {[0, 150, 300].map((d) => (
                  <span key={d} style={{ animationDelay: `${d}ms` }}
                    className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" />
                ))}
              </span>
              typing…
            </span>
          ) : preview ? (
            <p className="text-xs text-gray-500 truncate">{preview}</p>
          ) : (
            <span className={`text-xs font-medium flex items-center gap-1
              ${isOnline ? "text-green-400" : "text-gray-600"}`}>
              <span className={`w-1.5 h-1.5 rounded-full inline-block
                ${isOnline ? "bg-green-400" : "bg-gray-600"}`} />
              {isOnline ? "Online" : "Offline"}
            </span>
          )}
        </div>
      </div>

      {/* Time + badge */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {lastTime && (
          <span className="text-[10px] text-gray-600 whitespace-nowrap">
            {formatLastMessageTime(lastTime)}
          </span>
        )}
        {badge > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center
            rounded-full bg-violet-500 text-white text-[10px] font-bold leading-none">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
    </button>
  );
}, (prev, next) =>
  prev.isActive  === next.isActive  &&
  prev.isOnline  === next.isOnline  &&
  prev.isTyping  === next.isTyping  &&
  prev.preview   === next.preview   &&
  prev.lastTime  === next.lastTime  &&
  prev.badge     === next.badge
);

export default UserRow;
