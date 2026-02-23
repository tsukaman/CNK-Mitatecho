import Image from "next/image";

export default function Footer() {
  return (
    <footer className="relative mt-16 bg-sumi-950 py-10 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-5">
        <Image
          src="/brush-stroke.webp"
          alt=""
          fill
          className="object-cover mix-blend-overlay"
        />
      </div>
      <div className="relative z-10 mx-auto px-4 text-center">
        <Image
          src="/logo-wide.png"
          alt="クラウドネイティブ会議"
          width={200}
          height={38}
          className="mx-auto mb-4 h-10 w-auto brightness-0 invert"
        />
        <div className="mb-6 flex justify-center gap-6 text-sm text-sumi-400">
          <a
            href="https://kaigi.cloudnativedays.jp/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-sumi-100"
          >
            プライバシーポリシー
          </a>
          <a
            href="https://kaigi.cloudnativedays.jp/coc"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-sumi-100"
          >
            行動規範
          </a>
        </div>
        <p className="text-xs text-sumi-400">
          © クラウドネイティブ会議 Committee. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
