/**
 * Shared responsive layout breakpoint calculations.
 * Must stay in sync with layout.tsx breakpoints:
 *   - compact:  width < 120  → no left nav, no inspector
 *   - medium:   120 ≤ width < 140  → left nav (24), no inspector
 *   - full:     width ≥ 140  → left nav (24) + inspector (28)
 */

export interface ResponsiveLayout {
  /** Terminal width < 120 */
  isCompact: boolean;
  /** Terminal width ≥ 120 && < 140 */
  isMedium: boolean;
  /** Left nav is visible (width ≥ 120) */
  showLeftNav: boolean;
  /** Trust inspector is visible (width ≥ 140) */
  showTrustInspector: boolean;
  /** Width consumed by left nav */
  leftNavWidth: number;
  /** Width consumed by right inspector */
  inspectorWidth: number;
  /** Available width for the main stage area */
  stageWidth: number;
  /** Capped main stage content width (with padding margins) */
  mainStageWidth: number;
}

export function getResponsiveLayout(terminalWidth: number): ResponsiveLayout {
  const isCompact = terminalWidth < 120;
  const isMedium = terminalWidth >= 120 && terminalWidth < 140;
  const showLeftNav = terminalWidth >= 120;
  const showTrustInspector = terminalWidth >= 140;
  const leftNavWidth = showLeftNav ? 24 : 0;
  const inspectorWidth = showTrustInspector ? 28 : 0;
  const stageWidth = terminalWidth - leftNavWidth - inspectorWidth;
  const mainStageWidth = Math.max(30, Math.min(stageWidth - 4, Math.floor(stageWidth * 0.95)));

  return {
    isCompact,
    isMedium,
    showLeftNav,
    showTrustInspector,
    leftNavWidth,
    inspectorWidth,
    stageWidth,
    mainStageWidth,
  };
}
