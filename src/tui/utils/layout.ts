export interface DashboardLayoutMetrics {
  terminalWidth: number;
  terminalHeight: number;
  contentHeight: number;
  leftPanelWidth: number;
  panelWidth: number;
  statsPanelHeight: number;
  logsPanelHeight: number;
  logsContentHeight: number;
  inputWidth: number;
  suggestionHeight: number;
}

export function getDashboardLayoutMetrics(
  columns: number | undefined,
  rows: number | undefined,
  showSuggestions = false
): DashboardLayoutMetrics {
  const terminalWidth = Math.max(60, columns || 80);
  const terminalHeight = Math.max(20, rows || 24);
  const leftPanelWidth = Math.max(20, terminalWidth - 4);
  const panelGap = 2;
  const panelWidth = Math.max(10, Math.floor((leftPanelWidth - panelGap) / 2));
  const contentHeight = Math.max(12, terminalHeight - 3);
  const titleHeight = 2;
  const inputHeight = 3;
  const suggestionHeight = showSuggestions ? 2 : 0;
  const verticalGaps = 2;
  const preferredLogsHeight = terminalHeight >= 40 ? 8 : terminalHeight >= 30 ? 6 : 5;
  const logsPanelHeight = Math.max(4, Math.min(preferredLogsHeight, contentHeight - titleHeight - inputHeight - suggestionHeight - 6));
  const statsPanelHeight = Math.max(
    6,
    contentHeight - titleHeight - inputHeight - suggestionHeight - logsPanelHeight - verticalGaps
  );

  return {
    terminalWidth,
    terminalHeight,
    contentHeight,
    leftPanelWidth,
    panelWidth,
    statsPanelHeight,
    logsPanelHeight,
    logsContentHeight: Math.max(1, logsPanelHeight - 3),
    inputWidth: leftPanelWidth,
    suggestionHeight,
  };
}
