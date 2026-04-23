import { describe, it, expect } from "vitest";
import { successResponse, errorResponse } from "../../functions/utils/response.js";
import { corsHeaders, adminCorsHeaders } from "../../functions/utils/cors.js";

describe("successResponse", () => {
  it("should return 200 status", () => {
    const res = successResponse({ id: "abc" });
    expect(res.status).toBe(200);
  });

  it("should return JSON with success: true and data", async () => {
    const res = successResponse({ id: "abc" });
    const body = await res.json();
    expect(body).toEqual({ success: true, data: { id: "abc" } });
  });

  it("should include Content-Type and CORS headers", () => {
    const res = successResponse({});
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

describe("errorResponse", () => {
  it("should return 500 status by default", () => {
    const res = errorResponse("something went wrong");
    expect(res.status).toBe(500);
  });

  it("should return custom status code", () => {
    const res = errorResponse("not found", 404);
    expect(res.status).toBe(404);
  });

  it("should return JSON with success: false and error message", async () => {
    const res = errorResponse("bad request", 400);
    const body = await res.json();
    expect(body).toEqual({ success: false, error: "bad request" });
  });

  it("should include CORS headers", () => {
    const res = errorResponse("error");
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

describe("corsHeaders (公開系)", () => {
  it("GET/POST/OPTIONS のみ許可 (DELETE/PATCH は admin 専用で公開系には不要)", () => {
    expect(corsHeaders["Access-Control-Allow-Methods"]).toContain("GET");
    expect(corsHeaders["Access-Control-Allow-Methods"]).toContain("POST");
    expect(corsHeaders["Access-Control-Allow-Methods"]).toContain("OPTIONS");
    expect(corsHeaders["Access-Control-Allow-Methods"]).not.toContain("DELETE");
    expect(corsHeaders["Access-Control-Allow-Methods"]).not.toContain("PATCH");
  });

  it("Content-Type のみ許可、Authorization は公開系には出さない", () => {
    expect(corsHeaders["Access-Control-Allow-Headers"]).toContain("Content-Type");
    expect(corsHeaders["Access-Control-Allow-Headers"]).not.toContain("Authorization");
  });

  it("公開系は任意オリジンからの閲覧を許容する", () => {
    expect(corsHeaders["Access-Control-Allow-Origin"]).toBe("*");
  });
});

describe("adminCorsHeaders (管理系)", () => {
  it("ADMIN_ORIGIN を尊重し、未設定時は本番 URL にフォールバックする", () => {
    expect(adminCorsHeaders({})["Access-Control-Allow-Origin"]).toBe("https://cnk-mitatecho.pages.dev");
    expect(adminCorsHeaders({ ADMIN_ORIGIN: "https://example.com" })["Access-Control-Allow-Origin"]).toBe("https://example.com");
  });

  it("末尾スラッシュを剥がす", () => {
    expect(adminCorsHeaders({ ADMIN_ORIGIN: "https://example.com/" })["Access-Control-Allow-Origin"]).toBe("https://example.com");
  });

  it("CF Access cookie を受け取るため Allow-Credentials: true を付ける", () => {
    expect(adminCorsHeaders({})["Access-Control-Allow-Credentials"]).toBe("true");
  });

  it("Authorization ヘッダを許可 (Bearer CLI 経路)", () => {
    expect(adminCorsHeaders({})["Access-Control-Allow-Headers"]).toContain("Authorization");
  });

  it("PATCH/DELETE を含む管理用メソッドを許可", () => {
    const methods = adminCorsHeaders({})["Access-Control-Allow-Methods"];
    expect(methods).toContain("PATCH");
    expect(methods).toContain("DELETE");
  });

  it("オリジン可変なので Vary: Origin を付与", () => {
    expect(adminCorsHeaders({}).Vary).toBe("Origin");
  });
});
