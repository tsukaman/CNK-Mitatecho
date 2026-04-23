import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { callOpenAIWithProxy } from "../../functions/utils/openai-proxy.js";

// callOpenAIWithProxy は OpenAI を優先し、403 / ネットワーク系エラーのみ
// OpenRouter にフォールバックする。400/401/429/5xx 系は透過返却する。
// 情報境界ポリシー: 自由回答文を別ベンダに流さないための意図的制限。

const OK_BODY = { choices: [{ message: { content: "test" } }] };
const ROUTER_KEY = "sk-or-v1-test-key-1234567890";

function makeResponse(status: number, body: unknown = OK_BODY): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("callOpenAIWithProxy", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const body = { model: "gpt-4.1-mini", messages: [{ role: "user", content: "ping" }] };

  it("OpenAI 200 の場合はレスポンスをそのまま返す", async () => {
    fetchMock.mockResolvedValueOnce(makeResponse(200));
    const res = await callOpenAIWithProxy({ apiKey: "sk-test", body, env: {} });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("api.openai.com");
  });

  it("OpenAI 403 (region block) で OpenRouter にフォールバック", async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse(403))
      .mockResolvedValueOnce(makeResponse(200));
    const res = await callOpenAIWithProxy({
      apiKey: "sk-test",
      body,
      env: { OPENROUTER_API_KEY: ROUTER_KEY },
    });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain("api.openai.com");
    expect(fetchMock.mock.calls[1][0]).toContain("openrouter.ai");
  });

  it("OpenAI 400 は OpenRouter に流さず、そのまま返す (情報境界ポリシー)", async () => {
    fetchMock.mockResolvedValueOnce(makeResponse(400));
    const res = await callOpenAIWithProxy({
      apiKey: "sk-test",
      body,
      env: { OPENROUTER_API_KEY: ROUTER_KEY },
    });
    expect(res.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1); // OpenRouter には行かない
  });

  it("OpenAI 401 (auth失敗) も OpenRouter に流さない", async () => {
    fetchMock.mockResolvedValueOnce(makeResponse(401));
    const res = await callOpenAIWithProxy({
      apiKey: "sk-test",
      body,
      env: { OPENROUTER_API_KEY: ROUTER_KEY },
    });
    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("OpenAI 429 (quota) も OpenRouter に流さない", async () => {
    fetchMock.mockResolvedValueOnce(makeResponse(429));
    const res = await callOpenAIWithProxy({
      apiKey: "sk-test",
      body,
      env: { OPENROUTER_API_KEY: ROUTER_KEY },
    });
    expect(res.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("ネットワークエラー (TypeError) で OpenRouter にフォールバック", async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError("network"))
      .mockResolvedValueOnce(makeResponse(200));
    const res = await callOpenAIWithProxy({
      apiKey: "sk-test",
      body,
      env: { OPENROUTER_API_KEY: ROUTER_KEY },
    });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("タイムアウト (AbortError) で OpenRouter にフォールバック", async () => {
    const abortErr = new DOMException("aborted", "AbortError");
    fetchMock
      .mockRejectedValueOnce(abortErr)
      .mockResolvedValueOnce(makeResponse(200));
    const res = await callOpenAIWithProxy({
      apiKey: "sk-test",
      body,
      env: { OPENROUTER_API_KEY: ROUTER_KEY },
    });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("AbortError/TypeError 以外の例外は OpenRouter に流さず再 throw する (情報境界維持)", async () => {
    // 実装バグなど想定外の Error はフォールバックさせない。
    const bugError = new Error("unexpected bug");
    fetchMock.mockRejectedValueOnce(bugError);
    await expect(
      callOpenAIWithProxy({
        apiKey: "sk-test",
        body,
        env: { OPENROUTER_API_KEY: ROUTER_KEY },
      }),
    ).rejects.toThrow(/unexpected bug/);
    // OpenAI のみ 1 回呼ばれ、OpenRouter には流れない
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("api.openai.com");
  });

  it("OPENROUTER_API_KEY が不正な prefix の場合は throw する", async () => {
    fetchMock.mockResolvedValueOnce(makeResponse(403));
    await expect(
      callOpenAIWithProxy({
        apiKey: "sk-test",
        body,
        env: { OPENROUTER_API_KEY: "invalid-prefix-key" },
      }),
    ).rejects.toThrow(/No API key configured/);
  });

  it("API キーが全くない場合は throw する", async () => {
    await expect(
      callOpenAIWithProxy({ apiKey: null, body, env: {} }),
    ).rejects.toThrow(/No API key configured/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("model 未指定の body は即 throw する", async () => {
    await expect(
      callOpenAIWithProxy({ apiKey: "sk-test", body: { messages: [] }, env: {} }),
    ).rejects.toThrow(/Invalid request body/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("OpenRouter 側で model 名が openai/ プレフィックスに変換される", async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse(403))
      .mockResolvedValueOnce(makeResponse(200));
    await callOpenAIWithProxy({
      apiKey: "sk-test",
      body: { model: "gpt-4.1-mini", messages: [] },
      env: { OPENROUTER_API_KEY: ROUTER_KEY },
    });
    const routerCall = fetchMock.mock.calls[1];
    const sentBody = JSON.parse(routerCall[1].body);
    expect(sentBody.model).toBe("openai/gpt-4.1-mini");
  });
});
