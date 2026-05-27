/**
 * Utility to generate native clickable terminal hyperlinks (OSC 8 escape sequences)
 * supported by Ghostty, iTerm2, Kitty, WezTerm, Warp, and other modern terminal emulators.
 */
export function terminalLink(text: string, url: string): string {
  return `\u001B]8;;${url}\u001B\\${text}\u001B]8;;\u001B\\`;
}
