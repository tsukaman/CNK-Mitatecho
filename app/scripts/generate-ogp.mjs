/**
 * OGP画像を32人分生成する。
 *
 * 事前準備:
 *   cd scripts/fonts/
 *   curl -LO https://github.com/google/fonts/raw/main/ofl/yujiboku/YujiBoku-Regular.ttf
 *   curl -LO https://github.com/google/fonts/raw/main/ofl/zenoldmincho/ZenOldMincho-Regular.ttf
 *   curl -LO https://github.com/google/fonts/raw/main/ofl/zenoldmincho/ZenOldMincho-Bold.ttf
 *
 * 実行:
 *   node scripts/generate-ogp.mjs
 */
import { readFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import TextToSVG from "text-to-svg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PUBLIC = resolve(ROOT, "public");
const OUT_DIR = resolve(PUBLIC, "ogp/characters");
const FONTS_DIR = resolve(__dirname, "fonts");

mkdirSync(OUT_DIR, { recursive: true });

const brushFont = TextToSVG.loadSync(resolve(FONTS_DIR, "YujiBoku-Regular.ttf"));
const zenBoldFont = TextToSVG.loadSync(resolve(FONTS_DIR, "ZenOldMincho-Bold.ttf"));
const zenRegFont = TextToSVG.loadSync(resolve(FONTS_DIR, "ZenOldMincho-Regular.ttf"));

const W = 1200;
const H = 630;
const GOLD = "#CAA85B";
const DARK = "#0f0f12";
const CREAM = "#f5eed8";
// 右半分中央 (x=500..1160) — 右側テキスト＆ロゴをこの x に揃える
const RIGHT_CENTER = 830;
// 上部タイトル画像の貼り位置と、mitate→thousand を一体に見せるための重なり
const TITLE_TOP = 50;
const TITLE_STACK_OVERLAP = 8;
const LOGO_TOP = 555;

const CHARACTERS = [
  { id: 1, name: "織田信長", title: "破壊的リファクタリングの革命児", slug: "01-oda-nobunaga" },
  { id: 2, name: "豊臣秀吉", title: "墨俣一夜城のプロトタイパー", slug: "02-toyotomi-hideyoshi" },
  { id: 3, name: "徳川家康", title: "鳴くまで待とうのSREアーキテクト", slug: "03-tokugawa-ieyasu" },
  { id: 4, name: "柴田勝家", title: "瓶割りデプロイの鬼武者", slug: "04-shibata-katsuie" },
  { id: 5, name: "丹羽長秀", title: "米五郎左のサイレントPM", slug: "05-niwa-nagahide" },
  { id: 6, name: "前田利家", title: "傾奇者からの成長型テックリード", slug: "06-maeda-toshiie" },
  { id: 7, name: "佐々成政", title: "さらさら越えのマイグレーション狂", slug: "07-sassa-narimasa" },
  { id: 8, name: "森蘭丸", title: "完璧主義のコードレビュー侍", slug: "08-mori-ranmaru" },
  { id: 9, name: "蜂須賀正勝", title: "川並衆のシャドウインフラ職人", slug: "09-hachisuka-masakatsu" },
  { id: 10, name: "加藤清正", title: "武者返しのプラットフォームエンジニア", slug: "10-kato-kiyomasa" },
  { id: 11, name: "福島正則", title: "フルスロットル暴走デプロイヤー", slug: "11-fukushima-masanori" },
  { id: 12, name: "山内一豊", title: "内助の功型ペアプログラマー", slug: "12-yamauchi-kazutoyo" },
  { id: 13, name: "本多忠勝", title: "生涯バグゼロの戦神エンジニア", slug: "13-honda-tadakatsu" },
  { id: 14, name: "酒井忠次", title: "海老すくいのムードメーカーSRE", slug: "14-sakai-tadatsugu" },
  { id: 15, name: "榊原康政", title: "忖度なしのコードレビュー旗本", slug: "15-sakakibara-yasumasa" },
  { id: 16, name: "井伊直政", title: "赤備えの若手スターエンジニア", slug: "16-ii-naomasa" },
  { id: 17, name: "服部半蔵", title: "伊賀越えのセキュリティアーキテクト", slug: "17-hattori-hanzo" },
  { id: 18, name: "濃姫", title: "マムシの血を引くダークホースアーキテクト", slug: "18-nohime" },
  { id: 19, name: "お市の方", title: "小豆袋の暗号化通信エンジニア", slug: "19-oichi" },
  { id: 20, name: "淀殿", title: "レガシーシステム死守の女城主", slug: "20-yodo-dono" },
  { id: 21, name: "江", title: "3度のリプレイスを生き抜いたレジリエンスの人", slug: "21-go" },
  { id: 22, name: "千代", title: "へそくり投資のクラウドコスト最適化師", slug: "22-chiyo" },
  { id: 23, name: "まつ", title: "加賀百万石を支えたVPoE", slug: "23-matsu" },
  { id: 24, name: "於大の方", title: "逆境のレジリエンスエンジニア", slug: "24-odai" },
  { id: 25, name: "竹中半兵衛", title: "16人で城を落とす最小構成アーキテクト", slug: "25-takenaka-hanbei" },
  { id: 26, name: "明智光秀", title: "本能寺リファクタの異端アーキテクト", slug: "26-akechi-mitsuhide" },
  { id: 27, name: "石田三成", title: "兵站のDevOpsマスター", slug: "27-ishida-mitsunari" },
  { id: 28, name: "千利休", title: "わび・さびのシンプルコード求道者", slug: "28-sen-no-rikyu" },
  { id: 29, name: "松尾芭蕉", title: "五七五のリファクタリング俳聖", slug: "29-matsuo-basho" },
  { id: 30, name: "今川義元", title: "海道一の弓取りアーキテクト", slug: "30-imagawa-yoshimoto" },
  { id: 31, name: "斎藤道三", title: "油売りから国主へのフルスタック下克上", slug: "31-saito-dosan" },
  { id: 32, name: "黒田長政", title: "関ヶ原の調略プルリクエスター", slug: "32-kuroda-nagamasa" },
];

/**
 * テキストをSVGパスに変換
 * width指定時はその幅に収まるように fontSize を自動調整
 */
function textToPath(font, text, { x, y, fontSize, fill, maxWidth, anchor = "left baseline" }) {
  let size = fontSize;
  let metrics = font.getMetrics(text, { fontSize: size });
  if (maxWidth && metrics.width > maxWidth) {
    size = Math.floor(size * (maxWidth / metrics.width));
    metrics = font.getMetrics(text, { fontSize: size });
  }
  const d = font.getD(text, { x, y, fontSize: size, anchor });
  return { d, width: metrics.width * (size / fontSize), height: metrics.height * (size / fontSize), fontSize: size, fill };
}

function buildSvg(character) {
  const paths = [
    textToPath(brushFont, character.name, {
      x: RIGHT_CENTER, y: 290, fontSize: 120, fill: CREAM, maxWidth: 660, anchor: "center baseline",
    }),
    textToPath(zenBoldFont, `「${character.title}」`, {
      x: RIGHT_CENTER, y: 380, fontSize: 38, fill: GOLD, maxWidth: 660, anchor: "center baseline",
    }),
    textToPath(zenRegFont, "──── AIが詠む、汝だけの一首 ────", {
      x: RIGHT_CENTER, y: 490, fontSize: 26, fill: "#d8c48a", maxWidth: 660, anchor: "center baseline",
    }),
    textToPath(zenRegFont, "戦国武将 × エンジニアタイプ診断", {
      x: RIGHT_CENTER, y: 540, fontSize: 20, fill: "#d8c48a", maxWidth: 540, anchor: "center baseline",
    }),
  ];
  const pathSvgs = paths.map(p => `<path d="${p.d}" fill="${p.fill}" />`).join("");
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${pathSvgs}</svg>`);
}

// PNG オーバーレイを読み込んで中央寄せ用の x も計算して返す。
// tint=true なら negate で黒筆→白筆に変換（暗背景でも視認できるように）。
async function loadCenteredOverlay(srcPath, width, { tint = false } = {}) {
  const pipeline = sharp(srcPath).resize({ width });
  if (tint) pipeline.negate({ alpha: false });
  const { data, info } = await pipeline.png().toBuffer({ resolveWithObject: true });
  return {
    buffer: data,
    width: info.width,
    height: info.height,
    x: Math.round(RIGHT_CENTER - info.width / 2),
  };
}

async function buildBackground() {
  // 濃い墨色のグラデ背景 + 左下に金のグロー + 和紙テクスチャ
  const bgSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <radialGradient id="glow" cx="30%" cy="60%" r="75%">
        <stop offset="0%" stop-color="#2a1f10" />
        <stop offset="60%" stop-color="#12100b" />
        <stop offset="100%" stop-color="#0a0908" />
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#glow)" />
  </svg>`);

  // 和紙テクスチャを薄くオーバーレイ
  const washi = await sharp(resolve(PUBLIC, "texture-washi.webp"))
    .resize(W, H, { fit: "cover" })
    .modulate({ brightness: 0.35 })
    .ensureAlpha(0.18)
    .toBuffer();

  return sharp(bgSvg)
    .composite([{ input: washi, blend: "screen" }])
    .png()
    .toBuffer();
}

async function buildPortrait(slug) {
  // portrait WebP (480x720) を 380x570 に縮小し、金の枠で囲む
  const portraitSrc = resolve(PUBLIC, "characters", `${slug}.webp`);
  const portrait = await sharp(portraitSrc)
    .resize(380, 570, { fit: "cover" })
    .toBuffer();

  // 金の枠＋内側のクリームマット
  const framedSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="420" height="610">
    <rect x="0" y="0" width="420" height="610" rx="8" fill="${GOLD}" />
    <rect x="16" y="16" width="388" height="578" rx="4" fill="${CREAM}" />
  </svg>`);

  return sharp(framedSvg)
    .composite([{ input: portrait, top: 20, left: 20 }])
    .png()
    .toBuffer();
}

async function generateOne(character, shared) {
  const portrait = await buildPortrait(character.slug);
  const textSvg = buildSvg(character);
  const { bg, titleMitate, titleThousand, logoWide } = shared;

  const outPath = resolve(OUT_DIR, `${character.slug}.png`);
  await sharp(bg)
    .composite([
      { input: portrait, top: 10, left: 40 },
      { input: titleMitate.buffer, top: TITLE_TOP, left: titleMitate.x },
      {
        input: titleThousand.buffer,
        top: TITLE_TOP + titleMitate.height - TITLE_STACK_OVERLAP,
        left: titleThousand.x,
      },
      { input: textSvg, top: 0, left: 0 },
      { input: logoWide.buffer, top: LOGO_TOP, left: logoWide.x },
    ])
    .png({ quality: 90 })
    .toFile(outPath);
}

async function main() {
  const start = Date.now();
  console.log(`Generating ${CHARACTERS.length} OGP images...`);

  // 32人で共通の素材は1回だけ作る
  const [bg, titleMitate, titleThousand, logoWide] = await Promise.all([
    buildBackground(),
    loadCenteredOverlay(resolve(PUBLIC, "title-mitate.png"), 420, { tint: true }),
    loadCenteredOverlay(resolve(PUBLIC, "title-thousand.png"), 200),
    loadCenteredOverlay(resolve(PUBLIC, "logo-wide.png"), 300, { tint: true }),
  ]);
  const shared = { bg, titleMitate, titleThousand, logoWide };

  for (const c of CHARACTERS) {
    await generateOne(c, shared);
    const bytes = statSync(resolve(OUT_DIR, `${c.slug}.png`)).size;
    console.log(`  ✓ ${c.slug}.png  (${Math.round(bytes / 1024)} KB)`);
  }
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Done in ${elapsed}s`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
