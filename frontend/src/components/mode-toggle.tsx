"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // 1. Prevent Next.js hydration mismatch
  React.useEffect(() => setMounted(true), [])
  if (!mounted) return null

  // 2. Safely check the actual visual state, even if set to "system"
  const currentTheme = theme === "system" ? resolvedTheme : theme

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      className="rounded-full bg-white dark:bg-[#121214] border border-zinc-200 dark:border-white/10 shadow-md hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] text-zinc-800 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] text-zinc-200 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}