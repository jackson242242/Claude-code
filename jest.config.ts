import nextJest from 'next/jest.js';
import type { Config } from 'jest';

const createJestConfig = nextJest({ dir: './' });

const shared: Config = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

// Two projects so pure-logic suites (*.test.ts) run in the plain node
// environment — jsdom setup is the largest per-file overhead in a Jest run
// and only the component suites (*.test.tsx) need a DOM.
export default async (): Promise<Config> => ({
  projects: [
    await createJestConfig({
      ...shared,
      displayName: 'logic',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
    })(),
    await createJestConfig({
      ...shared,
      displayName: 'components',
      testEnvironment: 'jest-environment-jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      testMatch: ['<rootDir>/__tests__/**/*.test.tsx'],
    })(),
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  coverageReporters: ['text-summary', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 35,
      branches: 27,
      functions: 38,
      lines: 34,
    },
  },
});
