import React from "react";
import { getDateSeparatorLabel } from "../../lib/utills";

const DateSeparator = React.memo(function DateSeparator({ date }) {
  return (
    <div className="flex items-center gap-3 my-4" role="separator">
      <div className="flex-1 h-px bg-white/8" />
      <span className="text-[11px] text-gray-500 px-3 py-1 rounded-full bg-white/5 whitespace-nowrap select-none">
        {getDateSeparatorLabel(date)}
      </span>
      <div className="flex-1 h-px bg-white/8" />
    </div>
  );
});

export default DateSeparator;
