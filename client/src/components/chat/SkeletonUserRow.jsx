import React from "react";

/**
 * Shimmer placeholder for a user row while the users list is loading.
 */
const SkeletonUserRow = React.memo(function SkeletonUserRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" aria-hidden="true">
      {/* Avatar */}
      <div className="w-11 h-11 rounded-full bg-white/[0.07] animate-pulse flex-shrink-0" />

      {/* Text lines */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3 w-28 rounded-full bg-white/[0.07] animate-pulse" />
        <div className="h-2.5 w-20 rounded-full bg-white/[0.05] animate-pulse" />
      </div>

      {/* Time placeholder */}
      <div className="h-2 w-8 rounded-full bg-white/[0.05] animate-pulse flex-shrink-0" />
    </div>
  );
});

export default SkeletonUserRow;
