import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type UIMode = "hud" | "simple";

interface UIModeContextType {
  mode: UIMode;
  setMode: (mode: UIMode) => void;
  toggleMode: () => void;
  isSimple: boolean;
  isHud: boolean;
}

const UIModeContext = createContext<UIModeContextType | undefined>(undefined);

const STORAGE_KEY = "sellora-ui-mode";

export function UIModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<UIMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "hud" || saved === "simple") return saved;
    }
    // Default for first-time visitors is "simple"
    return "simple";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
    // Apply data attribute to root for CSS-level mode switching if needed
    document.documentElement.setAttribute("data-ui-mode", mode);
  }, [mode]);

  const setMode = (m: UIMode) => setModeState(m);
  const toggleMode = () => setModeState((prev) => (prev === "hud" ? "simple" : "hud"));

  return (
    <UIModeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        isSimple: mode === "simple",
        isHud: mode === "hud",
      }}
    >
      {children}
    </UIModeContext.Provider>
  );
}

export function useUIMode() {
  const ctx = useContext(UIModeContext);
  if (!ctx) {
    throw new Error("useUIMode must be used within a UIModeProvider");
  }
  return ctx;
}
