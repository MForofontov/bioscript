module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/*.test.ts'],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
};
