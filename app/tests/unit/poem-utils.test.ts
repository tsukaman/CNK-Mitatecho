import { describe, it, expect } from "vitest";
import { splitPoem } from "@/lib/poem-utils";

describe("splitPoem", () => {
  it("should split a 5-line poem into kami-no-ku (3 lines) and shimo-no-ku (2 lines)", () => {
    const poem = "楽市の\nラーメン屋台に\n火を放ち\n是非に及ばず\n替え玉を待つ";
    const result = splitPoem(poem);
    expect(result.kamiNoKu).toBe("楽市の ラーメン屋台に 火を放ち");
    expect(result.shimoNoKu).toBe("是非に及ばず 替え玉を待つ");
  });

  it("should handle poems with empty lines", () => {
    const poem = "楽市の\n\nラーメン屋台に\n\n火を放ち\n是非に及ばず\n替え玉を待つ";
    const result = splitPoem(poem);
    expect(result.kamiNoKu).toBe("楽市の ラーメン屋台に 火を放ち");
    expect(result.shimoNoKu).toBe("是非に及ばず 替え玉を待つ");
  });

  it("should handle poems with leading/trailing whitespace on lines", () => {
    const poem = "  楽市の  \n  ラーメン屋台に  \n  火を放ち  \n  是非に及ばず  \n  替え玉を待つ  ";
    const result = splitPoem(poem);
    expect(result.kamiNoKu).toBe("楽市の ラーメン屋台に 火を放ち");
    expect(result.shimoNoKu).toBe("是非に及ばず 替え玉を待つ");
  });

  it("should handle a poem with fewer than 5 lines", () => {
    const poem = "短い\n歌だ\n三行";
    const result = splitPoem(poem);
    expect(result.kamiNoKu).toBe("短い 歌だ 三行");
    expect(result.shimoNoKu).toBe("");
  });

  it("should handle a poem with more than 5 lines", () => {
    const poem = "一\n二\n三\n四\n五\n六";
    const result = splitPoem(poem);
    expect(result.kamiNoKu).toBe("一 二 三");
    expect(result.shimoNoKu).toBe("四 五 六");
  });
});
