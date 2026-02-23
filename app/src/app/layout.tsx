import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransitionProvider from "@/components/PageTransition";

export const metadata: Metadata = {
  metadataBase: new URL("https://cnk-mitatecho.pages.dev"),
  title: "風雲戦国見立帖 〜千人一首〜",
  description: "戦国人物 × エンジニアタイプ診断 + AIパーソナライズ短歌 ── プレーリーカード × クラウドネイティブ会議 2026",
  icons: { icon: "/favicon.png", apple: "/cnk-icon.png" },
  openGraph: {
    title: "風雲戦国見立帖 〜千人一首〜",
    description: "戦国武将 × エンジニアタイプ診断 + AIパーソナライズ短歌",
    // images: ["/og-image.png"],  // OGP画像ができたら有効化
  },
  twitter: {
    card: "summary",
    title: "風雲戦国見立帖 〜千人一首〜",
    description: "戦国武将 × エンジニアタイプ診断 + AIパーソナライズ短歌",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700;900&family=Yuji+Boku&family=Yuji+Syuku&family=Zen+Old+Mincho:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-washi-100 text-sumi-950 font-serif antialiased">
        <PageTransitionProvider>
          <Header />
          <main className="relative z-10 page-enter">
            {children}
          </main>
          <Footer />
        </PageTransitionProvider>
      </body>
    </html>
  );
}
