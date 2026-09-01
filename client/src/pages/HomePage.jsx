import React, { useContext } from "react";
import SideBar from "../components/SideBar";
import ChatContainer from "../components/ChatContainer";
import RightSideBar from "../components/RightSideBar";
import { ChatContext } from "../context/ChatContext";

function HomePage() {
  const { selectedUser } = useContext(ChatContext);

  return (
    /*
     * Outer: exact viewport height, flex column so padding is respected.
     * Inner card: flex-1 min-h-0 so it fills the remaining space after padding.
     * overflow-hidden clips the rounded corners and prevents any bleed.
     * grid-rows-[1fr] forces the single row to fill the card height.
     * Each column child gets h-full so it fills its grid cell.
     */
    <div className="h-dvh w-full flex flex-col sm:p-4 lg:p-6">
      <div
        className={`
          flex-1 min-h-0 w-full overflow-hidden
          sm:rounded-2xl sm:border sm:border-white/[0.08] sm:shadow-2xl
          backdrop-blur-xl
          grid grid-rows-[1fr]
          ${selectedUser
            ? "grid-cols-1 md:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_240px]"
            : "grid-cols-1 md:grid-cols-[280px_1fr]"
          }
        `}
      >
        <SideBar />
        <ChatContainer />
        {selectedUser && <RightSideBar />}
      </div>
    </div>
  );
}

export default HomePage;
