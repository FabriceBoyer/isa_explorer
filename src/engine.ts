export type ISA = "amd64" | "arm64" | "riscv";
export type Machine = {
  registers: Record<string, bigint>;
  pc: number;
  zero: boolean;
  ticks: number;
  changed: string[];
  last: string;
};
export type Line = { op: string; args: string[]; source: number; text: string };
export type Program = { lines: Line[]; labels: Record<string, number> };
export const registerNames = (isa: ISA) =>
  isa === "amd64"
    ? ["RAX", "RBX", "RCX", "RDX", "RSI", "RDI", "R8", "R9"]
    : isa === "arm64"
      ? Array.from({ length: 8 }, (_, i) => `X${i}`)
      : Array.from({ length: 8 }, (_, i) => `x${i}`);
export function initial(isa: ISA, input = "5"): Machine {
  if (!/^-?\d+$/.test(input.trim())) throw new Error("input");
  const n = BigInt(input);
  if (n < 0n || n > 100n) throw new Error("input");
  const registers = Object.fromEntries(registerNames(isa).map((r) => [r, 0n]));
  registers[isa === "amd64" ? "RCX" : isa === "arm64" ? "X1" : "x1"] = n;
  return { registers, pc: 0, zero: false, ticks: 0, changed: [], last: "" };
}
export function parse(code: string, isa: ISA): Program {
  const lines: Line[] = [];
  const labels: Record<string, number> = Object.create(null);
  const allowed: Record<ISA, string[]> = {
    amd64: ["MOV", "ADD", "SUB", "XOR", "CMP", "JNZ"],
    arm64: ["MOV", "ADD", "SUB", "EOR", "CBNZ"],
    riscv: ["ADDI", "ADD", "SUB", "XOR", "BNE"],
  };
  code.split("\n").forEach((text, source) => {
    let content = text.split(";")[0].trim();
    if (!content) return;
    const label = content.match(/^([a-zA-Z_]\w*):/);
    if (label) {
      if (label[1] in labels)
        throw new Error(`L${source + 1}: duplicate label`);
      labels[label[1]] = lines.length;
      content = content.slice(label[0].length).trim();
    }
    if (!content) return;
    const [raw, ...rest] = content.split(/\s+/);
    const op = raw.toUpperCase();
    if (!allowed[isa].includes(op))
      throw new Error(`L${source + 1}: ${op} — unsupported instruction`);
    const args = rest
      .join(" ")
      .split(",")
      .map((a) => a.trim());
    const count =
      op === "JNZ"
        ? 1
        : isa === "riscv" ||
            (isa === "arm64" && ["ADD", "SUB", "EOR"].includes(op))
          ? 3
          : 2;
    if (args.length !== count || args.some((a) => !a))
      throw new Error(`L${source + 1}: ${op} — expected ${count} operands`);
    lines.push({ op, args, source, text: content });
  });
  if (!lines.length) throw new Error("empty");
  if (lines.length > 256) throw new Error("length");
  const regs = registerNames(isa);
  const register = (s: string) =>
    regs.includes(isa === "riscv" ? s.toLowerCase() : s.toUpperCase());
  const imm = (s: string) => /^#?-?(?:0x[0-9a-f]+|\d+)$/i.test(s);
  lines.forEach(({ op, args: a, source }) => {
    const err = () => {
      throw new Error(`L${source + 1}: invalid operand / label`);
    };
    if (op === "JNZ") {
      if (!(a[0] in labels)) err();
      return;
    }
    if (op === "CBNZ" || op === "BNE") {
      if (
        !register(a[0]) ||
        (op === "BNE" && !register(a[1])) ||
        !(a[a.length - 1] in labels)
      )
        err();
      return;
    }
    if (!register(a[0])) err();
    if (isa === "amd64" || op === "MOV") {
      if (!register(a[1]) && !imm(a[1])) err();
    } else {
      if (!register(a[1])) err();
      if (op === "ADDI") {
        if (!imm(a[2])) err();
        else {
          const value = BigInt(a[2].replace("#", ""));
          if (value < -2048n || value > 2047n) err();
        }
      } else if (isa === "arm64" && ["ADD", "SUB"].includes(op)) {
        if (!register(a[2]) && !imm(a[2])) err();
        else if (
          imm(a[2]) &&
          (BigInt(a[2].replace("#", "")) < 0n ||
            BigInt(a[2].replace("#", "")) > 4095n)
        )
          err();
      } else if (!register(a[2])) err();
    }
  });
  return { lines, labels };
}
export function step(state: Machine, program: Program, isa: ISA): Machine {
  if (state.pc >= program.lines.length) return state;
  if (state.ticks >= 2000) throw new Error("limit");
  const { op, args, text } = program.lines[state.pc];
  const r = { ...state.registers };
  const norm = (s: string) =>
    isa === "riscv" ? s.toLowerCase() : s.toUpperCase();
  const value = (s: string) =>
    norm(s) in r ? r[norm(s)] : BigInt(s.replace("#", ""));
  let pc = state.pc + 1,
    zero = state.zero;
  const dest = norm(args[0]);
  let result: bigint | undefined;
  if (op === "JNZ") {
    if (!zero) pc = program.labels[args[0]];
  } else if (op === "CBNZ") {
    if (value(args[0]) !== 0n) pc = program.labels[args[1]];
  } else if (op === "BNE") {
    if (value(args[0]) !== value(args[1])) pc = program.labels[args[2]];
  } else if (op === "MOV") result = value(args[1]);
  else {
    const a = isa === "amd64" ? value(args[0]) : value(args[1]);
    const b = value(args[isa === "amd64" ? 1 : 2]);
    const raw =
      op === "ADD" || op === "ADDI"
        ? a + b
        : op === "SUB" || op === "CMP"
          ? a - b
          : a ^ b;
    const wrapped = BigInt.asUintN(64, raw);
    if (isa === "amd64") zero = wrapped === 0n;
    if (op !== "CMP") result = wrapped;
  }
  if (result !== undefined && !(isa === "riscv" && dest === "x0"))
    r[dest] = BigInt.asUintN(64, result);
  return {
    registers: r,
    pc,
    zero,
    ticks: state.ticks + 1,
    changed: Object.keys(r).filter((k) => r[k] !== state.registers[k]),
    last: text,
  };
}
export function example(isa: ISA, kind: string): string {
  if (kind === "sum")
    return isa === "amd64"
      ? "MOV RAX, 0\nADD RCX, 1\nloop:\nSUB RCX, 1\nADD RAX, RCX\nCMP RCX, 0\nJNZ loop"
      : isa === "arm64"
        ? "MOV X0, #0\nADD X1, X1, #1\nloop:\nSUB X1, X1, #1\nADD X0, X0, X1\nCBNZ X1, loop"
        : "ADDI x2, x0, 0\nADDI x1, x1, 1\nloop:\nADDI x1, x1, -1\nADD x2, x2, x1\nBNE x1, x0, loop";
  if (kind === "double")
    return isa === "amd64"
      ? "MOV RAX, RCX\nADD RAX, RCX"
      : isa === "arm64"
        ? "ADD X0, X1, X1"
        : "ADD x2, x1, x1";
  return isa === "amd64"
    ? "MOV RAX, RCX\nMOV RBX, 10\nXOR RAX, RBX\nXOR RBX, RAX\nXOR RAX, RBX"
    : isa === "arm64"
      ? "MOV X0, X1\nMOV X2, #10\nEOR X0, X0, X2\nEOR X2, X2, X0\nEOR X0, X0, X2"
      : "ADDI x2, x1, 0\nADDI x3, x0, 10\nXOR x2, x2, x3\nXOR x3, x3, x2\nXOR x2, x2, x3";
}
