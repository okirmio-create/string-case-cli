import { Command } from "commander";
import chalk from "chalk";
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

// ---------------------------------------------------------------------------
// 1. Tokenizer — split ANY input string into lowercase words
// ---------------------------------------------------------------------------

function tokenize(input: string): string[] {
  // Replace common separators with a space
  let s = input
    .replace(/[-_./\\]/g, " ") // kebab, snake, dot, path separators
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // camelCase boundary
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2") // ACRONYMWord boundary
    .trim();

  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

// ---------------------------------------------------------------------------
// 2. Case detection
// ---------------------------------------------------------------------------

type CaseName =
  | "camelCase"
  | "PascalCase"
  | "snake_case"
  | "SCREAMING_SNAKE_CASE"
  | "kebab-case"
  | "SCREAMING-KEBAB-CASE"
  | "dot.case"
  | "path/case"
  | "Title Case"
  | "Sentence case"
  | "UPPER CASE"
  | "lower case"
  | "unknown";

function detectCase(input: string): CaseName {
  if (/^[a-z][a-zA-Z0-9]*$/.test(input) && /[A-Z]/.test(input))
    return "camelCase";
  if (/^[A-Z][a-zA-Z0-9]*$/.test(input) && /[a-z]/.test(input))
    return "PascalCase";
  if (/^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$/.test(input))
    return "SCREAMING_SNAKE_CASE";
  if (/^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(input)) return "snake_case";
  if (/^[A-Z][A-Z0-9]*(-[A-Z0-9]+)+$/.test(input))
    return "SCREAMING-KEBAB-CASE";
  if (/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(input)) return "kebab-case";
  if (/^[a-z][a-z0-9]*(\.[a-z0-9]+)+$/.test(input)) return "dot.case";
  if (/^[a-z][a-z0-9]*(\/[a-z0-9]+)+$/.test(input)) return "path/case";
  if (/^[A-Z][a-z0-9]*( [A-Z][a-z0-9]*)+$/.test(input)) return "Title Case";
  if (/^[A-Z][a-z0-9]*( [a-z0-9]+)+$/.test(input)) return "Sentence case";
  if (/^[A-Z][A-Z0-9]*( [A-Z0-9]+)+$/.test(input)) return "UPPER CASE";
  if (/^[a-z][a-z0-9]*( [a-z0-9]+)+$/.test(input)) return "lower case";
  return "unknown";
}

// ---------------------------------------------------------------------------
// 3. Converters
// ---------------------------------------------------------------------------

const converters: Record<string, (words: string[]) => string> = {
  camelCase: (w) =>
    w[0] + w.slice(1).map((s) => s[0].toUpperCase() + s.slice(1)).join(""),
  PascalCase: (w) => w.map((s) => s[0].toUpperCase() + s.slice(1)).join(""),
  snake_case: (w) => w.join("_"),
  SCREAMING_SNAKE_CASE: (w) => w.map((s) => s.toUpperCase()).join("_"),
  "kebab-case": (w) => w.join("-"),
  "SCREAMING-KEBAB-CASE": (w) => w.map((s) => s.toUpperCase()).join("-"),
  "dot.case": (w) => w.join("."),
  "path/case": (w) => w.join("/"),
  "Title Case": (w) =>
    w.map((s) => s[0].toUpperCase() + s.slice(1)).join(" "),
  "Sentence case": (w) =>
    w[0][0].toUpperCase() + w[0].slice(1) + (w.length > 1 ? " " : "") + w.slice(1).join(" "),
  "UPPER CASE": (w) => w.map((s) => s.toUpperCase()).join(" "),
  "lower case": (w) => w.join(" "),
};

const CASE_NAMES = Object.keys(converters);

// Lookup map: normalised alias -> canonical name
const aliasMap: Record<string, string> = {};
for (const name of CASE_NAMES) {
  aliasMap[name] = name;
  aliasMap[name.toLowerCase()] = name;
  aliasMap[name.replace(/[\s._\-\/]/g, "")] = name;
  aliasMap[name.replace(/[\s._\-\/]/g, "").toLowerCase()] = name;
}
// Extra shorthand aliases
const extras: Record<string, string> = {
  camel: "camelCase",
  pascal: "PascalCase",
  snake: "snake_case",
  screaming_snake: "SCREAMING_SNAKE_CASE",
  screamingsnake: "SCREAMING_SNAKE_CASE",
  constant: "SCREAMING_SNAKE_CASE",
  kebab: "kebab-case",
  screaming_kebab: "SCREAMING-KEBAB-CASE",
  screamingkebab: "SCREAMING-KEBAB-CASE",
  cobol: "SCREAMING-KEBAB-CASE",
  dot: "dot.case",
  path: "path/case",
  title: "Title Case",
  sentence: "Sentence case",
  upper: "UPPER CASE",
  lower: "lower case",
};
for (const [k, v] of Object.entries(extras)) {
  aliasMap[k] = v;
  aliasMap[k.toLowerCase()] = v;
}

function resolveCase(name: string): string | undefined {
  return aliasMap[name] ?? aliasMap[name.toLowerCase()] ?? aliasMap[name.replace(/[\s._\-\/]/g, "").toLowerCase()];
}

// ---------------------------------------------------------------------------
// 4. Output formatting
// ---------------------------------------------------------------------------

function convertAll(input: string): Record<string, string> {
  const words = tokenize(input);
  if (words.length === 0) return {};
  const result: Record<string, string> = {};
  for (const [name, fn] of Object.entries(converters)) {
    result[name] = fn(words);
  }
  return result;
}

function printTable(input: string, results: Record<string, string>): void {
  const detected = detectCase(input);
  const maxLabel = Math.max(...Object.keys(results).map((k) => k.length));

  console.log();
  console.log(
    chalk.bold("  Input: ") + chalk.cyan(input) +
    chalk.gray(` (detected: ${detected})`)
  );
  console.log(chalk.gray("  " + "─".repeat(maxLabel + 30)));

  for (const [name, value] of Object.entries(results)) {
    const label = chalk.yellow(name.padStart(maxLabel));
    console.log(`  ${label}  ${chalk.white(value)}`);
  }
  console.log();
}

function printJson(input: string, results: Record<string, string>): void {
  const output = {
    input,
    detected: detectCase(input),
    conversions: results,
  };
  console.log(JSON.stringify(output, null, 2));
}

// ---------------------------------------------------------------------------
// 5. Clipboard helper
// ---------------------------------------------------------------------------

function copyToClipboard(text: string): boolean {
  try {
    const cmds = ["xclip -selection clipboard", "xsel --clipboard --input", "pbcopy", "clip.exe"];
    for (const cmd of cmds) {
      try {
        execSync(cmd, { input: text, stdio: ["pipe", "ignore", "ignore"] });
        return true;
      } catch {
        continue;
      }
    }
    return false;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 6. CLI setup
// ---------------------------------------------------------------------------

const program = new Command();

program
  .name("string-case")
  .description("Convert strings between naming conventions")
  .version("1.0.0")
  .argument("[input...]", "String to convert")
  .option("-t, --to <case>", "Output only a specific case")
  .option("-f, --file <path>", "Process a file line by line")
  .option("-j, --json", "Output as JSON")
  .option("-c, --copy", "Copy result to clipboard")
  .option("-l, --list", "List all supported case types")
  .action((inputParts: string[], opts) => {
    // --list
    if (opts.list) {
      console.log(chalk.bold("\nSupported case types:\n"));
      for (const name of CASE_NAMES) {
        const example = converters[name](["hello", "world"]);
        console.log(`  ${chalk.yellow(name.padEnd(24))} ${chalk.gray(example)}`);
      }
      console.log();
      return;
    }

    // --file mode
    if (opts.file) {
      const filePath = opts.file as string;
      if (!existsSync(filePath)) {
        console.error(chalk.red(`File not found: ${filePath}`));
        process.exit(1);
      }
      const lines = readFileSync(filePath, "utf-8")
        .split("\n")
        .map((l: string) => l.trim())
        .filter(Boolean);

      if (opts.json) {
        const all = lines.map((line: string) => ({
          input: line,
          detected: detectCase(line),
          conversions: filterResults(convertAll(line), opts.to),
        }));
        console.log(JSON.stringify(all, null, 2));
      } else {
        for (const line of lines) {
          const results = filterResults(convertAll(line), opts.to);
          printTable(line, results);
        }
      }
      return;
    }

    // Normal mode — string from args
    const input = inputParts.join(" ");
    if (!input) {
      program.help();
      return;
    }

    const results = filterResults(convertAll(input), opts.to);
    if (Object.keys(results).length === 0) {
      console.error(chalk.red(`Unknown case type: ${opts.to}`));
      console.error(chalk.gray("Use --list to see all supported types."));
      process.exit(1);
    }

    if (opts.json) {
      printJson(input, results);
    } else {
      printTable(input, results);
    }

    if (opts.copy) {
      const values = Object.values(results);
      const textToCopy = values.length === 1 ? values[0] : values.join("\n");
      if (copyToClipboard(textToCopy)) {
        console.log(chalk.green("  Copied to clipboard!"));
      } else {
        console.error(chalk.red("  Failed to copy — no clipboard tool found."));
      }
    }
  });

function filterResults(
  results: Record<string, string>,
  toCase?: string
): Record<string, string> {
  if (!toCase) return results;
  const resolved = resolveCase(toCase);
  if (!resolved || !(resolved in results)) return {};
  return { [resolved]: results[resolved] };
}

program.parse();
