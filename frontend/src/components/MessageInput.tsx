import { Loader2, Paperclip, Send, X } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";  

interface MessageInputProps{
    selectedUser: string | null;
    message: string;
    setMessage: (message: string) => void;
    handleMessageSend: (e: any, imageFile?: File | null) => void;
}

const MessageInput = ({
    selectedUser,
    message,
    setMessage,
    handleMessageSend,
}: MessageInputProps) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!message.trim() && !imageFile) return;

        setIsUploading(true);
        await handleMessageSend(e, imageFile);
        setImageFile(null);
        setIsUploading(false);
    };

    if (!selectedUser) return null;

  return (
    <div className="p-3 sm:p-4 bg-white/50 dark:bg-black/20 backdrop-blur-md border-t border-zinc-200 dark:border-white/10">
      <form onSubmit={handleSubmit} className='flex flex-col gap-3 max-w-5xl mx-auto'>
          
          {imageFile && (
            <div className='relative w-fit animate-in fade-in slide-in-from-bottom-2'>
                <img 
                  src={URL.createObjectURL(imageFile)} 
                  alt="preview" 
                  className='w-24 h-24 object-cover rounded-[14px] border-2 border-fuchsia-500/50 shadow-md'
                />
                <button 
                  type="button" 
                  className='absolute -top-2 -right-2 bg-zinc-800 dark:bg-zinc-100 rounded-full p-1 shadow-lg hover:scale-110 transition-transform' 
                  onClick={() => setImageFile(null)}
                >
                    <X className='w-4 h-4 text-white dark:text-zinc-900'/>
                </button>
            </div>
          )}
          
          <div className="flex items-center gap-2">
              <label className='cursor-pointer shrink-0'>
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400 transition-colors border border-zinc-200 dark:border-white/10">
                      <Paperclip size={20} strokeWidth={2}/>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className='hidden' 
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if(file && file.type.startsWith("image/")){
                          setImageFile(file);
                      }
                  }}/>
              </label>

              <Input 
                type="text" 
                className='flex-1 h-11 rounded-xl bg-white/80 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-fuchsia-500/30 text-[15px]' 
                placeholder={imageFile ? "Add a caption..." : "Type a message..."} 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
              />

              <Button 
                type="submit" 
                disabled={(!imageFile && !message.trim()) || isUploading} 
                className='h-11 w-11 rounded-xl shrink-0 p-0 bg-linear-to-br from-fuchsia-500 to-fuchsia-400 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 border-0'
              >
                  {isUploading ? (
                      <Loader2 className='w-5 h-5 animate-spin text-white'/>
                  ) : (
                      <Send className='w-5 h-5 text-white ml-1 pl-0.5' strokeWidth={2.5}/>
                  )}
              </Button>
          </div>
      </form>
    </div>
  );
};

export default MessageInput;