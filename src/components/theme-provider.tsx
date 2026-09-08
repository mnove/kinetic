import { createContext, useContext, useEffect, useState } from "react"
import { ScriptOnce } from "@tanstack/react-router"

export type Theme = "light" | "dark" | "system"
const storageKey = "kinetic-theme"
const isTheme = (value: unknown): value is Theme =>
  value === "light" || value === "dark" || value === "system"
const ThemeContext = createContext<
  { theme: Theme; setTheme: (theme: Theme) => void } | undefined
>(undefined)

// Apply before hydration, including when localStorage is unavailable.
export const themeScript = `(function(){var t='system';try{var s=localStorage.getItem('${storageKey}');if(s==='light'||s==='dark'||s==='system')t=s}catch(e){}var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.remove('light','dark');r.classList.add(d?'dark':'light');r.style.colorScheme=d?'dark':'light'})();`
function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  document.documentElement.classList.remove("light", "dark")
  document.documentElement.classList.add(dark ? "dark" : "light")
  document.documentElement.style.colorScheme = dark ? "dark" : "light"
}
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (isTheme(stored)) setThemeState(stored)
    } catch {
      /* Storage can be disabled; the switch still works. */
    }
    setMounted(true)
  }, [])
  useEffect(() => {
    if (!mounted) return
    applyTheme(theme)
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const change = () => {
      if (theme === "system") applyTheme(theme)
    }
    const sync = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null)
        setThemeState(isTheme(event.newValue) ? event.newValue : "system")
    }
    media.addEventListener("change", change)
    window.addEventListener("storage", sync)
    return () => {
      media.removeEventListener("change", change)
      window.removeEventListener("storage", sync)
    }
  }, [theme, mounted])
  const setTheme = (next: Theme) => {
    try {
      localStorage.setItem(storageKey, next)
    } catch {
      /* Keep the in-memory preference. */
    }
    applyTheme(next)
    setThemeState(next)
  }
  return (
    <ThemeContext value={{ theme, setTheme }}>
      <ScriptOnce>{themeScript}</ScriptOnce>
      {children}
    </ThemeContext>
  )
}
export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error("useTheme must be used within a ThemeProvider")
  return value
}
