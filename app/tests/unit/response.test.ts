import { describe, it, expect } from "vitest";
import { successResponse, errorResponse } from "../../functions/utils/response.js";
import { corsHeaders } from "../../functions/utils/cors.js";

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

describe("corsHeaders", () => {
  it("should allow GET, POST, DELETE, OPTIONS methods", () => {
    expect(corsHeaders["Access-Control-Allow-Methods"]).toContain("GET");
    expect(corsHeaders["Access-Control-Allow-Methods"]).toContain("POST");
    expect(corsHeaders["Access-Control-Allow-Methods"]).toContain("DELETE");
    expect(corsHeaders["Access-Control-Allow-Methods"]).toContain("OPTIONS");
  });

  it("should allow Content-Type and Authorization headers", () => {
    expect(corsHeaders["Access-Control-Allow-Headers"]).toContain("Content-Type");
    expect(corsHeaders["Access-Control-Allow-Headers"]).toContain("Authorization");
  });
});
