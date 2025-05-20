import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
    ],
  },
  transpilePackages: ["react-signature-canvas"],
  // Configure Turbopack (now stable, no longer experimental)
  turbopack: {
    // Turbopack specific configurations
    resolveAlias: {
      // Handle browser-specific modules in SSR
      // For turbopack, use an empty string to effectively ignore the module
      canvas: '',
    },
  },
  // Keep webpack config for non-turbopack builds
  webpack: (config) => {
    // Handle browser-specific modules in SSR
    config.resolve.fallback = {
      ...config.resolve.fallback,
      // Use false to ignore request and replace with empty module
      canvas: false,
    };

    return config;
  },
};

export default nextConfig;
