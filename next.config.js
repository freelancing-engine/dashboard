/** @type {import('next').NextConfig} */
const nextConfig = {
  // "standalone" only for Docker builds; Vercel ignores it
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  experimental: {
    optimizePackageImports: ["framer-motion", "three"],
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

module.exports = nextConfig;
