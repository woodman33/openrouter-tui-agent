import { useInput } from 'ink';
import { useFocus, panelMayAct } from './useKeyDispatcher.js';

export interface KeyboardShortcuts {
  onEscape?: () => void;
  onCtrlC?: () => void;
  onTab?: (shift?: boolean) => void;
  onCtrlL?: () => void;
  onCtrlM?: () => void;
  onCtrlS?: () => void;
  onCustom?: (input: string) => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  const __focus = useFocus();
  useInput((input, key) => {
    if (!panelMayAct(__focus, 'input:shortcuts')) return;
    if (key.escape && shortcuts.onEscape) {
      shortcuts.onEscape();
    } else if (key.ctrl && input === 'c' && shortcuts.onCtrlC) {
      shortcuts.onCtrlC();
    } else if (key.tab && shortcuts.onTab) {
      shortcuts.onTab(key.shift);
    } else if (key.ctrl && input === 'l' && shortcuts.onCtrlL) {
      shortcuts.onCtrlL();
    } else if (key.ctrl && input === 'm' && shortcuts.onCtrlM) {
      shortcuts.onCtrlM();
    } else if (key.ctrl && input === 's' && shortcuts.onCtrlS) {
      shortcuts.onCtrlS();
    } else if (shortcuts.onCustom) {
      shortcuts.onCustom(input);
    }
  });
}
