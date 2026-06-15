"use client";

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, Loader, Lock, Mail } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react'

const VerifyPage = () => {
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState<string []>([ "","","","","",""]);
  const [error,setError]=useState<string>("");
  const [resendLoading,setResendLoading]=useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs=useRef<Array<HTMLInputElement>>([]);
  const router=useRouter();

  const searchParams=useSearchParams();
  const email:string=searchParams.get("email") || "";

  useEffect(()=>{
    if(timer>0){
      const interval=setInterval(()=>{
        setTimer((prev)=>(prev-1))
      },1000);
      return ()=>clearInterval(interval)
    }
  },[timer]);
  
  const handleInputChange=(index:number,value:string):void=>{
    if(value.length>1) return;
    const newOtp=[...otp];
    newOtp[index]=value;
    setOtp(newOtp);
    setError("");

    if(value&& index<5){
      inputRefs.current[index+1]?.focus(); 
    }

  }

  const handleKeydown=(index:number,e:React.KeyboardEvent<HTMLElement>):void=>{
    if(e.key==="Backspace" && !otp[index] && index>0){
      inputRefs.current[index-1]?.focus()
    }
  }

  const handlePaste=(e:React.ClipboardEvent<HTMLElement>):void=>{
      const pastedData=e.clipboardData.getData("text");
      const digits=pastedData.replace(/\D/g,"").slice(0,6);
      if(digits.length===6){
        const newOtp=digits.split("");
        setOtp(newOtp)
        inputRefs.current[5]?.focus();
      }
  }

  const handleSubmit=async(e:React.FormEvent<HTMLElement>):Promise<void>=>{
    e.preventDefault();
    setLoading(true);
    try {
      
    } catch (error) {
      
    }finally{
      setLoading(false);
    }
  }
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
          <Lock className="h-5 w-5 text-fuchsia-400" strokeWidth={1.8} />
        </div>

        <h1 className="mb-1.5 text-[22px] font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
         Verify your email
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
          We have sent a 6-digit code to <span className='text-blue-400 dark:text-blue-500'>{email}</span>
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
              
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                // value={email}
                // onChange={(e) => setEmail(e.target.value)}
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
      </div>
    </div>
  )
}

export default VerifyPage