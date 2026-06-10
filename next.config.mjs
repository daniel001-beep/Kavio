/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, 
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Suppress the pg-native optional dependency warning — it's not needed,
    // pg works fine with the pure JS implementation
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "pg-native": false,
    };
    return config;
  },
};

export default nextConfig;