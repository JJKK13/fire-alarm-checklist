// Cloudflare Worker — Smartsheet proxy for fire alarm checklist
// Deploy at: https://dash.cloudflare.com → Workers & Pages → Create Worker
// Paste this code, click Deploy, then copy the worker URL into index.html

const SS_API_KEY = '6w2Hf1f78c7DrDUjfFrZCtPtvKjYcxXHhTtzb';
const ALLOW_ORIGIN = '*'; // restrict to your domain in production if desired

export default {
  async fetch(request) {

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': ALLOW_ORIGIN,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Forward path/query to Smartsheet (strip the worker's own origin)
    const url = new URL(request.url);
    const smartsheetUrl = 'https://api.smartsheet.com' + url.pathname + url.search;

    // Build forwarded headers — inject API key server-side
    const fwdHeaders = new Headers();
    fwdHeaders.set('Authorization', `Bearer ${SS_API_KEY}`);
    const ct = request.headers.get('Content-Type');
    if (ct) fwdHeaders.set('Content-Type', ct);

    const ssResponse = await fetch(smartsheetUrl, {
      method: request.method,
      headers: fwdHeaders,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      duplex: 'half',
    });

    // Return Smartsheet response with CORS headers added
    const respHeaders = new Headers(ssResponse.headers);
    respHeaders.set('Access-Control-Allow-Origin', ALLOW_ORIGIN);

    return new Response(ssResponse.body, {
      status: ssResponse.status,
      headers: respHeaders,
    });
  },
};
