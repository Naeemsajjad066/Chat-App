import React from "react";
import Avatar from "../ui/Avatar";

const TypingIndicator = React.memo(function TypingIndicator({ user }) {
  return (
    <div className="flex items-end gap-2">
      <Avatar src={user?.profilePic} alt={user?.fullName} size="w-7 h-7" />
      <div className="px-4 py-3 bg-white/10 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
        {[0, 150, 300].map((d) => (
          <span
            key={d}
            style={{ animationDelay: `${d}ms` }}
            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          />
        ))}
      </div>
    </div>
  );
});

export default TypingIndicator;
