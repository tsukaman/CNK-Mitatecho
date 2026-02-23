"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route - redirect to top page */
export default function DiagnoseRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <p className="text-center text-sm text-sumi-400">リダイレクト中...</p>
  );
}
