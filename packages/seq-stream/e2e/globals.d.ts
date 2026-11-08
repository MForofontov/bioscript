export {};

declare global {
  interface Window {
    bioseqStream: typeof import('../src/browser-bundle');
  }
}
