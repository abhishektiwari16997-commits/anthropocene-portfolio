import { type ReactNode, createContext, useContext, useState } from "react";

type Visibility = "live" | "private";

interface VisibilityContextType {
  toggleVisibility: (id: string) => void;
  isVisible: (id: string) => boolean;
  visibilityMap: Map<string, Visibility>;
}

const VisibilityContext = createContext<VisibilityContextType | null>(null);

export function VisibilityContextProvider({
  children,
}: { children: ReactNode }) {
  const [visibilityMap, setVisibilityMap] = useState<Map<string, Visibility>>(
    new Map(),
  );

  const toggleVisibility = (id: string) => {
    setVisibilityMap((prev) => {
      const next = new Map(prev);
      const current = next.get(id) ?? "live";
      next.set(id, current === "live" ? "private" : "live");
      return next;
    });
  };

  const isVisible = (id: string) => {
    return (visibilityMap.get(id) ?? "live") === "live";
  };

  return (
    <VisibilityContext.Provider
      value={{ toggleVisibility, isVisible, visibilityMap }}
    >
      {children}
    </VisibilityContext.Provider>
  );
}

export function useVisibility() {
  const ctx = useContext(VisibilityContext);
  if (!ctx)
    throw new Error(
      "useVisibility must be used within VisibilityContextProvider",
    );
  return ctx;
}
