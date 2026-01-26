declare const config: {
  preset: string;
  globals: {
    'ts-jest': {
      tsconfig: string;
    };
  };
  testEnvironment: string;
  testMatch: string[];
  collectCoverage: boolean;
  coverageDirectory: string;
  coverageReporters: string[];
  coveragePathIgnorePatterns: string[];
  testPathIgnorePatterns: string[];
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': string;
  };
  transform: {
    '^.+\\.ts$': (
      | string
      | {
          useESM: boolean;
          tsconfig: string;
        }
    )[];
  };
  extensionsToTreatAsEsm: string[];
  reporters: (
    | string
    | (
        | string
        | {
            pageTitle: string;
            outputPath: string;
            includeFailureMsg: boolean;
            includeConsoleLog: boolean;
          }
      )[]
  )[];
};
export default config;
