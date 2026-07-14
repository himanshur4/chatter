"use client";
import ChatSidebar from "@/components/ChatSidebar";
import Loading from "@/components/Loading";
import { chat_service, useAppData, User } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Menu, MessageSquareDashed } from "lucide-react";
import { toast } from "sonner";
import Cookies from "js-cookie";
import axios from "axios";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages from "@/components/ChatMessages";

export interface Message {
  id: string;
  chatId: string;
  sender: string;
  text?: string;
  image?: {
    url: string;
    publicId: string;
  };
  messageType: "text" | "image";
  seen: boolean;
  seenAt?: string;
  createdAt: string;
}

const getId = (item: any): string => {
  if (!item) return "";
  return String(item.id || item._id || "");
};

const ChatApp = () => {
  const {
    isAuth,
    loading,
    logoutUser,
    chats,
    user: loggedInUser,
    users,
    fetchChats,
  } = useAppData();

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [user, setUser] = useState<User | null>(null);
    const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeOut] = useState<NodeJS.Timeout | null>(null);
  const [showAllUser, setShowAllUser] = useState(false);

  const router = useRouter();
  
  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, router, loading]);

  const handleLogout = () => logoutUser();

  async function fetchChat(){
    const token = Cookies.get("token");
    try {
      const {data} = await axios.get(`${chat_service}/api/v1/message/${selectedUser}`, {
        headers:{ Authorization: `Bearer ${token}` },
      });
      setMessages(data.messages);
      setUser(data.user);
      await fetchChats();
    } catch (error) {
     console.log(error);
     toast.error("Failed to load messages");
    }
  }

  async function createChat(u: User){
    try {
      const token = Cookies.get("token");
      
      // FIX 4: Secure backend payload data parsing
      const {data} = await axios.post(`${chat_service}/api/v1/chat/new`, {
        userId: getId(loggedInUser), 
        otherUserId: getId(u)
      },{
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSelectedUser(data.chatId || data._id);
      setShowAllUser(false);
      await fetchChats();
    } catch (error) {
      toast.error("Failed to start chat");
    }
  }

  useEffect(() => {
    if(selectedUser) {
      fetchChat();
    }
  }, [selectedUser]);

  if (loading) return <Loading />;

  return (
    <div className="relative min-h-screen flex bg-fuchsia-50 dark:bg-[#0a0a0a] overflow-hidden transition-colors duration-300">
      
      {/* 1. Ambient Pulse Background */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
        <div className="h-150 w-150 animate-pulse rounded-full dark:bg-[radial-gradient(circle,rgba(99,102,241,0.18)_0%,rgba(99,102,241,0.06)_40%,transparent_70%)] bg-[radial-gradient(circle,rgba(99,102,241,0.10)_0%,rgba(99,102,241,0.03)_40%,transparent_70%)]" />
      </div>

      {/* 2. Grid Mask Background */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, black 0%, transparent 100%)",
        }}
      />

      {/* 3. Mobile Dark Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 4. The Sidebar */}
      <ChatSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        showAllUsers={showAllUser}
        setShowAllUsers={setShowAllUser}
        users={users}
        loggedInUser={loggedInUser}
        chats={chats}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        handleLogout={handleLogout}
        createChat={createChat}
      />

      {/* 5. Main Chat Area */}
      

      <main className="flex-1 relative z-10 flex flex-col h-screen">
        {selectedUser?
        (<div className="flex-1 flex flex-col bg-white/5 border border-white/10 justify-between p-4 text-center ">
          <ChatHeader user={user} setSidebarOpen={setSidebarOpen} isTyping={isTyping}/>

          <ChatMessages selectedUser={selectedUser} messages={messages} loggedInUser={loggedInUser}/>

        </div>)
        :
        (<div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-16 h-16 mb-4 rounded-2xl bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.2)] flex items-center justify-center shadow-lg">
            <MessageSquareDashed className="w-8 h-8 text-fuchsia-500 dark:text-fuchsia-400" />
          </div>
          <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight">Select a conversation</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm">
            Choose a contact from the sidebar or click the plus icon in sidebar to start messaging.
          </p>
        </div>)}
      </main>
      
    </div>
  );
};

export default ChatApp;