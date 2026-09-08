// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ThemeProvider, themeScript, useTheme } from "./theme-provider"
import { ModeToggle } from "./mode-toggle"

vi.mock("@tanstack/react-router", () => ({ ScriptOnce: () => null }))
let dark = false
let media: EventTarget & { readonly matches: boolean }
function Harness() {
  const { theme, setTheme } = useTheme()
  return (
    <>
      <output>{theme}</output>
      <button onClick={() => setTheme("dark")}>Dark</button>
      <button onClick={() => setTheme("light")}>Light</button>
      <button onClick={() => setTheme("system")}>System</button>
    </>
  )
}
beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ""
  dark = false
  media = Object.assign(new EventTarget(), {
    get matches() {
      return dark
    },
  })
  Object.defineProperty(media, "matches", { get: () => dark })
  vi.stubGlobal("matchMedia", () => media)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
describe("theme initialization and persistence", () => {
  it("lets the shadcn theme menu select dark mode", async () => {
    render(
      <ThemeProvider>
        <ModeToggle />
      </ThemeProvider>
    )
    fireEvent.click(screen.getByRole("button", { name: "Choose color theme" }))
    const option = await screen.findByRole("menuitemradio", { name: "Dark" })
    fireEvent.click(option)
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(localStorage.getItem("kinetic-theme")).toBe("dark")
  })
  it("applies the saved theme before hydration and falls back to the system when storage fails", () => {
    localStorage.setItem("kinetic-theme", "dark")
    window.eval(themeScript)
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe("dark")
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("disabled")
    })
    window.eval(themeScript)
    expect(document.documentElement.classList.contains("light")).toBe(true)
  })
  it("follows system changes only while System is selected", () => {
    render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>
    )
    act(() => {
      dark = true
      media.dispatchEvent(new Event("change"))
    })
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    fireEvent.click(screen.getByText("Light"))
    expect(localStorage.getItem("kinetic-theme")).toBe("light")
    act(() => media.dispatchEvent(new Event("change")))
    expect(document.documentElement.classList.contains("light")).toBe(true)
    fireEvent.click(screen.getByText("System"))
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })
  it("keeps manual theme selection working when storage is disabled", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("disabled")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("disabled")
    })
    render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>
    )
    fireEvent.click(screen.getByText("Dark"))
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })
  it("loads the saved preference and synchronizes changes from another tab", () => {
    localStorage.setItem("kinetic-theme", "dark")
    render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>
    )
    expect(screen.getByRole("status").textContent).toBe("dark")
    act(() =>
      window.dispatchEvent(
        new StorageEvent("storage", { key: "kinetic-theme", newValue: "light" })
      )
    )
    expect(screen.getByRole("status").textContent).toBe("light")
    expect(document.documentElement.classList.contains("light")).toBe(true)
  })
})
