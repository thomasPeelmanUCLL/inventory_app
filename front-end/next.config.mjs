/** @type {import('next').NextConfig} */
function normalizeRewriteDestination(rawValue) {
  const value = (rawValue || '').trim();

  if (!value) return 'http://localhost:3000';
  if (value.startsWith('/')) return value;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;

  // Accept host:port style values from CI and convert to absolute URL.
  return `http://${value}`;
}

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    const internalApi = normalizeRewriteDestination(
      process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    );
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
