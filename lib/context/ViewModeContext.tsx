"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type ViewMode = "spiral" | "list";

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextType>({
  viewMode: "spiral",
  setViewMode: () => {},
});

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>("spiral");
  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export const useViewMode = () => useContext(ViewModeContext);
