"use client";
import { useAppData, user_service } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { toast } from "sonner";
import Loading from "@/components/Loading";
import { ArrowLeft, Save, User, UserCircle } from "lucide-react";

const ProfilePage = () => {
  const { user, isAuth, loading, setUser } = useAppData();
  const [isEdit, setIsEdit] = useState(false);
  const [name, setName] = useState<string | undefined>("");
  const router = useRouter();

  const editHandler = () => {
    setIsEdit(!isEdit);
    setName(user?.name);
  };

  const submitHandler = async (e: any) => {
    e.preventDefault();
    const token = Cookies.get("token");
    try {
      const { data } = await axios.post(
        `${user_service}/api/v1/update/user`,
        { name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      Cookies.set("token", data.token, {
        expires: 15,
        secure: false,
        path: "/",
      });

      toast.success(data.message);
      setUser(data.user);
      setIsEdit(false);
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
  };

  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, router, loading]);

  if (loading) return <Loading />;

  return (
    <div className="relative min-h-screen flex bg-[#0a0a0a] overflow-hidden transition-colors duration-300">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
        <div className="h-150 w-150 animate-pulse rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.18)_0%,rgba(99,102,241,0.06)_40%,transparent_70%)]" />
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

      <div className="relative z-10 w-full max-w-2xl mx-auto pt-12 px-4 sm:px-6">
      
        <div className="flex items-center gap-5 mb-10">
          <button
            onClick={() => router.push("/chat")}
            className="cursor-pointer p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-zinc-400 hover:text-zinc-200 shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
              Profile Settings
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              Manage your account information
            </p>
          </div>
        </div>

        <div className="bg-black/20 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="bg-white/5 p-8 border-b border-white/10">
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                  <UserCircle className="w-14 h-14 text-zinc-500" strokeWidth={1.5} />
                </div>
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-[3px] border-[#121214] shadow-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-zinc-100 mb-1 truncate">
                  {user?.name || "User"}
                </h2>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-zinc-400 text-sm font-medium">Active now</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-3">
                  Display Name
                </label>
                {isEdit ? (
                  <form onSubmit={submitHandler} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="relative group">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-11 py-3.5 bg-white/5 border border-white/10 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/15 transition-all"
                        placeholder="Enter your name"
                      />
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-fuchsia-500 transition-colors" />
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-br from-fuchsia-500 to-fuchsia-400 hover:opacity-90 text-white font-medium rounded-xl transition-all shadow-lg shadow-fuchsia-500/20 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>

                      <button
                        type="button"
                        onClick={editHandler}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-medium rounded-xl transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 animate-in fade-in duration-300">
                    <span className="text-zinc-100 font-medium text-[15px]">
                      {user?.name || "Not set"}
                    </span>
                    <button
                      onClick={editHandler}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-medium rounded-lg transition-all text-sm cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;