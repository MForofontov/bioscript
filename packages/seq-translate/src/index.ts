/**
 * @bioscript/seq-translate
 * Efficient sequence translation supporting all NCBI genetic code tables
 *
 * Main exports for Node.js environment
 * For browser usage, import from '@bioscript/seq-translate/browser'
 */

// Export genetic code tables
export * from './tables';

// Export core translation functions (all in translate.ts)
export * from './translate';
export * from './lookup';

// Export ORF finding
export * from './find-orfs';

// Export worker-based parallel translation (Node.js only)
export {
  translateWorker,
  translateWorkerChunked,
  TranslationPool,
  type WorkerTranslationOptions,
  type TranslationResult as WorkerTranslationResult,
} from './worker-translate';

// Browser translation (tree-shakeable, won't bundle worker_threads in browser)
export {
  translateBrowser,
  translateBrowserStreaming,
  translateBrowserBatch,
  type BrowserTranslationOptions,
  type TranslationResult as BrowserTranslationResult,
} from './browser-translate';
