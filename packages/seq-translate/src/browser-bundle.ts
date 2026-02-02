/**
 * Browser bundle entry point
 * Exposes bioseqTranslate global object for direct script tag usage
 */

import { tables, getTable } from './tables';
import {
  translateBrowser,
  translateBrowserStreaming,
  translateBrowserBatch,
} from './browser-translate';
import { translateSequence } from './translate';
import { translateAllFrames, translateSixFrames } from './translate-frames';
import { translateBatch } from './translate-batch';
import { dnaToRna, rnaToDna, complement, reverseComplement } from './utils';
import { buildLookup } from './lookup';

// Export everything explicitly
export {
  // Tables
  tables,
  getTable,

  // Core translation
  translateSequence,
  translateAllFrames,
  translateSixFrames,
  translateBatch,

  // Browser-specific
  translateBrowser,
  translateBrowserStreaming,
  translateBrowserBatch,

  // Utilities
  dnaToRna,
  rnaToDna,
  complement,
  reverseComplement,
  buildLookup,
};
