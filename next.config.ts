import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Suppress "outside of current Git repository" warning on Windows
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
