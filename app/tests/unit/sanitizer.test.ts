import { describe, it, expect } from "vitest";
import { sanitizeText } from "../../functions/utils/sanitizer.js";

describe("sanitizeText", () => {
  it("should escape HTML angle brackets", () => {
    expect(sanitizeText("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;"
    );
  });

  it("should escape double quotes", () => {
    expect(sanitizeText('he said "hello"')).toBe("he said &quot;hello&quot;");
  });

  it("should escape single quotes", () => {
    expect(sanitizeText("it's")).toBe("it&#x27;s");
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

  it("should handle mixed content", () => {
    // Note: sanitizeText does not escape & (ampersand)
    expect(sanitizeText('<b>太字</b> & "引用"')).toBe(
      "&lt;b&gt;太字&lt;/b&gt; & &quot;引用&quot;"
    );
  });
});
