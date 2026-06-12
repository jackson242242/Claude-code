import nextJest from 'next/jest.js';
import type { Config } from 'jest';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/__tests__/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  coverageReporters: ['text-summary', 'lcov'],
};

// d3-geo (and its deps) ship ESM-only; next/jest excludes node_modules from the
// SWC transform by default, so carve them out of transformIgnorePatterns.
const buildConfig = async (): Promise<Config> => {
  const nextConfig = await createJestConfig(config)();
  return {
    ...nextConfig,
    transformIgnorePatterns: (nextConfig.transformIgnorePatterns ?? []).map((pattern) =>
      // next/jest emits e.g. '/node_modules/(?!.pnpm)(?!(geist)/)' — extend the allowlist group.
      pattern.replace('(geist)', '(geist|d3-geo|d3-array|internmap)'),
    ),
  };
};

export default buildConfig;
