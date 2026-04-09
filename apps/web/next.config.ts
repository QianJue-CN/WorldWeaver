import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@worldweaver/config", "@worldweaver/contracts"],
}

export default nextConfig
