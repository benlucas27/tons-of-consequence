/** The public address of the site. The older tons-of-consequence.vercel.app address keeps working too. */
export const SITE_URL = 'https://tonsofconsequence.com';
/** The iPhone app on the App Store (released 19 Nov 2026), and its numeric App Store id. */
export const APP_STORE_ID = '6825257483';
// No country or name in the address, so it opens the reader's own storefront. `${SITE_URL}/app` is a page with a download button, and is the one to share.
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;
/** Where Claude connects to the site's read-only connector (see src/lib/mcp.js). */
export const MCP_URL = `${SITE_URL}/mcp`;
