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
    <>
      {/* ヒーローセクション — 全幅 */}
      <section className="relative w-full min-h-[28vh] sm:min-h-[32vh] overflow-hidden">
        <Image
          src="/hero-bg.webp"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        <div className="relative z-10 flex min-h-[28vh] sm:min-h-[32vh] flex-col items-center justify-center px-4 pt-24 pb-8 text-center">
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
            汝の心に宿る戦国の魂、見定めん
          </p>
        </div>
      </section>

      {/* 黒帯セクション — 全幅 */}
      <div className="w-full bg-sumi-950 py-5">
        <p className="text-center text-base font-bold tracking-[0.25em] text-washi-100" style={{ fontFamily: "var(--font-zen)" }}>
          直感で一枚、選ばれよ
        </p>
      </div>

      {/* カード選択セクション */}
      <div className="relative mx-auto max-w-lg px-4 pb-8 flex flex-col items-center gap-8 pt-10">
        {/* 墨絵城 装飾背景 */}
        <div className="pointer-events-none absolute bottom-0 -right-16 z-0 w-72 opacity-[0.12]">
          <Image
            src="/nagoya-castle-ink.png"
            alt=""
            width={384}
            height={211}
            className="object-contain"
          />
        </div>

        <div className="relative z-10 grid w-full grid-cols-2 gap-3">
          {CARDS.map((card, i) => (
            <Link
              key={card.id}
              href={`/select/${card.id}`}
              className={`cnk-card group relative flex flex-col items-center gap-2 p-4 ${STAGGER[i]}`}
              style={{ borderTopColor: card.colorCode, borderTopWidth: "3px" }}
            >
              <span
                className="text-4xl font-black transition-all duration-300 group-hover:scale-110"
                style={{ color: card.colorCode }}
              >
                {card.kanji}
              </span>
              <span className="text-sm font-bold text-sumi-900">
                {card.name}の巻
              </span>
              <span className="text-xs text-sumi-600">
                {card.stage}
              </span>
            </Link>
          ))}
        </div>

        <div className="relative z-10 mt-4 animate-fade-in rounded-lg border border-sumi-200 bg-washi-200/80 backdrop-blur-sm p-4 text-center">
          <p className="text-xs text-sumi-400">
            本診断はイベントを楽しむための余興です。<br />結果はあくまでお遊びとしてお楽しみください。
          </p>
        </div>
      </div>
    </>
  );
}
