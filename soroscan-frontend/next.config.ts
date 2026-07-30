import createNextIntlPlugin from 'next-intl/plugin';
import createBundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin('./i18n.ts');
const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  output: 'standalone',
  // This package lives in a monorepo alongside a sibling root pnpm-lock.yaml.
  // Without this, Next infers the workspace root as the repo root and nests
  // the standalone output under `standalone/soroscan-frontend/` instead of
  // `standalone/` — pin it explicitly so `.next/standalone/server.js` is
  // always at a predictable path (matches Dockerfile.frontend, which builds
  // from an isolated context where this ambiguity doesn't arise).
  outputFileTracingRoot: process.cwd(),
  // Turbopack: pin the root to this package directory so Next doesn't
  // misdetect the monorepo root when the app/ directory is traversed
  // (Next.js 16 looks for pnpm-lock.yaml and may walk up to the repo root).
  turbopack: {
    root: process.cwd(),
  },
  images: {
    // No external image sources are in use yet (the app renders no raster
    // images outside the user-uploaded org logo crop tool, which reads
    // local blob URLs and intentionally opts out of next/image). Populate
    // this when a remote image source (e.g. an avatar/CDN host) is added.
    remotePatterns: [],
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
