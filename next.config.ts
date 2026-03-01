import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // In dev: no output:export so API routes work (live rate fetching)
  // In build: output:export for Tauri static bundle
  ...(isDev ? {} : { output: "export" }),
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
