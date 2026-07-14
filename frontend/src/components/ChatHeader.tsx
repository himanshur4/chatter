"use client";
import { User } from '@/context/AppContext';
import { Menu, UserCircle } from 'lucide-react';
import React, { useEffect } from 'react';

interface ChatHeaderProps {
  user: User | null;
  setSidebarOpen: (open: boolean) => void;
  isTyping: boolean;
}

const ChatHeader = ({ user, setSidebarOpen, isTyping }: ChatHeaderProps) => {
  
  // FIRST PRINCIPLE: The DOM Escape Hatch
  // Hides the global theme toggle ONLY when a chat is actively open
  useEffect(() => {
    const themeToggle = document.getElementById('global-theme-toggle');
    
    // If a user is selected (chat is open), hide the toggle
    if (user && themeToggle) {
      themeToggle.style.opacity = '0';
      themeToggle.style.pointerEvents = 'none'; 
    }

    // Cleanup function: If user closes the chat or unmounts, bring it back
    return () => {
      if (themeToggle) {
        themeToggle.style.opacity = '1';
        themeToggle.style.pointerEvents = 'auto';
      }
    };
  }, [user]); // Re-run this effect whenever the selected 'user' changes

  // 1. EMPTY STATE: No user selected. Render menu button on the right!
  if (!user) {
    return (
      <div className="sm:hidden absolute top-4 right-4 z-30">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-[10px] bg-white/60 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 backdrop-blur-md shadow-sm"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // 2. ACTIVE CHAT STATE
  return (
    <div className="w-full flex items-center justify-between p-4 border-b border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-md shrink-0">
      
      {/* Left Side: User Profile Info */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
          </div>
          {/* Green Online Dot */}
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-[#121214] rounded-full"></div>
        </div>

        <div className="flex flex-col justify-start overflow-hidden">
          <h3 className="text-lg text-zinc-800 dark:text-zinc-100 leading-tight truncate w-full p-1">
            {user.name}
          </h3>
          {/* to show Typing Indicator */}
          
        </div>
      </div>

      {/* Right Side: Mobile Menu Button */}
      <button 
        onClick={() => setSidebarOpen(true)}
        className="sm:hidden p-2 ml-2 rounded-[10px] hover:bg-zinc-200/50 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 transition-colors shrink-0"
      >
        <Menu className="w-5 h-5" />
      </button>

    </div>
  );
};

export default ChatHeader;