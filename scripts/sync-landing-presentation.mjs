import { execFileSync } from 'node:child_process';
import { cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const presentation = new URL('../../presentation/', import.meta.url);
const destination = new URL('../src/assets/landing/presentation/', import.meta.url);

execFileSync(process.execPath, [fileURLToPath(new URL('scripts/build.mjs', presentation))], { stdio: 'inherit' });
await rm(destination, { recursive: true, force: true });
await cp(new URL('dist/', presentation), destination, { recursive: true });
