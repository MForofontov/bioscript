import type { Config } from 'jest';
import { baseConfig } from '../../jest.config.base';

const config: Config = {
  ...baseConfig,
  displayName: 'seq-utils',
  rootDir: './',
  setupFilesAfterEnv: ['../../jest.setup.ts'],
  testMatch: ['<rootDir>/src/tests/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/tests/**/*',
    '!src/index.ts',
  ],
};

export default config;
