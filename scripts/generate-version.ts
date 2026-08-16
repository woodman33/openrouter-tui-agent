import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.join(__dirname, '../package.json');
const outPath = path.join(__dirname, '../src/version.ts');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const version = pkg.version;

const content = `// This file is generated automatically. Do not edit.
export const VERSION = '${version}';
`;

fs.writeFileSync(outPath, content, 'utf8');
console.log(`Generated src/version.ts with version ${version}`);
