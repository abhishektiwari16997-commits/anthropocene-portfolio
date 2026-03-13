import { createContext, useContext, useState } from "react";

interface CursorContextType {
  isRevealed: boolean;
  setIsRevealed: (v: boolean) => void;
  isHoveringCTA: boolean;
  setIsHoveringCTA: (v: boolean) => void;
  cursorLabel: string;
  setCursorLabel: (v: string) => void;
  suppressDefaultLabel: boolean;
  setSuppressDefaultLabel: (v: boolean) => void;
}

const CursorContext = createContext<CursorContextType>({
  isRevealed: false,
  setIsRevealed: () => {},
  isHoveringCTA: false,
  setIsHoveringCTA: () => {},
  cursorLabel: "",
  setCursorLabel: () => {},
  suppressDefaultLabel: false,
  setSuppressDefaultLabel: () => {},
});

export function CursorProvider({ children }: { children: React.ReactNode }) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isHoveringCTA, setIsHoveringCTA] = useState(false);
  const [cursorLabel, setCursorLabel] = useState("");
  const [suppressDefaultLabel, setSuppressDefaultLabel] = useState(false);
  return (
    <CursorContext.Provider
      value={{
        isRevealed,
        setIsRevealed,
        isHoveringCTA,
        setIsHoveringCTA,
        cursorLabel,
        setCursorLabel,
        suppressDefaultLabel,
        setSuppressDefaultLabel,
      }}
    >
      {children}
    </CursorContext.Provider>
  );
}

export function useCursor() {
  return useContext(CursorContext);
}
