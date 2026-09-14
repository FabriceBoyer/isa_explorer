import { describe, expect, it } from "vitest";
import { catalogs, type ReferenceEntry } from "./catalog";
import { executeMiniTest, type TesterWidth } from "./miniTester";

const entry = (name: string, family = "BASE"): ReferenceEntry => ({
  name,
  families: [family],
  forms: [{ family, source: "https://example.com", format: "assembly" }],
});

describe("universal mini tester", () => {
  it.each([
    ["ADD", 12n, 5n, 17n],
    ["SUB", 12n, 5n, 7n],
    ["MUL", 12n, 5n, 60n],
    ["DIV", 12n, 5n, 2n],
    ["AND", 12n, 5n, 4n],
    ["OR", 12n, 5n, 13n],
    ["XOR", 12n, 5n, 9n],
    ["LSL", 12n, 2n, 48n],
    ["LSR", 12n, 2n, 3n],
    ["POPCNT", 13n, 0n, 3n],
  ] as const)("evaluates %s", (name, left, right, expected) => {
    expect(executeMiniTest(entry(name), left, right, 8).value).toBe(expected);
  });

  it("wraps results and computes teaching flags at the selected width", () => {
    const result = executeMiniTest(entry("ADD"), 255n, 1n, 8);
    expect(result.value).toBe(0n);
    expect(result.flags).toEqual({ zero: true, negative: false, carry: true });
    expect(result.exact).toBe(true);
  });

  it("labels specialized behavior as a family model", () => {
    const result = executeMiniTest(entry("SLEEP", "AVR"), 12n, 5n, 8);
    expect(result.exact).toBe(false);
    expect(result.detail.fr).toContain("modèle pédagogique");
  });

  it("returns a bounded result for every catalogue instruction", () => {
    for (const catalog of Object.values(catalogs)) {
      for (const instruction of catalog.entries) {
        for (const width of [8, 64] as TesterWidth[]) {
          const result = executeMiniTest(instruction, 173n, 7n, width);
          expect(result.value).toBeGreaterThanOrEqual(0n);
          expect(result.value).toBeLessThan(1n << BigInt(width));
          expect(result.formula.fr).not.toBe("");
          expect(result.detail.en).not.toBe("");
        }
      }
    }
  });
});
