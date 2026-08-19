import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { appendFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { Agent } from '../agent/core.js';
import { saveConfig } from '../utils/config.js';
import { probeOllama } from '../agent/providers.js';
import { saveOrgConfig } from '../utils/sessionstore.js';
import { theme } from './theme.js';

interface OnboardingProps {
  agent: Agent;
  onDone: () => void;
}

type Step = 'provider' | 'key' | 'cloud' | 'cloudUrl' | 'logs' | 'done';

/**
 * First-run onboarding: pick a brain (local Ollama, OpenRouter key, or both),
 * optionally wire Cloudflare log sync, then drop into the unified screen.
 * Local-first by design — TIMMY must work with zero accounts.
 */
export function Onboarding({ agent, onDone }: OnboardingProps) {
  const [step, setStep] = useState<Step>('provider');
  const [ollama, setOllama] = useState<{ ok: boolean; models: string[] } | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [choice, setChoice] = useState<'ollama' | 'key' | 'both'>('both');
  const [cloud, setCloud] = useState<'default' | 'custom' | 'off'>('default');
  const [pendingCloud, setPendingCloud] = useState<'default' | 'custom' | 'off'>('default');
  const [logBase, setLogBase] = useState<'repo' | 'home'>('repo');
  const [logNaming, setLogNaming] = useState<'date' | 'run'>('date');
  const [logQ, setLogQ] = useState<'base' | 'naming'>('base');
  const [note, setNote] = useState('');

  useEffect(() => {
    void probeOllama().then(r => setOllama(r));
  }, []);

  const persistEnv = (line: string) => {
    try {
      const envPath = join(process.cwd(), '.env');
      if (existsSync(envPath)) appendFileSync(envPath, line + '\n', 'utf8');
    } catch { /* non-fatal */ }
  };

  const finish = (cloudChoice: 'default' | 'custom' | 'off', customUrl?: string) => {
    if (cloudChoice === 'off') persistEnv('TIMMY_TELEMETRY_URL=off');
    if (cloudChoice === 'custom' && customUrl) persistEnv(`TIMMY_TELEMETRY_URL=${customUrl}`);
    saveConfig({ onboarded: true } as any);
    onDone();
  };

  useInput((char, key) => {
    if (step === 'provider') {
      if (char === 'o') { setChoice('ollama'); setStep('cloud'); }
      if (char === 'k') { setChoice('key'); setStep('key'); }
      if (char === 'b' || key.return) { setChoice('both'); setStep('key'); }
      return;
    }
    if (step === 'key') {
      if (key.return) {
        const k = keyInput.trim();
        if (k) {
          saveConfig({ apiKey: k } as any);
          try { agent.updateApiKey(k); } catch { /* client refresh best-effort */ }
        }
        setStep('cloud');
        return;
      }
      if (key.backspace || key.delete) { setKeyInput(keyInput.slice(0, -1)); return; }
      if (key.escape) { setStep('provider'); return; }
      if (char && !key.ctrl && !key.meta && char !== '\t') setKeyInput(keyInput + char);
      return;
    }
    if (step === 'cloud') {
      if (key.return) { setPendingCloud('default'); setStep('logs'); }
      if (char === 'c') setStep('cloudUrl');
      if (char === 'l') { setPendingCloud('off'); setStep('logs'); }
      if (key.escape) setStep(choice === 'ollama' ? 'provider' : 'key');
      return;
    }
    if (step === 'cloudUrl') {
      if (key.return) { setPendingCloud('custom'); setStep('logs'); return; }
      if (key.backspace || key.delete) { setUrlInput(urlInput.slice(0, -1)); return; }
      if (key.escape) { setStep('cloud'); return; }
      if (char && !key.ctrl && !key.meta && char !== '\t') setUrlInput(urlInput + char);
      return;
    }
    if (step === 'logs') {
      if (logQ === 'base') {
        if (char === '1') setLogBase('repo');
        if (char === '2') setLogBase('home');
        if (key.return) setLogQ('naming');
        if (key.escape) setStep('cloud');
        return;
      }
      if (char === 'd') setLogNaming('date');
      if (char === 'r') setLogNaming('run');
      if (key.return) {
        saveOrgConfig({
          baseDir: logBase === 'home' ? '~/TIMMY-archive' : join('.timmy', 'archive'),
          naming: logNaming
        });
        finish(pendingCloud, pendingCloud === 'custom' ? urlInput.trim() : undefined);
      }
      if (key.escape) setLogQ('base');
      return;
    }
  });

  const ollamaLine = ollama === null
    ? 'probing localhost:11434…'
    : ollama.ok
      ? `✔ Ollama detected — ${ollama.models.length} model(s): ${ollama.models.slice(0, 3).join(', ')}${ollama.models.length > 3 ? '…' : ''}`
      : '✘ no local Ollama found (install: ollama.ai — optional)';

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box borderStyle="double" borderColor={theme.brand} paddingX={2} flexDirection="column">
        <Text bold color={theme.brand}>⚡ TIMMY FIRST RUN — 60-second setup</Text>
        <Text color={theme.textSecondary}>Local-first: everything works with zero accounts. The rest is enhancement.</Text>

        {step === 'provider' ? (
          <Box flexDirection="column" marginTop={1}>
            <Text bold color={theme.textPrimary}>1 · PICK A BRAIN — choose ONE, Enter continues</Text>
            <Text color={theme.textSecondary}>  {ollamaLine}</Text>
            <Text color={choice === 'both' ? theme.success : theme.textPrimary}>{choice === 'both' ? '  ▶ [b]' : '  ○ [b]'} Both — OpenRouter primary, Ollama fallback (recommended)</Text>
            <Text color={choice === 'ollama' ? theme.success : theme.textPrimary}>{choice === 'ollama' ? '  ▶ [o]' : '  ○ [o]'} Local Ollama only — offline, free, private</Text>
            <Text color={choice === 'key' ? theme.success : theme.textPrimary}>{choice === 'key' ? '  ▶ [k]' : '  ○ [k]'} OpenRouter key only — paste a key (openrouter.ai/keys)</Text>
            <Text color={theme.textSecondary}>  ▶ = current choice — press its key to change it</Text>
          </Box>
        ) : (
          <Box marginTop={1}>
            <Text color={theme.textSecondary}>1 · brain: {choice === 'both' ? 'Both (OpenRouter + Ollama)' : choice === 'ollama' ? 'Local Ollama' : 'OpenRouter key'} ✓</Text>
          </Box>
        )}

        {step === 'key' && (
          <Box flexDirection="column" marginTop={1}>
            <Text bold color={theme.textPrimary}>2 · OPENROUTER KEY (Enter to continue, Esc back)</Text>
            <Box borderStyle="single" borderColor={theme.borderDefault} paddingX={1}>
              <Text color={theme.brand}>sk-or-… </Text>
              <Text color={theme.textPrimary}>{keyInput || 'paste key (optional — Enter skips)'}</Text>
            </Box>
          </Box>
        )}

        {step === 'cloud' && (
          <Box flexDirection="column" marginTop={1}>
            <Text bold color={theme.textPrimary}>2 · CLOUDFLARE LOG SYNC (sealed receipts + companion mirror)</Text>
            <Text color={theme.success}>  [Enter] Sync to your worker (timmy-ai-proxy.wmeldman33.workers.dev)</Text>
            <Text color={theme.textPrimary}>  [c] Custom worker URL</Text>
            <Text color={theme.textPrimary}>  [l] Local-only logs — nothing leaves this machine</Text>
          </Box>
        )}

        {step === 'cloudUrl' && (
          <Box flexDirection="column" marginTop={1}>
            <Text bold color={theme.textPrimary}>Worker URL (Enter to save)</Text>
            <Box borderStyle="single" borderColor={theme.borderDefault} paddingX={1}>
              <Text color={theme.textPrimary}>{urlInput || 'https://your-worker.workers.dev'}</Text>
            </Box>
          </Box>
        )}

        {step === 'logs' && (
          <Box flexDirection="column" marginTop={1}>
            <Text color={theme.textSecondary}>2 · cloud sync: {pendingCloud === 'default' ? 'your worker' : pendingCloud === 'off' ? 'local-only' : 'custom URL'} ✓</Text>
            {logQ === 'base' ? (
              <>
                <Text bold color={theme.textPrimary}>3 · LOG ORGANIZATION — question 1 of 2: where should the archive live?</Text>
                <Text color={logBase === 'repo' ? theme.success : theme.textPrimary}>{logBase === 'repo' ? '  ▶ [1]' : '  ○ [1]'} .timmy/archive in this repo (recommended — stays with the project)</Text>
                <Text color={logBase === 'home' ? theme.success : theme.textPrimary}>{logBase === 'home' ? '  ▶ [2]' : '  ○ [2]'} ~/TIMMY-archive — survives clones & reinstalls</Text>
                <Text color={theme.textSecondary}>  press 1 or 2 to choose · Enter continues</Text>
              </>
            ) : (
              <>
                <Text color={theme.textSecondary}>3a · where: {logBase === 'repo' ? '.timmy/archive' : '~/TIMMY-archive'} ✓</Text>
                <Text bold color={theme.textPrimary}>3b · question 2 of 2: how should session folders be named?</Text>
                <Text color={logNaming === 'date' ? theme.success : theme.textPrimary}>{logNaming === 'date' ? '  ▶ [d]' : '  ○ [d]'} folders by date (2026-08-13/session…) — recommended</Text>
                <Text color={logNaming === 'run' ? theme.success : theme.textPrimary}>{logNaming === 'run' ? '  ▶ [r]' : '  ○ [r]'} folders by run id</Text>
                <Text color={theme.textSecondary}>  press d or r to choose · Enter finishes</Text>
              </>
            )}
            <Text color={theme.textSecondary}>  tree: sessions/ generations/ uploads/ skills/ context/ exports/ · change anytime via .timmy/logorg.json</Text>
          </Box>
        )}

        {note && <Text color={theme.warning}>{note}</Text>}
        <Box marginTop={1}>
          <Text color={theme.textSecondary}>TIMMY never sells compute: your keys, your Ollama, your worker. We store proofs, not your traffic.</Text>
        </Box>
      </Box>
    </Box>
  );
}
