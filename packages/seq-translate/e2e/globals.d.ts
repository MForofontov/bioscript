export {};

declare global {
  interface Window {
    bioseqTranslate: typeof import('../src/browser-bundle');
  }
}
