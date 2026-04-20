import { describe, it, expect } from "vitest";
import { SCENARIOS as clientScenarios } from "@/lib/scenarios";
import { SCENARIOS_SERVER } from "../../functions/utils/scenarios-server.js";

// scenarios-server.js は src/lib/scenarios.ts からプロンプト用に抜粋した
// 最小データ。ここでは同期（drift 検知）を機械的に保証する。

describe("client/server scenarios sync", () => {
  it("should have the same 6 card keys", () => {
    expect(Object.keys(clientScenarios).sort()).toEqual(
      Object.keys(SCENARIOS_SERVER).sort()
    );
  });

  for (let c = 1; c <= 6; c++) {
    it(`card ${c}: q1Choices should match client`, () => {
      expect(SCENARIOS_SERVER[c].q1Choices).toEqual(clientScenarios[c].q1Choices);
    });

    it(`card ${c}: sctTemplate should match client`, () => {
      expect(SCENARIOS_SERVER[c].sctTemplate).toBe(clientScenarios[c].sctTemplate);
    });

    for (let q1 = 1; q1 <= 4; q1++) {
      it(`card ${c} q1 ${q1}: q2 choices text+type should match client`, () => {
        const serverChoices = SCENARIOS_SERVER[c].q2[q1].choices;
        const clientChoices = clientScenarios[c].q2[q1].choices;
        expect(serverChoices).toHaveLength(clientChoices.length);
        for (let i = 0; i < clientChoices.length; i++) {
          expect(serverChoices[i].text).toBe(clientChoices[i].text);
          expect(serverChoices[i].type).toBe(clientChoices[i].type);
        }
      });
    }
  }
});
