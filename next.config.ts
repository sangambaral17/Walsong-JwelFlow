import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // In dev mode: no output:export so API routes work (for live rate fetching)
  // In build/production: output:export for Tauri static build
  ...(isDev ? {} : { output: "export" }),
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
