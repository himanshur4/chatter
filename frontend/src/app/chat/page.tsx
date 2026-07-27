"use client";
import ChatSidebar from "@/components/ChatSidebar";
import Loading from "@/components/Loading";
import { chat_service, useAppData, User } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { MessageSquareDashed } from "lucide-react";
import { toast } from "sonner";
import Cookies from "js-cookie";
import axios from "axios";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages from "@/components/ChatMessages";
import MessageInput from "@/components/MessageInput";
import { SocketData } from "@/context/SocketContext";

export interface Message {
  id: string;
  chatId: string;
  sender: string;
  text?: string;
  image?: { url: string; publicId: string };
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
    setChats,
  } = useAppData();

  const { onlineUsers, socket } = SocketData();

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [message, setMessage] = useState("");
  const [showAllUser, setShowAllUser] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );

  const router = useRouter();

  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, router, loading]);

  const handleLogout = () => logoutUser();

  async function fetchChat() {
    const token = Cookies.get("token");
    try {
      const { data } = await axios.get(
        `${chat_service}/api/v1/message/${selectedUser}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setMessages(data.messages);
      setUser(data.user);
      await fetchChats();
    } catch (error) {
      toast.error("Failed to load messages");
    }
  }

  const moveChatToTop = (
    chatId: string,
    newMessage: any,
    updatedUnseenCount = true,
  ) => {
    setChats((prev) => {
      if (!prev) return null;
      const updatedChats = [...prev];
      
      const chatIndex = updatedChats.findIndex((chat) => getId(chat) === chatId);

      if (chatIndex !== -1) {
        const [moveChat] = updatedChats.splice(chatIndex, 1);
        const updatedChat = {
          ...moveChat,
          latestMessage: newMessage.text,
          latestSender: newMessage.sender,
          updatedAt: new Date().toString(),
          unseenCount:
            updatedUnseenCount && newMessage.sender !== loggedInUser?.id
              ? (moveChat.unseenCount || 0) + 1
              : moveChat.unseenCount || 0,
        };
        updatedChats.unshift(updatedChat);
      } else {
        fetchChats();
      }
      return updatedChats;
    });
  };
  const resetUnseenCount = (chatId: string) => {
    setChats((prev) => {
      if (!prev) return null;

      return prev.map((chat) => {
        
        if (getId(chat) === chatId) {
          return {
            ...chat,
            unseenCount: 0,
          };
        }
        return chat;
      });
    });
  };

  async function createChat(u: User) {
    try {
      const token = Cookies.get("token");
      const { data } = await axios.post(
        `${chat_service}/api/v1/chat/new`,
        {
          userId: getId(loggedInUser),
          otherUserId: getId(u),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSelectedUser(data.chatId || data._id);
      setShowAllUser(false);
      await fetchChats();
    } catch (error) {
      toast.error("Failed to start chat");
    }
  }

  const handleMessageSend = async (e: any, imageFile?: File | null) => {
    e.preventDefault();
    if (!message.trim() && !imageFile && !selectedUser) return;

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }

    socket?.emit("stopTyping", {
      chatId: selectedUser,
      userId: loggedInUser?.id,
    });

    const token = Cookies.get("token");
    try {
      const formData = new FormData();
      formData.append("chatId", selectedUser!);
      if (message.trim()) formData.append("text", message);
      if (imageFile) formData.append("image", imageFile);

      const { data } = await axios.post(
        `${chat_service}/api/v1/message`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setMessages((prev) => {
        const currentMessages = prev || [];
        if (!currentMessages.some((msg) => msg.id === data.message.id)) {
          return [...currentMessages, data.message];
        }
        return currentMessages;
      });
      setMessage("");
      const displayText=imageFile?"📷 image":message;
      moveChatToTop(selectedUser!,{
        text:displayText,
        sender:data.sender
      },false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  };

  const handleTyping = (value: string) => {
    setMessage(value);

    if (!selectedUser || !socket) return;
    // socket setup

    if (value.trim()) {
      socket.emit("typing", {
        chatId: selectedUser,
        userId: loggedInUser?.id,
      });
    }
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(() => {
      socket.emit("stopTyping", {
        chatId: selectedUser,
        userId: loggedInUser?.id,
      });
    }, 2000);

    setTypingTimeout(timeout);
  };

  useEffect(() => {
    socket?.on("newMessage",(message)=>{
      console.log("Received new message:",message);

      if(selectedUser===message.chatId){
        setMessages((prev)=>{
          const currentMessages=prev || [];
          const messageExists=currentMessages.some((msg)=>msg.id===message.id)

          if(!messageExists){
            return [...currentMessages,message]
          }
          return currentMessages;
        });

        moveChatToTop(message.chatId,message,false);
      }
      else{
        moveChatToTop(message.chatId,message,true);
      }
    });

    socket?.on("messagesSeen",(data)=>{
      console.log("Message seen by:",data);

      if(selectedUser===data.chatId){
        setMessages((prev)=>{
          if(!prev) return null;
          return prev.map((msg)=>{
            if(msg.sender === loggedInUser?.id && data.messageIds && data.messageIds.includes(msg.id)){
              return {
                ...msg,
                seen:true,
                seenAt:new Date().toString()
              }
            }
            else if(msg.sender=== loggedInUser?.id && !data.messageIds){
              return {
                ...msg,
                seen:true,
                seenAt:new Date().toString(),
              }
            }
            return msg;
          })
        })
      }
    })

    socket?.on("userTyping", (data) => {
      console.log("received user typing", data);
      if (data.chatId === selectedUser && data.userId !== loggedInUser?.id) {
        setIsTyping(true);
      }
    });

    socket?.on("userStoppedTyping", (data) => {
      console.log("received user stopped typing typing", data);
      if (data.chatId === selectedUser && data.userId !== loggedInUser?.id) {
        setIsTyping(false);
      }
    });

    return () => {
      socket?.off("newMessage");
      socket?.off("messagesSeen");
      socket?.off("userTyping");
      socket?.off("userStoppedTyping");
    };
  }, [socket, selectedUser, setChats,loggedInUser?.id]);

  useEffect(() => {
    if (selectedUser) {
      fetchChat();
      setIsTyping(false);

      resetUnseenCount(selectedUser);

      socket?.emit("joinChat", selectedUser);
      return () => {
        socket?.emit("leaveChat", selectedUser);
        setMessages(null);
      };
    }
  }, [selectedUser, socket]);

  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  if (loading || !isAuth) return <Loading />;

  return (
    <div className="relative min-h-screen flex bg-fuchsia-50 dark:bg-[#0a0a0a] overflow-hidden transition-colors duration-300">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
        <div className="h-150 w-150 animate-pulse rounded-full dark:bg-[radial-gradient(circle,rgba(99,102,241,0.18)_0%,rgba(99,102,241,0.06)_40%,transparent_70%)] bg-[radial-gradient(circle,rgba(99,102,241,0.10)_0%,rgba(99,102,241,0.03)_40%,transparent_70%)]" />
      </div>
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

      <ChatSidebar
        showAllUsers={showAllUser}
        setShowAllUsers={setShowAllUser}
        users={users}
        loggedInUser={loggedInUser}
        chats={chats}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        handleLogout={handleLogout}
        createChat={createChat}
        onlineUsers={onlineUsers}
      />

      <main
        className={`flex-1 relative z-10 flex-col h-dvh ${!selectedUser ? "hidden sm:flex" : "flex"}`}
      >
        {selectedUser ? (
          <div className="flex-1 flex flex-col bg-white/5 border-l border-zinc-200 dark:border-white/10 overflow-hidden">
            <ChatHeader
              user={user}
              onBack={() => setSelectedUser(null)}
              isTyping={isTyping}
              onlineUsers={onlineUsers}
            />
            <ChatMessages
              selectedUser={selectedUser}
              messages={messages}
              loggedInUser={loggedInUser}
            />
            <MessageInput
              selectedUser={selectedUser}
              message={message}
              setMessage={handleTyping}
              handleMessageSend={handleMessageSend}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center border-l border-zinc-200 dark:border-white/10">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.2)] flex items-center justify-center shadow-lg">
              <MessageSquareDashed className="w-8 h-8 text-fuchsia-500 dark:text-fuchsia-400" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight">
              Select a conversation
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm">
              Choose a contact from the sidebar or click the plus icon to start
              messaging.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatApp;
