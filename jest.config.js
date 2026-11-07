import { createDefaultEsmPreset } from 'ts-jest';

/** @type {import('jest').Config} */
export default {
  ...createDefaultEsmPreset(),
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  setupFilesAfterEnv: ['jest-expect-message'],
  globalSetup: '<rootDir>/test/support/global-setup.ts',
  globalTeardown: '<rootDir>/test/support/global-teardown.ts',
  maxWorkers: 1,
  testTimeout: 30000,
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'reports',
        outputName: 'junit.xml',
        suiteNameTemplate: '{title}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        reportTestSuiteErrors: true,
      },
    ],
  ],
};
