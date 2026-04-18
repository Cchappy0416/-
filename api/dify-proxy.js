module.exports = async (req, res) => {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // 正确的 Dify Workflow API 地址
    // POST /v1/workflows/run (不需要 workflow_id)
    // 使用 ngrok 穿透地址（HTTPS）
    const DIFY_BASE_URL = process.env.DIFY_API_URL || 'https://exciting-deafness-enlisted.ngrok-free.dev/v1';
    const APP_KEY = process.env.DIFY_APP_KEY || 'app-lB0tgVA1ioxIKcvzPVT6jKDF';

    // 创建 HTTPS agent，忽略证书验证（ngrok 免费版的证书）
    const https = require('https');
    const agent = new https.Agent({ 
      rejectUnauthorized: false,
      keepAlive: true,
      timeout: 30000
    });

    const response = await fetch(`${DIFY_BASE_URL}/workflows/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APP_KEY}`,
        // 添加 ngrok 需要的请求头，跳过浏览器警告
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'Vercel-Serverless-Function'
      },
      body: JSON.stringify({
        inputs: {
          question: question
        },
        response_mode: 'blocking',
        user: 'web-user'
      }),
      agent: agent,
      timeout: 30000
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dify API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
