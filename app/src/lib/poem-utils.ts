/**
 * 短歌を上の句(5-7-5)と下の句(7-7)に分割する
 */
export function splitPoem(poemText: string): { kamiNoKu: string; shimoNoKu: string } {
  const lines = poemText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  return {
    kamiNoKu: lines.slice(0, 3).join(" "),
    shimoNoKu: lines.slice(3).join(" "),
  };
}
