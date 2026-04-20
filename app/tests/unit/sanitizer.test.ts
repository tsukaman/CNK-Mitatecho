import { describe, it, expect } from "vitest";
import { sanitizeText } from "../../functions/utils/sanitizer.js";

// sanitizeText は HTML エスケープを行わない設計（React 表示側が自動エスケープするため）。
// 役割は (1) 制御文字の除去 (2) 前後空白のトリム (3) 非文字列入力の安全化。

describe("sanitizeText", () => {
  it("should pass through HTML angle brackets as-is (React escapes on display)", () => {
    expect(sanitizeText("<script>alert('xss')</script>")).toBe(
      "<script>alert('xss')</script>"
    );
  });

  it("should pass through quotes as-is", () => {
    expect(sanitizeText('he said "hello"')).toBe('he said "hello"');
    expect(sanitizeText("it's")).toBe("it's");
  });

  it("should trim whitespace", () => {
    expect(sanitizeText("  hello  ")).toBe("hello");
  });

  it("should return empty string for non-string input", () => {
    expect(sanitizeText(null)).toBe("");
    expect(sanitizeText(undefined)).toBe("");
    expect(sanitizeText(123)).toBe("");
    expect(sanitizeText({})).toBe("");
  });

  it("should pass through normal Japanese text unchanged", () => {
    const japanese = "戦国武将に見立てたエンジニア診断";
    expect(sanitizeText(japanese)).toBe(japanese);
  });

  it("should handle empty string", () => {
    expect(sanitizeText("")).toBe("");
  });

  it("should preserve newlines, tabs, and carriage returns", () => {
    expect(sanitizeText("line1\nline2")).toBe("line1\nline2");
    expect(sanitizeText("col1\tcol2")).toBe("col1\tcol2");
  });

  it("should strip NUL and other control characters", () => {
    expect(sanitizeText("abc\u0000def")).toBe("abcdef");
    expect(sanitizeText("\u0001\u0002hi\u0007")).toBe("hi");
    expect(sanitizeText("bye\u007F")).toBe("bye");
  });

  it("should handle mixed content without escaping", () => {
    expect(sanitizeText('<b>太字</b> & "引用"')).toBe('<b>太字</b> & "引用"');
  });
});
