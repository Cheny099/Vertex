#!/usr/bin/env node
/**
 * The type-check gate.
 *
 * Background worth keeping: `typecheck` used to be `tsc --noEmit`, and the root tsconfig uses
 * `files: []` plus project references. Plain `tsc` does not build referenced projects, so it
 * compiled an empty program and exited 0 on every run — locally and in CI, where it is one of four
 * gates. Type errors reached main unopposed for a long time, including one that threw on every
 * successful "Add account" with all four gates green.
 *
 * So this script does two things:
 *   1. Runs the compiler in build mode, so it actually sees `src`, and fails on any error.
 *   2. Asserts the compiler received the source tree. This is the part that is easy to skip and
 *      the reason the original breakage went unnoticed for so long: a mis-wired tsc fails
 *      *silently* — exit 0 with no output is indistinguishable from success. Checking that the
 *      file count is plausible turns that specific failure mode into a loud one.
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIN_FILES = 100;

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

const errorLines = runTsc([])
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => / error TS\d+: /.test(line));

if (errorLines.length > 0) {
  console.error(`\ntypecheck FAILED: ${errorLines.length} type error(s).\n`);
  for (const line of errorLines) console.error(`  ${line}`);
  console.error('');
  process.exit(1);
}

console.log(`typecheck OK: ${sourceFileCount} files checked, no type errors.`);
