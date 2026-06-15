"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import Cookies from "js-cookie";
import { ArrowRight, ChevronLeft, Loader, Lock, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const VerifyPage = () => {
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string>("");
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const searchParams = useSearchParams();
  const email: string = searchParams.get("email") || "";

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleInputChange = (index: number, value: string): void => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeydown = (
    index: number,
    e: React.KeyboardEvent<HTMLElement>,
  ): void => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLElement>): void => {
    const pastedData = e.clipboardData.getData("text");
    const digits = pastedData.replace(/\D/g, "").slice(0, 6);
    if (digits.length === 6) {
      const newOtp = digits.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please Enter all 6 digits");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(`http:localhost:5000/api/v1/verify`, {
        email,
        otp: otpString,
      });
      toast.success(data.message);
      Cookies.set("token", data.token, {
        expires: 15 * 60 * 1000,
        secure: false,
        path: "/",
      });
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      setError(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError("");
    try {
      const { data } = await axios.post(`http://localhost:5000/api/v1/login`, {
        email,
      });
      toast.success(data.message);
      setTimer(60);
    } catch (error: any) {
      setError(error.response.data.message);
    } finally {
      setResendLoading(false);
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
        <button
          className="cursor-pointer dark:text-gray-300 p-2 rounded-full hover:bg-gray-200 hover:text-gray-700 hover:dark:text-zinc-300 hover:dark:bg-zinc-700 mb-2"
          onClick={() => router.push("/login")}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex justify-center">
          <div
            className="mb-7 flex gap-3 h-14 w-14 items-center justify-center rounded-[14px]"
            style={{
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
          >
            <Lock className="h-5 w-5 text-fuchsia-400" strokeWidth={1.8} />
          </div>
        </div>

        <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
          Verify Your Email
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
          We have sent a 6-digit code to{" "}
          <span className="text-blue-400 dark:text-blue-500">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <label
              htmlFor="email"
              className="block text-[11px] font-medium uppercase tracking-widest text-zinc-700 dark:text-zinc-500"
            >
              Enter your 6-digit OTP below
            </label>
            <div className="flex justify-center in-checked: space-x-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeydown(index, e)}
                  onPaste={index == 0 ? handlePaste : undefined}
                  className="w-12 h-15 text-center bg-gray-100 text-2xl font-bold peer rounded-[10px] dark:border-white/8 dark:bg-white/7 text-zinc-700 dark:text-zinc-300
                           focus:border-fuchsia-500/50 focus:ring-fuchsia-500/15
                           disabled:opacity-50 border-black/40"
                />
              ))}
            </div>
          </div>
          {error && (
            <div className="bg-red-600 dark:bg-red-900 border border-red-700 rounded-lg p-3">
              <p className="text-gray-50 dark:text-red-200 text-sm text-center">
                {error}
              </p>
            </div>
          )}

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
                Verifying...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                Verify OTP
                <ArrowRight
                  className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </div>
            )}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 ">
            Didn't receive the code?
          </p>
          {timer > 0 ? (
            <p className="text-gray-800 dark:text-gray-400 text-sm">
              Resend code in {timer} seconds
            </p>
          ) : (
            <Button
              disabled={resendLoading}
              className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium text-sm disabled:opacity-50 cursor-pointer"
              onClick={handleResendOtp}
            >
              {resendLoading ? "Sending..." : "Resend Code"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
