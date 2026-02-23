"use client";

import { createContext, useContext, useCallback, useState } from "react";

interface TransitionContextType {
  navigateWithTransition: (url: string) => void;
}

const TransitionContext = createContext<TransitionContextType>({
  navigateWithTransition: () => {},
});

export function usePageTransition() {
  return useContext(TransitionContext);
}

export default function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"idle" | "out">("idle");

  const navigateWithTransition = useCallback((url: string) => {
    setPhase("out");
    // 白いオーバーレイが完全に覆った後に遷移
    setTimeout(() => {
      window.location.href = url;
    }, 900);
  }, []);

  return (
    <TransitionContext.Provider value={{ navigateWithTransition }}>
      {/* トランジションオーバーレイ */}
      {phase === "out" && (
        <div className="page-transition-overlay" />
      )}
      {children}
    </TransitionContext.Provider>
  );
}
