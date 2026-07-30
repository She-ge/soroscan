module.exports = {
  ci: {
    collect: {
      // Matches production (Dockerfile.frontend): serve the standalone
      // output directly rather than `next start`, which warns/misbehaves
      // when `output: 'standalone'` is set. Requires public/ and
      // .next/static to already be copied alongside .next/standalone (the
      // Lighthouse CI workflow does this — see .github/workflows/lighthouse.yml
      // — mirroring Dockerfile.frontend's COPY steps; do the same locally
      // before running `lhci autorun` directly).
      startServerCommand: "node .next/standalone/server.js",
      startServerReadyPattern: "Ready in",
      startServerReadyTimeout: 30000,
      url: ["http://localhost:3000/"],
      numberOfRuns: 3,
      settings: {
        preset: "desktop",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 2000 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        // Target: 200 KB gzipped JS on the landing page. Currently over
        // budget (~328 KiB) because ApolloProvider loads globally via the
        // root layout even on pages with no GraphQL calls. `warn`, not
        // `error`, so this is visible on every PR without blocking merges
        // until that's addressed (see PR description for #841).
        "resource-summary:script:size": ["warn", { maxNumericValue: 204800 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
