#!/usr/bin/env node
/**
 * The real type-check gate.
 *
 * Background: `typecheck` used to be `tsc --noEmit`, and the root tsconfig uses `files: []` plus
 * project references. Plain `tsc` does not build referenced projects, so it compiled an empty
 * program and exited 0 on every run — locally and in CI. Type errors reached main unopposed for a
 * long time, including one that threw on every successful "Add account".
 *
 * This script does three things:
 *   1. Runs the compiler in build mode, so it actually sees `src`.
 *   2. Asserts the compiler received the source tree, because a mis-wired tsc fails *silently* —
 *      exit 0 with no output is indistinguishable from success.
 *   3. Compares the reported errors against a checked-in baseline, failing only on ones that are
 *      not already known. That makes the gate effective immediately without having to clear the
 *      pre-existing backlog first.
 *
 * Working the backlog down: fix errors, then run `npm run typecheck -- --update-baseline`.
 * The baseline may only ever shrink; adding to it should be a deliberate, reviewed act.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = join(root, 'typecheck-baseline.txt');
const MIN_FILES = 100;
const updating = process.argv.includes('--update-baseline');

function runTsc(extraArgs) {
  try {
    return execFileSync('npx', ['tsc', '-b', '--force', ...extraArgs], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });
  } catch (err) {
    // Non-zero exit means type errors, which is exactly what we are here to read.
    return `${err.stdout ?? ''}${err.stderr ?? ''}`;
  }
}

// --- 1 + 2: compile, and prove the compiler had inputs -------------------------------------
const listing = runTsc(['--listFiles']);
const sourceFileCount = listing
  .split(/\r?\n/)
  .filter((line) => /[\\/]src[\\/]/.test(line) && /\.tsx?$/.test(line.trim())).length;

if (sourceFileCount < MIN_FILES) {
  console.error(
    `\ntypecheck FAILED: the compiler received ${sourceFileCount} files from src/, expected at ` +
      `least ${MIN_FILES}.\n\nThe type-checker is not looking at the codebase — almost always a ` +
      `tsconfig or script change that left tsc with no inputs. It will keep exiting 0 and\n` +
      `reporting nothing until this is fixed.\n`
  );
  process.exit(1);
}

// --- 3: compare against the baseline -------------------------------------------------------
// Line numbers are deliberately dropped: unrelated edits shift them, and that should not be
// mistaken for a new error.
const errorLines = runTsc([])
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => / error TS\d+: /.test(line));

const signature = (line) => {
  const m = line.match(/^(.*?)\(\d+,\d+\): (error TS\d+):/);
  return m ? `${m[1].replace(/\\/g, '/')}|${m[2]}` : line;
};

const counts = (lines) => {
  const map = new Map();
  for (const line of lines) {
    const key = signature(line);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
};

const current = counts(errorLines);

if (updating) {
  const serialised = [...current.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => `${count} ${key}`)
    .join('\n');
  writeFileSync(BASELINE, `${serialised}\n`, 'utf8');
  console.log(`Baseline updated: ${errorLines.length} known errors across ${current.size} sites.`);
  process.exit(0);
}

const baseline = new Map();
if (existsSync(BASELINE)) {
  // Split on either line ending and trim: git may check this file out with CRLF, and a trailing
  // \r would make every key miss silently — the baseline would read as empty and every known
  // error would be reported as new.
  for (const line of readFileSync(BASELINE, 'utf8').split(/\r?\n/)) {
    const m = line.trim().match(/^(\d+) (.+)$/);
    if (m) baseline.set(m[2], Number(m[1]));
  }
}

const regressions = [];
for (const [key, count] of current) {
  const allowed = baseline.get(key) ?? 0;
  if (count > allowed) regressions.push({ key, count, allowed });
}

const fixed = [...baseline.entries()].filter(([key, count]) => (current.get(key) ?? 0) < count);

if (regressions.length > 0) {
  console.error('\ntypecheck FAILED: new type errors.\n');
  for (const { key, count, allowed } of regressions) {
    const [file, code] = key.split('|');
    console.error(`  ${file}  ${code}  ${allowed} known -> ${count} now`);
  }
  console.error('\nFull output:\n');
  for (const line of errorLines) {
    if (regressions.some((r) => signature(line) === r.key)) console.error(`  ${line}`);
  }
  console.error(
    `\n${errorLines.length} total errors; ${baseline.size} sites are known and tracked in ` +
      `typecheck-baseline.txt.\n`
  );
  process.exit(1);
}

console.log(
  `typecheck OK: ${sourceFileCount} files checked, ${errorLines.length} known errors ` +
    `(tracked in typecheck-baseline.txt), no new ones.`
);
if (fixed.length > 0) {
  console.log(
    `\n${fixed.length} baseline entr${fixed.length === 1 ? 'y is' : 'ies are'} now clean — ` +
      `run \`npm run typecheck -- --update-baseline\` to shrink the baseline.`
  );
}
