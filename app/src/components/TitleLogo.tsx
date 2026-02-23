/**
 * 仮置き題字コンポーネント
 * 本番の手書き題字画像が届いたら <Image> に差し替える
 */
export default function TitleLogo() {
  return (
    <div className="title-logo flex flex-col items-center gap-1">
      <h1 className="font-brush text-[2.5rem] leading-tight font-black tracking-widest text-sumi-950 drop-shadow-[0_2px_4px_rgba(255,255,255,0.9)]">
        風雲戦国見立帖
      </h1>
      <p className="font-brush text-lg font-bold tracking-wider text-beni-800 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
        〜千人一首〜
      </p>
    </div>
  );
}
