"use client";
import { User } from "@/context/AppContext";
import {
  MessageCircle,
  Plus,
  Search,
  UserCircle,
  X,
  LogOut,
  CornerUpLeft,
  CornerDownRight,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

interface ChatSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  showAllUsers: boolean;
  setShowAllUsers: (show: boolean | ((prev: boolean) => boolean)) => void;
  users: User[] | null;
  loggedInUser: User | null;
  chats: any[] | null;
  selectedUser: string | null;
  setSelectedUser: (userId: string | null) => void;
  handleLogout: () => void;
  createChat: (user: User) => void;
}

const getId = (item: any): string => {
  if (!item) return "";
  return String(item.id || item._id || "");
};

const ChatSidebar = ({
  sidebarOpen,
  setSidebarOpen,
  showAllUsers,
  setShowAllUsers,
  users,
  loggedInUser,
  chats,
  selectedUser,
  setSelectedUser,
  handleLogout,
  createChat,
}: ChatSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const myId = getId(loggedInUser);

  return (
    <aside
      className={`fixed z-30 sm:static top-0 left-0 h-screen w-80 sm:w-80 flex flex-col transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } sm:translate-x-0 transition-transform duration-300 ease-in-out
      dark:[background:rgba(18,18,20,0.6)] bg-white/70 
      border-r border-zinc-200 dark:border-white/10
      [backdrop-filter:blur(24px)] shadow-2xl sm:shadow-none`}
    >
      <div className="p-5 border-b border-zinc-200 dark:border-white/10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.2)]">
              <MessageCircle className="w-5 h-5 text-fuchsia-500 dark:text-fuchsia-400" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
              {showAllUsers ? "New Chat" : "Messages"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              className={`p-2 rounded-lg transition-colors flex items-center justify-center text-white shadow-md
                ${
                  showAllUsers
                    ? "bg-zinc-800 hover:bg-zinc-700 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-100"
                    : "bg-linear-to-br from-fuchsia-500 to-fuchsia-400 hover:-translate-y-px text-white"
                }`}
              onClick={() => setShowAllUsers((prev) => !prev)}
            >
              {showAllUsers ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" strokeWidth={3} />}
            </button>

            <button
              onClick={() => setSidebarOpen(false)}
              className="sm:hidden p-2 rounded-lg bg-zinc-200/50 dark:bg-white/5 text-zinc-600 dark:text-zinc-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showAllUsers && (
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-colors group-focus-within:text-fuchsia-500" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full h-10 pl-10 pr-4 rounded-[10px] text-sm outline-none transition-all
                bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10
                text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-500
                focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/15"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar">
        {showAllUsers ? (
          <div className="space-y-1">
            {(Array.isArray(users) ? users : [])
              .filter(
                (u) =>
                  getId(u) !== myId &&
                  u.name?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((u) => (
                <button
                  key={getId(u)}
                  className="w-full flex items-center gap-3 p-3 text-left rounded-xl transition-all duration-200
                        hover:bg-white/60 dark:hover:bg-white/5 
                        border border-transparent hover:border-zinc-200 dark:hover:border-white/10"
                  onClick={() => createChat(u)}
                >
                  <div className="relative shrink-0">
                    <UserCircle className="w-10 h-10 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-[#121214] rounded-full"></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm text-zinc-800 dark:text-zinc-100 block truncate">
                      {u.name}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 block truncate mt-0.5">
                      {u.email}
                    </span>
                  </div>
                </button>
              ))}
          </div>
        ) : chats && chats.length > 0 ? (
          <div className="space-y-1 text-sm text-zinc-500 pb-4">
            {chats.map((chat, index) => {
              
              // 1. Reading the exact flat data structure sent by your Express backend
              const chatId = getId(chat);
              const otherUser = chat.otherUser; 
              const otherUserId = getId(otherUser);
              
              // 2. Safely reading the separate message and sender fields
              const latestMessageText = chat.latestMessage; 
              const latestSenderId = chat.latestSender ? String(chat.latestSender) : null;
              
              const unseenCount = chat.unseenCount || 0;

              // 3. Selection and Identity Logic
              const isSelected = selectedUser !== null && chatId !== "" && selectedUser === chatId;
              const isSentByMe = latestSenderId !== null && latestSenderId === myId;
              const isMyself = otherUserId !== "" && myId !== "" && otherUserId === myId;
              
              const uniqueKey = chatId || `fallback-${index}`;

              return (
                <button
                  key={uniqueKey}
                  onClick={() => {
                    if (chatId) {
                      setSelectedUser(chatId);
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 border ${
                    isSelected
                      ? "bg-fuchsia-500/10 border-fuchsia-500/30 dark:bg-fuchsia-500/20 dark:border-fuchsia-500/40 shadow-sm"
                      : "border-transparent hover:bg-white/60 dark:hover:bg-white/5 hover:border-zinc-200 dark:hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center">
                        <UserCircle className="w-6 h-6 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span
                          className={`font-medium text-sm truncate ${
                            isSelected ? "text-fuchsia-700 dark:text-fuchsia-300" : "text-zinc-800 dark:text-zinc-100"
                          }`}
                        >
                          {/* Pulls from chat.otherUser.name */}
                          {isMyself ? `Myself` : (otherUser?.name || "Unknown User")}
                        </span>
                        {unseenCount > 0 && (
                          <div className="bg-fuchsia-500 text-white text-[10px] font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1.5 shadow-sm">
                            {unseenCount > 99 ? "99+" : unseenCount}
                          </div>
                        )}
                      </div>
                      
                      {/* Will only render the arrow area if a message actually exists */}
                      {latestMessageText && (
                        <div className="flex items-center gap-1.5">
                          {isSentByMe ? (
                            <CornerUpLeft size={14} className="text-fuchsia-500 dark:text-fuchsia-400 shrink-0" />
                          ) : (
                            <CornerDownRight size={14} className="text-blue-500 dark:text-blue-400 shrink-0" />
                          )}
                          <span className={`text-xs truncate flex-1 ${isSelected ? "text-fuchsia-600/80 dark:text-fuchsia-300/80" : "text-zinc-500 dark:text-zinc-400"}`}>
                            {latestMessageText}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 space-y-3">
            <div className="p-3 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[14px]">
              <MessageCircle className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
            </div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">No conversations yet</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Click the plus icon to start a new chat
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-white/10 space-y-2">
        <Link
          href={"/profile"}
          className="flex items-center gap-3 px-4 py-2.5 rounded-[10px] hover:bg-white/60 dark:hover:bg-white/5 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-colors"
        >
          <UserCircle className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          <span className="font-medium text-sm text-zinc-700 dark:text-zinc-300">Profile</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-[10px] hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-colors text-red-600 dark:text-red-400 cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default ChatSidebar;