// v0.9.0 (friction log #1): keep src/version.ts in sync even under raw
// `npx vitest`, which bypasses npm's pretest hook.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default function setup(): void {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  fs.writeFileSync(
    path.join(__dirname, '../src/version.ts'),
    `// This file is generated automatically. Do not edit.\nexport const VERSION = '${pkg.version}';\n`,
    'utf8'
  );
}
