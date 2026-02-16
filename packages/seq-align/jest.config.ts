import type { Config } from 'jest';
import { baseConfig } from '../../jest.config.base';

const config: Config = {
  ...baseConfig,
  displayName: 'seq-align',
  rootDir: '.',
  setupFilesAfterEnv: ['../../jest.setup.ts'],
  testMatch: ['<rootDir>/src/tests/**/*.test.ts'],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/index.ts',
    '!<rootDir>/src/**/*.test.ts',
    '!<rootDir>/src/**/*.spec.ts',
    '!<rootDir>/src/tests/**',
  ],
  coverageDirectory: 'coverage',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  reporters: [
    'default',
    [
      'jest-allure',
      {
        outputDirectory: '../../allure-results',
        addLabel: () => ({
          name: 'package',
          value: 'seq-align',
        }),
      },
    ],
  ],
};

export default config;
