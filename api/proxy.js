
import https from 'https';
import http from 'http';
import { URL } from 'url';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    
    // Robust Parsing: Handle case where body is passed as string
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            console.error('JSON Parse Error:', e);
            return res.status(400).json({ error: 'Invalid JSON request body', details: e.message });
        }
    }

    if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'Empty or invalid request body' });
    }

    const { targetUrl, xmlContent, username, password, method = 'POST' } = body;

    if (!targetUrl) return res.status(400).json({ error: 'Missing targetUrl' });
    if (method === 'POST' && !xmlContent) return res.status(400).json({ error: 'Missing xmlContent for POST' });

    let parsedUrl;
    try {
        parsedUrl = new URL(targetUrl);
    } catch (e) {
        return res.status(400).json({ error: 'Invalid URL format', details: e.message });
    }

    // Prepare Basic Auth
    const authString = Buffer.from(`${username || ''}:${password || ''}`).toString('base64');
    
    // Select Protocol
    const isHttps = parsedUrl.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    // Agent configuration: Allow self-signed certs (common in enterprise intranets)
    const agent = isHttps ? new https.Agent({ rejectUnauthorized: false }) : new http.Agent();

    const options = {
      method: method,
      headers: {
        'Content-Type': method === 'POST' ? 'application/xml' : 'application/json',
        'Authorization': `Basic ${authString}`
      },
      agent: agent,
      timeout: 60000 // 60s timeout
    };

    if (method === 'POST' && xmlContent) {
        options.headers['Content-Length'] = Buffer.byteLength(xmlContent);
    }

    const proxyReq = lib.request(targetUrl, options, (proxyRes) => {
      // Force encoding to ensure we get a string
      proxyRes.setEncoding('utf8');
      
      let data = '';
      
      proxyRes.on('data', (chunk) => {
        data += chunk;
      });
      
      proxyRes.on('end', () => {
        if (!res.headersSent) {
            // Pass through the upstream status code
            res.status(proxyRes.statusCode || 200).send(data);
        }
      });
    });

    proxyReq.on('error', (e) => {
      console.error('Upstream Request Error:', e);
      if (!res.headersSent) {
          // Differentiate connection errors
          const status = e.code === 'ECONNREFUSED' ? 502 : 500;
          res.status(status).json({ 
              error: 'Upstream Connection Failed', 
              details: e.message, 
              code: e.code 
          });
      }
    });
    
    proxyReq.on('timeout', () => {
        proxyReq.destroy();
        if (!res.headersSent) {
            res.status(504).json({ error: 'Upstream Timeout (60s limit)' });
        }
    });

    if (method === 'POST' && xmlContent) {
        proxyReq.write(xmlContent);
    }
    proxyReq.end();

  } catch (error) {
    console.error('Proxy Handler Fatal Error:', error);
    if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Proxy Error', details: error.message });
    }
  }
}
