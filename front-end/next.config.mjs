/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    const internalApi = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return [
      // Auth stays public (better-auth needs direct browser access for cookie handling)
      // Everything else is proxied server-side pod-to-pod
      {
        source: '/api/backend/:path*',
        destination: `${internalApi}/:path*`,
      },
    ];
  },
};

export default nextConfig;
