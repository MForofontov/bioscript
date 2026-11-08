// Run development commands with the same Node executable on Windows and Unix.
const { spawnSync } = require('child_process');
const { join } = require('path');
const packages = [
  'seq-utils',
  'seq-stream',
  'seq-translate',
  'seq-align',
  'seq-format',
  'seq-search',
  'seq-quality',
];
const root = join(__dirname, '..');
function run(tool, args, cwd = root) {
  const result = spawnSync(process.execPath, [join(root, 'node_modules', tool), ...args], {
    cwd,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
const task = process.argv[2];
if (task === 'build' || task === 'typecheck') {
  for (const name of packages) {
    run('typescript/bin/tsc', task === 'build' ? [] : ['--noEmit'], join(root, 'packages', name));
  }
  run('typescript/bin/tsc', task === 'build' ? [] : ['--noEmit']);
  if (task === 'typecheck') run('typescript/bin/tsc', ['-p', 'tsconfig.check.json']);
} else if (task === 'browser' || task === 'stress') {
  if (task === 'stress') process.env.BIOSCRIPT_STRESS = '1';
  for (const name of task === 'stress' ? ['seq-stream'] : ['seq-stream', 'seq-translate']) {
    const cwd = join(root, 'packages', name);
    const bundle = spawnSync(process.execPath, [join(__dirname, 'build-browser.cjs'), name], {
      cwd,
      stdio: 'inherit',
    });
    if (bundle.error) throw bundle.error;
    if (bundle.status !== 0) process.exit(bundle.status || 1);
    run(
      '@playwright/test/cli.js',
      task === 'stress' ? ['test', '--grep', '@stress', '--workers', '1'] : ['test'],
      cwd
    );
  }
} else {
  throw new Error(`Unknown task: ${task}`);
}
