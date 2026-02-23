#!/usr/bin/env python3
"""
OGP画像生成スクリプト
- サイト共通OGP画像 (og-image.png)
- 武将ごとのOGP画像 (ogp/char-{1..32}.png)
"""

from PIL import Image, ImageDraw, ImageFont
import os
import json

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(BASE_DIR, "app", "public")
OGP_DIR = os.path.join(PUBLIC_DIR, "ogp")
os.makedirs(OGP_DIR, exist_ok=True)

# Image dimensions (OGP standard)
W, H = 1200, 630

# Font paths (macOS)
FONT_MINCHO = "/System/Library/Fonts/ヒラギノ明朝 ProN.ttc"

# Assets
HERO_BG = os.path.join(PUBLIC_DIR, "hero-bg.webp")
TITLE_MITATE = os.path.join(PUBLIC_DIR, "title-mitate.png")
TITLE_THOUSAND = os.path.join(PUBLIC_DIR, "title-thousand.png")
LOGO = os.path.join(PUBLIC_DIR, "logo-compact.png")
CASTLE = os.path.join(PUBLIC_DIR, "nagoya-castle-ink.png")

# Character data
CHARACTERS = [
    {"id": 1, "name": "織田信長", "title": "破壊的リファクタリングの革命児", "colorCode": "#c43c3c"},
    {"id": 2, "name": "豊臣秀吉", "title": "墨俣一夜城のプロトタイパー", "colorCode": "#c43c3c"},
    {"id": 3, "name": "徳川家康", "title": "鳴くまで待とうのSREアーキテクト", "colorCode": "#c43c3c"},
    {"id": 4, "name": "柴田勝家", "title": "瓶割りデプロイの鬼武者", "colorCode": "#c43c3c"},
    {"id": 5, "name": "丹羽長秀", "title": "米五郎左のサイレントPM", "colorCode": "#c43c3c"},
    {"id": 6, "name": "前田利家", "title": "傾奇者からの成長型テックリード", "colorCode": "#c43c3c"},
    {"id": 7, "name": "佐々成政", "title": "さらさら越えのマイグレーション狂", "colorCode": "#c43c3c"},
    {"id": 8, "name": "森蘭丸", "title": "完璧主義のコードレビュー侍", "colorCode": "#4a7fb5"},
    {"id": 9, "name": "蜂須賀正勝", "title": "川並衆のシャドウインフラ職人", "colorCode": "#4a8c5c"},
    {"id": 10, "name": "加藤清正", "title": "武者返しのプラットフォームエンジニア", "colorCode": "#4a7fb5"},
    {"id": 11, "name": "福島正則", "title": "フルスロットル暴走デプロイヤー", "colorCode": "#c43c3c"},
    {"id": 12, "name": "山内一豊", "title": "内助の功型ペアプログラマー", "colorCode": "#4a7fb5"},
    {"id": 13, "name": "本多忠勝", "title": "生涯バグゼロの戦神エンジニア", "colorCode": "#4a7fb5"},
    {"id": 14, "name": "酒井忠次", "title": "海老すくいのムードメーカーSRE", "colorCode": "#c43c3c"},
    {"id": 15, "name": "榊原康政", "title": "忖度なしのコードレビュー旗本", "colorCode": "#4a7fb5"},
    {"id": 16, "name": "井伊直政", "title": "赤備えの若手スターエンジニア", "colorCode": "#c43c3c"},
    {"id": 17, "name": "服部半蔵", "title": "伊賀越えのセキュリティアーキテクト", "colorCode": "#c43c3c"},
    {"id": 18, "name": "濃姫", "title": "マムシの血を引くダークホースアーキテクト", "colorCode": "#4a7fb5"},
    {"id": 19, "name": "お市の方", "title": "小豆袋の暗号化通信エンジニア", "colorCode": "#4a7fb5"},
    {"id": 20, "name": "淀殿", "title": "レガシーシステム死守の女城主", "colorCode": "#4a8c5c"},
    {"id": 21, "name": "江", "title": "3度のリプレイスを生き抜いたレジリエンスの人", "colorCode": "#4a8c5c"},
    {"id": 22, "name": "千代", "title": "へそくり投資のクラウドコスト最適化師", "colorCode": "#4a8c5c"},
    {"id": 23, "name": "まつ", "title": "加賀百万石を支えたVPoE", "colorCode": "#4a7fb5"},
    {"id": 24, "name": "於大の方", "title": "逆境のレジリエンスエンジニア", "colorCode": "#4a8c5c"},
    {"id": 25, "name": "竹中半兵衛", "title": "16人で城を落とす最小構成アーキテクト", "colorCode": "#c43c3c"},
    {"id": 26, "name": "明智光秀", "title": "本能寺リファクタの異端アーキテクト", "colorCode": "#c43c3c"},
    {"id": 27, "name": "石田三成", "title": "兵站のDevOpsマスター", "colorCode": "#4a7fb5"},
    {"id": 28, "name": "千利休", "title": "わび・さびのシンプルコード求道者", "colorCode": "#8b5cad"},
    {"id": 29, "name": "松尾芭蕉", "title": "五七五のリファクタリング俳聖", "colorCode": "#4a8c5c"},
    {"id": 30, "name": "今川義元", "title": "海道一の弓取りアーキテクト", "colorCode": "#4a7fb5"},
    {"id": 31, "name": "斎藤道三", "title": "油売りから国主へのフルスタック下克上", "colorCode": "#c43c3c"},
    {"id": 32, "name": "黒田長政", "title": "関ヶ原の調略プルリクエスター", "colorCode": "#c43c3c"},
]


def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def load_bg():
    """背景画像を読み込み、OGPサイズにクロップ"""
    bg = Image.open(HERO_BG).convert("RGBA")
    # Center crop to 1200x630
    ratio = max(W / bg.width, H / bg.height)
    bg = bg.resize((int(bg.width * ratio), int(bg.height * ratio)), Image.LANCZOS)
    left = (bg.width - W) // 2
    top = (bg.height - H) // 2
    bg = bg.crop((left, top, left + W, top + H))
    return bg


def create_common_ogp():
    """サイト共通OGP画像を生成"""
    img = load_bg()
    draw = ImageDraw.Draw(img)

    # Semi-transparent dark overlay
    overlay = Image.new("RGBA", (W, H), (20, 20, 20, 140))
    img = Image.alpha_composite(img, overlay)

    # Title mitate
    mitate = Image.open(TITLE_MITATE).convert("RGBA")
    mitate_w = 700
    mitate_h = int(mitate.height * mitate_w / mitate.width)
    mitate = mitate.resize((mitate_w, mitate_h), Image.LANCZOS)
    mx = (W - mitate_w) // 2
    img.paste(mitate, (mx, 160), mitate)

    # Title thousand
    thousand = Image.open(TITLE_THOUSAND).convert("RGBA")
    thousand_w = 280
    thousand_h = int(thousand.height * thousand_w / thousand.width)
    thousand = thousand.resize((thousand_w, thousand_h), Image.LANCZOS)
    tx = (W - thousand_w) // 2
    img.paste(thousand, (tx, 160 + mitate_h - 5), thousand)

    # Logo
    logo = Image.open(LOGO).convert("RGBA")
    logo_w = 80
    logo_h = int(logo.height * logo_w / logo.width)
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
    img.paste(logo, ((W - logo_w) // 2, 70), logo)

    # Subtitle text
    draw = ImageDraw.Draw(img)
    font_sub = ImageFont.truetype(FONT_MINCHO, 22)
    subtitle = "戦国武将 × エンジニアタイプ診断 + AI短歌"
    bbox = draw.textbbox((0, 0), subtitle, font=font_sub)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, 160 + mitate_h + thousand_h + 20), subtitle, fill=(240, 240, 235), font=font_sub)

    # Gold line
    line_y = 160 + mitate_h + thousand_h + 55
    draw.rectangle([(W // 2 - 80, line_y), (W // 2 + 80, line_y + 2)], fill=(202, 168, 91))

    # Bottom text
    font_bottom = ImageFont.truetype(FONT_MINCHO, 16)
    bottom_text = "クラウドネイティブ会議 2026"
    bbox = draw.textbbox((0, 0), bottom_text, font=font_bottom)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, line_y + 15), bottom_text, fill=(180, 180, 170), font=font_bottom)

    # Save
    out_path = os.path.join(PUBLIC_DIR, "og-image.png")
    img.convert("RGB").save(out_path, quality=95)
    print(f"✅ Common OGP: {out_path}")


def create_character_ogp(char):
    """武将ごとのOGP画像を生成"""
    img = load_bg()

    # Dark overlay
    overlay = Image.new("RGBA", (W, H), (20, 20, 20, 180))
    img = Image.alpha_composite(img, overlay)

    # Color accent bar at top
    color = hex_to_rgb(char["colorCode"])
    accent = Image.new("RGBA", (W, 5), (*color, 255))
    img.paste(accent, (0, 0), accent)

    # Color accent bar at bottom
    accent_bottom = Image.new("RGBA", (W, 3), (*color, 180))
    img.paste(accent_bottom, (0, H - 3), accent_bottom)

    draw = ImageDraw.Draw(img)

    # Castle decoration (bottom right, subtle)
    castle = Image.open(CASTLE).convert("RGBA")
    castle_w = 280
    castle_h = int(castle.height * castle_w / castle.width)
    castle = castle.resize((castle_w, castle_h), Image.LANCZOS)
    # Make it very subtle
    castle_faded = castle.copy()
    alpha = castle_faded.split()[3]
    alpha = alpha.point(lambda p: int(p * 0.08))
    castle_faded.putalpha(alpha)
    img.paste(castle_faded, (W - castle_w + 40, H - castle_h + 20), castle_faded)

    # Title mitate (smaller, top area)
    mitate = Image.open(TITLE_MITATE).convert("RGBA")
    mitate_w = 400
    mitate_h = int(mitate.height * mitate_w / mitate.width)
    mitate = mitate.resize((mitate_w, mitate_h), Image.LANCZOS)
    img.paste(mitate, ((W - mitate_w) // 2, 40), mitate)

    # Decorative line
    line_y = 40 + mitate_h + 15
    draw.rectangle([(W // 2 - 60, line_y), (W // 2 + 60, line_y + 2)], fill=(*color, 200))

    # "汝の見立て" label
    font_label = ImageFont.truetype(FONT_MINCHO, 18)
    label = "── 汝の見立て ──"
    bbox = draw.textbbox((0, 0), label, font=font_label)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, line_y + 20), label, fill=(160, 160, 150), font=font_label)

    # Character name (large)
    font_name = ImageFont.truetype(FONT_MINCHO, 72)
    name = char["name"]
    bbox = draw.textbbox((0, 0), name, font=font_name)
    tw = bbox[2] - bbox[0]
    name_y = line_y + 60
    # Glow effect
    for dx, dy in [(-2, -2), (2, -2), (-2, 2), (2, 2), (0, -2), (0, 2), (-2, 0), (2, 0)]:
        draw.text(((W - tw) // 2 + dx, name_y + dy), name, fill=(*color, 40), font=font_name)
    draw.text(((W - tw) // 2, name_y), name, fill=(245, 245, 240), font=font_name)

    # Title (subtitle)
    font_title = ImageFont.truetype(FONT_MINCHO, 24)
    title = f"「{char['title']}」"
    bbox = draw.textbbox((0, 0), title, font=font_title)
    tw = bbox[2] - bbox[0]
    title_y = name_y + 90
    draw.text(((W - tw) // 2, title_y), title, fill=(*color, 255), font=font_title)

    # Bottom area -千人一首 label
    font_bottom = ImageFont.truetype(FONT_MINCHO, 16)
    bottom = "風雲戦国見立帖 〜千人一首〜"
    bbox = draw.textbbox((0, 0), bottom, font=font_bottom)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, H - 50), bottom, fill=(140, 140, 130), font=font_bottom)

    # Save
    out_path = os.path.join(OGP_DIR, f"char-{char['id']}.png")
    img.convert("RGB").save(out_path, quality=95)
    print(f"  ✅ Character {char['id']:2d}: {char['name']} → {out_path}")


def main():
    print("🎨 OGP画像生成開始")
    print()

    print("📌 サイト共通OGP画像")
    create_common_ogp()
    print()

    print("📌 武将別OGP画像 (32枚)")
    for char in CHARACTERS:
        create_character_ogp(char)
    print()

    print(f"✨ 完了！合計 {1 + len(CHARACTERS)} 枚の画像を生成しました。")


if __name__ == "__main__":
    main()
