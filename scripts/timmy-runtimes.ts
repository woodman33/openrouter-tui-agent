import { createDefaultRuntimeRegistry } from '../src/runtime/index.js';

const args = process.argv.slice(2);
const command = args.find(arg => !arg.startsWith('-')) ?? 'list';
const json = args.includes('--json');

if (!['list', 'doctor'].includes(command)) {
  console.error('Usage: timmy runtimes <list|doctor> [--json]');
  process.exit(2);
}

const registry = createDefaultRuntimeRegistry();

if (command === 'list') {
  const runtimes = registry.list();
  if (json) console.log(JSON.stringify({ runtimes }, null, 2));
  else {
    console.log('TIMMY Agent Runtimes');
    for (const runtime of runtimes) {
      console.log(`${runtime.id.padEnd(18)} ${runtime.transport.padEnd(7)} ${runtime.maturity.padEnd(7)} ${runtime.capabilities.join(', ')}`);
    }
  }
} else {
  const statuses = await registry.detectAll();
  if (json) console.log(JSON.stringify({ runtimes: statuses }, null, 2));
  else {
    console.log('TIMMY Runtime Doctor');
    console.log('Detection is read-only. No agent task is executed.');
    for (const { descriptor, availability } of statuses) {
      const state = availability.available ? 'ready' : 'unavailable';
      const detail = availability.version ?? availability.reason ?? '';
      console.log(`${descriptor.id.padEnd(18)} ${state.padEnd(11)} ${detail}`);
    }
  }
}
