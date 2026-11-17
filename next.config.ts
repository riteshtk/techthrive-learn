import type { NextConfig } from "next";

// Static export for GitHub Pages. BASE_PATH is set by the deploy workflow
// (e.g. "/techthrive-learn") and left empty for local development.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: process.env.BASE_PATH ?? "",
};

export default nextConfig;
