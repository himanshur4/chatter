import { Message } from "@/app/chat/page";
import { User } from "@/context/AppContext";
import React, { useEffect, useMemo, useRef } from "react";
import moment from "moment";
import { Check, CheckCheck } from "lucide-react";

interface ChatMessagesProps {
  selectedUser: string | null;
  messages: Message[] | null;
  loggedInUser: User | null;
}

const ChatMessages = ({
  selectedUser,
  messages,
  loggedInUser,
}: ChatMessagesProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  const uniqueMessages = useMemo(() => {
    if (!messages) return [];
    const seen = new Set();
    return messages.filter((message) => {
      if (seen.has(message.id)) {
        return false;
      }
      seen.add(message.id);
      return true;
    });
  }, [messages]);

useEffect(() => {
    const timeoutId = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [selectedUser, uniqueMessages]);

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
        {!selectedUser ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm bg-white/50 dark:bg-white/5 px-4 py-2 rounded-full border border-zinc-200 dark:border-white/10">
              Please select a user to start chatting 📩
            </p>
          </div>
        ) : (
          <>
            {uniqueMessages.map((e, i) => {
              const isSentByMe = e.sender === loggedInUser?.id;
              const uniqueKey = `${e.id}-${i}`;

              return (
                <div
                  key={uniqueKey}
                  className={`flex flex-col gap-1 w-full ${isSentByMe ? "items-end" : "items-start"}`}
                >
                  <div
                    className={` pb-3 px-1 pt-1 max-w-[85%] md:max-w-[60%] sm:max-w-[75%] shadow-md ${
                      isSentByMe 
                        ? "bg-linear-to-br from-fuchsia-500 to-fuchsia-600 text-white rounded-xl rounded-br-sm" 
                        : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-white/10 rounded-2xl rounded-bl-sm"
                    }`}
                  >
                    {e.messageType === "image" && e.image && (
                      <div className="relative group mb-1">
                        <img
                          src={e.image.url}
                          alt="shared image"
                          className="max-w-full max-h-50  object-cover rounded-xl border border-white/20 shadow-sm cursor-pointer"
                        />
                      </div>
                    )}

                    {e.text && <p className="text-[15px] px-1 pt-1 leading-relaxed">{e.text}</p>}
                  </div>

                  <div
                    className={`flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 ${
                      isSentByMe ? "pr-1 flex-row-reverse" : "pl-1"
                    }`}
                  >
                    <span>{moment(e.createdAt).format("hh:mm A · MMM D")}</span>
                    {isSentByMe && (
                      <div className="flex items-center">
                        {e.seen ? (
                          <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
                            <CheckCheck className="w-4 h-4" strokeWidth={2.5} />
                          </div>
                        ) : (
                          <Check className="w-4 h-4 text-zinc-400" strokeWidth={2.5} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} className="h-1" />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatMessages;