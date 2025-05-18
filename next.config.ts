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
      // Use empty string instead of false for type compatibility
      canvas: "",
    },
  },
  // Keep webpack config for non-turbopack builds
  webpack: (config) => {
    // Handle browser-specific modules in SSR
    config.resolve.fallback = {
      ...config.resolve.fallback,
      // Use null instead of false for proper type compatibility
      canvas: null,
    };

    return config;
  },
};

export default nextConfig;
