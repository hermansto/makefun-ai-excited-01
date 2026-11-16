/*
 * makefun ai-excited-01 entrypoint.
 *
 * Copies the pre-drawn artwork at ./art/excited.png (anchored to this script's
 * own directory, never the working directory) to
 * (process.env.MAKEFUN_OUTPUT_DIR || '/output')/entry.png, creating the output
 * directory chain recursively. Standard library only, no network.
 *
 * After the copy it verifies:
 *   1. the copied byte size matches the source byte size,
 *   2. the copied bytes start with the 8-byte PNG signature 89 50 4E 47 0D 0A 1A 0A.
 *
 * Any failure exits with code 1 and prints an error naming the output path.
 */

import { copyFileSync, mkdirSync, openSync, readSync, closeSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const sourcePath = join(import.meta.dirname, 'art', 'excited.png');
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const outputPath = join(outputDir, 'entry.png');

function fail(message: string): never {
  console.error(`error: ${message} (output path: ${outputPath})`);
  process.exit(1);
}

function readHead(path: string, length: number): Buffer {
  const fd = openSync(path, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const bytesRead = readSync(fd, buffer, 0, length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    closeSync(fd);
  }
}

try {
  mkdirSync(outputDir, { recursive: true });
  copyFileSync(sourcePath, outputPath);

  const sourceSize = statSync(sourcePath).size;
  const outputSize = statSync(outputPath).size;

  if (sourceSize !== outputSize) {
    fail(
      `copy size mismatch for ${outputPath}: source ${sourcePath} is ${sourceSize} bytes, copied file is ${outputSize} bytes`,
    );
  }

  const head = readHead(outputPath, PNG_SIGNATURE.length);
  if (head.length !== PNG_SIGNATURE.length || !head.equals(PNG_SIGNATURE)) {
    fail(
      `copied file ${outputPath} is missing the PNG signature (expected 89 50 4E 47 0D 0A 1A 0A, got ${head.toString('hex') || 'nothing'})`,
    );
  }

  console.log(`wrote ${outputPath} (${outputSize} bytes, PNG signature ok)`);
} catch (error) {
  fail(`could not write ${outputPath}: ${(error as Error).message}`);
}
