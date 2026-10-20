/** @type {import('next').NextConfig} */
const nextConfig = {
  // The service worker must always be re-checked, and must be allowed to control the whole site.
  async headers() {
    return [{ source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }, { key: 'Service-Worker-Allowed', value: '/' }] }];
  },
  // The Hello Cricket page used to live at /hello-sport: keep old links working.
  async redirects() {
    return [{ source: '/hello-sport', destination: '/hello-cricket', permanent: true }];
  },
};

module.exports = nextConfig;
