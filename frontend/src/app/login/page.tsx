"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Mail, ArrowRight, Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { user_service } from "@/context/AppContext";

const LoginPage = () => {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (
    e: React.FormEvent<HTMLElement>,
  ): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${user_service}/api/v1/login`, {
        email,
      });
      toast.success(data.message);
      router.push(`/verify?email=${email}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-fuchsia-50 dark:bg-[#0a0a0a] px-4 overflow-hidden">
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

      <div
        className="relative z-10 w-full max-w-100 animate-in fade-in slide-in-from-bottom-3 duration-500
           dark:[background:rgba(18,18,20,0.85)] dark:[border:1px_solid_rgba(255,255,255,0.08)]
           bg-white/90 border border-zinc-200
           rounded-[20px] p-10
           [backdrop-filter:blur(20px)]
           dark:[box-shadow:0_0_0_1px_rgba(99,102,241,0.1),0_32px_64px_rgba(0,0,0,0.5)]
           [box-shadow:0_0_0_1px_rgba(99,102,241,0.08),0_32px_64px_rgba(0,0,0,0.08)] shadow-2xl"
      >
        <div
          className="absolute top-0 left-10 right-10 h-px rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)",
          }}
        />

        <div
          className="mb-7 flex h-12 w-12 items-center justify-center rounded-[14px]"
          style={{
            background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          <Mail className="h-5 w-5 text-fuchsia-400" strokeWidth={1.8} />
        </div>

        <h1 className="mb-1.5 text-[22px] font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
          Welcome to <span className="bg-linear-to-r from-fuchsia-600  to-fuchsia-900 dark:to-fuchsia-400 bg-clip-text text-transparent text-2xl font-serif italic tracking-tightest pl-1">Chatter</span>
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
          Sign in with your email. We'll send you an OTP.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-[11px] font-medium uppercase tracking-widest text-zinc-700 dark:text-zinc-500"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 
           text-zinc-400 dark:text-zinc-600 transition-colors duration-200"
                strokeWidth={1.8}
              />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="peer h-11 rounded-[10px] dark:border-white/8 bg-white/4 pl-10 text-sm text-zinc-700 placeholder:text-zinc-500  dark:text-zinc-300
                           focus:border-fuchsia-500/50 focus:ring-fuchsia-500/15
                           disabled:opacity-50 border-black/15"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="group h-11 w-full rounded-[10px] border-0 bg-linear-to-br from-fuchsia-500 to-fuchsia-400 
                       text-sm font-medium text-white shadow-[0_4px_16px_rgba(99,102,241,0.3)]
                       transition-all duration-200 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)]
                       active:translate-y-0 disabled:opacity-60 disabled:translate-y-0"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                
                <Loader
                  className="ml-2 h-4 w-4 transition-transform duration-200 animate-spin"
                  strokeWidth={2}
                />
                Sending OTP to your email...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                Continue
                <ArrowRight
                  className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </div>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
