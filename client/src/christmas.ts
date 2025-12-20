// Christmas mode state management

let christmasMode = false;

// Check localStorage on load
if (typeof window !== 'undefined') {
  christmasMode = localStorage.getItem('codemap-christmas') === 'true';
}

export function getChristmasMode(): boolean {
  return christmasMode;
}

export function setChristmasMode(enabled: boolean): void {
  christmasMode = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('codemap-christmas', String(enabled));
  }
}

export function toggleChristmasMode(): boolean {
  setChristmasMode(!christmasMode);
  return christmasMode;
}
