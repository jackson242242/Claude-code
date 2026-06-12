import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Same convention as the repo root project: lint runs as its own gate
  // (`npm run lint`); TypeScript errors still fail the build.
  eslint: { ignoreDuringBuilds: true },
  // This app lives inside a monorepo with its own lockfile — pin the tracing
  // root so Next does not infer the repo root as the workspace root.
  outputFileTracingRoot: here,
};

export default nextConfig;
