import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0a0a0a] px-4 overflow-hidden">
      
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-150 w-150 animate-pulse rounded-full dark:bg-[radial-gradient(circle,rgba(99,102,241,0.18)_0%,rgba(99,102,241,0.06)_40%,transparent_70%)] bg-[radial-gradient(circle,rgba(99,102,241,0.10)_0%,rgba(99,102,241,0.03)_40%,transparent_70%)]" />
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, black 0%, transparent 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl 
            dark:[background:rgba(18,18,20,0.85)] dark:[border:1px_solid_rgba(255,255,255,0.08)] dark:[box-shadow:0_0_0_1px_rgba(99,102,241,0.1),0_16px_32px_rgba(0,0,0,0.5)]
            bg-white/90 border border-zinc-200 shadow-xl
            [backdrop-filter:blur(20px)]"
        >
          <Loader2 className="h-10 w-10 animate-spin text-fuchsia-500 dark:text-fuchsia-400" strokeWidth={2.5} />
        </div>

        <div className="space-y-2 text-center animate-pulse">
          
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Loading your workspace and recent chats
          </p>
        </div>
        
      </div>
    </div>
  );
}