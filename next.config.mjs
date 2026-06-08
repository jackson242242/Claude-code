/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lint runs as its own gate (`npm run lint`). Don't let a stray lint rule
  // fail `next build` and silently block production deploys — TypeScript errors
  // still fail the build.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
