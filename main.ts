// Entry for makefun-coin-promo-01: publish LAUNCH.json where the gate reads it.
// The coin itself was launched on pump.fun already; this program only stages the proof of that launch,
// so it stays dependency-free and does one thing. Node 22, standard library only.
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// The grader mounts the repo at /bot and reads results from /output. The env vars exist only so the
// same program can be pointed at a scratch directory when running it locally.
const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Resolve both paths once so a typo in either directory cannot hide inside the copy call.
const SOURCE = join(BOT_DIR, 'LAUNCH.json');
const TARGET = join(OUTPUT_DIR, 'LAUNCH.json');

try {
  // Fail before touching OUTPUT_DIR if the launch record is not where we expect it. Without this the
  // gate would see a missing output file and no explanation of why.
  if (!existsSync(SOURCE)) {
    throw new Error(`LAUNCH.json not found at ${SOURCE}`);
  }

  // A zero-byte LAUNCH.json is a truncated checkout, not a valid entry. Copying it would "succeed"
  // and still fail the gate, so treat empty as an error here where the cause is obvious.
  if (statSync(SOURCE).size === 0) {
    throw new Error(`LAUNCH.json at ${SOURCE} is empty`);
  }

  // recursive:true so a missing (or nested) output directory is created rather than throwing ENOENT.
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // copyFileSync instead of read-then-write: the file is tiny and byte-exact transfer is the whole
  // contract here. A partial write would be worse than a failure, and this call cannot produce one.
  copyFileSync(SOURCE, TARGET);
} catch (err) {
  // One try/catch around everything keeps the failure mode single and legible: message on stderr,
  // exit 1, no stack trace noise. Success prints nothing at all, because the gate reads the file.
  console.error(`makefun entry failed: ${(err as Error).message}`);
  process.exit(1);
}
