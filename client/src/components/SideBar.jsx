import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import toast from "react-hot-toast";

function SideBar() {

  const{getUsers,users,selectedUser,setSelectedUser,unseenMessages,setUnseenMessages}=useContext(ChatContext)
  const [input,setInput]=useState("")
  const {logout,onlineUser,authUser,updateProfile}=useContext(AuthContext)
  const navigate = useNavigate();

  // Filter users by search input
  const searchFilteredUsers = input 
    ? users.filter((user) => user.fullName.toLowerCase().includes(input.toLowerCase())) 
    : users;

  // Sort users: online users first, then offline users
  const sortedUsers = searchFilteredUsers.sort((a, b) => {
    // Ensure we're comparing strings
    const aIsOnline = onlineUser.includes(String(a._id));
    const bIsOnline = onlineUser.includes(String(b._id));
    
    
    // If both have same online status, maintain alphabetical order by name
    if (aIsOnline === bIsOnline) {
      return a.fullName.localeCompare(b.fullName);
    }
    
    // Online users come first (return -1 to put 'a' before 'b')
    return bIsOnline - aIsOnline;
  });

  useEffect(()=>{
    getUsers()
  },[onlineUser])

  // Initial load of users
  useEffect(()=>{
    getUsers()
  },[])


  return (
    <div
      className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll 
        text-white ${selectedUser ? "max-md:hidden" : ""}`}
    >
      <div className="pb-5">
        <div className="flex justify-between items-center">
          <img src={assets.logo} alt="logo" className="max-w-40" />
          <div className="relative py-2 group">
            <img
              src={assets.menu_icon}
              alt="Menu"
              className="max-h-5 cursor-pointer"
            />
            <div
              className="absolute top-full right-0 z-20 w-32 p-5 rounded-md
                         bg-[#282142] border border-gray-600 text-gray-100
                        hidden group-hover:block"
            >
              <p
                onClick={() => navigate("/profile")}
                className="cursor-pointer text-sm hover:text-violet-400"
              >
                Edit Profile
              </p>
              <hr className="my-2 border-t border-gray-500" />
              <p onClick={()=>logout()} className="cursor-pointer text-sm hover:text-red-400">Logout</p>
            </div>
          </div>
        </div>

        <div className=" bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5">
          <img src={assets.search_icon} alt="Search" className="w-3" />
          <input
          onChange={(e)=>setInput(e.target.value)}
            type="text"
            className="bg-transparent border-none outline-none
             text-white text-xs placeholder-[#c8c8c8] flex-1"
            placeholder="Search User"
          />
        </div>
      </div>
      <div className="flex flex-col">
        {sortedUsers.map((user, index) => (
          <div
          onClick={() => {
            setSelectedUser(user);
            setUnseenMessages(prev => ({ ...prev, [user._id]: 0 }));
          }}
            key={user._id}
            className={`relative flex items-center gap-3 p-3 rounded-lg cursor-pointer 
      max-sm:text-sm transition-all duration-200 hover:bg-[#282142]/30 ${
        selectedUser?._id === user._id 
          ? "bg-[#282142]/70 border-l-2 border-violet-500" 
          : ""
      }`}
          >
            <div className="relative">
              <img
                src={user?.profilePic || assets.avatar_icon}
                alt={user.fullName}
                className="w-[35px] aspect-[1/1] rounded-full"
              />
              {/* Online indicator dot */}
              {onlineUser.includes(String(user._id)) && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#8185B2]"></div>
              )}
            </div>
            <div className="flex flex-col leading-5">
              <p className="font-medium">{user.fullName}</p>
              {onlineUser.includes(String(user._id)) ? (
                <span className="text-green-400 text-xs">Online</span>
              ) : (
                <span className="text-neutral-400 text-xs">Offline</span>
              )}
            </div>


            {unseenMessages[user._id] > 0 && (
              <div
                className="absolute top-2 right-2 text-xs h-5 min-w-[20px] px-1
          flex justify-center items-center rounded-full 
          bg-violet-500 text-white font-medium shadow-lg"
              >
                {unseenMessages[user._id]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SideBar;
