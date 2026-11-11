// Test packed artifacts in an isolated consumer, never resolving workspace sources.
const { mkdtempSync, writeFileSync, rmSync, readdirSync } = require('fs');
const { tmpdir } = require('os');
const { join, resolve } = require('path');
const { spawnSync } = require('child_process');
const { buildSync } = require('esbuild');
const root = resolve(__dirname, '..');
const temporary = mkdtempSync(join(tmpdir(), 'bioscript-packages-'));
const npm = process.env.npm_execpath;
if (!npm) throw new Error('Run this check with npm run test:packages');
const names = [
  'seq-utils',
  'seq-stream',
  'seq-translate',
  'seq-align',
  'seq-format',
  'seq-search',
  'seq-quality',
];
function run(args, cwd = temporary, executable = process.execPath) {
  const result = spawnSync(executable, args, { cwd, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stdout + result.stderr);
  return result.stdout;
}
async function main() {
  try {
    const tarballs = [];
    for (const name of names) {
      const previous = new Set(readdirSync(temporary));
      run(
        [npm, 'pack', '--ignore-scripts', '--json', '--pack-destination', temporary],
        join(root, 'packages', name)
      );
      // Older npm versions report an unsanitized scoped name in JSON.
      const created = readdirSync(temporary).filter(
        (file) => file.endsWith('.tgz') && !previous.has(file)
      );
      if (created.length !== 1) throw new Error(`Expected one tarball for ${name}`);
      tarballs.push(join(temporary, created[0]));
    }
    writeFileSync(
      join(temporary, 'package.json'),
      JSON.stringify({ name: 'bioscript-consumer', private: true })
    );
    run([npm, 'install', '--ignore-scripts', '--no-audit', '--no-fund', ...tarballs]);
    const common = `
const assert = require('assert');
const utils = require('@bioscript/seq-utils');
assert.equal(utils.reverseComplement('ACG'), 'CGT');
assert.equal(utils.normalizeToDna(' aug '), 'ATG');
assert.equal(utils.normalizeToRna(' atg '), 'AUG');
assert.equal(utils.isValidSequence('AX'), false);
utils.assertValidSequence('ACGT');
assert.deepEqual(require('@bioscript/seq-search').findExact('ACAC','AC').map(hit => hit.start), [0,2]);
assert.equal(require('@bioscript/seq-quality').meanQuality('II'), 40);
assert.equal(require('@bioscript/seq-align').needlemanWunsch('AC', 'AC', {matrix:'DNA_SIMPLE'}).score, 10);
assert.equal(require('@bioscript/seq-format').parseBEDLine('chr1\\t0\\t10').chromEnd, 10);
assert.equal(typeof require('@bioscript/seq-stream').FastaParser, 'function');
const translation = require('@bioscript/seq-translate');
(async () => {
  assert.equal((await translation.translateWorker(['ATG'], {numWorkers:1}))[0][0].sequence, 'M');
  const pool = new translation.TranslationPool(1);
  try { assert.equal((await pool.translate(['ATG']))[0][0].sequence, 'M'); }
  finally { await pool.terminate(); }
})().catch(error => { console.error(error); process.exitCode=1; });
`;
    writeFileSync(join(temporary, 'consumer.cjs'), common);
    run(['consumer.cjs'], temporary, process.env.BIOSCRIPT_RUNTIME_NODE || process.execPath);
    writeFileSync(
      join(temporary, 'consumer.mjs'),
      names
        .map(
          (name, i) =>
            `import * as p${i} from '@bioscript/${name}'; if (!Object.keys(p${i}).length) throw new Error('Empty ESM export');`
        )
        .join('\n')
    );
    run(['consumer.mjs'], temporary, process.env.BIOSCRIPT_RUNTIME_NODE || process.execPath);
    writeFileSync(
      join(temporary, 'consumer.ts'),
      `
import { reverseComplement } from '@bioscript/seq-utils';
import { needlemanWunsch, type AlignmentResult } from '@bioscript/seq-align';
import { parseBEDLine } from '@bioscript/seq-format';
import { FastaParser } from '@bioscript/seq-stream';
import { parseFastqBrowser } from '@bioscript/seq-stream/browser';
import { translateSequence } from '@bioscript/seq-translate/browser';
const alignment: AlignmentResult = needlemanWunsch('AC','AC');
const sequence: string = reverseComplement('AC');
void [alignment, sequence, parseBEDLine, FastaParser, parseFastqBrowser, translateSequence];
`
    );
    run([
      join(root, 'node_modules/typescript/bin/tsc'),
      '--noEmit',
      '--strict',
      '--skipLibCheck',
      '--module',
      'node16',
      '--moduleResolution',
      'node16',
      '--target',
      'es2020',
      '--lib',
      'es2020,dom',
      '--typeRoots',
      join(root, 'node_modules/@types'),
      'consumer.ts',
    ]);
    writeFileSync(
      join(temporary, 'browser.js'),
      "export * from '@bioscript/seq-stream/browser'; export * from '@bioscript/seq-translate/browser';"
    );
    buildSync({
      entryPoints: [join(temporary, 'browser.js')],
      bundle: true,
      platform: 'browser',
      outfile: join(temporary, 'browser.bundle.js'),
      logLevel: 'silent',
    });
    console.log(
      'All seven tarballs passed CommonJS, ESM, declarations, worker, and browser bundle checks.'
    );
  } finally {
    if (!resolve(temporary).startsWith(join(resolve(tmpdir()), 'bioscript-packages-'))) {
      console.error('Temporary package directory is outside the expected cleanup location');
      process.exitCode = 1;
    } else {
      rmSync(temporary, { recursive: true, force: true });
    }
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
