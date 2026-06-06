// Tiny zero-dependency test runner. Imports every *.test.mjs file in this folder.
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

let passed = 0;
let failed = 0;
const failures = [];

globalThis.test = async (name, fn) => {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log(`  ✗ ${name}`);
  }
};

globalThis.assertEqual = (actual, expected, msg) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${msg || "assertEqual"}: expected ${e} but got ${a}`);
  }
};

const files = readdirSync(here).filter((f) => f.endsWith(".test.mjs"));
for (const file of files) {
  console.log(`\n${file}`);
  await import(join(here, file));
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  for (const { name, err } of failures) {
    console.log(`\nFAILED: ${name}\n${err.stack}`);
  }
  process.exit(1);
}
