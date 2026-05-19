import React, { useContext } from "react";
import SideBar from "../components/SideBar";
import ChatContainer from "../components/ChatContainer";
import RightSideBar from "../components/RightSideBar";
import { ChatContext } from "../context/ChatContext";

function HomePage() {
  const { selectedUser } = useContext(ChatContext);

  return (
    /*
     * Mobile  : full-screen, no padding, no border-radius — feels native
     * Tablet+ : floating card with padding and rounded corners
     */
    <div className="h-dvh w-full sm:px-[6%] sm:py-[3%] lg:px-[10%] lg:py-[4%]">
      <div
        className={`
          h-full w-full
          sm:rounded-2xl sm:border sm:border-gray-600/50 sm:overflow-hidden
          backdrop-blur-xl
          grid
          ${selectedUser
            ? "grid-cols-1 md:grid-cols-[260px_1fr] xl:grid-cols-[280px_1fr_240px]"
            : "grid-cols-1 md:grid-cols-[260px_1fr]"
          }
        `}
      >
        <SideBar />
        <ChatContainer />
        {/* Right sidebar only on xl when a user is selected */}
        {selectedUser && <RightSideBar />}
      </div>
    </div>
  );
}

export default HomePage;
