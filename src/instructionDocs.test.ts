import { describe, expect, it } from "vitest";
import { catalogs, type ReferenceEntry, type ReferenceForm } from "./catalog";
import { classifyInstruction, extractOperands, flagDetails, instructionGuide } from "./instructionDocs";

const entry = (name: string, family = "BASE"): ReferenceEntry => ({
  name,
  families: [family],
  forms: [{ family, source: "https://example.com", format: "assembly" }],
});

describe("instruction documentation", () => {
  it.each([
    ["JNZ", "control"],
    ["LDR", "memory"],
    ["AMOADD.W", "atomic"],
    ["FENCE", "system"],
    ["LSR", "shift"],
    ["XOR", "logical"],
    ["CMP", "compare"],
    ["FCVTZS", "conversion"],
    ["FADD", "floating"],
    ["ADD", "arithmetic"],
    ["MOV", "data"],
  ] as const)("classifies %s as %s", (name, expected) => {
    expect(classifyInstruction(entry(name))).toBe(expected);
  });

  it("uses extension metadata to identify vector forms", () => {
    expect(classifyInstruction(entry("PTRUE", "SVE"))).toBe("vector");
  });

  it("decodes XED read/write operand metadata", () => {
    const form: ReferenceForm = {
      family: "I86",
      source: "https://example.com",
      format: "xed",
      operands: "REG0=GPR64_R():rw:q MEM0:r:q IMM0:r:b",
    };
    expect(extractOperands(form).map(({ token, access }) => [token, access])).toEqual([
      ["REG0", "R/W"],
      ["MEM0", "R"],
      ["IMM0", "R"],
    ]);
  });

  it("turns an assembly template into an operand guide", () => {
    const form: ReferenceForm = {
      family: "SVE",
      source: "https://example.com",
      format: "assembly",
      syntax: "ADD Z0.S, P0/M, Z0.S, Z1.S",
    };
    expect(extractOperands(form).map(({ token }) => token)).toEqual(["Z0.S", "P0/M", "Z0.S", "Z1.S"]);
  });

  it("explains flag actions without duplicates", () => {
    expect(flagDetails("MUST [ ZF-MOD CF-TST ZF-MOD OF-0 ]")).toEqual([
      { name: "ZF", action: { fr: "modifié selon le résultat", en: "modified from the result" } },
      { name: "CF", action: { fr: "lu comme entrée", en: "read as an input" } },
      { name: "OF", action: { fr: "effacé à 0", en: "cleared to 0" } },
    ]);
  });

  it("provides a bilingual guide for every catalogue entry", () => {
    for (const catalog of Object.values(catalogs)) {
      for (const instruction of catalog.entries) {
        const guide = instructionGuide(instruction);
        expect(guide.label.fr).not.toBe("");
        expect(guide.label.en).not.toBe("");
        expect(guide.summary.fr).not.toBe("");
        expect(guide.operation.en).not.toBe("");
      }
    }
  });
});
