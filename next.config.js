/** @type {import('next').NextConfig} */
const nextConfig = {
  // Baked in at build time, so share cards can say when the data they show was last published.
  env: { BUILD_DATE: new Date().toISOString().slice(0, 10) },
  // The Hello Cricket page used to live at /hello-sport: keep old links working.
  async redirects() {
    return [{ source: '/hello-sport', destination: '/hello-cricket', permanent: true }];
  },
};

module.exports = nextConfig;
