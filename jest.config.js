import { createDefaultEsmPreset } from "ts-jest";

export default {
  testEnvironment: 'node',
  ...createDefaultEsmPreset(),
  roots: ['<rootDir>'],
  testMatch: ['<rootDir>/**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/__tests__/**'],
  moduleNameMapper: {
    'yargs:': '<rootDir>/__tests__/__mocks__/yargs/index.ts',
  }
};
