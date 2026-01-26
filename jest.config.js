import * as os from 'os';

const config = {
  projects: ['<rootDir>/packages/*/jest.config.js'],
  collectCoverage: false,
  moduleNameMapper: {
    '^@bioscript/(.*)$': '<rootDir>/packages/$1/src',
  },
};

export default config;
