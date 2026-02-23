/**
 * 相性・ライバル武将マッピング
 * MAPPING.md の定義に基づく
 */

interface Relationship {
  characterId: number;
  reason: string;
}

/** 相性武将（この人と組むと最強） */
export const COMPATIBILITY: Record<number, Relationship> = {
  1:  { characterId: 8,  reason: "破壊者には完璧な右腕が必要" },
  2:  { characterId: 9,  reason: "墨俣一夜城の最強コンビ" },
  3:  { characterId: 13, reason: "57戦バグゼロの絶対的信頼" },
  4:  { characterId: 19, reason: "最後まで共にした北ノ庄の誓い" },
  5:  { characterId: 22, reason: "縁の下の力持ち×コスト最適化" },
  6:  { characterId: 23, reason: "傾奇者を支え百万石を築いた夫婦" },
  7:  { characterId: 16, reason: "不可能に挑む突破型同士" },
  8:  { characterId: 1,  reason: "主の意図を先読みする信頼の極み" },
  9:  { characterId: 25, reason: "秀吉軍団の裏方と頭脳" },
  10: { characterId: 11, reason: "賤ヶ岳七本槍の盟友" },
  11: { characterId: 10, reason: "勢いと堅牢、攻守の両輪" },
  12: { characterId: 5,  reason: "堅実を貫く者同士" },
  13: { characterId: 3,  reason: "傷を負わぬ武神と忍耐の主君" },
  14: { characterId: 2,  reason: "人たらし×ムードメーカー" },
  15: { characterId: 17, reason: "忖度なしのレビューと影のセキュリティ" },
  16: { characterId: 7,  reason: "赤備え×ザラ峠、限界突破コンビ" },
  17: { characterId: 18, reason: "秘密を守る者同士" },
  18: { characterId: 31, reason: "マムシの血を引く父娘の知略" },
  19: { characterId: 4,  reason: "暗号の使い手と覚悟の武将" },
  20: { characterId: 21, reason: "逆境を生き抜いた姉妹の絆" },
  21: { characterId: 20, reason: "何度でも立ち上がる姉妹" },
  22: { characterId: 12, reason: "へそくり名馬のペアプロ夫婦" },
  23: { characterId: 6,  reason: "VPoEと成長型テックリード" },
  24: { characterId: 14, reason: "家康を支えた温かき者同士" },
  25: { characterId: 27, reason: "秀吉の知恵袋、構造と兵站" },
  26: { characterId: 15, reason: "忖度なき者同士の知的共鳴" },
  27: { characterId: 32, reason: "兵站と根回し、PMの両輪" },
  28: { characterId: 29, reason: "引き算の美学を極める求道者" },
  29: { characterId: 28, reason: "一字一行を削ぎ落とす同志" },
  30: { characterId: 24, reason: "家康の幼少期を支えた庇護者" },
  31: { characterId: 26, reason: "美濃が生んだ知略の系譜" },
  32: { characterId: 30, reason: "大局を見据える戦略眼" },
};

/** ライバル武将（互いを高め合う好敵手） */
export const RIVALRY: Record<number, Relationship> = {
  1:  { characterId: 26, reason: "破壊と改革、本能寺の宿命" },
  2:  { characterId: 3,  reason: "速度と安定、天下を争う二つの哲学" },
  3:  { characterId: 2,  reason: "忍耐と突破、覇道の対極" },
  4:  { characterId: 11, reason: "猛将の世代対決、退路を断つ者同士" },
  5:  { characterId: 27, reason: "縁の下のPM対決、静と動" },
  6:  { characterId: 7,  reason: "織田家臣団の永遠のライバル" },
  7:  { characterId: 6,  reason: "越中と加賀、正反対の歩み" },
  8:  { characterId: 15, reason: "細部のレビュー対決、美学vs論理" },
  9:  { characterId: 12, reason: "裏方の職人vs日の当たる道" },
  10: { characterId: 20, reason: "築城の忠義と城を守る意志" },
  11: { characterId: 4,  reason: "直push派の先輩と後輩" },
  12: { characterId: 9,  reason: "パートナー依存vs独自ネットワーク" },
  13: { characterId: 16, reason: "四天王、ベテランvs若手スター" },
  14: { characterId: 29, reason: "宴会の賑やかさvs孤高の旅" },
  15: { characterId: 8,  reason: "忖度ゼロ同士の完璧主義対決" },
  16: { characterId: 13, reason: "先輩の背中を追い越す覚悟" },
  17: { characterId: 31, reason: "影の実力者、忍びvsフルスタック" },
  18: { characterId: 1,  reason: "最も近くにいるからこそ最も手厳しい" },
  19: { characterId: 18, reason: "信長の妹vs信長の妻、情報戦の女王対決" },
  20: { characterId: 10, reason: "守るべきものを巡る忠義の衝突" },
  21: { characterId: 22, reason: "環境適応vsコスト最適化、サバイバル術" },
  22: { characterId: 21, reason: "内助の功のスタイル対決" },
  23: { characterId: 5,  reason: "VPoE vs サイレントPM、管理哲学" },
  24: { characterId: 23, reason: "子を支える母のスタイル対決" },
  25: { characterId: 28, reason: "構造のミニマリズムvs美のミニマリズム" },
  26: { characterId: 17, reason: "内部犯行vsセキュリティ、攻防の宿命" },
  27: { characterId: 14, reason: "堅物の兵站家vsムードメーカー" },
  28: { characterId: 25, reason: "引き算の流派対決、わびvs知略" },
  29: { characterId: 32, reason: "個人の旅路vs組織の根回し" },
  30: { characterId: 19, reason: "情報戦の盲点を突かれた者同士" },
  31: { characterId: 30, reason: "東海道の覇権を争った大名" },
  32: { characterId: 24, reason: "調略の達人vs静かに見守る者" },
};
