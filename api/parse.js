const https = require('https');
const http = require('http');

function callAPI(apiUrl, videoUrl, method = 'GET') {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 8000);
    
    const protocol = apiUrl.startsWith('https') ? https : http;
    const options = {
      method,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 8000
    };
    
    const req = protocol.request(apiUrl, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        clearTimeout(timeout);
        try {
          const parsed = JSON.parse(data);
          resolve(parseResponse(parsed));
        } catch {
          resolve(null);
        }
      });
    });
    
    req.on('error', () => resolve(null));
    if (method === 'POST') req.write(JSON.stringify({ url: videoUrl }));
    req.end();
  });
}

function parseResponse(data) {
  if (data.msg === 'success' && data.data) {
    return {
      videoUrl: data.data.url,
      cover: data.data.cover,
      title: data.data.title,
      author: data.data.author
    };
  }
  if (data.code === 200 && data.data) {
    return {
      videoUrl: data.data.url,
      cover: data.data.cover,
      title: data.data.title,
      author: data.data.author
    };
  }
  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ success: false, error: '缺少 url 参数' });
  
  const apis = [
    {
      name: 'jx.etnoweb.com',
      url: `https://jx.etnoweb.com/api/parseVideo?url=${encodeURIComponent(url)}`,
      method: 'GET'
    },
    {
      name: 'vv.video-parse.com',
      url: 'https://vv.video-parse.com/api/parse',
      method: 'POST'
    }
  ];
  
  for (const api of apis) {
    const result = await callAPI(api.url, url, api.method);
    if (result?.videoUrl) {
      return res.json({ success: true, data: result, from: api.name });
    }
  }
  
  return res.json({ success: false, error: 'API 返回错误' });
};
