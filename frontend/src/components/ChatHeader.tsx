"use client";
import { User } from "@/context/AppContext";
import { ChevronLeft, UserCircle } from "lucide-react";
import React from "react";

interface ChatHeaderProps {
  user: User | null;
  onBack: () => void;
  isTyping: boolean;
  onlineUsers: string[];
}

const ChatHeader = ({
  user,
  onBack,
  isTyping,
  onlineUsers,
}: ChatHeaderProps) => {
  if (!user) return null;
  
  const isOnlineUser = user && onlineUsers.includes(user.id);

  return (
    <div className="w-full flex items-center justify-between p-3 sm:p-4 border-b border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onBack}
          className="sm:hidden p-1.5 -ml-1 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center">
            <UserCircle
              className="w-6 h-6 text-zinc-400 dark:text-zinc-500"
              strokeWidth={1.5}
            />
          </div>
          {isOnlineUser && (
            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-gray-800">
              <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"/>
            </span>
          )}
        </div>
        
        <div className="flex flex-col items-start overflow-hidden">
          <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100 leading-tight truncate w-full">
            {user.name}
          </h3>
          <div className="flex items-center gap-2">
            {isTyping ? (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-bounce" style={{animationDelay:"0.1s"}}></div>
                  <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-bounce" style={{animationDelay:"0.2s"}}></div>
                  <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-bounce" style={{animationDelay:"0.3s"}}></div>
                </div>
                <span className="text-fuchsia-500 font-medium"> typing...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isOnlineUser ? "text-green-500" : "text-gray-500"}`}>
                  {isOnlineUser ? "Online" : "Offline"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;