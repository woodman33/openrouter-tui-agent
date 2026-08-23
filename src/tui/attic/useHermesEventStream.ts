// React binding for the process-lifetime Hermes mirror (src/hermes/mirror.ts).
// The mirror owns the client/store/log so it survives panel unmounts; this
// hook only subscribes (with coalesced re-renders) and exposes actions.

import { useEffect, useMemo, useRef, useState } from 'react';
import { getHermesMirror, type HermesMirrorState } from '../../hermes/mirror.js';

/** Coalesce mirror change notifications so delta floods re-render at ~20fps. */
const RENDER_COALESCE_MS = 50;

export interface HermesEventStreamActions {
  connect: () => void;
  startSession: () => Promise<void>;
  submitPrompt: (text: string) => Promise<void>;
  approve: (approvalId: string) => Promise<void>;
  reject: (approvalId: string) => Promise<void>;
  answer: (approvalId: string, text: string) => Promise<void>;
  exportReceipt: () => string | null;
}

export function useHermesEventStream(): HermesMirrorState & HermesEventStreamActions {
  const mirror = useMemo(() => getHermesMirror(), []);
  const [state, setState] = useState<HermesMirrorState>(() => mirror.getState());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const scheduleSync = () => {
      if (timerRef.current) return;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setState(mirror.getState());
      }, RENDER_COALESCE_MS);
    };
    const unsubscribe = mirror.subscribe(scheduleSync);
    // Re-sync on mount: the mirror may have advanced while unmounted.
    setState(mirror.getState());
    return () => {
      unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [mirror]);

  const actions = useMemo<HermesEventStreamActions>(
    () => ({
      connect: () => mirror.connect(),
      startSession: () => mirror.startSession(),
      submitPrompt: (text) => mirror.submitPrompt(text),
      approve: (approvalId) => mirror.approve(approvalId),
      reject: (approvalId) => mirror.reject(approvalId),
      answer: (approvalId, text) => mirror.answer(approvalId, text),
      exportReceipt: () => mirror.exportReceipt(),
    }),
    [mirror],
  );

  return { ...state, ...actions };
}
