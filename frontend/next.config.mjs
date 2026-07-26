/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "https://amjad-healthcare-ai.onrender.com/api/:path*" },
    ];
  },
};
export default nextConfig;
