import { describe, it, expect } from "vitest";
import { algorithms, example, initial, parse, step, type ISA } from "./engine";
const isas: ISA[] = ["amd64", "arm64", "riscv"];
function execute(isa: ISA, code: string, n = "5") {
  const p = parse(code, isa);
  let s = initial(isa, n);
  while (s.pc < p.lines.length) s = step(s, p, isa);
  return s;
}
describe.each(isas)("%s algorithms", (isa) => {
  const result = (s: ReturnType<typeof initial>) =>
    s.registers[isa === "amd64" ? "RAX" : isa === "arm64" ? "X0" : "x2"];

  it.each([0, 1, 5, 100])("sums 0 through %i", (n) => {
    const s = execute(isa, example(isa, "sum"), String(n));
    expect(
      s.registers[isa === "amd64" ? "RAX" : isa === "arm64" ? "X0" : "x2"],
    ).toBe(BigInt((n * (n + 1)) / 2));
  });
  it("doubles input", () => {
    const s = execute(isa, example(isa, "double"), "17");
    expect(
      s.registers[isa === "amd64" ? "RAX" : isa === "arm64" ? "X0" : "x2"],
    ).toBe(34n);
  });
  it("swaps with XOR", () => {
    const s = execute(isa, example(isa, "swap"), "17");
    expect(
      s.registers[isa === "amd64" ? "RAX" : isa === "arm64" ? "X0" : "x2"],
    ).toBe(10n);
    expect(
      s.registers[isa === "amd64" ? "RBX" : isa === "arm64" ? "X2" : "x3"],
    ).toBe(17n);
  });
  it.each([
    [0, 0n],
    [1, 1n],
    [2, 1n],
    [10, 55n],
  ])("computes Fibonacci(%i)", (n, expected) => {
    expect(result(execute(isa, example(isa, "fibonacci"), String(n)))).toBe(expected);
  });
  it.each([
    [0, 0n],
    [5, 2n],
    [100, 3n],
  ])("counts the set bits of %i", (n, expected) => {
    expect(result(execute(isa, example(isa, "popcount"), String(n)))).toBe(expected);
  });
  it("computes a power of two with a shift loop", () => {
    expect(result(execute(isa, example(isa, "power2"), "12"))).toBe(4096n);
  });
  it("packs a masked nibble and fixed flags", () => {
    expect(result(execute(isa, example(isa, "bitpack"), "42"))).toBe(163n);
  });
});
it("exposes seven complete demonstrations", () => {
  expect(algorithms).toHaveLength(7);
  for (const algorithm of algorithms)
    for (const isa of isas) expect(() => parse(example(isa, algorithm.id), isa)).not.toThrow();
});
it("wraps at 64 bits exactly and updates ZF", () => {
  const s = execute("amd64", "MOV RAX, 18446744073709551615\nADD RAX, 1");
  expect(s.registers.RAX).toBe(0n);
  expect(s.zero).toBe(true);
});
it("CMP sets flags without writing a register", () => {
  const s = execute("amd64", "MOV RAX, 5\nCMP RAX, 5");
  expect(s.registers.RAX).toBe(5n);
  expect(s.zero).toBe(true);
});
it("keeps RISC-V x0 hardwired to zero", () => {
  expect(execute("riscv", "ADDI x0, x0, 10").registers.x0).toBe(0n);
});
it("does not mutate previous state", () => {
  const before = initial("amd64");
  const after = step(before, parse("MOV RAX, 12", "amd64"), "amd64");
  expect(before.registers.RAX).toBe(0n);
  expect(after.changed).toEqual(["RAX"]);
});
it("terminates infinite loops", () => {
  expect(() =>
    execute("amd64", "MOV RAX, 1\nloop: CMP RAX, 0\nJNZ loop"),
  ).toThrow("limit");
});
it.each([
  "MOV RAX, BAD",
  "ADD RAX",
  "JNZ missing",
  "loop: MOV RAX, 1\nloop: ADD RAX, 2",
  "PUSH RAX",
])("rejects malformed source %s", (code) => {
  expect(() => parse(code, "amd64")).toThrow();
});
it("rejects unknown ARM source registers", () =>
  expect(() => parse("ADD X0, X99, X2", "arm64")).toThrow());
it("rejects out-of-range RISC-V immediates", () =>
  expect(() => parse("ADDI x1, x0, 2048", "riscv")).toThrow());
it("rejects out-of-range immediate shift counts", () => {
  expect(() => parse("SLLI x1, x1, 64", "riscv")).toThrow();
  expect(() => parse("LSR X1, X1, #64", "arm64")).toThrow();
});
it.each(["-1", "101", "1.5", "", "NaN"])("rejects input %s", (n) =>
  expect(() => initial("amd64", n)).toThrow(),
);
it("resolves labels, comments and source line numbers", () => {
  const p = parse("; comment\nloop: MOV RAX, 0 ; note\nJNZ loop", "amd64");
  expect(p.labels.loop).toBe(0);
  expect(p.lines[0].source).toBe(1);
});
