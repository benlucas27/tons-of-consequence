/** @type {import('next').NextConfig} */
const nextConfig = {
  // The Hello Cricket page used to live at /hello-sport: keep old links working.
  async redirects() {
    return [{ source: '/hello-sport', destination: '/hello-cricket', permanent: true }];
  },
};

module.exports = nextConfig;
