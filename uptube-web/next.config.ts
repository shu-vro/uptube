import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.UPTUBE_API ?? "http://localhost:3000"}/api/v1/:path*`,
      },
      {
        source: "/download-api/v1/:path*",
        destination: `${process.env.UPTUBE_DOWNLOAD_API ?? "http://localhost:8000"}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
