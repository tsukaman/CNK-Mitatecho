import Image from "next/image";

/**
 * 題字コンポーネント — 手書き題字画像を使用
 */
export default function TitleLogo() {
  return (
    <div className="title-logo flex flex-col items-center -space-y-1">
      <Image
        src="/title-mitate.png"
        alt="風雲戦国見立帖"
        width={480}
        height={94}
        className="h-auto w-[380px] sm:w-[480px] drop-shadow-[0_2px_4px_rgba(255,255,255,0.9)]"
        priority
      />
      <Image
        src="/title-thousand.png"
        alt="〜千人一首〜"
        width={320}
        height={75}
        className="h-auto w-[160px] sm:w-[200px] drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]"
        priority
      />
    </div>
  );
}
