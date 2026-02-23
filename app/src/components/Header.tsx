"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 h-14">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-compact.png"
            alt="クラウドネイティブ会議"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <span className="text-sm font-bold text-sumi-900">千人一首</span>
        </Link>
      </div>
    </header>
  );
}
