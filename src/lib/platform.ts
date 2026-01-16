// Detect if the user is on macOS
export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.platform.toUpperCase().indexOf("MAC") >= 0 ||
         navigator.userAgent.toUpperCase().indexOf("MAC") >= 0;
}

// Get the modifier key symbol for the current platform
export function getModifierKey(): string {
  return isMac() ? "⌘" : "Ctrl";
}

// Format a keyboard shortcut for display
export function formatShortcut(key: string): string {
  return `${getModifierKey()}+${key}`;
}
