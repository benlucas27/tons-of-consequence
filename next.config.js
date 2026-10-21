/** @type {import('next').NextConfig} */
const nextConfig = {
  // Baked in at build time, so share cards can say when the data they show was last published.
  env: { BUILD_DATE: new Date().toISOString().slice(0, 10) },
  // The service worker must always be re-checked, and must be allowed to control the whole site.
  async headers() {
    // Basic browser protections on every page (no Content-Security-Policy yet: the site uses inline scripts and YouTube embeds, so a CSP needs its own testing).
    const secure = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), payment=(), microphone=(self)' },
    ];
    return [{ source: '/(.*)', headers: secure }, { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }, { key: 'Service-Worker-Allowed', value: '/' }] }];
  },
  // The Hello Cricket page used to live at /hello-sport: keep old links working.
  async redirects() {
    return [{ source: '/hello-sport', destination: '/hello-cricket', permanent: true }];
  },
};

module.exports = nextConfig;
