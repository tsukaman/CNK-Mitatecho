import { describe, it, expect } from "vitest";
import { validatePoem } from "../../functions/utils/poem-generator.js";

describe("validatePoem", () => {
  it("should accept a valid 5-line tanka", () => {
    const poem = "楽市の\nラーメン屋台に\n火を放ち\n是非に及ばず\n替え玉を待つ";
    expect(validatePoem(poem)).toEqual({ valid: true });
  });

  it("should accept a poem with slight variations in line count (4-6 lines)", () => {
    const fourLines = "短い歌\n七文字の行だよ\n五文字だね\n七文字のうただ";
    expect(validatePoem(fourLines).valid).toBe(true);
  });

  it("should reject a poem with too few lines", () => {
    const twoLines = "短い\n歌だ";
    const result = validatePoem(twoLines);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("行数");
  });

  it("should reject a poem with too many lines (7+)", () => {
    const sevenLines = "一行目\n二行目です\n三行目\n四行目です\n五行目です\n六行目です\n七行目です";
    const result = validatePoem(sevenLines);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("行数");
  });

  it("should reject lines that are too long", () => {
    const longLine = "これはとても長い行でバリデーションに引っかかるはずです\n七文字の行だよ\n五文字だね\n七文字のうただ\n七文字のうただ";
    const result = validatePoem(longLine);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("文字");
  });

  it("should reject lines that are too short", () => {
    const shortLine = "あ\n七文字の行だよ\n五文字だね\n七文字のうただ\n七文字のうただ";
    const result = validatePoem(shortLine);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("文字");
  });

  it("should reject prose with multiple periods", () => {
    const prose = "これは散文です。短歌ではありません。そうです。はい。もう一つ。";
    // Even if line count happens to be off, multiple periods should be caught
    const fiveLineProse = "短い歌です。\n七文字です。\n五文字だ。\n七文字ですよ。\n七文字ですよ。";
    const result = validatePoem(fiveLineProse);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("散文");
  });

  it("should accept a poem with exactly one period", () => {
    const poem = "楽市の\nラーメン屋台に\n火を放つ。\n是非に及ばず\n替え玉を待つ";
    // One period should be acceptable
    expect(validatePoem(poem).valid).toBe(true);
  });

  it("should ignore empty lines", () => {
    const poemWithBlanks = "楽市の\n\nラーメン屋台に\n火を放ち\n\n是非に及ばず\n替え玉を待つ";
    expect(validatePoem(poemWithBlanks).valid).toBe(true);
  });
});
