import '@testing-library/jest-dom/vitest';

// jsdom has no native modal lifecycle; real focus/inertness is checked in Chromium.
Object.defineProperties(HTMLDialogElement.prototype, {
  showModal: { configurable: true, value() { this.open = true; } },
  close: { configurable: true, value() { this.open = false; } },
});
