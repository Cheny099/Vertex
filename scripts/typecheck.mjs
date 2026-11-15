#!/usr/bin/env node
// Build project references and verify that the compiler actually received our source tree.
import { spawnSync } from 'node:child_process';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync(process.execPath, [
  join(root, 'node_modules/typescript/bin/tsc'), '-b', '--force', '--listFiles', '--pretty', 'false',
], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });

const lines = (result.stdout ?? '').split(/\r?\n/);
const sourceFiles = new Set(lines.filter((line) => {
  if (!isAbsolute(line) || !/\.tsx?$/.test(line)) return false;
  const path = relative(join(root, 'src'), line);
  return path !== '..' && !path.startsWith('../') && !path.startsWith('..\\') && !isAbsolute(path);
}));

// Propagate process failures too; diagnostic text alone cannot establish success.
if (result.error || result.status !== 0) {
  console.error(lines.filter((line) => !isAbsolute(line) || !/\.(?:[cm]?tsx?|json)$/.test(line)).join('\n'));
  if (result.stderr) console.error(result.stderr);
  if (result.error) console.error(result.error.message);
  if (result.signal) console.error(`Compiler terminated by ${result.signal}`);
  process.exit(result.status || 1);
}
if (sourceFiles.size < 100) {
  console.error(`typecheck FAILED: only ${sourceFiles.size} source files checked; expected at least 100. Check project references.`);
  process.exit(1);
}
console.log(`typecheck OK: ${sourceFiles.size} source files checked, no type errors.`);
