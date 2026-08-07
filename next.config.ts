import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack to this project (a stray package-lock.json exists in the user home dir).
  turbopack: { root: "." },
};

export default nextConfig;