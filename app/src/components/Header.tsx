"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function Header() {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > lastY.current && y > 60);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-sumi-950/10 bg-washi-100/90 backdrop-blur-sm transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
      style={{ fontFamily: "var(--font-zen)" }}
    >
      <div className="flex items-center px-4 h-14">
        <a href="https://kaigi.cloudnativedays.jp/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
          <Image
            src="/cnk-icon.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <Image
            src="/logo-wide.png"
            alt="クラウドネイティブ会議"
            width={160}
            height={24}
            className="h-5 w-auto object-contain"
          />
        </a>
      </div>
    </header>
  );
}
