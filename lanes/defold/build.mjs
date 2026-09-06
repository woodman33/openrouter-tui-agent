#!/usr/bin/env node
// Receipted Defold lane: bob.jar (pinned to the installed engine sha) resolves
// the Rive extension, builds the HTML5 bundle through the Defold build server
// (native extensions), copies it into the custody site, hashes every input
// and output, and seals one `defold.build` receipt in the ROOT chain via
// seal-root.mjs (store-pin preflight applies).
//   node lanes/defold/build.mjs [--no-seal] [--skip-build]
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..', '..');
const PROJECT = join(ROOT, 'companion', 'custody-companion');
const ENGINE_SHA = '574678c7d44be490d874fbed2d0ae6211feec4d9';
const BOB = join(here, '.cache', `bob-${ENGINE_SHA.slice(0, 8)}.jar`);
const BOB_URL = `https://d.defold.com/archive/${ENGINE_SHA}/bob/bob.jar`;
// bob reserves <project>/build for itself; bundle beside it.
const BUNDLE = join(PROJECT, 'bundle', 'wasm-web');
const SITE_OUT = join(ROOT, 'vault-custody', 'public', 'companion');
const args = new Set(process.argv.slice(2));

// bob for this engine needs the JDK Defold ships (25); the system Java is 21.
function findJava() {
  if (process.env.JAVA_BIN) return process.env.JAVA_BIN;
  const pk = '/Applications/Defold.app/Contents/Resources/packages';
  if (existsSync(pk)) {
    for (const d of readdirSync(pk).filter((n) => n.startsWith('jdk-'))) {
      for (const rel of ['Contents/Home/bin/java', 'bin/java']) {
        const p = join(pk, d, rel);
        if (existsSync(p)) return p;
      }
    }
  }
  return 'java';
}
const JAVA = findJava();
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const run = (cmd, a, opts = {}) => {
  const r = spawnSync(cmd, a, { stdio: 'inherit', ...opts });
  if (r.status !== 0) throw new Error(`${cmd} ${a.join(' ')} exited ${r.status}`);
};

// 1. bob.jar pinned to the installed engine.
mkdirSync(dirname(BOB), { recursive: true });
if (!existsSync(BOB)) {
  console.log(`downloading ${BOB_URL}`);
  run('curl', ['-sSL', '-o', BOB, BOB_URL]);
}
const bobSha = sha(BOB);
const javaProbe = spawnSync(JAVA, ['-version'], { encoding: 'utf8' });
const javaVersion = ((javaProbe.stderr || '') + (javaProbe.stdout || '')).split('\n')[0].trim();
const bobVersion = execFileSync(JAVA,['-jar', BOB, '--version'], { encoding: 'utf8' }).trim();

// 2. Inputs: every project file + the .riv.
const inputs = walk(PROJECT).filter((p) => !p.includes('/build/') && !p.includes('/.internal/'));
const rivs = inputs.filter((p) => p.endsWith('.riv'));
const inputManifest = inputs.map((p) => ({ path: p.slice(PROJECT.length + 1), sha256: sha(p) }));
const inputsSha = createHash('sha256').update(JSON.stringify(inputManifest)).digest('hex');

// 3. Build: resolve deps, build + bundle for js-web through the build server.
if (!args.has('--skip-build')) {
  rmSync(BUNDLE, { recursive: true, force: true });
  run(JAVA, ['-jar', BOB, '--email', 'ci@timmy.local', '--auth', 'none', 'resolve'], { cwd: PROJECT });
  run(JAVA, ['-jar', BOB,
    '--platform', 'wasm-web', '--architectures', 'wasm-web',
    '--archive', '--variant', 'release', '--build-server', 'https://build.defold.com',
    '--bundle-output', BUNDLE, 'build', 'bundle'], { cwd: PROJECT });
}

// 4. Outputs: the bundle dir bob names after the title.
const bundleDir = readdirSync(BUNDLE).map((n) => join(BUNDLE, n)).find((p) => statSync(p).isDirectory());
if (!bundleDir) throw new Error('no bundle produced');
const outputs = walk(bundleDir).map((p) => ({ path: p.slice(bundleDir.length + 1), sha256: sha(p), bytes: statSync(p).size }));
const engineFiles = outputs.filter((o) => /\.wasm$|_wasm\.js$|dmloader\.js$|dmengine.*\.js$/.test(o.path));
const outputsSha = createHash('sha256').update(JSON.stringify(outputs)).digest('hex');

// 5. Copy into the custody site (served at /companion/).
rmSync(SITE_OUT, { recursive: true, force: true });
cpSync(bundleDir, SITE_OUT, { recursive: true });

const summary = {
  engine_sha: ENGINE_SHA, bob_version: bobVersion, bob_sha256: bobSha, java: javaVersion, java_bin: JAVA,
  rivs: rivs.map((p) => ({ path: p.slice(PROJECT.length + 1), sha256: sha(p) })),
  inputs: inputManifest.length, inputs_sha256: inputsSha,
  outputs: outputs.length, outputs_sha256: outputsSha, engine_files: engineFiles,
  bundle: bundleDir, site: SITE_OUT
};
console.log(JSON.stringify(summary, null, 1));

// 6. Seal defold.build in the ROOT chain.
if (!args.has('--no-seal')) {
  const meta = [
    `engine_sha=${ENGINE_SHA}`, `bob_version=${bobVersion}`, `bob_sha256=${bobSha}`, `java=${javaVersion}`,
    `riv=${summary.rivs.map((r) => `${r.path}:${r.sha256}`).join(',')}`,
    `inputs=${inputManifest.length}`, `inputs_sha256=${inputsSha}`,
    `outputs=${outputs.length}`, `outputs_sha256=${outputsSha}`,
    `engine=${engineFiles.map((e) => `${e.path}:${e.sha256.slice(0, 16)}`).join(',')}`,
    `site=vault-custody/public/companion`, `launch=/t?...&app=1 → /companion/?serial=<serial>&tap=<hash8>`
  ];
  const a = ['defold.build'];
  for (const m of meta) a.push('--meta', m);
  run('node', [join(ROOT, 'lanes', 'anchor', 'seal-root.mjs'), ...a]);
}
