const { buildSync } = require('esbuild');
const { copyFileSync } = require('fs');
const { join } = require('path');
const name = process.argv[2];
if (!['seq-stream', 'seq-translate'].includes(name)) throw new Error('Unknown browser package');
const root = join(__dirname, '..', 'packages', name);
const stream = name === 'seq-stream';
const outfile = join(root, stream ? 'e2e/bioseq-bundle.js' : 'dist/bioseq-translate.bundle.js');
buildSync({
  entryPoints: [join(root, 'dist/browser-bundle.js')],
  bundle: true,
  format: 'iife',
  globalName: stream ? 'bioseqStream' : 'bioseqTranslate',
  outfile,
  platform: 'browser',
});
if (!stream) copyFileSync(outfile, join(root, 'e2e/bioseq-translate.bundle.js'));
