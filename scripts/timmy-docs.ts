import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

type VerifyResult = {
  ok: boolean;
  checks: Array<{ name: string; ok: boolean; detail?: string }>;
};

const DOCS_ROOT = 'docs';
const PREVIEW_ROOT = join('.timmy', 'docs-preview');
const REQUIRED_DOCS = [
  'README.md',
  'SUMMARY.md',
  'timmy-architecture.md',
  'provider-registry.md',
  'agent-runners.md',
  'receipts-and-replay.md',
  'cloudflare-deployment.md',
  'security-and-secrets.md',
];

function parseArgs(argv: string[]) {
  const command = argv.find((arg) => !arg.startsWith('-')) || 'verify';
  const json = argv.includes('--json');
  const once = argv.includes('--once');
  const portArg = argv.find((arg) => arg.startsWith('--port='));
  const port = portArg ? Number(portArg.slice('--port='.length)) : 4177;
  return { command, json, once, port };
}

function loadDotEnv(path = '.env'): Record<string, string> {
  if (!existsSync(path)) return {};

  const values: Record<string, string> = {};
  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const equals = line.indexOf('=');
    if (equals === -1) continue;

    const key = line.slice(0, equals).trim();
    let value = line.slice(equals + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function getEnv(name: string): string | undefined {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;
  return loadDotEnv()[name];
}

function hasUsableSecret(name: string): boolean {
  const value = getEnv(name);
  if (!value) return false;
  return !/^(your-|paste_|changeme|change_me|example|placeholder)$/i.test(value.trim());
}

function checkGitBookCli(): { ok: boolean; detail: string } {
  const result = spawnSync('gitbook', ['--version'], { encoding: 'utf8' });
  if (result.status === 0) {
    return { ok: true, detail: (result.stdout || result.stderr).trim() || 'installed' };
  }
  return { ok: false, detail: 'gitbook command not found or not runnable' };
}

function readText(path: string): string {
  return readFileSync(path, 'utf8');
}

function verifyDocs(): VerifyResult {
  const checks: VerifyResult['checks'] = [];

  for (const file of REQUIRED_DOCS) {
    const path = join(DOCS_ROOT, file);
    checks.push({ name: `docs:${file}`, ok: existsSync(path), detail: path });
  }

  const gitbookConfig = '.gitbook.yaml';
  const configOk = existsSync(gitbookConfig) && /root:\s*\.\/docs\/?/m.test(readText(gitbookConfig));
  checks.push({
    name: 'gitbook:content-root',
    ok: configOk,
    detail: '.gitbook.yaml points GitBook Git Sync at ./docs',
  });

  if (existsSync('.env.example')) {
    const example = readText('.env.example');
    checks.push({
      name: 'env-example:gitbook-key',
      ok: /^GITBOOK_API_KEY=/m.test(example),
      detail: 'GITBOOK_API_KEY is documented without a value',
    });
    checks.push({
      name: 'env-example:openai-key',
      ok: /^OPENAI_API_KEY=/m.test(example),
      detail: 'OPENAI_API_KEY is documented as an optional provider key',
    });
  } else {
    checks.push({ name: 'env-example', ok: false, detail: '.env.example missing' });
  }

  if (existsSync(join(DOCS_ROOT, 'SUMMARY.md'))) {
    const summary = readText(join(DOCS_ROOT, 'SUMMARY.md'));
    const links = [...summary.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);
    const missingLinks = links
      .filter((href) => !href.startsWith('http://') && !href.startsWith('https://') && href.endsWith('.md'))
      .filter((href) => !existsSync(join(DOCS_ROOT, href)));

    checks.push({
      name: 'summary:links',
      ok: missingLinks.length === 0,
      detail: missingLinks.length === 0 ? 'all SUMMARY.md links resolve' : missingLinks.join(', '),
    });
  }

  const gitbook = checkGitBookCli();
  checks.push({ name: 'gitbook:cli', ok: gitbook.ok, detail: gitbook.detail });
  checks.push({
    name: 'gitbook:api-key',
    ok: hasUsableSecret('GITBOOK_API_KEY'),
    detail: hasUsableSecret('GITBOOK_API_KEY') ? 'present in environment or .env' : 'missing or placeholder',
  });

  return { ok: checks.every((check) => check.ok), checks };
}

function printVerify(result: VerifyResult, json = false) {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  for (const check of result.checks) {
    const marker = check.ok ? 'OK' : 'FAIL';
    console.log(`${marker} ${check.name}${check.detail ? ` - ${check.detail}` : ''}`);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function markdownToHtml(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const html: string[] = [];
  let inCode = false;
  let inList = false;

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCode) {
        html.push('</code></pre>');
        inCode = false;
      } else {
        html.push('<pre><code>');
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      html.push(`${escapeHtml(line)}\n`);
      continue;
    }

    if (/^\s*-\s+/.test(line)) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${formatInline(line.replace(/^\s*-\s+/, ''))}</li>`);
      continue;
    }

    if (inList) {
      html.push('</ul>');
      inList = false;
    }

    if (!line.trim()) {
      html.push('');
    } else if (line.startsWith('# ')) {
      html.push(`<h1>${formatInline(line.slice(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      html.push(`<h2>${formatInline(line.slice(3))}</h2>`);
    } else if (line.startsWith('### ')) {
      html.push(`<h3>${formatInline(line.slice(4))}</h3>`);
    } else {
      html.push(`<p>${formatInline(line)}</p>`);
    }
  }

  if (inList) html.push('</ul>');
  if (inCode) html.push('</code></pre>');
  return html.join('\n');
}

function formatInline(value: string): string {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function renderPreview() {
  mkdirSync(PREVIEW_ROOT, { recursive: true });

  const nav = REQUIRED_DOCS
    .filter((file) => existsSync(join(DOCS_ROOT, file)))
    .map((file) => `<a href="/${file.replace(/\.md$/, '.html')}">${file.replace(/\.md$/, '')}</a>`)
    .join('');

  for (const file of REQUIRED_DOCS.filter((entry) => entry.endsWith('.md'))) {
    const source = join(DOCS_ROOT, file);
    if (!existsSync(source)) continue;

    const content = markdownToHtml(readText(source));
    const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TIMMY Docs - ${escapeHtml(file)}</title>
  <style>
    :root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; background: #f7f8fb; color: #171923; }
    .shell { display: grid; grid-template-columns: minmax(180px, 240px) minmax(0, 1fr); min-height: 100vh; }
    nav { background: #111827; color: #f9fafb; padding: 24px 18px; }
    nav strong { display: block; margin-bottom: 16px; }
    nav a { color: #d1d5db; display: block; margin: 10px 0; text-decoration: none; }
    nav a:hover { color: #ffffff; }
    main { max-width: 940px; padding: 40px 6vw 64px; }
    h1 { font-size: 2.1rem; line-height: 1.1; margin-top: 0; }
    h2 { margin-top: 2.2rem; border-top: 1px solid #d7dce5; padding-top: 1.3rem; }
    p, li { line-height: 1.68; }
    code { background: rgba(17, 24, 39, 0.08); border-radius: 4px; padding: 0.1rem 0.3rem; }
    pre { overflow: auto; background: #111827; color: #f9fafb; border-radius: 8px; padding: 16px; }
    a { color: #1f5fbf; }
    @media (max-width: 760px) {
      .shell { grid-template-columns: 1fr; }
      nav { position: static; }
      main { padding: 28px 20px 48px; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <nav><strong>TIMMY Docs</strong>${nav}</nav>
    <main>${content}</main>
  </div>
</body>
</html>`;
    writeFileSync(join(PREVIEW_ROOT, file.replace(/\.md$/, '.html')), page);
  }

  writeFileSync(join(PREVIEW_ROOT, 'index.html'), readFileSync(join(PREVIEW_ROOT, 'README.html')));
}

function contentType(pathname: string) {
  if (pathname.endsWith('.html')) return 'text/html; charset=utf-8';
  if (pathname.endsWith('.css')) return 'text/css; charset=utf-8';
  return 'text/plain; charset=utf-8';
}

function startPreview(port: number) {
  renderPreview();
  const root = resolve(PREVIEW_ROOT);
  const server = createServer((request, response) => {
    const requested = request.url?.split('?')[0] || '/';
    const normalized = requested === '/' ? '/index.html' : requested;
    const file = resolve(root, `.${normalized}`);

    if (!file.startsWith(root) || !existsSync(file)) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    response.writeHead(200, { 'content-type': contentType(file) });
    response.end(readFileSync(file));
  });

  server.listen(port, () => {
    console.log(`TIMMY docs preview: http://localhost:${port}`);
  });
}

function runPublish(json = false): number {
  const result = verifyDocs();
  if (!result.ok) {
    printVerify(result, json);
    return 1;
  }

  const apiKey = getEnv('GITBOOK_API_KEY');
  const endpoint = getEnv('GITBOOK_ENDPOINT') || 'https://api.gitbook.com';
  const whoami = spawnSync('gitbook', ['whoami'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      GITBOOK_TOKEN: apiKey,
      GITBOOK_ENDPOINT: endpoint,
    },
  });

  const publishResult = {
    ok: whoami.status === 0,
    mode: 'git-sync',
    detail:
      whoami.status === 0
        ? 'GitBook authentication verified. Push the private GitHub repo branch connected to GitBook Git Sync to publish docs.'
        : 'GitBook authentication failed. Check GITBOOK_API_KEY without printing it.',
  };

  if (json) {
    console.log(JSON.stringify(publishResult, null, 2));
  } else {
    console.log(publishResult.ok ? `OK ${publishResult.detail}` : `FAIL ${publishResult.detail}`);
  }

  return publishResult.ok ? 0 : 1;
}

const { command, json, once, port } = parseArgs(process.argv.slice(2));

if (command === 'verify') {
  const result = verifyDocs();
  printVerify(result, json);
  process.exit(result.ok ? 0 : 1);
}

if (command === 'preview') {
  renderPreview();
  if (once) {
    console.log(`OK rendered docs preview into ${PREVIEW_ROOT}`);
    process.exit(0);
  }
  startPreview(port);
} else if (command === 'publish' || command === 'gitbook') {
  process.exit(runPublish(json));
} else {
  const script = process.argv[1] || 'timmy-docs';
  console.error(`Usage: ${script} <verify|preview|publish> [--json] [--once] [--port=4177]`);
  process.exit(2);
}
