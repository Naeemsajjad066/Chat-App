import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import { useOutsideClick } from "../hooks/useOutsideClick";
import { useDebounce } from "../hooks/useDebounce";
import UserRow from "./chat/UserRow";

function SideBar() {
  const {
    getUsers, users, selectedUser, setSelectedUser,
    unseenMessages, setUnseenMessages, lastMessages, typingUsers,
  } = useContext(ChatContext);

  const { logout, onlineUser, authUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [rawInput, setRawInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const searchTerm = useDebounce(rawInput, 200);

  useOutsideClick(menuRef, useCallback(() => setMenuOpen(false), []));

  // Fetch users once on mount and whenever online status changes
  useEffect(() => { getUsers(); }, [onlineUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Memoised filter + sort — only recomputes when inputs change
  const sortedUsers = useMemo(() => {
    const filtered = searchTerm
      ? users.filter((u) => u.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
      : users;

    return [...filtered].sort((a, b) => {
      const aOn = onlineUser.includes(String(a._id));
      const bOn = onlineUser.includes(String(b._id));
      if (aOn !== bOn) return bOn - aOn;
      const aT = lastMessages[a._id]?.createdAt ? new Date(lastMessages[a._id].createdAt).getTime() : 0;
      const bT = lastMessages[b._id]?.createdAt ? new Date(lastMessages[b._id].createdAt).getTime() : 0;
      if (aT !== bT) return bT - aT;
      return a.fullName.localeCompare(b.fullName);
    });
  }, [users, searchTerm, onlineUser, lastMessages]);

  const getPreview = useCallback((user) => {
    if (typingUsers.has(user._id)) return null;
    const last = lastMessages[user._id];
    if (!last) return null;
    const isMe = String(last.senderId) === String(authUser?._id);
    const prefix = isMe ? "You: " : "";
    if (last.image) return `${prefix}📷 Photo`;
    if (last.text) return `${prefix}${last.text.length > 28 ? last.text.slice(0, 28) + "…" : last.text}`;
    return null;
  }, [lastMessages, typingUsers, authUser]);

  return (
    <div className={`flex flex-col h-full bg-[#0c0b18] border-r border-white/[0.07] ${selectedUser ? "hidden md:flex" : "flex"}`}>

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-4 pt-4">
        <div className="flex items-center justify-between pb-3">
          {/* Logo — icon + text so it's always crisp */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600/25 border border-violet-500/25
              flex items-center justify-center">
              <img src={assets.logo_icon} alt="" className="w-4.5 h-4.5" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">QuickChat</span>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-full
                hover:bg-white/10 active:bg-white/15 transition text-gray-400 hover:text-white"
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              {/* Three-dot vertical icon — sharper than the png */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5"  r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute top-full right-0 mt-1 z-30 w-44 bg-[#1e1b3a] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-white text-sm font-medium truncate">{authUser?.fullName}</p>
                  <p className="text-gray-500 text-xs truncate">{authUser?.email}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); navigate("/profile"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 active:bg-white/10 transition text-left"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Edit Profile
                </button>
                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 active:bg-red-500/15 transition text-left"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 mb-3 focus-within:border-violet-500/40 transition">
          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            type="search"
            placeholder="Search…"
            aria-label="Search users"
            className="flex-1 bg-transparent outline-none text-white text-sm placeholder-gray-500 min-w-0"
          />
          {rawInput && (
            <button onClick={() => setRawInput("")} className="text-gray-500 hover:text-gray-300 transition flex-shrink-0 p-0.5" aria-label="Clear search">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── User list ── */}
      <div className="flex-1 overflow-y-auto px-2 pb-2" role="list" aria-label="Conversations">
        {sortedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-600" role="status">
            <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm">{rawInput ? "No results" : "No users yet"}</p>
          </div>
        ) : (
          sortedUsers.map((user) => (
            <UserRow
              key={user._id}
              user={user}
              isActive={selectedUser?._id === user._id}
              isOnline={onlineUser.includes(String(user._id))}
              isTyping={typingUsers.has(user._id)}
              preview={getPreview(user)}
              lastTime={lastMessages[user._id]?.createdAt}
              badge={unseenMessages[user._id] || 0}
              onClick={() => {
                setSelectedUser(user);
                setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default SideBar;
