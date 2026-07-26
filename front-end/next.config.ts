import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import path from "node:path";

const projectRoot = __dirname;
const emptyModule = path.join(projectRoot, "lib/empty-module.ts");

const optionalPeerAliases = {
  "@base-org/account": emptyModule,
  "@x402/core": emptyModule,
  "@x402/evm": emptyModule,
  "@x402/extensions": emptyModule,
  "@x402/svm": emptyModule,
  "@react-native-async-storage/async-storage": emptyModule,
} as const;

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@andrewkimjoseph/celina-sdk",
    "@amplitude/analytics-node",
    "@mento-protocol/mento-sdk",
    "permissionless",
    "ox",
  ],
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      ...optionalPeerAliases,
    },
  },
  webpack: (config, { webpack }) => {
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      ...optionalPeerAliases,
    };
    // Subpaths like @x402/core/client must also resolve to the stub.
    config.plugins ??= [];
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^@x402\/(core|evm|extensions|svm)(\/.*)?$/,
        emptyModule,
      ),
    );
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "canvassing",

  project: "thegoodpaxapp",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
