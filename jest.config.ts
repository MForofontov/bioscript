/*
Root Jest configuration for bioscript.
Runs all tests across all packages with comprehensive reporting.

For testing individual packages, use:
  npm test -w @bioscript/seq-stream
  npm run test:seq-stream
*/

import type { Config } from 'jest';
import { baseConfig } from './jest.config.base';

const config: Config = {
  ...baseConfig,
  // Map @bioscript/* imports to package source
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@bioscript/(.*)$': '<rootDir>/packages/$1/src',
  },
  // Unified reporters for all packages
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'Bioscript Test Report',
        outputPath: 'jest.html',
        includeFailureMsg: true,
        includeConsoleLog: true,
      },
    ],
  ],
  // Coverage for all packages at root
  coverageDirectory: 'coverage',
};

export default config;
