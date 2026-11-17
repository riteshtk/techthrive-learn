import type { NextConfig } from "next";

// Static export for GitHub Pages. BASE_PATH is set by the deploy workflow
// (e.g. "/techthrive-learn") and left empty for local development.
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  // Exposed to lib/paths.ts for links next/link doesn't handle.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
