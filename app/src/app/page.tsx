import Link from "next/link";
import Image from "next/image";
import TitleLogo from "@/components/TitleLogo";

const CARDS = [
  { id: 1, name: "壱", color: "紅", colorCode: "#c43c3c", kanji: "紅", stage: "合戦前夜の陣中" },
  { id: 2, name: "弐", color: "藍", colorCode: "#4a7fb5", kanji: "藍", stage: "月夜の城下町" },
  { id: 3, name: "参", color: "翠", colorCode: "#4a8c5c", kanji: "翠", stage: "山あいの隠れ里" },
  { id: 4, name: "肆", color: "金", colorCode: "#b8963e", kanji: "金", stage: "天守閣の大広間" },
  { id: 5, name: "伍", color: "紫", colorCode: "#8b5cad", kanji: "紫", stage: "霧に包まれた古寺" },
  { id: 6, name: "陸", color: "白", colorCode: "#8a9aad", kanji: "白", stage: "雪の茶室" },
];

const STAGGER = [
  "animate-fade-in-d1",
  "animate-fade-in-d2",
  "animate-fade-in-d3",
  "animate-fade-in-d4",
  "animate-fade-in-d5",
  "animate-fade-in-d6",
];

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-8">
      {/* ヒーローセクション */}
      <section className="relative -mx-4 -mt-20 flex min-h-[60vh] w-[calc(100%+2rem)] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-bg.webp"
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative z-10 flex flex-col items-center px-4 py-16 text-center">
          <Image
            src="/logo-compact.png"
            alt="クラウドネイティブ会議"
            width={120}
            height={120}
            className="mb-6 drop-shadow-lg"
            priority
          />
          <TitleLogo />
          <div className="kinpaku-line mx-auto mt-4 w-32" />
          <p className="mt-4 text-sm font-bold text-sumi-800 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
            汝の戦国エンジニア格を占わん
          </p>
        </div>
      </section>

      {/* カード選択セクション */}
      <p className="text-center text-xs text-sumi-500">
        直感で一枚、選ばれよ
      </p>

      <div className="relative grid w-full grid-cols-2 gap-3">
        {/* 墨絵城 装飾背景 */}
        <div className="pointer-events-none absolute -bottom-8 -right-4 z-0 w-48 opacity-[0.06]">
          <Image
            src="/nagoya-castle-ink.png"
            alt=""
            width={384}
            height={211}
            className="object-contain"
          />
        </div>
        {CARDS.map((card, i) => (
          <Link
            key={card.id}
            href={`/select/${card.id}`}
            className={`cnk-card group relative z-10 flex flex-col items-center gap-2 p-4 ${STAGGER[i]}`}
            style={{ borderTopColor: card.colorCode, borderTopWidth: "3px" }}
          >
            <span
              className="text-3xl font-black transition-all duration-300 group-hover:scale-110"
              style={{ color: card.colorCode }}
            >
              {card.kanji}
            </span>
            <span className="text-xs font-bold text-sumi-900">
              {card.name}の巻
            </span>
            <span className="text-[10px] text-sumi-500">
              {card.stage}
            </span>
          </Link>
        ))}
      </div>

      <div className="animate-fade-in rounded-lg border border-sumi-200 bg-washi-200 p-4 text-center">
        <p className="text-xs text-sumi-500">
          プレーリーカードをお持ちの方は<br />
          カードをかざして診断を始めてください
        </p>
      </div>
    </div>
  );
}
