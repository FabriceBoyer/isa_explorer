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
export type AlgorithmKind =
  | "sum"
  | "double"
  | "swap"
  | "fibonacci"
  | "popcount"
  | "power2"
  | "bitpack";
export type Algorithm = {
  id: AlgorithmKind;
  label: { fr: string; en: string };
  pseudocode: string;
  explanation: { fr: string; en: string };
};
export const algorithms: Algorithm[] = [
  { id: "sum", label: { fr: "Somme de 1 à n", en: "Sum from 1 to n" }, pseudocode: "total = 0; for (i = n; i > 0; i--) total += i;", explanation: { fr: "Le compteur descend de n à zéro et chaque valeur rejoint l’accumulateur. Le résultat vaut n × (n + 1) / 2.", en: "The counter descends from n to zero and each value is added to the accumulator. The result is n × (n + 1) / 2." } },
  { id: "double", label: { fr: "Doubler une valeur", en: "Double a value" }, pseudocode: "result = n + n;", explanation: { fr: "La même valeur alimente les deux entrées de l’addition. La destination contient 2 × n.", en: "The same value feeds both addition inputs. The destination holds 2 × n." } },
  { id: "swap", label: { fr: "Échanger par XOR", en: "Swap with XOR" }, pseudocode: "a = n; b = 10; a ^= b; b ^= a; a ^= b;", explanation: { fr: "Trois XOR échangent deux registres sans temporaire. Chaque XOR conserve assez d’information pour reconstruire l’autre valeur.", en: "Three XOR operations swap two registers without a temporary. Each XOR retains enough information to reconstruct the other value." } },
  { id: "fibonacci", label: { fr: "Suite de Fibonacci", en: "Fibonacci sequence" }, pseudocode: "a = 0; b = 1; repeat n times: (a, b) = (b, a + b);", explanation: { fr: "Deux registres contiennent les termes consécutifs. Un troisième protège l’ancien terme pendant que la paire avance, et le compteur pilote la boucle.", en: "Two registers hold consecutive terms. A third preserves the old term while the pair advances, and the counter drives the loop." } },
  { id: "popcount", label: { fr: "Compter les bits à 1", en: "Count set bits" }, pseudocode: "count = 0; while (n != 0) { count += n & 1; n >>= 1; }", explanation: { fr: "Le masque AND isole le bit faible, puis un décalage logique expose le bit suivant. L’accumulateur donne le poids de Hamming de n.", en: "The AND mask isolates the low bit, then a logical shift exposes the next one. The accumulator gives n’s Hamming weight." } },
  { id: "power2", label: { fr: "Calculer 2 puissance n", en: "Compute 2 to the power n" }, pseudocode: "result = 1; repeat n times: result <<= 1;", explanation: { fr: "Chaque décalage à gauche multiplie la valeur par deux. Le branchement initial traite n = 0 sans entrer dans la boucle.", en: "Each left shift multiplies the value by two. The initial branch handles n = 0 without entering the loop." } },
  { id: "bitpack", label: { fr: "Assembler un champ de bits", en: "Pack a bit field" }, pseudocode: "result = ((n & 0x0F) << 4) | 0x03;", explanation: { fr: "AND limite l’entrée à quatre bits, le décalage place ce champ dans le demi-octet haut et OR ajoute deux indicateurs fixes.", en: "AND limits the input to four bits, the shift places that field in the high nibble, and OR adds two fixed flags." } },
];
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
    amd64: ["MOV", "ADD", "SUB", "XOR", "AND", "OR", "SHL", "SHR", "CMP", "JNZ", "JZ"],
    arm64: ["MOV", "ADD", "SUB", "EOR", "AND", "ORR", "LSL", "LSR", "CBNZ", "CBZ"],
    riscv: ["ADDI", "ANDI", "ORI", "SLLI", "SRLI", "ADD", "SUB", "XOR", "BNE", "BEQ"],
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
      op === "JNZ" || op === "JZ"
        ? 1
          : isa === "riscv" ||
            (isa === "arm64" && ["ADD", "SUB", "EOR", "AND", "ORR", "LSL", "LSR"].includes(op))
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
    if (op === "JNZ" || op === "JZ") {
      if (!(a[0] in labels)) err();
      return;
    }
    if (op === "CBNZ" || op === "CBZ" || op === "BNE" || op === "BEQ") {
      if (
        !register(a[0]) ||
        ((op === "BNE" || op === "BEQ") && !register(a[1])) ||
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
      if (["ADDI", "ANDI", "ORI", "SLLI", "SRLI"].includes(op)) {
        if (!imm(a[2])) err();
        else {
          const value = BigInt(a[2].replace("#", ""));
          if (["SLLI", "SRLI"].includes(op) ? value < 0n || value > 63n : value < -2048n || value > 2047n) err();
        }
      } else if (isa === "arm64" && ["ADD", "SUB", "AND", "ORR", "LSL", "LSR"].includes(op)) {
        if (!register(a[2]) && !imm(a[2])) err();
        else if (
          imm(a[2]) &&
          (BigInt(a[2].replace("#", "")) < 0n ||
            BigInt(a[2].replace("#", "")) > (["LSL", "LSR"].includes(op) ? 63n : 4095n))
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
  if (op === "JNZ" || op === "JZ") {
    if (op === "JZ" ? zero : !zero) pc = program.labels[args[0]];
  } else if (op === "CBNZ" || op === "CBZ") {
    if (op === "CBZ" ? value(args[0]) === 0n : value(args[0]) !== 0n) pc = program.labels[args[1]];
  } else if (op === "BNE" || op === "BEQ") {
    const equal = value(args[0]) === value(args[1]);
    if (op === "BEQ" ? equal : !equal) pc = program.labels[args[2]];
  } else if (op === "MOV") result = value(args[1]);
  else {
    const a = isa === "amd64" ? value(args[0]) : value(args[1]);
    const b = value(args[isa === "amd64" ? 1 : 2]);
    const raw =
      op === "ADD" || op === "ADDI"
        ? a + b
        : op === "SUB" || op === "CMP"
          ? a - b
          : op === "XOR" || op === "EOR"
            ? a ^ b
            : op === "AND" || op === "ANDI"
              ? a & b
              : op === "OR" || op === "ORR" || op === "ORI"
                ? a | b
                : op === "SHL" || op === "LSL" || op === "SLLI"
                  ? a << (b & 63n)
                  : a >> (b & 63n);
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
export function example(isa: ISA, kind: AlgorithmKind): string {
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
  if (kind === "swap") return isa === "amd64"
    ? "MOV RAX, RCX\nMOV RBX, 10\nXOR RAX, RBX\nXOR RBX, RAX\nXOR RAX, RBX"
    : isa === "arm64"
      ? "MOV X0, X1\nMOV X2, #10\nEOR X0, X0, X2\nEOR X2, X2, X0\nEOR X0, X0, X2"
      : "ADDI x2, x1, 0\nADDI x3, x0, 10\nXOR x2, x2, x3\nXOR x3, x3, x2\nXOR x2, x2, x3";
  const programs: Record<Exclude<AlgorithmKind, "sum" | "double" | "swap">, Record<ISA, string>> = {
    fibonacci: {
      amd64: "MOV RAX, 0\nMOV RBX, 1\nCMP RCX, 0\nJZ done\nloop:\nMOV RDX, RAX\nADD RDX, RBX\nMOV RAX, RBX\nMOV RBX, RDX\nSUB RCX, 1\nCMP RCX, 0\nJNZ loop\ndone:",
      arm64: "MOV X0, #0\nMOV X2, #1\nCBZ X1, done\nloop:\nADD X3, X0, X2\nMOV X0, X2\nMOV X2, X3\nSUB X1, X1, #1\nCBNZ X1, loop\ndone:",
      riscv: "ADDI x2, x0, 0\nADDI x3, x0, 1\nBEQ x1, x0, done\nloop:\nADD x4, x2, x3\nADDI x2, x3, 0\nADDI x3, x4, 0\nADDI x1, x1, -1\nBNE x1, x0, loop\ndone:",
    },
    popcount: {
      amd64: "MOV RAX, 0\nCMP RCX, 0\nJZ done\nloop:\nMOV RBX, RCX\nAND RBX, 1\nADD RAX, RBX\nSHR RCX, 1\nCMP RCX, 0\nJNZ loop\ndone:",
      arm64: "MOV X0, #0\nCBZ X1, done\nloop:\nAND X2, X1, #1\nADD X0, X0, X2\nLSR X1, X1, #1\nCBNZ X1, loop\ndone:",
      riscv: "ADDI x2, x0, 0\nBEQ x1, x0, done\nloop:\nANDI x3, x1, 1\nADD x2, x2, x3\nSRLI x1, x1, 1\nBNE x1, x0, loop\ndone:",
    },
    power2: {
      amd64: "MOV RAX, 1\nCMP RCX, 0\nJZ done\nloop:\nSHL RAX, 1\nSUB RCX, 1\nCMP RCX, 0\nJNZ loop\ndone:",
      arm64: "MOV X0, #1\nCBZ X1, done\nloop:\nLSL X0, X0, #1\nSUB X1, X1, #1\nCBNZ X1, loop\ndone:",
      riscv: "ADDI x2, x0, 1\nBEQ x1, x0, done\nloop:\nSLLI x2, x2, 1\nADDI x1, x1, -1\nBNE x1, x0, loop\ndone:",
    },
    bitpack: {
      amd64: "MOV RAX, RCX\nAND RAX, 15\nSHL RAX, 4\nOR RAX, 3",
      arm64: "AND X0, X1, #15\nLSL X0, X0, #4\nORR X0, X0, #3",
      riscv: "ANDI x2, x1, 15\nSLLI x2, x2, 4\nORI x2, x2, 3",
    },
  };
  return programs[kind][isa];
}
