import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/tests/**',
    '!src/index.ts', // Exclude index file (just re-exports)
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 95,
      lines: 85,
      statements: 85,
    },
  },
};

export default config;
