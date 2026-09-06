// Board state from receipts. Pure and shared: the viewer bundles it and the
// state-table lane imports it, so the picture on screen and the table in the
// dossier are computed by the same rules.
//
// inputs
//   receipts  root receipt records {id, ts, subject, sources}
//   edge      Map<subject, {count, head}> from the worker's daily head
//
// frame:   done when every listed order has an order.execute receipt whose
//          sources carry the id; blocked when one was sealed as blocked;
//          active when some are sealed; next otherwise. `attested` names a
//          receipt that stands for orders sealed in a frozen fork store.
// capsule: one rule per acceptance line (acceptance_evidence, aligned by
//          index; null = not receipted). Rules:
//            {root: subject, min?, sources?: {k: v}, has?: {k: substring}}
//            {edge: chain, min?} · {edge_prefix: prefix, min?}
//            {blocked_by: subject}  (marks the capsule blocked while incomplete)

export function orderReceipt(receipts, ordId) {
  return receipts.find((r) => r.subject === 'order.execute' && Array.isArray(r.sources) && r.sources.some((s) => s && s.id === ordId));
}

export function frameStatus(f, receipts) {
  const byId = new Map(receipts.map((r) => [r.id, r]));
  if (!Array.isArray(f.orders) || !f.orders.length) return { status: f.status ?? 'next', sealed: 0, total: 0, why: f.status ? 'declared' : 'no orders listed' };
  const found = f.orders.map((id) => orderReceipt(receipts, id));
  const sealed = found.filter(Boolean).length;
  const total = f.orders.length;
  if (found.some((r) => r && r.sources.some((s) => s && s.state === 'blocked'))) return { status: 'blocked', sealed, total, why: 'an order was sealed as blocked' };
  if (sealed === total) return { status: 'done', sealed, total, why: 'every order sealed' };
  if (f.attested && byId.has(f.attested)) return { status: 'done', sealed, total, attested: f.attested, why: `attested by ${f.attested}` };
  if (sealed > 0) return { status: 'active', sealed, total, why: 'some orders sealed' };
  return { status: 'next', sealed, total, why: 'no order sealed yet' };
}

export function rootCount(receipts, subject, sources, has) {
  return receipts.filter((r) => {
    if (r.subject !== subject) return false;
    if (!sources && !has) return true;
    if (!Array.isArray(r.sources)) return false;
    return r.sources.some((s) => s && typeof s === 'object'
      && (!sources || Object.entries(sources).every(([k, v]) => String(s[k]) === String(v)))
      && (!has || Object.entries(has).every(([k, v]) => String(s[k] ?? '').includes(String(v)))));
  }).length;
}

export function ruleHolds(rule, receipts, edge) {
  if (!rule) return null; // not receipted
  if (rule.root) return rootCount(receipts, rule.root, rule.sources, rule.has) >= (rule.min ?? 1);
  if (rule.edge) return (edge.get(rule.edge)?.count ?? 0) >= (rule.min ?? 1);
  if (rule.edge_prefix) {
    let n = 0;
    for (const [subject, h] of edge) if (subject.startsWith(rule.edge_prefix)) n += h.count ?? 0;
    return n >= (rule.min ?? 1);
  }
  return false;
}

export function ruleLabel(rule) {
  if (!rule) return 'not receipted';
  if (rule.root) return `root ${rule.root}${rule.sources ? ' ' + JSON.stringify(rule.sources) : ''}${rule.has ? ' ~' + JSON.stringify(rule.has) : ''}${rule.min > 1 ? ` ×${rule.min}` : ''}`;
  if (rule.edge) return `edge ${rule.edge}${rule.min > 1 ? ` ×${rule.min}` : ''}`;
  if (rule.edge_prefix) return `edge ${rule.edge_prefix}*`;
  if (rule.blocked_by) return `blocked by ${rule.blocked_by}`;
  return '?';
}

export function capsuleState(n, receipts, edge) {
  const lines = Array.isArray(n.acceptance) ? n.acceptance : [];
  const aligned = Array.isArray(n.acceptance_evidence) && n.acceptance_evidence.length === lines.length;
  const rules = aligned ? n.acceptance_evidence : (n.evidence ?? []).filter((r) => !r.blocked_by);
  const blockers = aligned ? (n.blocked_by ? [{ blocked_by: n.blocked_by }] : []) : (n.evidence ?? []).filter((r) => r.blocked_by);
  const checks = rules.map((rule, i) => ({ line: aligned ? lines[i] : (rule?.why ?? ''), rule, held: ruleHolds(rule, receipts, edge), why: rule?.why ?? null }));
  const receipted = checks.filter((c) => c.rule);
  const held = receipted.filter((c) => c.held === true).length;
  const total = receipted.length;
  const blocked = blockers.some((b) => rootCount(receipts, b.blocked_by) > 0);
  let status = 'next';
  if (total && held === total) status = 'done';
  else if (blocked) status = 'blocked';
  else if (held > 0) status = 'active';
  return { status, held, total, unreceipted: checks.length - total, checks, blocked_by: blocked ? blockers.map((b) => b.blocked_by) : [] };
}

export function stateTable(board, receipts, head) {
  const edge = new Map((head?.heads ?? []).map((h) => [h.subject, h]));
  const frames = board.frames.map((f) => ({ id: f.id, title: f.title, ...frameStatus(f, receipts) }));
  const capsules = board.nodes.filter((n) => n.kind === 'capsule').map((n) => ({ id: n.id, frame: n.frame, ...capsuleState(n, receipts, edge) }));
  return { computed_at: new Date().toISOString(), receipts: receipts.length, head: head ? { date: head.date, combined_sha256: head.combined_sha256, subjects: head.subjects } : null, frames, capsules };
}

export function renderMarkdown(table) {
  const mark = (c) => (c.rule ? (c.held ? '✓' : '✗') : '–');
  const lines = ['| capsule | frame | state | evidence | acceptance lines |', '|---|---|---|---|---|'];
  for (const c of table.capsules) {
    const acc = c.checks.map((k) => `${mark(k)} ${k.line}`).join('<br>');
    lines.push(`| ${c.id} | ${c.frame} | ${c.status} | ${c.held}/${c.total}${c.unreceipted ? ` (+${c.unreceipted} unreceipted)` : ''} | ${acc} |`);
  }
  lines.push('', '| frame | state | orders |', '|---|---|---|');
  for (const f of table.frames) lines.push(`| ${f.title} | ${f.status}${f.attested ? ' · attested' : ''} | ${f.sealed}/${f.total} |`);
  lines.push('', `computed ${table.computed_at} from ${table.receipts} root receipts${table.head ? ` · edge head ${table.head.date} ${String(table.head.combined_sha256).slice(0, 12)}` : ' · no edge head'}`);
  return lines.join('\n');
}
