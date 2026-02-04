/*
Base Jest configuration for bioscript packages.
Individual packages extend this configuration.
*/

import type { Config } from 'jest';

export const baseConfig: Config = {
  preset: 'ts-jest',
  testEnvironment: 'allure-jest/node',
  testEnvironmentOptions: {
    resultsDir: 'allure-results',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  reporters: [
    'default',
    ['jest-allure', { outputDir: 'allure-results' }],
  ],
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/e2e/',
    '\\.spec\\.ts$',
    '\\.d\\.ts$',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/e2e/',
    '/examples/',
    '/browser-example.html',
    'demo.js',
    '.spec.ts$',
    '.d.ts$',
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  testTimeout: 10000,
};
