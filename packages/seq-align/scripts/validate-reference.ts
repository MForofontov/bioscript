/** Run exhaustive path enumeration as an independent score and traceback oracle. */
import { spawnSync } from 'child_process';
import { resolve } from 'path';

const root = resolve(__dirname, '../../..');
const result = spawnSync(
  process.execPath,
  [
    require.resolve('jest/bin/jest'),
    '--runInBand',
    '--coverage=false',
    '--runTestsByPath',
    'packages/seq-align/src/tests/alignment-regression.test.ts',
  ],
  { cwd: root, stdio: 'inherit' }
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
